// Trading comparables: summary statistics and implied valuation.
import { mean, median, quantile } from "./stats";

export type Comp = { name: string; ev: number; marketCap: number; revenue: number; ebitda: number; netIncome: number };
export type MultipleKey = "evRevenue" | "evEbitda" | "pe";

export function multiples(c: Comp): Record<MultipleKey, number> {
  return {
    evRevenue: c.revenue > 0 ? c.ev / c.revenue : NaN,
    evEbitda: c.ebitda > 0 ? c.ev / c.ebitda : NaN,
    pe: c.netIncome > 0 ? c.marketCap / c.netIncome : NaN, // negative earnings make P/E meaningless
  };
}

export function summarize(comps: Comp[]): Record<MultipleKey, { low: number; q1: number; median: number; mean: number; q3: number; high: number }> {
  const keys: MultipleKey[] = ["evRevenue", "evEbitda", "pe"];
  const out = {} as ReturnType<typeof summarize>;
  for (const k of keys) {
    const xs = comps.map((c) => multiples(c)[k]).filter((x) => isFinite(x));
    out[k] = { low: Math.min(...xs), q1: quantile(xs, 0.25), median: median(xs), mean: mean(xs), q3: quantile(xs, 0.75), high: Math.max(...xs) };
  }
  return out;
}

/** Implied equity value per share for a target from a multiple range [q1, median, q3]. */
export function impliedPerShare(
  target: { revenue: number; ebitda: number; netIncome: number; netDebt: number; shares: number },
  stats: ReturnType<typeof summarize>,
): Record<MultipleKey, [number, number, number]> {
  const ev = (m: number, metric: number) => (m * metric - target.netDebt) / target.shares;
  const pick = (k: MultipleKey) => [stats[k].q1, stats[k].median, stats[k].q3] as const;
  return {
    evRevenue: pick("evRevenue").map((m) => ev(m, target.revenue)) as [number, number, number],
    evEbitda: pick("evEbitda").map((m) => ev(m, target.ebitda)) as [number, number, number],
    pe: pick("pe").map((m) => (m * target.netIncome) / target.shares) as [number, number, number],
  };
}
