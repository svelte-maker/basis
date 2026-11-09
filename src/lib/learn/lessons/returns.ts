import { maxDrawdown } from "@/lib/finance/portfolio";
import { mean, stdev } from "@/lib/finance/stats";
import { fv } from "@/lib/finance/tvm";
import { num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Average return, CAGR and drawdowns ----------

const rupees = (x: number) => `₹${num(x)}`;
const start = 100000;

/** Value path of an investment through a series of period returns, starting at `start`. */
function path(returns: number[]): number[] {
  const out = [start];
  for (const r of returns) out.push(out[out.length - 1] * (1 + r));
  return out;
}
const cagrOf = (values: number[]) => Math.pow(values[values.length - 1] / values[0], 1 / (values.length - 1)) - 1;

// The simplest case: +50% then −50%.
const upDown = path([0.5, -0.5]);
const upDownAvg = mean([0.5, -0.5]);
const upDownCagr = cagrOf(upDown);

// Two funds with the same 8% average return over five years.
const fundA = [0.25, -0.2, 0.3, -0.1, 0.15];
const fundB = [0.09, 0.07, 0.1, 0.06, 0.08];
const pathA = path(fundA), pathB = path(fundB);
const avgA = mean(fundA), avgB = mean(fundB);
const cagrA = cagrOf(pathA), cagrB = cagrOf(pathB);
const sdA = stdev(fundA), sdB = stdev(fundB);
const ddA = maxDrawdown(pathA), ddB = maxDrawdown(pathB);
const endA = pathA[pathA.length - 1], endB = pathB[pathB.length - 1];
const at8 = fv(start, 0.08, 5);
const dragApprox = avgA - (sdA * sdA) / 2;

// Gain needed to recover from a loss.
const losses = [0.1, 0.2, 0.25, 1 / 3, 0.5];
const recovery = (loss: number) => loss / (1 - loss);

// Quiz.
const quizUpDown = cagrOf(path([0.2, -0.2]));
const quizPrices = [100, 120, 90, 130, 104, 140];
const quizDd = maxDrawdown(quizPrices);

export const returnsAndDrawdowns: Lesson = {
  slug: "average-return-cagr-and-drawdowns",
  title: "Average return vs CAGR, and why drawdowns matter",
  summary: "Why the average of yearly returns overstates what an investor earns, how to compute CAGR and maximum drawdown, and why a 50% loss needs a 100% gain to recover.",
  module: "risk",
  level: "Foundation",
  prerequisites: ["time-value-of-money"],
  outcomes: [
    "Explain why the arithmetic average return overstates the growth of an investment that goes up and down.",
    "Compute CAGR (the geometric average return) from a start value, an end value and the number of years.",
    "Compute the maximum drawdown of a price or value series, and the gain needed to recover a loss.",
    "Compare two funds with the same average return on what an investor actually ends up with.",
  ],
  hook: [
    `A fund gains 50% one year and loses 50% the next. Its average return is ${pct(upDownAvg, 0)}. An investor who put in ${rupees(start)} has ${rupees(upDown[2])}.`,
    "Fund factsheets, stock-tip channels and even some textbooks quote average returns. Investors live on compounded ones. The difference is small for steady investments and large for volatile ones, and it's the reason a fund's worst fall matters as much as its average year.",
  ],
  sections: [
    {
      id: "two-averages",
      title: "Two kinds of average",
      blocks: [
        { kind: "p", text: "The **arithmetic average** adds up the yearly returns and divides by the number of years. It answers: what was a typical year? The **geometric average**, better known as **CAGR** (compound annual growth rate), is the single constant return that would turn the starting value into the ending value. It answers: what did the investor actually earn per year?" },
        { kind: "formula", expr: "Arithmetic average = (r₁ + r₂ + … + rₙ) ÷ n", terms: [["rₜ", "The return in year t, as a decimal"], ["n", "Number of years"]] },
        { kind: "formula", expr: "CAGR = (End value ÷ Start value)^(1 ÷ n) − 1", terms: [["End value, Start value", "What the investment was worth at the end and the start"], ["n", "Number of years between them"]] },
        { kind: "p", text: `For +50% then −50%: the arithmetic average is ${pct(upDownAvg, 0)}, but ${rupees(start)} becomes ${rupees(upDown[1])} and then ${rupees(upDown[2])}. CAGR = (${num(upDown[2])} ÷ ${num(start)})^(1/2) − 1 = **${pct(upDownCagr, 2)}** a year.` },
        { kind: "callout", tone: "insight", title: "Why the average misleads", text: [
          "A loss is taken from a bigger base than the gain that came before it, or a gain is earned on a smaller base after a loss. Returns multiply; they don't add. The arithmetic average treats them as if they add, so it's always at least as high as CAGR, and the gap widens as returns get more volatile.",
        ] },
      ],
    },
    {
      id: "two-funds",
      title: "Two funds, same average",
      blocks: [
        { kind: "table", caption: `${rupees(start)} invested in each fund for five years`, head: ["Year", "Fund A return", "Fund A value", "Fund B return", "Fund B value"], rows: [
          ["Start", "", rupees(start), "", rupees(start)],
          ...fundA.map((r, i) => [String(i + 1), pct(r, 0), rupees(pathA[i + 1]), pct(fundB[i], 0), rupees(pathB[i + 1])]),
        ] },
        { kind: "table", head: ["", "Fund A", "Fund B"], rows: [
          ["Arithmetic average return", pct(avgA, 2), pct(avgB, 2)],
          ["CAGR", pct(cagrA, 2), pct(cagrB, 2)],
          ["Value after 5 years", rupees(endA), rupees(endB)],
          ["Standard deviation of returns", pct(sdA, 2), pct(sdB, 2)],
          ["Maximum drawdown", pct(ddA, 2), pct(ddB, 2)],
        ] },
        { kind: "p", text: `Both funds average ${pct(avgA, 0)} a year. Fund B ends at ${rupees(endB)}, close to the ${rupees(at8)} that a steady 8% would give. Fund A ends at ${rupees(endA)}, a CAGR of only ${pct(cagrA, 2)}. The difference, ${rupees(endB - endA)} on a ${rupees(start)} investment, is the cost of volatility. It's often called **volatility drag**.` },
        { kind: "callout", tone: "desk", title: "A rule of thumb for the drag", text: [
          `CAGR ≈ arithmetic average − σ² ÷ 2, where σ is the standard deviation of returns. For Fund A that gives ${pct(avgA, 2)} − ${pct(sdA, 2)}² ÷ 2 ≈ ${pct(dragApprox, 2)}, against the true ${pct(cagrA, 2)}. It's rough over five years, but it shows the point: the drag grows with the square of volatility, so doubling volatility roughly quadruples it.`,
        ] },
        { kind: "sheet", title: "Compute CAGR and drawdown yourself", task: "Change the returns in B3:B7. Make one year −40% and watch the gap between the average and CAGR. Then press \"Try it yourself\" and rebuild the values, the running peak, the drawdowns and the three results.", rows: 11, cols: 5, widths: [180, 100, 120, 120, 110],
          labels: { A1: "Year", B1: "Return", C1: "Value (₹)", D1: "Running peak (₹)", E1: "Drawdown", A2: "Start", A3: "1", A4: "2", A5: "3", A6: "4", A7: "5", A9: "Arithmetic average", A10: "CAGR", A11: "Maximum drawdown" },
          heads: ["A1", "B1", "C1", "D1", "E1"],
          inputs: { C2: "100000", B3: "25%", B4: "-20%", B5: "30%", B6: "-10%", B7: "15%" },
          formulas: { D2: "=C2", C3: "=C2*(1+B3)", C4: "=C3*(1+B4)", C5: "=C4*(1+B5)", C6: "=C5*(1+B6)", C7: "=C6*(1+B7)", D3: "=MAX(D2,C3)", D4: "=MAX(D3,C4)", D5: "=MAX(D4,C5)", D6: "=MAX(D5,C6)", D7: "=MAX(D6,C7)", E3: "=1-C3/D3", E4: "=1-C4/D4", E5: "=1-C5/D5", E6: "=1-C6/D6", E7: "=1-C7/D7", B9: "=AVERAGE(B3:B7)", B10: "=POWER(C7/C2,1/5)-1", B11: "=MAX(E3:E7)" },
          fmt: { B3: "pct1", B4: "pct1", B5: "pct1", B6: "pct1", B7: "pct1", C2: "n0", C3: "n0", C4: "n0", C5: "n0", C6: "n0", C7: "n0", D2: "n0", D3: "n0", D4: "n0", D5: "n0", D6: "n0", D7: "n0", E3: "pct2", E4: "pct2", E5: "pct2", E6: "pct2", E7: "pct2", B9: "pct2", B10: "pct2", B11: "pct2" } },
      ],
    },
    {
      id: "drawdowns",
      title: "Drawdowns and the maths of recovery",
      blocks: [
        { kind: "p", text: "A **drawdown** is the fall from the highest value reached so far to a later low. The **maximum drawdown** is the largest such fall over the whole period. It answers the question every investor asks in a bad year: how much could I have lost if I'd bought at the worst moment?" },
        { kind: "formula", expr: "Drawdown at t = 1 − Value at t ÷ Highest value up to t", terms: [["Highest value up to t", "The running peak: the maximum value reached on or before t"]] },
        { kind: "p", text: `Fund A peaks at ${rupees(pathA[1])} after year 1 and falls to ${rupees(pathA[2])} in year 2, a drawdown of **${pct(ddA, 0)}**. Fund B never falls, so its maximum drawdown is ${pct(ddB, 0)}.` },
        { kind: "table", caption: "Gain needed to get back to where you started", head: ["Loss", "Gain needed to recover"], rows: losses.map((l) => [pct(l, 2), pct(recovery(l), 2)]) },
        { kind: "formula", expr: "Gain needed = Loss ÷ (1 − Loss)", terms: [["Loss", "The drawdown, as a decimal"]] },
        { kind: "callout", tone: "warning", title: "Losses and gains aren't symmetric", text: [
          `A ${pct(0.5, 0)} loss needs a ${pct(recovery(0.5), 0)} gain to recover, because the gain is earned on half the money. Small losses are easy to make back; large ones can take years. That's why risk managers watch drawdowns, not just averages.`,
        ] },
      ],
    },
    {
      id: "practice",
      title: "Which number to quote",
      blocks: [
        { kind: "list", items: [
          "**Past performance of an investment**: quote CAGR. It's the return the investor actually earned.",
          "**Expected return for next year**, as an input to a portfolio model: the arithmetic average is the better estimate of a single year, which is why models like CAPM use it.",
          "**Risk**: quote the standard deviation and the maximum drawdown together. Volatility measures how bumpy the ride was; drawdown measures how deep the worst hole was.",
        ] },
        { kind: "callout", tone: "desk", title: "Reading a fund factsheet", text: [
          "Mutual fund factsheets in India report returns over one year as absolute and over longer periods as CAGR, often alongside a SIP return computed with XIRR. When a product is sold on an \"average return\", ask for the CAGR and the worst drawdown over the same period.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "The average return is the return.", practice: `Investors earn the compounded return. Fund A averages ${pct(avgA, 0)} but compounds at ${pct(cagrA, 2)}, ${rupees(endB - endA)} behind a steadier fund with the same average over five years.` },
    { theory: "Standard deviation captures risk.", practice: "Standard deviation treats a +20% surprise the same as a −20% one, and says nothing about the order of returns. Practitioners add maximum drawdown and time to recover, because that's what makes investors sell at the bottom." },
    { theory: "A loss of x% needs a gain of x% to recover.", practice: `It needs x ÷ (1 − x). A ${pct(0.25, 0)} drawdown needs ${pct(recovery(0.25), 2)}, and a ${pct(0.5, 0)} drawdown needs ${pct(recovery(0.5), 0)}.` },
  ],
  mistakes: [
    `Quoting the arithmetic average as the investor's return: ${pct(upDownAvg, 0)} for +50%/−50% when the investor lost ${pct(-upDownCagr, 2)} a year.`,
    "Measuring drawdown from the starting value instead of from the running peak.",
    "Computing CAGR with the number of values instead of the number of years. Five yearly returns span five years, not six.",
    "Comparing CAGRs over different periods. A fund's five-year CAGR depends heavily on its start and end dates.",
  ],
  interview: [
    { q: "A fund returned +50% and then −50%. What was its average return, and what did the investor earn?", a: `The arithmetic average is ${pct(upDownAvg, 0)}, but ${rupees(start)} became ${rupees(upDown[1])} and then ${rupees(upDown[2])}, so the investor lost ${pct(1 - upDown[2] / start, 0)} in total, a CAGR of ${pct(upDownCagr, 2)}. Returns compound, so a loss on a larger base more than cancels an equal percentage gain.` },
    { q: "Why might a fund with a lower average return be the better investment?", a: `Because what compounds is the geometric return, and volatility drags it below the average. Two funds that both average 8% can end ${rupees(endB - endA)} apart on ${rupees(start)} over five years if one is much more volatile. A lower but steadier average can compound to more, and a shallower drawdown makes it less likely the investor sells at the bottom.` },
    { q: "A stock falls 40%. What gain does it need to get back to its previous high?", a: `${pct(0.4, 0)} ÷ (1 − ${pct(0.4, 0)}) = ${pct(recovery(0.4), 2)}. The gain is earned on 60% of the original value, so it has to be bigger than the loss.` },
  ],
  quiz: [
    { q: "An investment gains 20% and then loses 20%. What is its CAGR over the two years?", options: ["0%", "−2.02%", "−4%", "−20%"], answer: 1, why: `1.2 × 0.8 = 0.96, so the investment lost 4% in total, and CAGR = 0.96^(1/2) − 1 = ${pct(quizUpDown, 2)} a year. 0% is the arithmetic average, and −4% is the total loss, not the annual rate.` },
    { q: `Month-end values: ${quizPrices.join(", ")}. What is the maximum drawdown?`, options: ["20%", "25%", "30%", "10%"], answer: 1, why: `The deepest fall from a running peak is 120 → 90: 1 − 90 ÷ 120 = ${pct(quizDd, 0)}. The 130 → 104 fall is 20%, and the overall path from 100 to 140 doesn't matter.` },
    { q: "Two funds have the same arithmetic average return. Which one most likely has the higher CAGR?", options: ["The more volatile one", "The less volatile one", "They're always equal", "It depends only on the last year"], answer: 1, why: "Volatility drags the compounded return below the average, by roughly half the variance. The steadier fund keeps more of its average." },
  ],
  apply: {
    problems: [],
    models: [],
    cases: [],
    tools: ["tvm"],
  },
  glossary: [
    { term: "Arithmetic average return", definition: "The sum of period returns divided by the number of periods: the return of a typical period." },
    { term: "CAGR", definition: "Compound annual growth rate: (End ÷ Start)^(1 ÷ years) − 1. The constant yearly return that gives the same ending value; also called the geometric average return." },
    { term: "Volatility drag", definition: "The gap between the arithmetic average and CAGR caused by returns going up and down. Roughly half the variance of returns." },
    { term: "Drawdown", definition: "The fall from the highest value reached so far to a later value, as a percentage of that peak." },
    { term: "Maximum drawdown", definition: "The largest drawdown over a period: the worst peak-to-trough loss an investor could have suffered." },
  ],
};
