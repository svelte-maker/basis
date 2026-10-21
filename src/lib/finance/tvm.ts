// Time value of money. Rates are decimals (0.08 = 8%). Cash flow arrays start at t = 0.

export function pv(fv: number, rate: number, periods: number): number {
  return fv / Math.pow(1 + rate, periods);
}

export function fv(pv: number, rate: number, periods: number): number {
  return pv * Math.pow(1 + rate, periods);
}

export function npv(rate: number, cashFlows: number[]): number {
  if (rate <= -1) throw new RangeError("Rate must be greater than -100%");
  return cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
}

function hasSignChange(cashFlows: number[]): boolean {
  let pos = false, neg = false;
  for (const cf of cashFlows) {
    if (cf > 0) pos = true;
    if (cf < 0) neg = true;
  }
  return pos && neg;
}

/** IRR by Newton's method with a bisection fallback. Returns NaN when no IRR exists. */
export function irr(cashFlows: number[], guess = 0.1): number {
  if (!hasSignChange(cashFlows)) return NaN;
  let r = guess;
  for (let i = 0; i < 100; i++) {
    let f = 0, df = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const d = Math.pow(1 + r, t);
      f += cashFlows[t] / d;
      df -= (t * cashFlows[t]) / (d * (1 + r));
    }
    if (Math.abs(f) < 1e-10) return r;
    if (df === 0 || !isFinite(df)) break;
    const next = r - f / df;
    if (!isFinite(next) || next <= -1) break;
    if (Math.abs(next - r) < 1e-12) return next;
    r = next;
  }
  // Bisection over a wide bracket
  let lo = -0.9999, hi = 10;
  let flo = npv(lo, cashFlows), fhi = npv(hi, cashFlows);
  if (flo * fhi > 0) return NaN;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fm = npv(mid, cashFlows);
    if (Math.abs(fm) < 1e-10 || hi - lo < 1e-12) return mid;
    if (fm * flo < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

/** Modified IRR: negative flows financed at financeRate, positive flows reinvested at reinvestRate. */
export function mirr(cashFlows: number[], financeRate: number, reinvestRate: number): number {
  const n = cashFlows.length - 1;
  let pvNeg = 0, fvPos = 0;
  cashFlows.forEach((cf, t) => {
    if (cf < 0) pvNeg += cf / Math.pow(1 + financeRate, t);
    else fvPos += cf * Math.pow(1 + reinvestRate, n - t);
  });
  if (pvNeg === 0 || n === 0) return NaN;
  return Math.pow(fvPos / -pvNeg, 1 / n) - 1;
}

/** Years until cumulative cash flow turns non-negative, interpolated within the year. Infinity if never. */
export function paybackPeriod(cashFlows: number[], rate = 0): number {
  let cum = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    const cf = cashFlows[t] / Math.pow(1 + rate, t);
    const prev = cum;
    cum += cf;
    if (t > 0 && prev < 0 && cum >= 0) return t - 1 + -prev / cf;
    if (t === 0 && cum >= 0) return 0;
  }
  return Infinity;
}

const DAY_MS = 86_400_000;

export function xnpv(rate: number, cashFlows: number[], dates: Date[]): number {
  const t0 = dates[0].getTime();
  return cashFlows.reduce((s, cf, i) => s + cf / Math.pow(1 + rate, (dates[i].getTime() - t0) / DAY_MS / 365), 0);
}

export function xirr(cashFlows: number[], dates: Date[]): number {
  if (!hasSignChange(cashFlows)) return NaN;
  let lo = -0.9999, hi = 10;
  let flo = xnpv(lo, cashFlows, dates);
  if (flo * xnpv(hi, cashFlows, dates) > 0) return NaN;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    const fm = xnpv(mid, cashFlows, dates);
    if (Math.abs(fm) < 1e-9 || hi - lo < 1e-12) return mid;
    if (fm * flo < 0) hi = mid; else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

/** Level payment for a loan of `principal` over `n` periods. Positive result = payment amount. */
export function pmt(rate: number, n: number, principal: number, futureValue = 0, due = false): number {
  if (n <= 0) throw new RangeError("Number of periods must be positive");
  if (rate === 0) return (principal + futureValue) / n;
  const f = Math.pow(1 + rate, n);
  const p = (rate * (principal * f + futureValue)) / (f - 1);
  return due ? p / (1 + rate) : p;
}

export function annuityPV(payment: number, rate: number, n: number, due = false): number {
  const base = rate === 0 ? payment * n : (payment * (1 - Math.pow(1 + rate, -n))) / rate;
  return due ? base * (1 + rate) : base;
}

export function annuityFV(payment: number, rate: number, n: number, due = false): number {
  const base = rate === 0 ? payment * n : (payment * (Math.pow(1 + rate, n) - 1)) / rate;
  return due ? base * (1 + rate) : base;
}

export function perpetuityPV(payment: number, rate: number, growth = 0): number {
  if (rate <= growth) throw new RangeError("Discount rate must exceed growth rate");
  return payment / (rate - growth);
}

export function effectiveAnnualRate(nominal: number, compoundsPerYear: number): number {
  if (!isFinite(compoundsPerYear)) return Math.exp(nominal) - 1;
  return Math.pow(1 + nominal / compoundsPerYear, compoundsPerYear) - 1;
}

export type AmortRow = { period: number; payment: number; interest: number; principal: number; balance: number };

export function amortizationSchedule(principal: number, annualRate: number, years: number, periodsPerYear = 12, extraPayment = 0): AmortRow[] {
  const r = annualRate / periodsPerYear;
  const n = Math.round(years * periodsPerYear);
  const base = pmt(r, n, principal);
  const rows: AmortRow[] = [];
  let bal = principal;
  for (let k = 1; k <= n && bal > 1e-8; k++) {
    const interest = bal * r;
    let principalPaid = base - interest + extraPayment;
    if (principalPaid > bal) principalPaid = bal;
    bal -= principalPaid;
    rows.push({ period: k, payment: interest + principalPaid, interest, principal: principalPaid, balance: Math.max(0, bal) });
  }
  return rows;
}
