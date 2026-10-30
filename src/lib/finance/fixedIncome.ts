// Bond math. Coupon rate and yield are annual decimals; freq is coupons per year.

export type Bond = { face: number; couponRate: number; years: number; freq?: number };

function flows(b: Bond): { t: number; cf: number }[] {
  const f = b.freq ?? 1;
  const n = Math.round(b.years * f);
  const c = (b.face * b.couponRate) / f;
  return Array.from({ length: n }, (_, k) => ({ t: (k + 1) / f, cf: c + (k === n - 1 ? b.face : 0) }));
}

export function bondPrice(b: Bond, ytm: number): number {
  const f = b.freq ?? 1;
  return flows(b).reduce((s, { t, cf }) => s + cf / Math.pow(1 + ytm / f, t * f), 0);
}

export function bondYield(b: Bond, price: number): number {
  let lo = -0.99, hi = 5;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (bondPrice(b, mid) > price) lo = mid; else hi = mid;
    if (hi - lo < 1e-12) break;
  }
  return (lo + hi) / 2;
}

export function macaulayDuration(b: Bond, ytm: number): number {
  const f = b.freq ?? 1;
  const p = bondPrice(b, ytm);
  return flows(b).reduce((s, { t, cf }) => s + (t * cf) / Math.pow(1 + ytm / f, t * f), 0) / p;
}

export function modifiedDuration(b: Bond, ytm: number): number {
  return macaulayDuration(b, ytm) / (1 + ytm / (b.freq ?? 1));
}

/** Convexity in years² (periodic convexity divided by freq²). */
export function convexity(b: Bond, ytm: number): number {
  const f = b.freq ?? 1;
  const y = ytm / f;
  const p = bondPrice(b, ytm);
  const sum = flows(b).reduce((s, { t, cf }) => {
    const k = t * f;
    return s + (cf * k * (k + 1)) / Math.pow(1 + y, k + 2);
  }, 0);
  return sum / p / (f * f);
}

/** Approximate % price change for a yield change dy using duration and convexity. */
export function priceChangeApprox(modDur: number, convex: number, dy: number): number {
  return -modDur * dy + 0.5 * convex * dy * dy;
}

export function currentYield(b: Bond, price: number): number {
  return (b.face * b.couponRate) / price;
}

/** Implied forward rate between years t1 and t2 from annual spot rates. */
export function forwardRate(spot1: number, t1: number, spot2: number, t2: number): number {
  return Math.pow(Math.pow(1 + spot2, t2) / Math.pow(1 + spot1, t1), 1 / (t2 - t1)) - 1;
}

/** Bootstrap annual zero rates from par yields of annual-pay bonds with maturities 1..n. */
export function bootstrapZeros(parYields: number[]): number[] {
  const zeros: number[] = [];
  parYields.forEach((c, i) => {
    const n = i + 1;
    let pvCoupons = 0;
    for (let t = 1; t < n; t++) pvCoupons += c / Math.pow(1 + zeros[t - 1], t);
    zeros.push(Math.pow((1 + c) / (1 - pvCoupons), 1 / n) - 1);
  });
  return zeros;
}

/**
 * Cash settlement of a forward rate agreement, to the party receiving floating (the buyer), paid at
 * the start of the contract period. The interest difference N × (L − K) × τ would be due at the end of
 * the period, so it is discounted back at the reference rate: N(L − K)τ / (1 + Lτ).
 * Hull, Options, Futures, and Other Derivatives, ch. 4 (forward rate agreements); τ = days / 360.
 */
export function fraSettlement(notional: number, contractRate: number, referenceRate: number, days: number, basis = 360): number {
  const tau = days / basis;
  return (notional * (referenceRate - contractRate) * tau) / (1 + referenceRate * tau);
}
