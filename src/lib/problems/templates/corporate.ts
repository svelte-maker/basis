import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";
import { irr, npv, paybackPeriod, pmt, effectiveAnnualRate } from "@/lib/finance/tvm";
import { wacc, accretionDilution, treasuryStockMethod } from "@/lib/finance/corporate";

export const corporate: Template[] = [
  {
    slug: "project-npv",
    title: "Project NPV",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["NPV", "Capital budgeting"],
    generate(rng) {
      const c0 = pick(rng, 800, 2000, 50), r = pick(rng, 0.06, 0.14, 0.01);
      const cfs = [1, 2, 3].map(() => pick(rng, 200, 900, 25));
      const flows = [-c0, ...cfs];
      const ans = npv(r, flows);
      return {
        blocks: [
          { kind: "p", text: `A project costs **${money(c0)}** today and returns the cash flows below at the end of each year. The discount rate is **${pct(r)}**.` },
          { kind: "table", head: ["Year", "0", "1", "2", "3"], rows: [["Cash flow", ...flows.map((x) => num(x))]] },
        ],
        question: "What is the project's NPV?",
        answer: ans, unit: "$", tolerance: { abs: 0.1 },
        solution: [
          `PV of inflows = ${cfs.map((c, i) => `${c}/${(1 + r).toFixed(2)}${i ? `^${i + 1}` : ""}`).join(" + ")} = ${money(ans + c0, 2)}.`,
          `NPV = ${money(ans + c0, 2)} − ${money(c0)} = **${money(ans, 2)}**. ${ans >= 0 ? "Accept" : "Reject"} the project.`,
        ],
      };
    },
  },
  {
    slug: "project-irr",
    title: "Project IRR",
    track: "Corporate Finance",
    difficulty: "Medium",
    concepts: ["IRR", "Capital budgeting"],
    generate(rng) {
      const c0 = pick(rng, 1000, 3000, 100);
      const cfs = [1, 2, 3, 4].map(() => pick(rng, 250, 1100, 50));
      const flows = [-c0, ...cfs];
      const r = irr(flows);
      if (!isFinite(r)) return this.generate(rng);
      return {
        blocks: [
          { kind: "p", text: "A project has the cash flows below." },
          { kind: "table", head: ["Year", "0", "1", "2", "3", "4"], rows: [["Cash flow", ...flows.map((x) => num(x))]] },
        ],
        question: "What is its internal rate of return? Enter a percentage to two decimals.",
        answer: r * 100, unit: "%", tolerance: { abs: 0.02 },
        solution: [
          "IRR is the rate that sets NPV to zero. Solve by iteration (Excel: =IRR).",
          `At ${pct(r)}, NPV = ${npv(r, flows).toFixed(4)}. IRR = **${(r * 100).toFixed(2)}%**.`,
        ],
      };
    },
  },
  {
    slug: "wacc",
    title: "Weighted average cost of capital",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["WACC", "Cost of capital"],
    generate(rng) {
      const e = pick(rng, 300, 900, 50), d = pick(rng, 100, 700, 50);
      const re = pick(rng, 0.08, 0.15, 0.005), rd = pick(rng, 0.03, 0.08, 0.005), t = pick(rng, 0.2, 0.3, 0.01);
      const ans = wacc({ equityValue: e, debtValue: d, costOfEquity: re, preTaxCostOfDebt: rd, taxRate: t }) * 100;
      return {
        blocks: [{ kind: "p", text: `A company has **${money(e)}m** of equity and **${money(d)}m** of debt at market value. Cost of equity is **${pct(re)}**, pre-tax cost of debt is **${pct(rd)}** and the tax rate is **${pct(t)}**.` }],
        question: "What is the WACC? Enter a percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [
          `Weights: E/V = ${(e / (e + d)).toFixed(4)}, D/V = ${(d / (e + d)).toFixed(4)}.`,
          `WACC = ${(e / (e + d)).toFixed(4)} × ${pct(re)} + ${(d / (e + d)).toFixed(4)} × ${pct(rd)} × (1 − ${pct(t)}) = **${ans.toFixed(2)}%**.`,
        ],
      };
    },
  },
  {
    slug: "payback-period",
    title: "Payback period",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["Payback", "Capital budgeting"],
    generate(rng) {
      const c0 = pick(rng, 500, 1500, 50);
      const cfs = [1, 2, 3, 4, 5].map(() => pick(rng, 150, 450, 10));
      const flows = [-c0, ...cfs];
      const ans = paybackPeriod(flows);
      if (!isFinite(ans)) return this.generate(rng);
      return {
        blocks: [
          { kind: "p", text: "Cash arrives evenly through each year." },
          { kind: "table", head: ["Year", "0", "1", "2", "3", "4", "5"], rows: [["Cash flow", ...flows.map((x) => num(x))]] },
        ],
        question: "What is the payback period in years? Two decimals.",
        answer: ans, unit: "years", tolerance: { abs: 0.006 },
        solution: ["Accumulate cash flows until the running total turns positive, then interpolate within that year.", `Payback = **${ans.toFixed(2)} years**.`],
      };
    },
  },
  {
    slug: "loan-payment",
    title: "Monthly loan payment",
    track: "Corporate Finance",
    difficulty: "Medium",
    concepts: ["Annuities", "Amortisation"],
    generate(rng) {
      const p = pick(rng, 50_000, 600_000, 5_000), r = pick(rng, 0.03, 0.09, 0.0025), y = pick(rng, 5, 30, 5);
      const ans = pmt(r / 12, y * 12, p);
      return {
        blocks: [{ kind: "p", text: `A borrower takes a **${money(p)}** loan at **${pct(r)}** a year, compounded monthly, repaid in equal monthly instalments over **${y} years**.` }],
        question: "What is the monthly payment?",
        answer: ans, unit: "$", tolerance: { abs: 0.05 },
        solution: [`r = ${pct(r)}/12, n = ${y * 12}.`, `PMT = P × r / (1 − (1 + r)^−n) = **${money(ans, 2)}**.`],
      };
    },
  },
  {
    slug: "effective-annual-rate",
    title: "Effective annual rate",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["Compounding", "EAR"],
    generate(rng) {
      const apr = pick(rng, 0.04, 0.24, 0.005);
      const freq = [2, 4, 12, 365][Math.floor(rng() * 4)];
      const label = { 2: "semi-annually", 4: "quarterly", 12: "monthly", 365: "daily" }[freq];
      const ans = effectiveAnnualRate(apr, freq) * 100;
      return {
        blocks: [{ kind: "p", text: `A credit product quotes an APR of **${pct(apr)}**, compounded **${label}**.` }],
        question: "What is the effective annual rate? Enter a percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`EAR = (1 + ${pct(apr)}/${freq})^${freq} − 1 = **${ans.toFixed(2)}%**.`],
      };
    },
  },
  {
    slug: "diluted-shares-tsm",
    title: "Diluted shares with the treasury stock method",
    track: "Corporate Finance",
    difficulty: "Medium",
    concepts: ["Dilution", "Treasury stock method"],
    generate(rng) {
      const basic = pick(rng, 50, 300, 5), price = pick(rng, 20, 80, 1);
      const o1 = { count: pick(rng, 2, 10, 0.5), strike: pick(rng, 5, price - 5, 1) };
      const o2 = { count: pick(rng, 2, 10, 0.5), strike: pick(rng, price - 10, price + 15, 1) };
      const net = treasuryStockMethod(price, [o1, o2]);
      const ans = basic + net;
      return {
        blocks: [
          { kind: "p", text: `A company has **${basic}m** basic shares and trades at **${money(price)}**. It has two tranches of options outstanding:` },
          { kind: "table", head: ["Tranche", "Options (m)", "Strike"], rows: [["A", num(o1.count, 1), money(o1.strike)], ["B", num(o2.count, 1), money(o2.strike)]] },
        ],
        question: "How many diluted shares are outstanding, in millions? Two decimals.",
        answer: ans, unit: "shares", tolerance: { abs: 0.01 },
        solution: [
          "Only in-the-money options dilute. Exercise proceeds buy back shares at the current price.",
          ...[o1, o2].map((o, i) => o.strike < price
            ? `Tranche ${"AB"[i]}: ${o.count} − ${o.count} × ${o.strike}/${price} = ${(o.count - (o.count * o.strike) / price).toFixed(3)}m new shares.`
            : `Tranche ${"AB"[i]}: out of the money, ignored.`),
          `Diluted shares = ${basic} + ${net.toFixed(3)} = **${ans.toFixed(2)}m**.`,
        ],
      };
    },
  },
  {
    slug: "eps-accretion-dilution",
    title: "Merger accretion or dilution",
    track: "Corporate Finance",
    difficulty: "Hard",
    concepts: ["M&A", "EPS", "Accretion/dilution"],
    generate(rng) {
      const aNI = pick(rng, 200, 800, 10), aShares = pick(rng, 100, 400, 10), aPrice = pick(rng, 20, 90, 1);
      const tNI = pick(rng, 20, 150, 5), premiumPE = pick(rng, 10, 30, 1);
      const price = tNI * premiumPE, pctStock = pick(rng, 0, 1, 0.25), rd = pick(rng, 0.04, 0.09, 0.005), t = 0.25;
      const r = accretionDilution({ acquirerNetIncome: aNI, acquirerShares: aShares, targetNetIncome: tNI, purchasePrice: price, pctStock, acquirerSharePrice: aPrice, costOfDebt: rd, taxRate: t });
      const ans = r.accretion * 100;
      return {
        blocks: [
          { kind: "p", text: `An acquirer earns **${money(aNI)}m** on **${aShares}m** shares trading at **${money(aPrice)}**. It buys a target earning **${money(tNI)}m** for **${money(price)}m**.` },
          { kind: "p", text: `The deal is funded **${pct(pctStock, 0)} with new stock** at the current price and the rest with new debt at **${pct(rd)}**. Tax rate is **25%**. Ignore synergies and fees.` },
        ],
        question: "What is the EPS accretion (positive) or dilution (negative) in year 1? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.02 },
        solution: [
          `Standalone EPS = ${aNI}/${aShares} = ${money(r.standaloneEPS, 4)}.`,
          `New shares = ${money(price * pctStock)}m / ${money(aPrice)} = ${r.newShares.toFixed(3)}m. New debt = ${money(price * (1 - pctStock))}m, after-tax interest = ${money(price * (1 - pctStock) * rd * 0.75, 3)}m.`,
          `Pro forma EPS = (${aNI} + ${tNI} − interest) / (${aShares} + new shares) = ${money(r.proFormaEPS, 4)}.`,
          `Change = **${ans.toFixed(2)}%** (${ans >= 0 ? "accretive" : "dilutive"}).`,
        ],
      };
    },
  },
];
