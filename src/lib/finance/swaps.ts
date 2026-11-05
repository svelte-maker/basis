// Interest rate swaps and FRAs on an annual grid. Rates are decimals; discount factors index from year 1.

/** Discount factors 1 / (1 + z_t)^t from annual zero rates for years 1..n. */
export function discountFactors(zeros: number[]): number[] {
  return zeros.map((z, i) => 1 / Math.pow(1 + z, i + 1));
}

/** Sum of discount factors: the PV of 1 paid at the end of every year (the swap's "annuity"). */
export function annuityFactor(dfs: number[]): number {
  return dfs.reduce((s, d) => s + d, 0);
}

/** Fixed rate that makes a new annual-pay swap worth zero: (1 − DF_n) / Σ DF. */
export function parSwapRate(dfs: number[]): number {
  return (1 - dfs[dfs.length - 1]) / annuityFactor(dfs);
}

/**
 * Value to the fixed-rate payer of an annual-pay swap just after a reset. The floating leg is worth
 * par then, so value = notional × [(1 − DF_n) − fixedRate × Σ DF]. The fixed receiver's value is the negative.
 */
export function swapValueToPayer(notional: number, fixedRate: number, dfs: number[]): number {
  return notional * ((1 - dfs[dfs.length - 1]) - fixedRate * annuityFactor(dfs));
}

/** Change in the payer's value for a 1bp rise in the fixed-rate equivalent: notional × Σ DF × 0.0001. */
export function swapDv01(notional: number, dfs: number[]): number {
  return notional * annuityFactor(dfs) * 0.0001;
}

/**
 * Cash paid to the FRA buyer (who locked in borrowing at contractRate) at the start of the period,
 * discounted at the settlement rate: N × (L − K) × τ / (1 + L × τ). Negative means the buyer pays.
 */
export function fraSettlement(notional: number, contractRate: number, settlementRate: number, years: number): number {
  return (notional * (settlementRate - contractRate) * years) / (1 + settlementRate * years);
}
