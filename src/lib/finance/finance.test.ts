import { describe, expect, it } from "vitest";
import { amortizationSchedule, irr, mirr, npv, paybackPeriod, pmt, xirr, effectiveAnnualRate, annuityPV } from "./tvm";
import { capm, gordonGrowth, releverBeta, unleverBeta, wacc, twoStageDDM, enterpriseValue, treasuryStockMethod, accretionDilution } from "./corporate";
import { bondPrice, bondYield, bootstrapZeros, convexity, macaulayDuration, modifiedDuration, forwardRate } from "./fixedIncome";
import { binomial, blackScholes, impliedVol, putFromParity } from "./options";
import { runDcf, dcfSensitivity, type DcfInput } from "./dcf";
import { runLbo } from "./lbo";
import { computeRatios, dupont } from "./ratios";
import { minVarianceWeight, twoAsset, maxDrawdown, parametricVaR } from "./portfolio";
import { summarize, impliedPerShare } from "./comps";
import { median, quantile } from "./stats";

describe("time value of money", () => {
  it("npv matches hand calculation", () => expect(npv(0.1, [-1000, 300, 400, 500])).toBeCloseTo(-21.04, 2));
  it("irr round-trips", () => {
    expect(irr([-100, 110])).toBeCloseTo(0.1, 10);
    const cf = [-1000, 300, 400, 500, 200];
    expect(npv(irr(cf), cf)).toBeCloseTo(0, 6);
  });
  it("irr is NaN without a sign change", () => expect(irr([100, 100])).toBeNaN());
  it("mortgage payment", () => expect(pmt(0.05 / 12, 360, 200_000)).toBeCloseTo(1073.64, 2));
  it("amortization pays off the balance", () => {
    const rows = amortizationSchedule(200_000, 0.05, 30);
    expect(rows).toHaveLength(360);
    expect(rows.at(-1)!.balance).toBeCloseTo(0, 4);
    expect(rows.reduce((s, r) => s + r.principal, 0)).toBeCloseTo(200_000, 4);
  });
  it("extra payments shorten the loan", () => expect(amortizationSchedule(200_000, 0.05, 30, 12, 200).length).toBeLessThan(300));
  it("payback interpolates", () => expect(paybackPeriod([-1000, 400, 400, 400])).toBeCloseTo(2.5, 10));
  it("mirr", () => expect(mirr([-1000, 500, 500, 500], 0.1, 0.1)).toBeCloseTo(Math.cbrt(1.655) - 1, 10));
  it("xirr of a one-year doubling is 100%", () => expect(xirr([-100, 200], [new Date("2025-01-01"), new Date("2026-01-01")])).toBeCloseTo(1, 4));
  it("EAR", () => expect(effectiveAnnualRate(0.12, 12)).toBeCloseTo(0.126825, 5));
  it("annuity PV", () => expect(annuityPV(100, 0.1, 3)).toBeCloseTo(248.685, 3));
});

describe("corporate finance", () => {
  it("capm", () => expect(capm(0.04, 1.3, 0.055)).toBeCloseTo(0.1115, 10));
  it("wacc", () => expect(wacc({ equityValue: 600, debtValue: 400, costOfEquity: 0.12, preTaxCostOfDebt: 0.06, taxRate: 0.25 })).toBeCloseTo(0.09, 10));
  it("hamada round trip", () => {
    const bu = unleverBeta(1.5, 0.5, 0.25);
    expect(bu).toBeCloseTo(1.0909, 4);
    expect(releverBeta(bu, 1, 0.25)).toBeCloseTo(1.909, 3);
  });
  it("gordon growth uses next year's dividend", () => expect(gordonGrowth(2, 0.09, 0.04)).toBeCloseTo(41.6, 10));
  it("two-stage DDM equals Gordon when growth rates match", () => expect(twoStageDDM(2, 0.09, 0.04, 5, 0.04)).toBeCloseTo(41.6, 8));
  it("EV bridge", () => expect(enterpriseValue({ sharePrice: 25, dilutedShares: 40, debt: 300, cash: 120, minorityInterest: 30 })).toBe(1210));
  it("treasury stock method", () => expect(treasuryStockMethod(50, [{ count: 10, strike: 25 }, { count: 5, strike: 60 }])).toBeCloseTo(5, 10));
  it("all-stock deal at a lower P/E is accretive", () => {
    const r = accretionDilution({ acquirerNetIncome: 100, acquirerShares: 100, targetNetIncome: 20, purchasePrice: 200, pctStock: 1, acquirerSharePrice: 20, costOfDebt: 0.05, taxRate: 0.25 });
    // acquirer P/E 20x, target bought at 10x
    expect(r.accretion).toBeGreaterThan(0);
    expect(r.newShares).toBe(10);
  });
});

