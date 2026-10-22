/** True when n is negative and still shows as non-zero at dp places (so −0.00 never appears). */
const showsNegative = (n: number, dp: number) => n < 0 && Number(Math.abs(n).toFixed(dp)) !== 0;

export function money(n: number, dp = 0): string {
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return (showsNegative(n, dp) ? "−$" : "$") + s;
}

export function num(n: number, dp = 0): string {
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return (showsNegative(n, dp) ? "−" : "") + s;
}

/** Decimal → "8.5%". Trims trailing zeros up to dp places. Negatives use the Unicode minus. */
export function pct(x: number, dp = 2): string {
  const v = Number((x * 100).toFixed(dp));
  return v < 0 ? `−${-v}%` : `${Math.abs(v)}%`;
}

export function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
