// Unlevered free-cash-flow DCF.

export type DcfInput = {
  baseRevenue: number;
  revenueGrowth: number[]; // one entry per forecast year
  ebitMargin: number[]; // one entry per forecast year
  taxRate: number;
  daPctRevenue: number;
  capexPctRevenue: number;
  nwcPctRevenue: number; // net working capital as % of revenue; the change is the cash flow
  wacc: number;
  terminal: { method: "gordon"; growth: number } | { method: "exit"; evEbitda: number };
  midYear: boolean;
  netDebt: number;
  dilutedShares: number;
};

export type DcfYear = {
  year: number; revenue: number; ebit: number; nopat: number; da: number; capex: number;
  changeNwc: number; fcf: number; discountPeriod: number; discountFactor: number; pv: number;
};

export type DcfResult = {
  years: DcfYear[]; sumPv: number; terminalValue: number; pvTerminal: number;
  enterpriseValue: number; equityValue: number; perShare: number; terminalShare: number;
  impliedExitMultiple: number; impliedPerpetualGrowth: number;
};

export function runDcf(i: DcfInput): DcfResult {
  const n = i.revenueGrowth.length;
  if (i.ebitMargin.length !== n) throw new Error("Need one EBIT margin per forecast year");
  const years: DcfYear[] = [];
  let rev = i.baseRevenue;
  let prevNwc = i.baseRevenue * i.nwcPctRevenue;
  for (let k = 0; k < n; k++) {
    rev *= 1 + i.revenueGrowth[k];
    const ebit = rev * i.ebitMargin[k];
    const nopat = ebit * (1 - i.taxRate);
    const da = rev * i.daPctRevenue;
    const capex = rev * i.capexPctRevenue;
    const nwc = rev * i.nwcPctRevenue;
    const changeNwc = nwc - prevNwc;
    prevNwc = nwc;
    const fcf = nopat + da - capex - changeNwc;
    const discountPeriod = i.midYear ? k + 0.5 : k + 1;
    const discountFactor = 1 / Math.pow(1 + i.wacc, discountPeriod);
    years.push({ year: k + 1, revenue: rev, ebit, nopat, da, capex, changeNwc, fcf, discountPeriod, discountFactor, pv: fcf * discountFactor });
  }
  const last = years[n - 1];
  const lastEbitda = last.ebit + last.da;
  let terminalValue: number, tvPeriod: number;
  if (i.terminal.method === "gordon") {
    if (i.wacc <= i.terminal.growth) throw new RangeError("WACC must exceed terminal growth");
    terminalValue = (last.fcf * (1 + i.terminal.growth)) / (i.wacc - i.terminal.growth);
    // Under the mid-year convention a Gordon terminal value sits on the same timing as the final-year cash flow.
    tvPeriod = i.midYear ? n - 0.5 : n;
  } else {
    terminalValue = lastEbitda * i.terminal.evEbitda;
    tvPeriod = n; // an exit multiple values the business at a point in time: end of year n
  }
  const pvTerminal = terminalValue / Math.pow(1 + i.wacc, tvPeriod);
  const sumPv = years.reduce((s, y) => s + y.pv, 0);
  const enterpriseValue = sumPv + pvTerminal;
  const equityValue = enterpriseValue - i.netDebt;
  // Cross-checks: what the terminal value implies under the other method
  const impliedExitMultiple = terminalValue / lastEbitda;
  const impliedPerpetualGrowth = (terminalValue * i.wacc - last.fcf) / (terminalValue + last.fcf);
  return {
    years, sumPv, terminalValue, pvTerminal, enterpriseValue, equityValue,
    perShare: equityValue / i.dilutedShares, terminalShare: pvTerminal / enterpriseValue,
    impliedExitMultiple, impliedPerpetualGrowth,
  };
}

/** Per-share value grid: rows = WACC values, columns = terminal growth (or exit multiple) values. */
export function dcfSensitivity(i: DcfInput, waccs: number[], terminals: number[]): number[][] {
  return waccs.map((w) => terminals.map((t) => {
    const terminal = i.terminal.method === "gordon" ? { method: "gordon" as const, growth: t } : { method: "exit" as const, evEbitda: t };
    try { return runDcf({ ...i, wacc: w, terminal }).perShare; } catch { return NaN; }
  }));
}

