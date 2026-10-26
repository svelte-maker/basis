// Futures and forwards on assets with a continuous yield. Rates are annual, continuously compounded; t in years.

/**
 * Cost-of-carry fair value of a futures or forward on an asset paying a continuous yield q
 * (a stock index's dividend yield): F = S × e^((r − q) t). Hull, "Options, Futures, and Other
 * Derivatives", chapter 5 (forward on an asset providing a known yield).
 */
export function futuresFairValue(spot: number, rate: number, yieldRate: number, t: number): number {
  return spot * Math.exp((rate - yieldRate) * t);
}
