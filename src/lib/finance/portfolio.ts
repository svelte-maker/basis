// Portfolio and risk measures. Returns are periodic decimals.
import { covariance, mean, quantile, stdev } from "./stats";
import { normCdf, normPdf } from "./options";

export function beta(assetReturns: number[], marketReturns: number[]): number {
  return covariance(assetReturns, marketReturns) / Math.pow(stdev(marketReturns), 2);
}

export function sharpe(returns: number[], riskFreePerPeriod: number, periodsPerYear = 1): number {
  const ex = returns.map((r) => r - riskFreePerPeriod);
  return (mean(ex) / stdev(ex)) * Math.sqrt(periodsPerYear);
}

export function sortino(returns: number[], targetPerPeriod: number, periodsPerYear = 1): number {
  const downside = Math.sqrt(returns.reduce((s, r) => s + Math.min(0, r - targetPerPeriod) ** 2, 0) / returns.length);
  return ((mean(returns) - targetPerPeriod) / downside) * Math.sqrt(periodsPerYear);
}

export function treynor(portfolioReturn: number, riskFree: number, b: number): number {
  return (portfolioReturn - riskFree) / b;
}

export function jensensAlpha(portfolioReturn: number, riskFree: number, b: number, marketReturn: number): number {
  return portfolioReturn - (riskFree + b * (marketReturn - riskFree));
}

/** Two-asset portfolio expected return and volatility. */
export function twoAsset(w1: number, r1: number, s1: number, r2: number, s2: number, rho: number): { ret: number; vol: number } {
  const w2 = 1 - w1;
  return { ret: w1 * r1 + w2 * r2, vol: Math.sqrt(w1 * w1 * s1 * s1 + w2 * w2 * s2 * s2 + 2 * w1 * w2 * rho * s1 * s2) };
}

/** Weight in asset 1 that minimises two-asset portfolio variance. */
export function minVarianceWeight(s1: number, s2: number, rho: number): number {
  const c = rho * s1 * s2;
  return (s2 * s2 - c) / (s1 * s1 + s2 * s2 - 2 * c);
}

function invNorm(p: number): number {
  let lo = -10, hi = 10;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (normCdf(m) < p) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/** Parametric (normal) VaR as a positive loss amount over `days`, scaled by sqrt of time. */
export function parametricVaR(value: number, annualVol: number, confidence: number, days: number, annualReturn = 0): number {
  const z = invNorm(confidence);
  const t = days / 252;
  return value * (z * annualVol * Math.sqrt(t) - annualReturn * t);
}

/**
 * Parametric (normal, zero mean) expected shortfall as a positive loss: the average loss on the
 * days that are worse than VaR. ES = value × σ × φ(z) / (1 − confidence), z = Φ⁻¹(confidence).
 * Pass `z` to use a rounded table value (e.g. 1.96) instead of the exact quantile.
 * Basel's market-risk standard uses 97.5% ES (BCBS d352, "Minimum capital requirements for market risk", 2016).
 */
export function parametricES(value: number, periodVol: number, confidence: number, z = invNorm(confidence)): number {
  return (value * periodVol * normPdf(z)) / (1 - confidence);
}

/** Historical VaR as a positive loss fraction at the given confidence. */
export function historicalVaR(returns: number[], confidence: number): number {
  return -quantile(returns, 1 - confidence);
}

export function maxDrawdown(prices: number[]): number {
  let peak = -Infinity, mdd = 0;
  for (const p of prices) { peak = Math.max(peak, p); mdd = Math.max(mdd, (peak - p) / peak); }
  return mdd;
}

export { invNorm };
