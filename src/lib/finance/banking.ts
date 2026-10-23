// Bank capital. Amounts are in any one currency unit; risk weights are decimals (1 = 100%).

export type Exposure = { amount: number; riskWeight: number };

/** Credit risk-weighted assets: Σ exposure × risk weight (Basel standardised approach). */
export function creditRwa(exposures: Exposure[]): number {
  return exposures.reduce((s, e) => s + e.amount * e.riskWeight, 0);
}

/**
 * Capital ratio = capital / total RWA, where total RWA = credit RWA + RWA for market and operational risk.
 * Basel III: CET1 ≥ 4.5% of RWA, plus a 2.5% capital conservation buffer (BCBS 189, paras 50 and 129).
 */
export function capitalRatio(capital: number, exposures: Exposure[], otherRwa = 0): number {
  const rwa = creditRwa(exposures) + otherRwa;
  if (rwa <= 0) throw new RangeError("RWA must be positive");
  return capital / rwa;
}
