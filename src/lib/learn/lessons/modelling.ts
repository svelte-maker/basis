import { irr, npv, pmt, xirr, xnpv } from "@/lib/finance/tvm";
import { money, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Financial modelling principles ----------

export const modellingPrinciples: Lesson = {
  slug: "financial-modelling-principles",
  title: "Financial modelling: building models people can trust",
  summary: "How professional models are structured: inputs, calculations and outputs; formatting conventions; drivers and scenarios; checks; and the habits that keep a model from breaking.",
  module: "modelling",
  level: "Core",
  prerequisites: ["three-financial-statements"],
  outcomes: [
    "Lay out a model so someone else can audit it in minutes: inputs, calculations, outputs.",
    "Apply the banking conventions: blue inputs, black formulas, one formula per row, no hard-codes.",
    "Drive a forecast from a small set of assumptions, with a scenario switch.",
    "Build checks that catch errors (balance sheet balances, cash ties) before anyone else does.",
  ],
  hook: [
    "In 2012 a bank lost billions on a trading strategy whose risk model was assembled by copying and pasting between spreadsheets; one formula divided by a sum instead of an average and understated risk. Spreadsheet errors are not rare: studies of real-world business spreadsheets keep finding that a large share contain material mistakes.",
    "The difference between a student model and a professional one is not cleverness. It is structure, discipline and checks, so that errors are hard to make and easy to find.",
  ],
  sections: [
    {
      id: "structure",
      title: "Structure: inputs, calculations, outputs",
      blocks: [
        { kind: "p", text: "Every good model separates three things. **Inputs** are the assumptions: growth rates, margins, prices, tax rates, each typed once. **Calculations** turn inputs into the forecast and never contain typed numbers. **Outputs** summarise the answer: valuation, returns, ratios, charts. A reviewer should be able to change any input and watch the outputs move." },
        { kind: "list", items: [
          "**Flow one way.** Left to right in time, top to bottom in logic. Avoid formulas that reach back up to the right.",
          "**One row, one formula.** The formula in a row should be the same across every forecast column. If year 1 needs a different formula, that is usually a separate row.",
          "**No hard-codes inside formulas.** `=B5*1.08` hides an assumption. Put 8% in an input cell and reference it.",
          "**Consistent timeline.** Same columns mean the same periods on every sheet, so a formula can always point straight up or down.",
        ] },
        { kind: "callout", tone: "desk", title: "The formatting code", text: [
          "Banks and consultancies share a convention so anyone can read anyone's model: **blue** font for hard-coded inputs, **black** for formulas, **green** for links to other sheets. The Basis model tasks use it: given inputs are blue, your formula cells are shaded. Negative numbers in brackets, units in every label (\"₹ crore\", \"%\", \"x\"), and one consistent sign convention for costs.",
        ] },
      ],
    },
    {
      id: "drivers",
      title: "Drivers and scenarios",
      blocks: [
        { kind: "p", text: "A forecast is only as good as its drivers. Instead of typing next year's revenue, model what causes it: volume × price, stores × revenue per store, subscribers × average revenue per user. Costs follow as a percentage of revenue (variable) or as a fixed amount growing with inflation (fixed). Working capital follows days drivers; capex follows a percentage of revenue or a capacity plan." },
        { kind: "p", text: "Then add a **scenario switch**: one input cell (1 = bear, 2 = base, 3 = bull) that picks each driver from a small table with `CHOOSE` or `INDEX`. A single model can then show the whole range of outcomes without copying sheets." },
        { kind: "sheet", title: "A driver-based revenue build with a scenario switch", task: "Change the scenario in B2 from 2 to 1 or 3 and watch revenue and EBITDA move. Then press \"Try it yourself\" and rebuild the formulas.", rows: 12, cols: 5, widths: [230, 100, 100, 100, 100],
          labels: { A1: "Driver-based forecast (₹ crore)", A2: "Scenario (1 bear, 2 base, 3 bull)", A4: "Volume growth", A5: "Price growth", A6: "EBITDA margin", B3: "Bear", C3: "Base", D3: "Bull", E3: "Selected", A9: "Revenue, last year", A10: "Revenue, next year", A11: "EBITDA, next year", A12: "Check: margin × revenue" },
          heads: ["A1", "B3", "C3", "D3", "E3"],
          inputs: { B2: "2", B4: "2%", C4: "6%", D4: "10%", B5: "1%", C5: "3%", D5: "5%", B6: "14%", C6: "17%", D6: "19%", B9: "1200" },
          formulas: { E4: "=CHOOSE($B$2,B4,C4,D4)", E5: "=CHOOSE($B$2,B5,C5,D5)", E6: "=CHOOSE($B$2,B6,C6,D6)", B10: "=B9*(1+E4)*(1+E5)", B11: "=B10*E6", B12: "=B11-B10*E6" },
          fmt: { B4: "pct1", C4: "pct1", D4: "pct1", B5: "pct1", C5: "pct1", D5: "pct1", B6: "pct1", C6: "pct1", D6: "pct1", E4: "pct1", E5: "pct1", E6: "pct1", B9: "n0", B10: "n1", B11: "n1", B12: "n2" } },
        { kind: "callout", tone: "insight", title: "Why volume × price and not just \"growth\"", text: [
          "Revenue growth of 9% from 6% volume and 3% price is a very different business from 9% growth driven entirely by price increases. The first is gaining customers; the second may be losing them. Splitting drivers forces you to make, and defend, the assumptions that matter.",
        ] },
      ],
    },
    {
      id: "checks",
      title: "Checks and integrity",
      blocks: [
        { kind: "list", items: [
          "**Balance check:** total assets minus total liabilities and equity, every period. It must be zero.",
          "**Cash check:** cash on the balance sheet equals closing cash on the cash flow statement.",
          "**Sum checks:** segments add to the total; the debt schedule's closing balance equals the balance sheet line.",
          "**Sign checks:** debt can't go negative; cash sweeps can't repay more than the balance (`MIN` and `MAX` do this).",
          "**A master check cell** at the top that sums every check, so one glance tells you the model is sound.",
        ] },
        { kind: "callout", tone: "warning", title: "Circular references", text: [
          "Interest depends on average debt, debt depends on cash flow, and cash flow depends on interest: a circular reference. Banks handle it either with iterative calculation turned on plus a circuit-breaker switch that zeroes interest if the model blows up, or by computing interest on opening balances, which avoids the loop at a small cost in precision. Basis's LBO tools take the second approach, as most interview models do.",
        ] },
      ],
    },
    {
      id: "types",
      title: "The models you will meet",
      blocks: [
        { kind: "table", head: ["Model", "Used by", "Core question"], rows: [
          ["Three-statement model", "Everyone", "How do the business's P&L, balance sheet and cash flow evolve?"],
          ["DCF", "Equity research, banking, corporate development", "What is the business worth on its cash flows?"],
          ["Trading comps", "Banking, research, IPO pricing", "What do similar companies trade at?"],
          ["LBO", "Private equity, leveraged finance", "What return can a buyer earn with debt?"],
          ["Merger (accretion/dilution)", "M&A banking, corporate development", "Does the deal raise or lower the buyer's EPS?"],
          ["Project finance", "Infrastructure, energy, banks", "Can the project's cash flows service its debt? (DSCR, LLCR)"],
          ["Budget / FP&A", "Corporate finance teams", "What will next year look like, by month and by department?"],
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Build the perfect model.", practice: "Models are built under deadline. The skill is building something correct and auditable quickly, then improving it. Simple and right beats elaborate and fragile." },
    { theory: "Models predict the future.", practice: "Models organise assumptions and show sensitivities. Their value is in the conversations they enable: which three inputs matter, and what would have to be true." },
    { theory: "A model is a personal tool.", practice: "Models are shared, reviewed and inherited. Banks have formal model-review processes; the person who inherits yours at 2 a.m. should be able to follow it." },
  ],
  mistakes: [
    "Typing numbers inside formulas (=B5*1.08).",
    "Different formulas across a row, so dragging one breaks the others.",
    "Mixed units: a cost in ₹ lakh beside revenue in ₹ crore.",
    "No checks, so a balance sheet that doesn't balance goes unnoticed.",
    "Linking to other workbooks, which break when files move.",
  ],
  interview: [
    { q: "How do you make a model easy to audit?", a: "Separate inputs, calculations and outputs; colour-code inputs; keep one consistent formula per row; avoid hard-codes and external links; and build checks with a master check cell at the top." },
    { q: "How would you handle the interest circularity in a model?", a: "Either enable iterative calculation with a circuit-breaker toggle, or calculate interest on the opening debt balance to avoid the circularity. I would say which one I used in the model notes." },
  ],
  quiz: [
    { q: "In banking convention, a hard-coded input is formatted:", options: ["Black", "Blue", "Green", "Red"], answer: 1, why: "Blue for inputs, black for formulas, green for links to other sheets." },
    { q: "Which is the best practice?", options: ["=C10*1.05", "=C10*(1+$B$4) with 5% in B4", "Typing next year's revenue", "=C10+60"], answer: 1, why: "The assumption sits in one visible input cell and every formula refers to it." },
  ],
  apply: {
    problems: [],
    models: ["term-loan-amortisation", "five-year-dcf", "lbo-debt-sweep", "trading-comps-lookups"],
    cases: [{ slug: "apple-dcf-fy2025", parts: ["dcf-model"] }, { slug: "hyundai-motor-india-ipo-2024", parts: ["offer-structure-model"] }],
    tools: [],
  },
  glossary: [
    { term: "Driver", definition: "An assumption that causes a forecast line to move, such as volume growth or a margin." },
    { term: "Scenario switch", definition: "A single input that selects a set of assumptions (bear, base, bull) throughout a model." },
    { term: "Hard-code", definition: "A number typed directly into a formula or calculation cell instead of referenced from an input." },
    { term: "Circular reference", definition: "A formula that depends, directly or indirectly, on its own result." },
    { term: "Balance check", definition: "A row that tests whether assets equal liabilities plus equity in every period." },
  ],
};

// ---------- Excel for finance ----------

const loanPmt = pmt(0.09 / 12, 240, 200_000);
const day = (y: number, mo: number, d: number) => new Date(Date.UTC(y, mo - 1, d));
const fundDates = [day(2025, 1, 1), day(2025, 9, 30), day(2026, 6, 30), day(2027, 3, 31), day(2027, 12, 31)];
const fundFlows = [-1000, 150, 250, 300, 600];
const fundXnpv = xnpv(0.1, fundFlows, fundDates);
const fundXirr = xirr(fundFlows, fundDates);
const fundIrr = irr(fundFlows);
const fundNpv = npv(0.1, fundFlows);

export const excelForFinance: Lesson = {
  slug: "excel-for-finance",
  title: "Excel for finance: the functions that do the real work",
  summary: "The twenty-odd Excel functions finance professionals use every day, with live sheets you can edit: TVM, NPV/XNPV, IRR/XIRR, lookups, conditional sums, MIN/MAX logic and dates.",
  module: "modelling",
  level: "Foundation",
  prerequisites: ["time-value-of-money"],
  outcomes: [
    "Use PMT, IPMT, PPMT and CUMIPMT for loan schedules, with the right signs.",
    "Know when NPV is wrong and XNPV is right, and use IRR versus XIRR correctly.",
    "Look things up robustly with INDEX/MATCH and XLOOKUP, and pick scenarios with CHOOSE.",
    "Write caps, floors and conditional logic with MIN, MAX, IF and IFERROR, and summarise with SUMIFS and SUMPRODUCT.",
  ],
  hook: [
    "Ask any analyst what they wish they had learned before their first job and the answer is usually not more theory. It is Excel: not every function, but the twenty that do almost all the work, and the habits that make them reliable.",
    "Every sheet in this lesson is live. Change an input and the formulas recalculate, using the same spreadsheet engine that grades Basis model tasks. Press \"Try it yourself\" to clear the formulas and rebuild them; each cell is checked as you go.",
  ],
  sections: [
    {
      id: "references",
      title: "References: the habit that matters most",
      blocks: [
        { kind: "p", text: "Before any function, master references. `B4` is relative: copy it one cell right and it becomes `C4`. `$B$4` is absolute: it never moves. `B$4` locks the row; `$B4` locks the column. In Excel, press **F4** while editing a reference to cycle through them." },
        { kind: "p", text: "Most broken models are reference errors: an assumption cell that should have been locked shifts when the formula is dragged across the forecast. The scenario sheet in the modelling lesson uses `$B$2` for exactly this reason." },
      ],
    },
    {
      id: "tvm",
      title: "Loans: PMT, IPMT, PPMT, CUMIPMT",
      blocks: [
        { kind: "p", text: "These functions share one sign convention: cash you receive is positive, cash you pay is negative. Enter the loan as a negative present value (from the lender's view) and the payment comes out positive, or vice versa. Divide annual rates by 12 and multiply years by 12 for monthly loans." },
        { kind: "sheet", title: "Home loan: payment, interest and principal", task: "Change the rate or the term and watch the EMI and the interest split update. Try 8.5% or 25 years.", rows: 9, cols: 3, widths: [250, 120, 300],
          labels: { A1: "Loan amount", A2: "Annual interest rate", A3: "Term (years)", A5: "Monthly payment (EMI)", A6: "Interest in month 1", A7: "Principal in month 1", A8: "Interest paid in year 1", A9: "Total interest over the loan", C5: "PMT(rate per month, months, −loan)", C6: "IPMT(rate, period, months, −loan)", C7: "PPMT: the rest of the EMI", C8: "CUMIPMT over months 1 to 12", C9: "All EMIs less the loan" },
          inputs: { B1: "200000", B2: "9%", B3: "20" },
          formulas: { B5: "=PMT(B2/12,B3*12,-B1)", B6: "=IPMT(B2/12,1,B3*12,-B1)", B7: "=PPMT(B2/12,1,B3*12,-B1)", B8: "=-CUMIPMT(B2/12,B3*12,B1,1,12,0)", B9: "=B5*B3*12-B1" },
          fmt: { B1: "n0", B2: "pct2", B3: "n0", B5: "n2", B6: "n2", B7: "n2", B8: "n2", B9: "n0" } },
        { kind: "p", text: `At 9% over 20 years the EMI is ${money(loanPmt, 2)}, and in month 1 most of it is interest. The interest share falls every month as the balance shrinks. The Basis loan model task makes you build the full schedule.` },
      ],
    },
    {
      id: "npv",
      title: "NPV versus XNPV, IRR versus XIRR",
      blocks: [
        { kind: "p", text: "`NPV(rate, values)` assumes the first value is **one period** from now and every value is exactly one period apart. `XNPV(rate, values, dates)` discounts each value by the actual days from the first date, over 365. Real investments (fund drawdowns, project milestones, deal cash flows) rarely arrive on neat anniversaries, so professionals use XNPV and XIRR." },
        { kind: "sheet", title: "A fund investment on real dates", task: "Compare NPV with XNPV and IRR with XIRR. Move the last distribution to an earlier date and see XIRR jump while IRR doesn't move.", rows: 12, cols: 4, widths: [200, 130, 120, 260],
          labels: { A1: "Discount rate", A3: "Date", B3: "Cash flow", A10: "NPV, treating flows as annual", A11: "XNPV on actual dates", A12: "IRR (assumes annual spacing)", C10: "first flow kept outside NPV()", D12: "← XIRR on actual dates" },
          heads: ["A3", "B3"],
          inputs: { B1: "10%", A4: "=DATE(2025,1,1)", A5: "=DATE(2025,9,30)", A6: "=DATE(2026,6,30)", A7: "=DATE(2027,3,31)", A8: "=DATE(2027,12,31)", B4: "-1000", B5: "150", B6: "250", B7: "300", B8: "600" },
          formulas: { B10: "=B4+NPV(B1,B5:B8)", B11: "=XNPV(B1,B4:B8,A4:A8)", B12: "=IRR(B4:B8)", C12: "=XIRR(B4:B8,A4:A8)" },
          fmt: { B1: "pct1", A4: "date", A5: "date", A6: "date", A7: "date", A8: "date", B4: "n0", B5: "n0", B6: "n0", B7: "n0", B8: "n0", B10: "n2", B11: "n2", B12: "pct2", C12: "pct2" } },
        { kind: "p", text: `The flows span three years but NPV and IRR treat them as four annual steps. On actual dates, XNPV is ${money(fundXnpv, 2)} against ${money(fundNpv, 2)}, and XIRR (in C12) is ${pct(fundXirr, 2)} against an IRR of ${pct(fundIrr, 2)}. Same cash, very different story: getting money back sooner is worth a lot.` },
        { kind: "callout", tone: "warning", title: "The NPV trap, once more", text: [
          "`=NPV(10%, B4:B8)` including the year-0 outflow discounts it by a year, understating the true NPV by a factor of 1.1. Keep the time-0 flow outside: `=B4+NPV(B1,B5:B8)`. XNPV has no such trap, because its first date is the valuation date.",
        ] },
      ],
    },
    {
      id: "lookups",
      title: "Lookups and scenario pickers",
      blocks: [
        { kind: "p", text: "`VLOOKUP` breaks when someone inserts a column and can only look to the right. `INDEX(column, MATCH(key, keys, 0))` does neither, which is why modellers prefer it. `XLOOKUP(key, keys, results)` is the modern, simpler version in Excel 365 and Google Sheets. Always use exact match (`0` in MATCH): approximate match on unsorted data silently returns wrong answers." },
        { kind: "sheet", title: "A peer table: lookups, medians and counts", task: "Type a different peer name in B9 and watch the lookups follow. Then change a multiple and see the median move.", rows: 14, cols: 4, widths: [200, 110, 110, 220],
          labels: { A1: "Peer", B1: "EV/EBITDA", C1: "P/E", A9: "Look up peer", A10: "EV/EBITDA (INDEX/MATCH)", A11: "P/E (XLOOKUP)", A12: "Median EV/EBITDA", A13: "Peers with P/E above 20", A14: "Average P/E, top two by EV/EBITDA", C14: "LARGE picks the top two" },
          heads: ["A1", "B1", "C1"],
          inputs: { A2: "Atlas", A3: "Borealis", A4: "Cobalt", A5: "Delta", A6: "Ember", B2: "9.5", B3: "11.2", B4: "8.1", B5: "12.4", B6: "10.3", C2: "18.4", C3: "24.0", C4: "15.2", C5: "26.7", C6: "21.1", B9: "Cobalt" },
          formulas: { B10: "=INDEX(B2:B6,MATCH(B9,A2:A6,0))", B11: "=XLOOKUP(B9,A2:A6,C2:C6)", B12: "=MEDIAN(B2:B6)", B13: "=COUNTIF(C2:C6,\">20\")", B14: "=AVERAGE(XLOOKUP(LARGE(B2:B6,1),B2:B6,C2:C6),XLOOKUP(LARGE(B2:B6,2),B2:B6,C2:C6))" },
          fmt: { B2: "x1", B3: "x1", B4: "x1", B5: "x1", B6: "x1", C2: "x1", C3: "x1", C4: "x1", C5: "x1", C6: "x1", B10: "x1", B11: "x1", B12: "x1", B13: "n0", B14: "x1" } },
        { kind: "p", text: "`CHOOSE(index, option1, option2, ...)` picks one of a list by position. With a scenario number in one cell, `=CHOOSE($B$2, bear, base, bull)` on every driver row turns one model into three. See it in the modelling principles lesson." },
      ],
    },
    {
      id: "logic",
      title: "Caps, floors and conditions",
      blocks: [
        { kind: "p", text: "Finance is full of limits: you can't repay more debt than is outstanding, a sweep can't use negative cash, tax isn't negative in a loss year (ignoring carry-forwards). `MIN` and `MAX` express these more cleanly than nested IFs." },
        { kind: "sheet", title: "A cash sweep with caps and floors", task: "Set cash available to a negative number, or debt to less than the sweep, and check the formulas still behave.", rows: 9, cols: 3, widths: [260, 110, 300],
          labels: { A1: "Cash available after mandatory repayment", A2: "Debt outstanding", A3: "Sweep percentage", A4: "Pre-tax profit", A5: "Tax rate", A7: "Optional repayment (sweep)", A8: "Tax expense", A9: "Interest cover check", C7: "never negative, never more than the debt", C8: "no tax on a loss", C9: "IFERROR guards the division" },
          inputs: { B1: "180", B2: "120", B3: "75%", B4: "-40", B5: "25%" },
          formulas: { B7: "=MIN(B2,MAX(0,B1*B3))", B8: "=MAX(0,B4*B5)", B9: "=IFERROR(B1/B8,\"n.m.\")" },
          fmt: { B1: "n0", B2: "n0", B3: "pct1", B4: "n0", B5: "pct1", B7: "n1", B8: "n1" } },
        { kind: "p", text: "`SUMIFS(sum_range, criteria_range, criteria, ...)` adds values that meet conditions (all revenue in the \"West\" region in 2025); `SUMPRODUCT(a, b)` multiplies two ranges element by element and adds the results, which is how a weighted average is computed in one cell: `=SUMPRODUCT(weights, returns)`." },
      ],
    },
    {
      id: "dates",
      title: "Dates and periods",
      blocks: [
        { kind: "table", head: ["Function", "Does", "Finance use"], rows: [
          ["EOMONTH(date, months)", "Last day of the month, n months away", "Quarter- and year-end columns in a model timeline"],
          ["EDATE(date, months)", "Same day n months away", "Coupon and loan payment dates"],
          ["YEARFRAC(start, end, basis)", "Fraction of a year between two dates", "Accrued interest, stub periods in a DCF"],
          ["DAYS(end, start)", "Days between dates", "Day-count fractions, DSO on actual days"],
        ] },
        { kind: "callout", tone: "desk", title: "Shortcuts that save hours", text: [
          "F2 edit a cell · F4 cycle $ references · Ctrl + [ jump to precedent · Ctrl + Shift + arrow select to the edge of data · Alt + = AutoSum · Ctrl + 1 format cells · Ctrl + ` show all formulas. Analysts are judged on speed early on; learning shortcuts in your first month pays back for years.",
        ] },
        { kind: "p", text: "Two features you will use constantly that aren't functions: **Goal Seek** (find the input that makes an output hit a target, such as the price that gives a 20% IRR) and **Data Tables** (the WACC × growth sensitivity grid in a DCF). Both live under What-If Analysis in Excel." },
      ],
    },
  ],
  gap: [
    { theory: "Learn every Excel function.", practice: "Two dozen functions cover nearly everything. Speed, reference discipline and clean structure matter far more than obscure functions." },
    { theory: "VLOOKUP is the standard lookup.", practice: "Modellers use INDEX/MATCH or XLOOKUP because VLOOKUP breaks when columns move and can't look left." },
    { theory: "IRR is IRR.", practice: "Funds and deal teams report XIRR on actual dates. Annual IRR on irregular flows can be badly wrong." },
    { theory: "Data tables are a convenience.", practice: "Sensitivity tables are mandatory in every valuation output. Because they slow big workbooks down, analysts often set calculation to \"automatic except tables\"." },
  ],
  mistakes: [
    "Putting the time-0 cash flow inside NPV().",
    "Using approximate match (TRUE or omitted) in VLOOKUP or MATCH on unsorted data.",
    "Forgetting to divide the annual rate by 12 in PMT for monthly payments.",
    "Not locking assumption references with $ before dragging a formula across.",
    "Hiding errors with IFERROR everywhere, so real problems go unnoticed.",
  ],
  interview: [
    { q: "What is the difference between NPV and XNPV in Excel?", a: "NPV assumes equal periods and that the first value is one period away. XNPV takes actual dates and discounts each flow by the exact time from the first date, so the first flow isn't discounted. For real deal cash flows I use XNPV." },
    { q: "Why INDEX/MATCH rather than VLOOKUP?", a: "It can look left, it doesn't break when columns are inserted, and it is explicit about which column it returns. With XLOOKUP available, I'd use that for the same reasons." },
  ],
  quiz: [
    { q: "Monthly payment on a ₹10 lakh loan at 12% a year for 5 years:", options: ["=PMT(12%,5,-1000000)", "=PMT(1%,60,-1000000)", "=PMT(12%,60,-1000000)", "=PMT(1%,5,-1000000)"], answer: 1, why: "Rate per month 12% ÷ 12 = 1%, and 5 × 12 = 60 payments." },
    { q: "Which formula caps a repayment at the debt balance in B2 and floors it at zero?", options: ["=MAX(B2,MIN(0,B1))", "=MIN(B2,MAX(0,B1))", "=IF(B1>0,B1)", "=MIN(0,B1,B2)"], answer: 1, why: "MAX(0, …) floors at zero, then MIN(B2, …) caps at the balance." },
    { q: "Cash flows arrive on irregular dates. To get the annual return, use:", options: ["IRR", "MIRR", "XIRR", "RATE"], answer: 2, why: "XIRR takes the actual dates and annualises on the true time between flows." },
  ],
  apply: {
    problems: ["loan-payment", "project-irr", "project-npv"],
    models: ["term-loan-amortisation", "fund-returns-xirr", "trading-comps-lookups", "lbo-debt-sweep"],
    cases: [],
    tools: ["loan", "tvm"],
  },
  glossary: [
    { term: "Absolute reference", definition: "A cell reference with $ signs ($B$4) that does not change when the formula is copied." },
    { term: "XNPV", definition: "Excel's net present value on actual dates, discounting each flow by the exact days from the first date." },
    { term: "XIRR", definition: "Excel's internal rate of return on actual dates, annualised." },
    { term: "INDEX/MATCH", definition: "A lookup that returns the value in one range at the position where a key is found in another." },
    { term: "Goal Seek", definition: "An Excel tool that finds the input value making a formula equal a target." },
    { term: "Data table", definition: "An Excel What-If tool that recalculates a model across a grid of input values, used for sensitivity tables." },
  ],
};
