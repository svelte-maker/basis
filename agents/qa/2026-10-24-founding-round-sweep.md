# QA pre-contest sweep: Founding Round problems (2026-10-24)

This is an independent check of the five problems in Basis #1: The Founding Round (`lbo-sources-and-uses`, `unlevered-free-cash-flow`, `macaulay-duration`, `eps-accretion-dilution`, `lbo-exit-returns`). Each problem was checked on 3,000 instances: 1,500 practice-style seeds and 1,500 `contestSeed(...)` seeds, so 15,000 in all. The script reads the numbers from the rendered statement and recomputes each answer without using `src/lib/finance`. It also checks every instance for `NaN`, `Infinity` or `undefined` anywhere in the statement or solution.

Result: 0 mismatches and 0 bad values. Answer ranges were: equity $37m to $3,090m; UFCF −$98m to $545m; duration 1.91 to 3.83 years; EPS −55.6% to +51.6%; IRR 2.3% to 46.4%.

Observation, not a bug: about 3% of `eps-accretion-dilution` instances land beyond ±25%. The extreme case is an all-debt deal at 9% for a target on 28x earnings. The arithmetic is right, but such cases are unusual for a real deal.

Run from the repo root: `npx tsx --tsconfig tsconfig.json <this script saved as .ts>`.

```ts
import { instantiate, contestSeed } from "./src/lib/problems/index";
const T = (i: any) => i.blocks.map((b: any) => b.text ?? "").join(" ");
const N = (s: string, re: RegExp) => { const m = s.match(re); if (!m) throw new Error("parse " + re + " in " + s); return +m[1].replace(/,/g, ""); };
const num = "\\$?([\\d,]+(?:\\.\\d+)?)";
const solvers: Record<string, (i: any) => number> = {
  "lbo-sources-and-uses": (i) => { const s = T(i);
    const e = N(s, new RegExp(`with \\*\\*${num}m\\*\\* of EBITDA`)), m = N(s, /at \*\*([\d.]+)x\*\* EV/), f = N(s, /fees are \*\*([\d.]+)%/) / 100, c = N(s, new RegExp(`needs \\*\\*${num}m\\*\\* of minimum`)), d = N(s, /provide \*\*([\d.]+)x\*\*/);
    const ev = e * m; return ev + ev * f + c - d * e; },
  "unlevered-free-cash-flow": (i) => { const r = Object.fromEntries((i.blocks[0].rows as string[][]).map(([k, v]) => [k, parseFloat(v.replace(/,/g, "").replace("−", "-"))]));
    return r["EBIT"] * (1 - r["Tax rate"] / 100) + r["D&A"] - r["Capital expenditure"] - r["Increase in net working capital"]; },
  "macaulay-duration": (i) => { const s = T(i); const n = N(s, /\*\*(\d+)-year\*\*/), c = N(s, /\*\*([\d.]+)%\*\* annual coupon/) / 100, F = N(s, new RegExp(`on \\*\\*${num}\\*\\* face`)), y = N(s, /yields \*\*([\d.]+)%/) / 100;
    let pv = 0, w = 0; for (let t = 1; t <= n; t++) { const cf = F * c + (t === n ? F : 0); const d = cf / (1 + y) ** t; pv += d; w += t * d; } return w / pv; },
  "eps-accretion-dilution": (i) => { const s = T(i);
    const ni = N(s, new RegExp(`earns \\*\\*${num}m\\*\\* on`)), sh = N(s, /on \*\*([\d,.]+)m\*\* shares/), p = N(s, new RegExp(`trading at \\*\\*${num}\\*\\*`)), tni = N(s, new RegExp(`target earning \\*\\*${num}m\\*\\*`)), price = N(s, new RegExp(`for \\*\\*${num}m\\*\\*`)), stock = N(s, /\*\*([\d.]+)% with new stock\*\*/) / 100, r = N(s, /new debt at \*\*([\d.]+)%/) / 100, t = N(s, /Tax rate is \*\*([\d.]+)%/) / 100;
    const ns = price * stock / p, debt = price * (1 - stock); const pf = (ni + tni - debt * r * (1 - t)) / (sh + ns); return (pf / (ni / sh) - 1) * 100; },
  "lbo-exit-returns": (i) => { const s = T(i);
    const e = N(s, new RegExp(`with \\*\\*${num}m\\*\\* EBITDA`)), m = N(s, /EBITDA at \*\*([\d.]+)x\*\*/), d = N(s, /funded with \*\*([\d.]+)x\*\* debt/), g = N(s, /grows \*\*([\d.]+)%/) / 100, yrs = N(s, /Over \*\*(\d+) years/), rep = N(s, /repays \*\*([\d.]+)%/) / 100, xm = N(s, /exits at \*\*([\d.]+)x/);
    const eq0 = e * m - e * d, exitEq = e * (1 + g) ** yrs * xm - e * d * (1 - rep); return ((exitEq / eq0) ** (1 / yrs) - 1) * 100; },
};
const out: Record<string, any> = {};
for (const [slug, solve] of Object.entries(solvers)) {
  let bad = 0, worst = 0, min = Infinity, max = -Infinity, n = 0, textBad = 0;
  for (let k = 0; k < 3000; k++) {
    const seed = k < 1500 ? `qa-sweep-${k}` : contestSeed("founding-qa", `user-${k}`, slug);
    const i = instantiate(slug, seed); n++;
    const all = JSON.stringify(i); if (/NaN|Infinity|undefined/.test(all)) textBad++;
    if (!Number.isFinite(i.answer)) { bad++; continue; }
    const mine = solve(i), tol = (i.tolerance as any).abs ?? 0, diff = Math.abs(mine - i.answer);
    worst = Math.max(worst, diff / (tol || 1)); min = Math.min(min, i.answer); max = Math.max(max, i.answer);
    if (!(diff <= tol / 10)) { bad++; if (bad < 3) console.log(slug, seed, mine, i.answer); }
  }
  out[slug] = { n, mismatches: bad, textNaN: textBad, answerRange: [+min.toFixed(3), +max.toFixed(3)], worstDiffOverTol: +worst.toExponential(2) };
}
console.log(JSON.stringify(out, null, 1));
```
