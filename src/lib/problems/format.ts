export function money(n: number, dp = 0): string {
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return (n < 0 ? "−$" : "$") + s;
}

export function num(n: number, dp = 0): string {
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return (n < 0 ? "−" : "") + s;
}

/** Decimal → "8.5%". Trims trailing zeros up to dp places. */
export function pct(x: number, dp = 2): string {
  return `${Number((x * 100).toFixed(dp))}%`;
}

export function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
