// Option pricing. Rates and volatility are annual, continuously compounded; t in years.

export function normCdf(x: number): number {
  // Abramowitz-Stegun 7.1.26 via erf, accurate to ~1e-7
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export type BSInput = { spot: number; strike: number; t: number; rate: number; vol: number; dividendYield?: number };
export type Greeks = { price: number; delta: number; gamma: number; vega: number; theta: number; rho: number };

export function blackScholes(i: BSInput, type: "call" | "put"): Greeks {
  const q = i.dividendYield ?? 0;
  const { spot: S, strike: K, t, rate: r, vol: v } = i;
  if (t <= 0 || v <= 0) {
    const intrinsic = type === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: intrinsic, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const sq = Math.sqrt(t);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * v * v) * t) / (v * sq);
  const d2 = d1 - v * sq;
  const dfq = Math.exp(-q * t), dfr = Math.exp(-r * t);
  const gamma = (dfq * normPdf(d1)) / (S * v * sq);
  const vega = (S * dfq * normPdf(d1) * sq) / 100; // per 1 vol point
  if (type === "call") {
    const price = S * dfq * normCdf(d1) - K * dfr * normCdf(d2);
    const theta = (-(S * dfq * normPdf(d1) * v) / (2 * sq) - r * K * dfr * normCdf(d2) + q * S * dfq * normCdf(d1)) / 365;
    return { price, delta: dfq * normCdf(d1), gamma, vega, theta, rho: (K * t * dfr * normCdf(d2)) / 100 };
  }
  const price = K * dfr * normCdf(-d2) - S * dfq * normCdf(-d1);
  const theta = (-(S * dfq * normPdf(d1) * v) / (2 * sq) + r * K * dfr * normCdf(-d2) - q * S * dfq * normCdf(-d1)) / 365;
  return { price, delta: -dfq * normCdf(-d1), gamma, vega, theta, rho: (-K * t * dfr * normCdf(-d2)) / 100 };
}

export function impliedVol(i: Omit<BSInput, "vol">, type: "call" | "put", marketPrice: number): number {
  let lo = 1e-4, hi = 5;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (blackScholes({ ...i, vol: mid }, type).price > marketPrice) hi = mid; else lo = mid;
    if (hi - lo < 1e-8) break;
  }
  return (lo + hi) / 2;
}

/** Cox-Ross-Rubinstein binomial tree. American exercise if `american`. */
export function binomial(i: BSInput, type: "call" | "put", steps = 200, american = false): number {
  const q = i.dividendYield ?? 0;
  const dt = i.t / steps;
  const u = Math.exp(i.vol * Math.sqrt(dt));
  const d = 1 / u;
  const p = (Math.exp((i.rate - q) * dt) - d) / (u - d);
  const disc = Math.exp(-i.rate * dt);
  const payoff = (s: number) => (type === "call" ? Math.max(0, s - i.strike) : Math.max(0, i.strike - s));
  const v: number[] = [];
  for (let j = 0; j <= steps; j++) v.push(payoff(i.spot * Math.pow(u, j) * Math.pow(d, steps - j)));
  for (let n = steps - 1; n >= 0; n--) {
    for (let j = 0; j <= n; j++) {
      const cont = disc * (p * v[j + 1] + (1 - p) * v[j]);
      v[j] = american ? Math.max(cont, payoff(i.spot * Math.pow(u, j) * Math.pow(d, n - j))) : cont;
    }
  }
  return v[0];
}

/** Put price implied by put-call parity with a discrete annual rate. */
export function putFromParity(call: number, spot: number, strike: number, annualRate: number, t: number): number {
  return call - spot + strike / Math.pow(1 + annualRate, t);
}
