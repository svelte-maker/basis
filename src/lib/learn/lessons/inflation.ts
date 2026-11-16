import { fv, npv, pv } from "@/lib/finance/tvm";
import { num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Real vs nominal returns and inflation ----------

const rupees = (x: number) => `₹${num(x)}`;

/** Exact Fisher relation: the real rate implied by a nominal rate and an inflation rate. */
const realRate = (nominal: number, inflation: number) => (1 + nominal) / (1 + inflation) - 1;
/** The nominal rate that delivers a given real rate at a given inflation rate. */
const nominalRate = (real: number, inflation: number) => (1 + real) * (1 + inflation) - 1;

// The fixed deposit example (illustrative rates).
const fdRate = 0.07, taxRate = 0.3, inflation = 0.06, amount = 100000, years = 10;
const afterTax = fdRate * (1 - taxRate);
const fdReal = realRate(afterTax, inflation);
const fdRealPreTax = realRate(fdRate, inflation);
const fdShortcut = afterTax - inflation;
const fdNominalEnd = fv(amount, afterTax, years);
const priceLevelEnd = fv(amount, inflation, years);
const fdRealEnd = (fdNominalEnd / priceLevelEnd) * amount;
const breakEvenFd = inflation / (1 - taxRate);

// What ₹1,00,000 buys after 20 years of 6% inflation, and how long until it buys half as much.
const in20 = pv(amount, inflation, 20);
const halfLife = Math.log(2) / Math.log(1 + inflation);

// Exact vs shortcut at different rates.
const pairs: [number, number][] = [[0.07, 0.06], [0.12, 0.06], [0.3, 0.25], [1.0, 0.8]];

// Consistency in a DCF: three years of a cash flow that is flat in real terms.
const realDisc = 0.04;
const nominalDisc = nominalRate(realDisc, inflation);
const realFlows = [0, 100, 100, 100];
const nominalFlows = realFlows.map((c, t) => fv(c, inflation, t));
const pvReal = npv(realDisc, realFlows);
const pvNominal = npv(nominalDisc, nominalFlows);
const pvMixHigh = npv(realDisc, nominalFlows); // nominal flows at a real rate: too high
const pvMixLow = npv(nominalDisc, realFlows); // real flows at a nominal rate: too low

// Quiz.
const quizReal = realRate(0.1, 0.04);
const quizPower = pv(amount, inflation, 12);

export const realReturnsInflation: Lesson = {
  slug: "real-vs-nominal-returns-inflation",
  title: "Real vs nominal returns: what inflation does to your money",
  summary: "How to turn a nominal return into a real one with the Fisher equation, why a 7% fixed deposit can lose money after tax and inflation, and why a DCF must discount nominal cash flows at a nominal rate.",
  module: "foundations",
  level: "Foundation",
  prerequisites: ["time-value-of-money"],
  outcomes: [
    "Convert a nominal return into a real return with the exact Fisher equation, and say when the shortcut (nominal minus inflation) breaks down.",
    "Work out the after-tax real return on a fixed deposit, and the deposit rate needed just to keep up with inflation.",
    "Measure how much a sum of money will buy in the future, in today's rupees.",
    "Keep a valuation consistent: nominal cash flows with a nominal discount rate, real with real.",
  ],
  hook: [
    `A fixed deposit pays ${pct(fdRate, 0)}. After tax at ${pct(taxRate, 0)}, ${pct(afterTax, 2)} is left. If prices rise ${pct(inflation, 0)} a year, ${rupees(amount)} grows to ${rupees(fdNominalEnd)} in ${years} years, but what costs ${rupees(amount)} today will cost ${rupees(priceLevelEnd)}. In today's money the deposit is worth ${rupees(fdRealEnd)}.`,
    "The balance went up. What it can buy went down. Every return you see, on a deposit, a bond, a fund factsheet or a salary hike, is nominal until you take inflation out. Finance professionals ask \"real or nominal?\" before they ask anything else. (All rates in this lesson are illustrative assumptions, not today's rates or a forecast.)",
  ],
  sections: [
    {
      id: "fisher",
      title: "Nominal, real and the Fisher equation",
      blocks: [
        { kind: "p", text: "A **nominal return** is measured in rupees: how many more rupees you have. A **real return** is measured in what those rupees buy: how much more you can consume. Inflation is the gap between the two." },
        { kind: "formula", expr: "(1 + nominal) = (1 + real) × (1 + inflation)", terms: [["nominal", "The return in money terms, as a decimal"], ["real", "The return in purchasing-power terms"], ["inflation", "The rise in the price level over the same period"]] },
        { kind: "formula", expr: "Real return = (1 + nominal) ÷ (1 + inflation) − 1", terms: [["÷", "Divide, don't subtract: inflation shrinks the value of the whole ending amount, including the interest"]] },
        { kind: "p", text: `For the deposit: (1 + ${pct(afterTax, 2)}) ÷ (1 + ${pct(inflation, 0)}) − 1 = **${pct(fdReal, 2)}** a year. The shortcut, ${pct(afterTax, 2)} − ${pct(inflation, 0)} = ${pct(fdShortcut, 2)}, is close at low rates.` },
        { kind: "table", caption: "Exact vs shortcut: the gap grows with the rates", head: ["Nominal", "Inflation", "Shortcut (nominal − inflation)", "Exact real return"], rows: pairs.map(([n, i]) => [pct(n, 0), pct(i, 0), pct(n - i, 2), pct(realRate(n, i), 2)]) },
        { kind: "callout", tone: "warning", title: "When the shortcut fails", text: [
          `At ${pct(1.0, 0)} nominal and ${pct(0.8, 0)} inflation, the shortcut says ${pct(0.2, 0)} real; the truth is ${pct(realRate(1.0, 0.8), 2)}. In high-inflation economies, and in interviews, use the exact formula.`,
        ] },
      ],
    },
    {
      id: "fixed-deposit",
      title: "Tax, inflation and the fixed deposit",
      blocks: [
        { kind: "p", text: "Tax is charged on the **nominal** interest, including the part that only makes up for inflation. That is why tax and inflation together hurt more than either alone." },
        { kind: "table", caption: `${rupees(amount)} in a ${pct(fdRate, 0)} deposit for ${years} years (illustrative)`, head: ["", "Value"], rows: [
          ["Real return before tax", pct(fdRealPreTax, 2)],
          [`After-tax return (${pct(taxRate, 0)} tax)`, pct(afterTax, 2)],
          ["Real return after tax", pct(fdReal, 2)],
          [`Balance after ${years} years`, rupees(fdNominalEnd)],
          [`Cost of today's ${rupees(amount)} basket after ${years} years`, rupees(priceLevelEnd)],
          ["Balance in today's rupees", rupees(fdRealEnd)],
          ["Deposit rate needed to break even after tax", pct(breakEvenFd, 2)],
        ] },
        { kind: "formula", expr: "Break-even rate = inflation ÷ (1 − tax rate)", terms: [["Break-even rate", "The nominal rate at which the after-tax return just matches inflation, so the real return is zero"]] },
        { kind: "sheet", title: "Your own real return", task: "Change the rate, tax and inflation in B1:B3. Then press \"Try it yourself\" and rebuild the after-tax return, the real return and the values.", rows: 13, cols: 2, widths: [300, 130],
          labels: { A1: "Nominal rate", A2: "Tax rate", A3: "Inflation", A4: "Amount (₹)", A5: "Years", A7: "After-tax return", A8: "Real return (exact)", A9: "Real return (shortcut)", A10: "Balance at the end (₹)", A11: "Cost of today's basket at the end (₹)", A12: "Balance in today's rupees (₹)", A13: "Break-even nominal rate" },
          inputs: { B1: "7%", B2: "30%", B3: "6%", B4: "100000", B5: "10" },
          formulas: { B7: "=B1*(1-B2)", B8: "=(1+B7)/(1+B3)-1", B9: "=B7-B3", B10: "=B4*POWER(1+B7,B5)", B11: "=B4*POWER(1+B3,B5)", B12: "=B10/B11*B4", B13: "=B3/(1-B2)" },
          fmt: { B1: "pct2", B2: "pct1", B3: "pct2", B4: "n0", B5: "n0", B7: "pct2", B8: "pct2", B9: "pct2", B10: "n0", B11: "n0", B12: "n0", B13: "pct2" } },
      ],
    },
    {
      id: "purchasing-power",
      title: "Purchasing power over time",
      blocks: [
        { kind: "p", text: "To see what a future sum is worth today, discount it at the inflation rate. It's the same present-value formula as in the time value of money lesson, with inflation as the rate." },
        { kind: "formula", expr: "Value in today's money = Future amount ÷ (1 + inflation)ⁿ", terms: [["n", "Number of years"]] },
        { kind: "p", text: `At ${pct(inflation, 0)} inflation, ${rupees(amount)} received in 20 years buys what ${rupees(in20)} buys today. Prices double, and money's purchasing power halves, roughly every **${num(halfLife, 1)} years**.` },
        { kind: "callout", tone: "insight", title: "Why this matters for goals", text: [
          "A retirement, education or house target set in today's rupees has to be grown by inflation before you work out how much to save. Planning in nominal rupees without doing this is the most common reason savings plans fall short.",
        ] },
      ],
    },
    {
      id: "valuation",
      title: "Real and nominal in a valuation",
      blocks: [
        { kind: "p", text: `Take a cash flow of 100 a year for three years that is flat in **real** terms, so it grows with ${pct(inflation, 0)} inflation in rupees. The real discount rate is ${pct(realDisc, 0)}, so the nominal rate is (${num(1 + realDisc, 2)} × ${num(1 + inflation, 2)}) − 1 = ${pct(nominalDisc, 2)}.` },
        { kind: "table", head: ["Approach", "Present value"], rows: [
          [`Real cash flows at the real rate (${pct(realDisc, 0)})`, num(pvReal, 2)],
          [`Nominal cash flows at the nominal rate (${pct(nominalDisc, 2)})`, num(pvNominal, 2)],
          ["Nominal cash flows at the real rate (wrong)", num(pvMixHigh, 2)],
          ["Real cash flows at the nominal rate (wrong)", num(pvMixLow, 2)],
        ] },
        { kind: "p", text: "Both consistent approaches give the same answer. Mixing them overstates or understates value." },
        { kind: "callout", tone: "desk", title: "What the desk does", text: [
          "Analysts almost always model nominal cash flows (revenues and costs grow with prices) and discount them at a nominal WACC, because market rates such as bond yields and the cost of equity are nominal. The terminal growth rate in a nominal DCF is therefore a nominal rate: long-run real growth plus expected inflation.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Real return = nominal return − inflation.", practice: `That's a shortcut. The exact real return divides: (1 + nominal) ÷ (1 + inflation) − 1. At ${pct(1.0, 0)} nominal and ${pct(0.8, 0)} inflation the shortcut is off by ${num((0.2 - realRate(1.0, 0.8)) * 100, 1)} percentage points.` },
    { theory: "A positive interest rate grows your wealth.", practice: `Only if it beats inflation after tax. A ${pct(fdRate, 0)} deposit taxed at ${pct(taxRate, 0)} with ${pct(inflation, 0)} inflation returns ${pct(fdReal, 2)} a year in real terms.` },
    { theory: "Pick any discount rate that looks reasonable.", practice: "The rate must match the cash flows: nominal with nominal, real with real. Practitioners model nominal cash flows and use a nominal WACC, because market rates are nominal." },
  ],
  mistakes: [
    "Subtracting inflation instead of dividing, and getting the wrong answer at high rates.",
    "Ignoring tax. Tax is charged on nominal interest, so it takes a bigger share of the real return.",
    "Discounting nominal cash flows at a real rate, or real cash flows at a nominal rate.",
    "Setting a savings goal in today's rupees and forgetting to grow it by inflation.",
    "Using a terminal growth rate in a nominal DCF that is below expected inflation without meaning to, which assumes the business shrinks in real terms forever.",
  ],
  interview: [
    { q: `A deposit pays ${pct(fdRate, 0)}, tax is ${pct(taxRate, 0)} and inflation is ${pct(inflation, 0)}. What's the real return?`, a: `After tax, ${pct(fdRate, 0)} × (1 − ${pct(taxRate, 0)}) = ${pct(afterTax, 2)}. Real return = ${num(1 + afterTax, 3)} ÷ ${num(1 + inflation, 2)} − 1 = ${pct(fdReal, 2)} a year, so the saver loses purchasing power. The deposit would need to pay ${pct(breakEvenFd, 2)} just to break even.` },
    { q: "Should the cash flows in your DCF be nominal or real?", a: "Either works if the discount rate matches. In practice they're nominal, because WACC is built from market rates (bond yields, the cost of equity), which are nominal. Then the terminal growth rate is nominal too: long-run real growth plus inflation." },
    { q: "Why does the exact Fisher equation divide rather than subtract?", a: "Inflation reduces the value of the whole ending amount, principal plus interest, not just the interest. So you deflate (1 + nominal) by (1 + inflation). Subtracting ignores the cross term, which is tiny at low rates and large at high ones." },
  ],
  quiz: [
    { q: "Nominal return 10%, inflation 4%. What is the exact real return?", options: ["6%", "5.77%", "6.24%", "14.4%"], answer: 1, why: `1.10 ÷ 1.04 − 1 = ${pct(quizReal, 2)}. 6% is the shortcut; 14.4% multiplies instead of dividing.` },
    { q: `At ${pct(inflation, 0)} inflation, roughly what will ${rupees(amount)} received in 12 years buy in today's money?`, options: [rupees(100000), rupees(amount * (1 - inflation * 12)), rupees(quizPower), rupees(fv(amount, inflation, 12))], answer: 2, why: `${rupees(amount)} ÷ 1.06¹² = ${rupees(quizPower)}. Subtracting ${pct(inflation, 0)} a year in a straight line (${rupees(amount * (1 - inflation * 12))}) ignores compounding. Money loses about half its purchasing power in ${num(halfLife, 1)} years at ${pct(inflation, 0)} inflation.` },
    { q: "A DCF models revenue growing with prices. Which discount rate should it use?", options: ["A real rate", "A nominal rate", "The inflation rate", "Either, it makes no difference"], answer: 1, why: "Cash flows that grow with prices are nominal, so they need a nominal discount rate. Mixing nominal flows with a real rate overstates value." },
  ],
  apply: {
    problems: [],
    models: [],
    cases: [],
    tools: ["tvm"],
  },
  glossary: [
    { term: "Nominal return", definition: "The return measured in money: how many more rupees you have at the end." },
    { term: "Real return", definition: "The return measured in purchasing power: (1 + nominal) ÷ (1 + inflation) − 1." },
    { term: "Fisher equation", definition: "(1 + nominal) = (1 + real) × (1 + inflation). Links nominal rates, real rates and inflation." },
    { term: "Purchasing power", definition: "What a sum of money can buy. Future rupees are converted into today's rupees by discounting at the inflation rate." },
    { term: "Break-even rate", definition: "The nominal rate at which the after-tax return just matches inflation: inflation ÷ (1 − tax rate)." },
  ],
};
