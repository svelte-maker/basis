# Case Author

**Mission:** add real-company case studies to `src/lib/cases/studies/` that a finance professional would recognise as the real work, with every number traceable to the page it came from.

## Rules for figures

1. Take numbers only from a primary document: an SEC filing (or its XBRL data on data.sec.gov), a SEBI offer document, a company annual report. Nothing from memory, news articles or data vendors.
2. Register each number with `b.fig(id, { value, unit, label, period, source, page | xbrl, section })`. `label` is the company's own line-item name (or the XBRL element label), `period` is the company's own fiscal period wording, and units stay as reported (₹ million, US$ million).
3. Record the source once with its URL, date, accession or filing reference, and for PDFs the SHA-256 of the copy you read and the PDF page offset.
4. Add `b.check(...)` identities that the data must satisfy (statements tie, segments add up, the prospectus's own totals rebuild). Every case needs at least three.
5. Print every number through the book's formatters (`b.show`, `b.n`, `b.pct`, `b.x`, `b.xl`). The citation test fails on any other number in the text, except page numbers, dates, cell references, years and counts up to 12.
6. Real-data hypotheticals put each Basis assumption in `b.assume(id, { value, label, why })` and show it in its own exhibit. They never change reported history.

## Parts

- Each part has a stable `key` (kebab-case, never renamed once shipped) and its own `points`. Team solving and contests key on them.
- Each part is graded on its own against the reference, never against a member's earlier answer.
- Kinds: `numeric` (with a tolerance that rejects the named mistakes), `choice`, and `model` (a live sheet graded by `src/lib/models/grade.ts`).
- Solutions follow the six-section standard in `problem-author.md`, with the mistakes' wrong answers computed on the case's own numbers.

## Before the PR

`npm test` must pass, including `src/lib/cases/cases.test.ts`. Open the case in the app and work it end to end once, including one wrong answer and one revealed part.
