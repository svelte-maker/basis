import { xirr, xnpv } from "@/lib/finance/tvm";
import { num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- SIP returns and XIRR ----------

const rupees = (x: number) => `₹${num(x)}`;
const day = (y: number, m: number, d = 1) => new Date(Date.UTC(y, m - 1, d));

/** A monthly SIP: `months` instalments on the 1st from January of `year`, valued one month after the last. */
function sip(months: number, amount: number, endValue: number, year = 2025) {
  const flows: number[] = [], dates: Date[] = [];
  for (let i = 0; i < months; i++) { flows.push(-amount); dates.push(day(year, 1 + i)); }
  flows.push(endValue); dates.push(day(year, 1 + months));
  return { flows, dates, invested: amount * months };
}

// One year of ₹5,000 a month (illustrative values, not any fund's returns).
const amount = 5000;
const one = sip(12, amount, 64000);
const oneEnd = one.flows[one.flows.length - 1];
const oneAbs = oneEnd / one.invested - 1;
const oneXirr = xirr(one.flows, one.dates);
const oneCheck = xnpv(oneXirr, one.flows, one.dates);

// The same profit on a lump sum invested for the whole year.
const lumpXirr = xirr([-one.invested, oneEnd], [day(2025, 1), day(2026, 1)]);

// Average time each rupee of the SIP was invested, in years.
const endMs = one.dates[one.dates.length - 1].getTime();
const avgYears = one.dates.slice(0, -1).reduce((s, d) => s + (endMs - d.getTime()) / 86_400_000 / 365, 0) / 12;

// Three years of the same SIP.
const three = sip(36, amount, 220000);
const threeEnd = three.flows[three.flows.length - 1];
const threeAbs = threeEnd / three.invested - 1;
const threeWrongCagr = Math.pow(threeEnd / three.invested, 1 / 3) - 1;
const threeXirr = xirr(three.flows, three.dates);

// Two months: a small gain annualised.
const short = sip(2, amount, 10300);
const shortEnd = short.flows[short.flows.length - 1];
const shortAbs = shortEnd / short.invested - 1;
const shortXirr = xirr(short.flows, short.dates);

const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const sipReturnsXirr: Lesson = {
  slug: "sip-returns-xirr",
  title: "SIP returns and XIRR: measuring returns when you invest every month",
  summary: "Why the absolute return and CAGR mislead for a monthly SIP, how XIRR measures the return on money that goes in on different dates, how to calculate it in Excel, and when an XIRR shouldn't be trusted.",
  module: "foundations",
  level: "Foundation",
  prerequisites: ["time-value-of-money", "npv-irr-capital-budgeting"],
  outcomes: [
    "Explain why a SIP's absolute return understates its annual return, and why CAGR on the total invested is wrong.",
    "Calculate a SIP's XIRR from its dates and cash flows, in Excel and by reasoning about the average time invested.",
    "Compare a SIP with a lump sum, or with a benchmark, on a like-for-like basis.",
    "Recognise when an XIRR is too short-dated to mean anything.",
  ],
  hook: [
    `You invest ${rupees(amount)} on the 1st of every month for a year: ${rupees(one.invested)} in total. On ${fmtDate(one.dates[one.dates.length - 1])} the statement says ${rupees(oneEnd)}. Is that a ${pct(oneAbs, 2)} return?`,
    `On the money, yes. As a yearly rate, no. The first ${rupees(amount)} was invested for a full year, but the last for one month. On average each rupee was in the market for about ${num(avgYears * 12, 1)} months, so the same gain is roughly a ${pct(oneXirr, 2)} annual return. That number is the **XIRR**, and it is the number most mutual fund statements show for SIPs. (All values in this lesson are illustrative, not any fund's returns.)`,
  ],
  sections: [
    {
      id: "three-numbers",
      title: "Absolute return, CAGR and XIRR",
      blocks: [
        { kind: "p", text: "A SIP statement can show three different return numbers. They answer different questions." },
        { kind: "table", caption: `${rupees(amount)} a month for 12 months, worth ${rupees(oneEnd)} at the end`, head: ["Measure", "Formula", "Result", "What it answers"], rows: [
          ["Absolute return", "Gain ÷ amount invested", pct(oneAbs, 2), "How much did I make, ignoring time?"],
          ["CAGR on the total", "(End ÷ invested)^(1/years) − 1", pct(oneAbs, 2), "Only right if all the money went in on day one"],
          ["XIRR", "Rate that makes the dated cash flows' present value zero", pct(oneXirr, 2), "What yearly rate did my money actually earn?"],
        ] },
        { kind: "p", text: `For comparison, a lump sum of ${rupees(one.invested)} invested on 1 Jan 2025 and worth ${rupees(oneEnd)} a year later earned ${pct(lumpXirr, 2)}. The profit is the same, but the SIP earned it on money that was invested, on average, for only about half the year, so its annual rate is close to double.` },
        { kind: "callout", tone: "warning", title: "CAGR doesn't fit a SIP", text: [
          "CAGR assumes one amount in at the start and one amount out at the end. A SIP has many amounts going in on different dates, so CAGR on the total invested treats every instalment as if it had been invested from day one and understates the return.",
        ] },
      ],
    },
    {
      id: "how-xirr-works",
      title: "How XIRR works",
      blocks: [
        { kind: "p", text: "XIRR is the internal rate of return on cash flows with real dates. Write every instalment as a negative cash flow (money out of your pocket) on its date and the current value as a positive cash flow on today's date. XIRR is the yearly rate at which those flows have a total present value of zero." },
        { kind: "formula", expr: "Σ CFᵢ ÷ (1 + XIRR)^((dᵢ − d₀) ÷ 365) = 0", terms: [["CFᵢ", "Each cash flow: instalments negative, the final value positive"], ["dᵢ − d₀", "Days from the first cash flow to this one"], ["365", "Excel's XIRR always uses a 365-day year"]] },
        { kind: "p", text: `For the one-year SIP, discounting all ${one.flows.length} flows at ${pct(oneXirr, 4)} gives a present value of ${num(Math.abs(oneCheck) < 0.005 ? 0 : oneCheck, 2)}. There's no closed formula: Excel and Basis both search for the rate, just as IRR does.` },
        { kind: "excel", title: "In Excel or Google Sheets", rows: [
          ["A2:A13", "1-Jan-2025 … 1-Dec-2025", "instalment dates"],
          ["B2:B13", `-${amount}`, "each instalment, negative"],
          ["A14 / B14", `1-Jan-2026 / ${oneEnd}`, "today's date and value, positive"],
          ["B16", "=XIRR(B2:B14, A2:A14)", pct(oneXirr, 2)],
        ] },
        { kind: "sheet", title: "Your own SIP's XIRR", task: "Change the monthly amount, the start date or the value at the end. Then press \"Try it yourself\" and rebuild the dates, the cash flows and the XIRR.", rows: 22, cols: 2, widths: [260, 140],
          labels: { A1: "Monthly instalment (₹)", A2: "First instalment date", A3: "Value at the end (₹)", A5: "Date", B5: "Cash flow (₹)", A20: "Total invested (₹)", A21: "Absolute return", A22: "XIRR" },
          heads: ["A5", "B5"],
          inputs: { B1: "5000", B2: "=DATE(2025,1,1)", B3: "64000" },
          formulas: {
            A6: "=B2", A7: "=EDATE(B2,1)", A8: "=EDATE(B2,2)", A9: "=EDATE(B2,3)", A10: "=EDATE(B2,4)", A11: "=EDATE(B2,5)", A12: "=EDATE(B2,6)", A13: "=EDATE(B2,7)", A14: "=EDATE(B2,8)", A15: "=EDATE(B2,9)", A16: "=EDATE(B2,10)", A17: "=EDATE(B2,11)", A18: "=EDATE(B2,12)",
            B6: "=-B1", B7: "=-B1", B8: "=-B1", B9: "=-B1", B10: "=-B1", B11: "=-B1", B12: "=-B1", B13: "=-B1", B14: "=-B1", B15: "=-B1", B16: "=-B1", B17: "=-B1", B18: "=B3",
            B20: "=-SUM(B6:B17)", B21: "=B3/B20-1", B22: "=XIRR(B6:B18,A6:A18)",
          },
          fmt: { B1: "n0", B2: "date", B3: "n0", A6: "date", A7: "date", A8: "date", A9: "date", A10: "date", A11: "date", A12: "date", A13: "date", A14: "date", A15: "date", A16: "date", A17: "date", A18: "date", B6: "n0", B7: "n0", B8: "n0", B9: "n0", B10: "n0", B11: "n0", B12: "n0", B13: "n0", B14: "n0", B15: "n0", B16: "n0", B17: "n0", B18: "n0", B20: "n0", B21: "pct2", B22: "pct2" } },
        { kind: "callout", tone: "insight", title: "A quick sense check", text: [
          `A SIP's money is invested, on average, for about half the period. So its XIRR is roughly the absolute return divided by half the number of years. Here ${pct(oneAbs, 2)} ÷ 0.5 ≈ ${pct(oneAbs / 0.5, 2)}, close to the exact ${pct(oneXirr, 2)}. The rule is rough and gets worse over longer periods, because it ignores compounding.`,
        ] },
      ],
    },
    {
      id: "longer",
      title: "Over several years",
      blocks: [
        { kind: "p", text: `Three years of the same ${rupees(amount)} SIP: ${rupees(three.invested)} invested, now worth ${rupees(threeEnd)}.` },
        { kind: "table", head: ["Measure", "Result"], rows: [
          ["Absolute return", pct(threeAbs, 2)],
          ["Absolute return ÷ 3 years", pct(threeAbs / 3, 2)],
          ["CAGR on the total invested (wrong)", pct(threeWrongCagr, 2)],
          ["XIRR", pct(threeXirr, 2)],
        ] },
        { kind: "p", text: "Dividing by the number of years and CAGR on the total both understate the return, for the same reason: they treat the money as invested for the whole period when most of it wasn't." },
        { kind: "callout", tone: "desk", title: "Comparing like with like", text: [
          "To judge a SIP, compare its XIRR with the XIRR of the same instalments, on the same dates, invested in the benchmark index. Comparing a SIP's XIRR with a fund's point-to-point CAGR from its factsheet mixes two different measures of two different investments.",
        ] },
      ],
    },
    {
      id: "short-periods",
      title: "When not to trust an XIRR",
      blocks: [
        { kind: "p", text: `XIRR annualises. Over a short period that magnifies noise. Two instalments of ${rupees(amount)} worth ${rupees(shortEnd)} a month after the second is a ${pct(shortAbs, 2)} gain, and an XIRR of **${pct(shortXirr, 2)}**. Nobody should expect ${pct(shortXirr, 0)} a year from that.` },
        { kind: "list", items: [
          "Below about a year, read the absolute return. Many statements show only the absolute return for holdings under a year for this reason.",
          "XIRR is a historical measure. It depends heavily on where the market was on the start and end dates.",
          "Add redemptions and extra purchases as cash flows on their own dates. XIRR handles them; the absolute return and CAGR don't.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Return = gain ÷ amount invested.", practice: `That's the absolute return, and it ignores time. A SIP's ${pct(oneAbs, 2)} absolute gain over a year is a ${pct(oneXirr, 2)} annual return, because the money was invested for about half the year on average.` },
    { theory: "Use CAGR to annualise any return.", practice: "CAGR fits one amount in and one amount out. Many amounts on many dates need XIRR." },
    { theory: "A higher annualised return is better.", practice: `Not over a few months. A ${pct(shortAbs, 0)} gain over two months annualises to ${pct(shortXirr, 0)}, which says nothing about the next year.` },
  ],
  mistakes: [
    "Reporting a SIP's absolute return as if it were an annual return.",
    "Calculating CAGR on the total invested, as if every instalment went in on day one.",
    "Entering instalments and the final value with the same sign. XIRR needs money out as negative and money back as positive, or it returns an error.",
    "Comparing a SIP's XIRR with a fund's point-to-point CAGR instead of with the benchmark's XIRR on the same dates.",
    "Trusting an XIRR measured over a few weeks or months.",
  ],
  interview: [
    { q: "What's the difference between IRR and XIRR?", a: "IRR assumes cash flows are evenly spaced, one period apart. XIRR takes the actual date of each cash flow and annualises on a 365-day year. Anything with irregular dates, such as SIPs, fund drawdowns or deal cash flows, needs XIRR." },
    { q: `Someone invested ${rupees(amount)} a month for a year and has ${rupees(oneEnd)}. What return did they earn?`, a: `Absolute return ${pct(oneAbs, 2)}, but the money was invested for about ${num(avgYears * 12, 1)} months on average, so the annual return is roughly double. XIRR on the dated flows gives ${pct(oneXirr, 2)}.` },
    { q: "How would you judge whether a SIP has done well?", a: "Calculate its XIRR and compare it with the XIRR of the same instalments, on the same dates, in the benchmark index. That controls for the timing of the money, which a factsheet CAGR doesn't." },
  ],
  quiz: [
    { q: `${rupees(amount)} a month for 12 months is worth ${rupees(oneEnd)} a month after the last instalment. Which is closest to the XIRR?`, options: [pct(oneAbs, 2), pct(oneXirr, 2), pct(oneAbs / 2, 2), pct(oneAbs * 12, 2)], answer: 1, why: `The ${pct(oneAbs, 2)} gain was earned on money invested for about half a year on average, so the annual rate is close to double: ${pct(oneXirr, 2)}.` },
    { q: `The same ${rupees(oneEnd - one.invested)} profit on a ${rupees(one.invested)} lump sum held for the whole year is a ${pct(lumpXirr, 2)} return. Why is the SIP's XIRR higher?`, options: ["The SIP had lower fees", "The SIP's money was invested for less time on average", "XIRR ignores the instalments", "XIRR uses a 360-day year"], answer: 1, why: "Same profit, less time invested: the later instalments were in the market for only a few months, so the yearly rate is higher." },
    { q: `A new SIP shows an XIRR of ${pct(shortXirr, 0)} after two months. What should you conclude?`, options: ["The fund will return about that this year", "Very little: annualising a short return magnifies it", "The fund is better than its benchmark", "XIRR was calculated wrongly"], answer: 1, why: `A ${pct(shortAbs, 0)} two-month gain annualises to ${pct(shortXirr, 0)}. Below about a year, read the absolute return instead.` },
  ],
  apply: {
    problems: [],
    models: ["fund-returns-xirr"],
    cases: [],
    tools: ["tvm"],
  },
  glossary: [
    { term: "SIP", definition: "Systematic investment plan: a fixed amount invested in a fund at regular intervals, usually monthly." },
    { term: "Absolute return", definition: "Gain ÷ amount invested, with no adjustment for how long the money was invested." },
    { term: "Average time invested", definition: "How long each rupee of a SIP was in the market, on average. For a level monthly SIP it is about half the period, which is why the XIRR is roughly the absolute return divided by half the years." },
    { term: "Annualising", definition: "Converting a return over any period into an equivalent yearly rate. Over short periods it magnifies small gains and losses." },
    { term: "Point-to-point return", definition: "A return measured between two dates on a single amount, as in a fund factsheet's CAGR." },
  ],
};