describe("fixed income", () => {
  const b = { face: 1000, couponRate: 0.05, years: 3 };
  it("prices a discount bond", () => expect(bondPrice(b, 0.06)).toBeCloseTo(973.27, 2));
  it("par bond prices at par", () => expect(bondPrice({ face: 100, couponRate: 0.06, years: 10, freq: 2 }, 0.06)).toBeCloseTo(100, 8));
  it("yield inverts price", () => expect(bondYield(b, 973.27)).toBeCloseTo(0.06, 5));
  it("duration", () => {
    const b2 = { face: 1000, couponRate: 0.1, years: 2 };
    expect(macaulayDuration(b2, 0.1)).toBeCloseTo(1.9091, 4);
    expect(modifiedDuration(b2, 0.1)).toBeCloseTo(1.7355, 4);
  });
  it("zero coupon duration equals maturity", () => expect(macaulayDuration({ face: 100, couponRate: 0, years: 7 }, 0.04)).toBeCloseTo(7, 8));
  it("duration+convexity approximates repricing", () => {
    const bond = { face: 100, couponRate: 0.05, years: 10, freq: 2 };
    const p0 = bondPrice(bond, 0.05), p1 = bondPrice(bond, 0.06);
    const approx = -modifiedDuration(bond, 0.05) * 0.01 + 0.5 * convexity(bond, 0.05) * 0.0001;
    expect(approx).toBeCloseTo(p1 / p0 - 1, 3);
  });
  it("flat par curve bootstraps to flat zeros", () => bootstrapZeros([0.05, 0.05, 0.05]).forEach((z) => expect(z).toBeCloseTo(0.05, 10)));
  it("forward rate", () => expect(forwardRate(0.03, 1, 0.04, 2)).toBeCloseTo(0.0501, 4));
});

describe("options", () => {
  const i = { spot: 100, strike: 100, t: 1, rate: 0.05, vol: 0.2 };
  it("Black-Scholes textbook values", () => {
    expect(blackScholes(i, "call").price).toBeCloseTo(10.4506, 3);
    expect(blackScholes(i, "put").price).toBeCloseTo(5.5735, 3);
    expect(blackScholes(i, "call").delta).toBeCloseTo(0.6368, 3);
  });
  it("continuous put-call parity holds", () => {
    const c = blackScholes(i, "call").price, p = blackScholes(i, "put").price;
    expect(c - p).toBeCloseTo(100 - 100 * Math.exp(-0.05), 4);
  });
  it("implied vol inverts price", () => expect(impliedVol(i, "call", 10.4506)).toBeCloseTo(0.2, 3));
  it("binomial converges to BS", () => expect(binomial(i, "put", 500)).toBeCloseTo(5.5735, 1));
  it("American put is worth at least the European", () => expect(binomial(i, "put", 300, true)).toBeGreaterThan(binomial(i, "put", 300)));
  it("discrete parity", () => expect(putFromParity(8, 100, 100, 0.05, 1)).toBeCloseTo(3.238, 3));
});

describe("DCF", () => {
  const base: DcfInput = {
    baseRevenue: 1000, revenueGrowth: [0.1, 0.1, 0.08, 0.06, 0.05], ebitMargin: [0.2, 0.2, 0.21, 0.22, 0.22],
    taxRate: 0.25, daPctRevenue: 0.04, capexPctRevenue: 0.05, nwcPctRevenue: 0.1, wacc: 0.09,
    terminal: { method: "gordon", growth: 0.025 }, midYear: false, netDebt: 200, dilutedShares: 50,
  };
  it("first year cash flow by hand", () => {
    const y1 = runDcf(base).years[0];
    // rev 1100, EBIT 220, NOPAT 165, D&A 44, capex 55, ΔNWC 10 → 144
    expect(y1.fcf).toBeCloseTo(144, 8);
  });
  it("EV = sum of PVs + PV of terminal, equity = EV - net debt", () => {
    const r = runDcf(base);
    expect(r.enterpriseValue).toBeCloseTo(r.sumPv + r.pvTerminal, 8);
    expect(r.perShare).toBeCloseTo((r.enterpriseValue - 200) / 50, 8);
  });
  it("implied growth cross-check recovers the input", () => expect(runDcf(base).impliedPerpetualGrowth).toBeCloseTo(0.025, 10));
  it("mid-year convention raises value", () => expect(runDcf({ ...base, midYear: true }).enterpriseValue).toBeGreaterThan(runDcf(base).enterpriseValue));
  it("sensitivity is monotonic in WACC", () => {
    const g = dcfSensitivity(base, [0.08, 0.09, 0.1], [0.025]);
    expect(g[0][0]).toBeGreaterThan(g[1][0]);
    expect(g[1][0]).toBeGreaterThan(g[2][0]);
  });
  it("rejects growth above WACC", () => expect(() => runDcf({ ...base, terminal: { method: "gordon", growth: 0.1 } })).toThrow());
});

