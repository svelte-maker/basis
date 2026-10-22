// Building blocks for worked solutions: paragraphs, tables, discounting schedules and
// hand-style root searches (the trial-and-error a candidate would do on paper).
import type { Block } from "./types";
import { npv } from "@/lib/finance/tvm";
import { num, pct } from "./format";

export const p = (text: string): Block => ({ kind: "p", text });
export const table = (head: string[], rows: string[][]): Block => ({ kind: "table", head, rows });

/** Excel array constant, e.g. {-1000,300,400}. */
export function arr(xs: number[], dp = 4): string {
  return `{${xs.map((x) => Number(x.toFixed(dp))).join(",")}}`;
}

/** Plain number for a formula: no thousands separators, trailing zeros trimmed. */
export function n(x: number, dp = 4): string {
  return String(Number(x.toFixed(dp)));
}

/** One row per period: cash flow, discount factor and present value, with a total row. */
export function discountTable(flows: number[], rate: number, opts: { dp?: number; label?: string; firstPeriod?: number } = {}): Block {
  const dp = opts.dp ?? 2, t0 = opts.firstPeriod ?? 0;
  const rows = flows.map((cf, i) => {
    const df = 1 / Math.pow(1 + rate, t0 + i);
    return [String(t0 + i), num(cf, dp), df.toFixed(4), num(cf * df, dp)];
  });
  const total = flows.reduce((s, cf, i) => s + cf / Math.pow(1 + rate, t0 + i), 0);
  rows.push(["Total", num(flows.reduce((s, x) => s + x, 0), dp), "", `**${num(total, dp)}**`]);
  return table([opts.label ?? "Year", "Cash flow", `Discount factor at ${pct(rate, 3)}`, "Present value"], rows);
}

export type Trial = { x: number; fx: number };

/**
 * Trial and error the way it is done by hand: two starting guesses, then repeated linear
 * interpolation (the secant method) until f(x) is within `tol` of zero. The exact root, if
 * given, is appended when the search stops short of it, so the table always ends on the answer.
 */
export function secantTrials(f: (x: number) => number, x0: number, x1: number, opts: { tol: number; max?: number; floor?: number; exact?: number }): Trial[] {
  const max = opts.max ?? 8, floor = opts.floor ?? -0.99;
  const out: Trial[] = [{ x: x0, fx: f(x0) }, { x: x1, fx: f(x1) }];
  while (out.length < max && Math.abs(out[out.length - 1].fx) > opts.tol) {
    const a = out[out.length - 2], b = out[out.length - 1];
    let next = b.x - (b.fx * (b.x - a.x)) / (b.fx - a.fx);
    if (!isFinite(next) || next <= floor) next = (Math.max(a.x, b.x) + floor) / 2;
    out.push({ x: next, fx: f(next) });
  }
  if (opts.exact !== undefined && Math.abs(out[out.length - 1].x - opts.exact) > 5e-6) out.push({ x: opts.exact, fx: f(opts.exact) });
  return out;
}

/** Wrap a negative number in brackets so "x − −y" reads as "x − (−y)". */
const br = (s: string) => (s.startsWith("−") ? `(${s})` : s);

/** The interpolation step between two trials, written out with the numbers. */
export function interpolationLine(a: Trial, b: Trial, fmt: (x: number) => string, fdp = 2): string {
  const next = b.x - (b.fx * (b.x - a.x)) / (b.fx - a.fx);
  return `Draw a straight line between the two trials: next guess = ${fmt(b.x)} − ${br(num(b.fx, fdp))} × (${fmt(b.x)} − ${br(fmt(a.x))}) / (${num(b.fx, fdp)} − ${br(num(a.fx, fdp))}) = ${fmt(next)}.`;
}

/** IRR search table, starting at 0% (where NPV is simply the sum of the cash flows). */
export function irrTrials(flows: number[], exact: number): Trial[] {
  const f = (r: number) => npv(r, flows);
  const start = f(0);
  return secantTrials(f, 0, start > 0 ? 0.1 : -0.1, { tol: 0.005, exact });
}

export function irrTrialTable(trials: Trial[], dp = 2): Block {
  return table(["Trial", "Rate", "NPV", "What it tells you"], trials.map((t, i) => [
    String(i + 1), pct(t.x, 4), num(t.fx, dp + 2),
    Math.abs(t.fx) < 0.005 ? "NPV ≈ 0: this is the IRR" : t.fx > 0 ? "NPV > 0: rate too low, go higher" : "NPV < 0: rate too high, go lower",
  ]));
}
