# Learn lessons

The `/learn` section is built from typed lessons in [`src/lib/learn/lessons/`](../../src/lib/learn/lessons/), not Markdown files, so that every number in a worked example is computed by the same tested functions in `src/lib/finance/` that grade the problems. A lesson and the answer key can't disagree.

## Adding or extending a lesson

1. Write the lesson as a `Lesson` (see [`src/lib/learn/types.ts`](../../src/lib/learn/types.ts)) in the module's file under `src/lib/learn/lessons/`. Every field is required:
   - `hook`: why it matters, through a real situation, before any theory.
   - `sections`: the teaching, made of blocks: paragraphs, formulas with every term explained, tables, callouts (`insight`, `desk` for how practitioners really do it, `warning`), Excel rows, and live `sheet` blocks the reader can edit and rebuild.
   - `gap`: "Textbook vs the desk" rows, where classroom finance and real practice part ways. This is the heart of Basis.
   - `mistakes`, `interview` (with model answers), `quiz` (with the reason for each answer) and `glossary`.
   - `apply`: the problems, model tasks, case parts and tools that use the concept.
2. Compute numbers in code (`const v = npv(0.1, flows)`) and interpolate them; never type a computed number into text.
3. Add it to `LESSONS` in [`src/lib/learn/index.ts`](../../src/lib/learn/index.ts). Its slug is its URL; never rename one that has shipped.
4. `npm test` checks links, prerequisites, quiz answers, glossary uniqueness, that live sheets evaluate without errors, and that every problem, model task and case part on Basis is taught by at least one lesson. With a server running, `npm run test:learn` walks every lesson in a browser.

When a new problem, model task or case ships, add it to the `apply` list of the lesson that teaches it, or the coverage test fails.