describe("LBO", () => {
  const input = {
    entryEbitda: 100, entryMultiple: 10, leverageMultiple: 6, feesPct: 0.02, years: 5, ebitdaGrowth: 0.05,
    daPctEbitda: 0.15, capexPctEbitda: 0.15, nwcPctEbitda: 0.1, interestRate: 0.08, mandatoryAmortPct: 0.05,
    cashSweepPct: 1, taxRate: 0.25, exitMultiple: 10,
  };
  it("value creation bridge reconciles to equity gain", () => {
    const r = runLbo(input);
    const a = r.attribution;
    expect(a.ebitdaGrowth + a.multipleExpansion + a.debtPaydownAndCash + a.fees).toBeCloseTo(r.exitEquity - r.entryEquity, 6);
  });
  it("IRR matches MOIC over the hold", () => {
    const r = runLbo(input);
    expect(Math.pow(1 + r.irr, 5)).toBeCloseTo(r.moic, 6);
  });
  it("debt never goes negative", () => runLbo({ ...input, leverageMultiple: 1 }).schedule.forEach((y) => expect(y.debtEnd).toBeGreaterThanOrEqual(0)));
});

describe("ratios", () => {
  const s = { revenue: 1000, cogs: 600, opex: 200, da: 50, interestExpense: 30, taxExpense: 30, netIncome: 90,
    cash: 100, receivables: 120, inventory: 80, currentAssets: 400, totalAssets: 1200, payables: 60, currentLiabilities: 200,
    totalDebt: 400, totalEquity: 600, retainedEarnings: 300, cfo: 160, capex: 60, sharePrice: 20, sharesOutstanding: 100 };
  it("dupont identity", () => {
    const d = dupont(s);
    expect(d.roe).toBeCloseTo(90 / 600, 10);
  });
  it("key ratios", () => {
    const r = Object.fromEntries(computeRatios(s).flatMap((g) => g.items.map((x) => [x.name, x.value])));
    expect(r["Current ratio"]).toBe(2);
    expect(r["Interest coverage"]).toBeCloseTo(150 / 30, 10);
    expect(r["EV / EBITDA"]).toBeCloseTo(2300 / 200, 10);
  });
});

describe("portfolio and stats", () => {
  it("quantile matches Excel PERCENTILE.INC", () => {
    expect(quantile([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75, 10);
    expect(median([5, 1, 3])).toBe(3);
  });
  it("perfect negative correlation can eliminate risk", () => {
    const w = minVarianceWeight(0.2, 0.1, -1);
    expect(twoAsset(w, 0.1, 0.2, 0.05, 0.1, -1).vol).toBeCloseTo(0, 10);
  });
  it("max drawdown", () => expect(maxDrawdown([100, 120, 90, 130, 65])).toBeCloseTo(0.5, 10));
  it("1-day 99% VaR", () => expect(parametricVaR(1_000_000, 0.2, 0.99, 1)).toBeCloseTo(2.3263 * 0.2 / Math.sqrt(252) * 1e6, -1));
  it("comps implied value", () => {
    const comps = [
      { name: "A", ev: 1000, marketCap: 800, revenue: 500, ebitda: 100, netIncome: 50 },
      { name: "B", ev: 1200, marketCap: 1000, revenue: 400, ebitda: 100, netIncome: 60 },
      { name: "C", ev: 900, marketCap: 700, revenue: 450, ebitda: 90, netIncome: -10 },
    ];
    const st = summarize(comps);
    expect(st.pe.median).toBeCloseTo((16 + 50 / 3) / 2, 8); // C excluded: negative earnings
    const imp = impliedPerShare({ revenue: 300, ebitda: 60, netIncome: 30, netDebt: 100, shares: 10 }, st);
    expect(imp.evEbitda[1]).toBeCloseTo((10 * 60 - 100) / 10, 8);
  });
});
