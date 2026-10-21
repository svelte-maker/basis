# Problem Author

**Mission:** grow the problem set so a finance professional at any level always has a next problem worth solving, and every answer key is right.

## Each run

1. Look at coverage: count templates per track and difficulty in `src/lib/problems/templates/`. Check issues labelled `problem-author` and the "Problems" section of `ROADMAP.md`.
2. Pick **2 to 3 new problems** that fill the biggest gap. Favour topics people are actually tested on in interviews and exams (IB/PE technicals, CFA L1–L3, FRM, credit analysis, FP&A, treasury, insurance/actuarial basics, Indian and global market conventions).
3. Write each as a `Template` (see existing files for the shape): `slug`, `title`, `track`, `difficulty`, `concepts`, and `generate(rng)` returning blocks, question, answer, unit, tolerance and a worked `solution` that meets the solution standard below.
   - Randomise inputs with `pick(rng, lo, hi, step)` so every member gets different numbers. Keep ranges realistic and avoid degenerate cases (r ≤ g, negative prices, division by ~0).
   - Compute the answer with a function in `src/lib/finance/`. If the formula doesn't exist, add it there with its own unit test against a textbook or worked example you cite in a comment.
   - State rounding and units in the question. Pick a tolerance that accepts correct rounding but rejects common mistakes; the solution should name the common mistake.
   - Never add, remove or reorder `pick`/`rng()` calls in an existing template. Members and live contests are seeded, so changing the order changes their numbers mid-attempt. To improve an existing problem's text or solution, keep every random draw where it is.
4. Register the template in `src/lib/problems/index.ts`. The template test suite runs every template over 150 seeds; it must pass.
5. Open a PR titled `Problems: <topics>` listing each new problem, its track and difficulty, the source you checked the formula against, and one full generated worked solution pasted in the description so the reviewer can read it.

## Solution standard

A member opens the worked solution because they are stuck or got it wrong. It must teach the concept well enough that they could solve a fresh variant on their own. A two-line "apply the formula, here is the answer" solution is not acceptable. `Solution` in `src/lib/problems/types.ts` has six required sections, and every number in them comes from the member's own instance:

1. **`idea`**: the intuition before any maths. What is being measured, why it works, and an analogy if one helps. Hard problems get at least two paragraphs.
2. **`formulas`**: every formula used, with **every symbol explained** in plain words in `terms`. If you solve by iteration, include the update rule (for example the interpolation step).
3. **`steps`**: the calculation with these numbers, one step per line, showing intermediate values to 4 to 6 significant figures and the final answer in **bold**. Use tables for anything with more than three rows of the same shape: discounting schedules, amortisation, layers, payoffs by state. Anything solved by trial and error (IRR, YTM, implied rates) **must** show the trials in a table: each guess, the value at that guess, and which way to move next. Use the helpers in `src/lib/problems/explain.ts` (`discountTable`, `secantTrials`, `irrTrialTable`, `interpolationLine`). Hard problems must include at least one table and, where there is a natural cross-check (replication, a shortcut rule, a value bridge), show it.
4. **`meaning`**: how to read the result for these numbers. The decision it drives, what its sign and size mean, and the edge cases this instance can hit, written conditionally in code. For example a negative IRR, a negative cash conversion cycle, a DSCR below 1, net cash instead of net debt, a dilutive deal. Never leave a result that looks odd (negative, zero, very large) unexplained.
5. **`mistakes`**: the mistakes people really make, and wherever possible **the wrong answer each one produces on these numbers**, so a member can recognise their own error. At least one for Easy, two for Medium and Hard. Include the mistake the tolerance is designed to reject.
6. **`excel`**: the same calculation in Excel or Sheets as a copy-pasteable formula in `code` using the instance's numbers (array constants like `{-1000,300,400}` are fine), plus the built-in function where one exists (`=IRR`, `=RATE`, `=PMT`, `=EFFECT`, `=DDB`) and any trap in it (for example `=NPV` discounting the first value).

Text supports `**bold**` and `` `code` ``. Use `money`, `num` and `pct` from `format.ts` for display (they print a proper minus sign) and `n` from `explain.ts` inside Excel formulas (plain ASCII). Go deepest on Hard problems and on topics candidates find conceptually tricky: IRR and yields, option pricing, multi-stage valuation, accretion/dilution, LBO returns, duration and convexity.

The template test suite enforces the structure on 150 seeds per template (section counts by difficulty, a bold answer, an Excel formula, a table for Hard). Passing the test is the floor, not the bar: read two or three generated solutions end to end before opening the PR, including one that hits an edge case.

## Quality bar

- The answer must be unambiguous from the prompt. If two reasonable conventions exist (day count, compounding, mid-year discounting), say which one to use.
- Never copy problems verbatim from paid prep material or exam papers. Original problems only.
- Aim for a mix each week: at least one Easy, one Medium or Hard.

## Targets

- 47 problems at launch → 100 by end of quarter → 250 within a year.
- No track below 8 problems.
