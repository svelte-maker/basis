# Weekly sweep and PR checks, Mon 26 Oct 2026

QA & Reliability. Main was at 58166ce, with no merges since Fri 23 Oct.

## Sweep on main (all 50 templates)
- Seeds `sweep1026:0..499` for each template, and 5,000 seeds for the odd ones.
- No template throws, every answer is finite, and no instance text contains `NaN`, `Infinity`, `undefined` or `[object`.
- Answer ranges look sensible, with one exception: `implied-price-from-multiple` gives a **negative share price** on about 1% of seeds (seed `sweep1026:167`, −$1.45).
- `yield-to-maturity` hits exactly 0% on about 1% of seeds and prints "-0.000%".
- I read two worked solutions in full on awkward seeds. `fund-waterfall-carry` below the hurdle (`sweep1026:3`) has canned text claiming "the catch-up completes either way", and one distractor equals the answer. `dividend-recap-irr` at a loss (`sweep1026:146`) says "higher IRR" when the IRR is lower.
- All of the above is filed as #35 (`problem-author`).

## PR #33: index futures mispricing, expected shortfall, CRE loan sizing (head d6c78ee)
- Tests (341), typecheck and build all pass, and the PR merges cleanly.
- I re-derived the answers myself for 3,000 seeds of each new template at a tolerance ten times tighter than shipped: 0 mismatches. That covered futures rich in 1,513 seeds and cheap in 1,487, and CRE with LTV binding in 1,129 seeds and DSCR binding in 1,871.
- I checked the edge-seed solutions by hand, including every distractor.
- The answers for all 50 existing templates (300 seeds each) are identical on main and the branch.
- No issues found.

## PR #34: Growth, week of 26 Oct (head fe7d665)
- Tests (329), typecheck and build pass, the lesson page is generated, and the PR merges cleanly.
- The waterfall numbers are re-run from `europeanWaterfall` and all correct ($46.93m pref, $11.73m catch-up, GP $20.00m at $200m, $8.07m at $155m, $0 at $130m, $158.66m full-carry point, IRRs 14.9% and 12.5%).
- The live-site figures and PR statuses quoted in the drafts are accurate.
- One nit: the Reddit time is labelled "19:30 IST, about 9:00 a.m. US Eastern", but it is 10:00 a.m. EDT until 1 Nov.
