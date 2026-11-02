import { capitalRatio, creditRwa, type Exposure } from "@/lib/finance/banking";
import { money, num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Bank capital: risk-weighted assets and CET1 ----------

type Line = Exposure & { name: string };

const book: Line[] = [
  { name: "Government bonds (AAA)", amount: 300, riskWeight: 0 },
  { name: "Residential mortgages", amount: 400, riskWeight: 0.35 },
  { name: "Retail loans", amount: 200, riskWeight: 0.75 },
  { name: "Corporate loans (unrated)", amount: 500, riskWeight: 1 },
];
const otherRwa = 110;
const cet1 = 81;
const exposures = book.reduce((s, b) => s + b.amount, 0);
const credit = creditRwa(book);
const rwa = credit + otherRwa;
const ratio = capitalRatio(cet1, book, otherRwa);
const density = credit / exposures;
const simpleLeverage = cet1 / exposures;

// Move 200 from corporate loans into mortgages: same assets, same capital, lower RWA.
const shift = 200;
const shifted: Line[] = book.map((b) =>
  b.name.startsWith("Corporate") ? { ...b, amount: b.amount - shift } : b.name.startsWith("Residential") ? { ...b, amount: b.amount + shift } : b);
const shiftedRwa = creditRwa(shifted) + otherRwa;
const shiftedRatio = capitalRatio(cet1, shifted, otherRwa);

// A loss on corporate loans: written off against both the loan and CET1.
const loss = 18;
const afterLoss: Line[] = book.map((b) => (b.name.startsWith("Corporate") ? { ...b, amount: b.amount - loss } : b));
const lossRwa = creditRwa(afterLoss) + otherRwa;
const lossRatio = capitalRatio(cet1 - loss, afterLoss, otherRwa);

// Reaching an 11% target: raise capital, or cut corporate loans (100% weight).
const target = 0.11;
const capitalNeeded = target * rwa - cet1;
const rwaCut = rwa - cet1 / target;

// Quiz: a smaller book.
const quizBook: Exposure[] = [{ amount: 100, riskWeight: 0 }, { amount: 200, riskWeight: 0.35 }, { amount: 300, riskWeight: 1 }];
const quizRatio = capitalRatio(40, quizBook, 30);

const minimum = 0.045, buffer = 0.025;
const zone = (r: number) => (r < minimum ? "below the minimum" : r < minimum + buffer ? "inside the buffer" : "above minimum + buffer");

export const bankCapital: Lesson = {
  slug: "bank-capital-cet1-and-risk-weighted-assets",
  title: "Bank capital: risk-weighted assets and the CET1 ratio",
  summary: "Why regulators measure a bank's equity against risk-weighted assets, how to compute RWA and the CET1 ratio, the Basel III minimums and buffers, and how banks move the ratio without raising new capital.",
  module: "credit",
  level: "Core",
  prerequisites: ["credit-analysis-and-lending"],
  outcomes: [
    "Compute credit risk-weighted assets from exposures and risk weights, and add market and operational RWA.",
    "Compute a CET1 ratio and say whether it clears the Basel III minimum and the conservation buffer.",
    "Show how a loss, a change in the loan mix or a capital raise moves the ratio, and size the fix for a target.",
    "Explain why regulators also watch a simple leverage ratio alongside the risk-based one.",
  ],
  hook: [
    "When a bank reports results, the first number analysts check isn't profit. It's the CET1 ratio. A bank can report a record quarter and still be told to stop paying dividends if that ratio slips under its buffer.",
    "The ratio answers one question: if loans go bad, how much of the bank's own money stands between the losses and the depositors? The twist is that it measures that cushion against how risky the assets are, not how large they are. That one design choice explains a lot of how banks lend.",
  ],
  sections: [
    {
      id: "why",
      title: "Why risk-weight at all",
      blocks: [
        { kind: "p", text: "A bank funds itself mostly with deposits and borrowing, and only a thin slice with equity. Equity is the part that can absorb losses without anyone else losing money. Regulators set a floor on that slice." },
        { kind: "p", text: "A floor on equity ÷ total assets would treat a government bond and an unsecured loan to a start-up as equally risky. So the Basel framework scales each exposure by a **risk weight** first. A safe sovereign bond might count for 0%, a mortgage secured on a home for about a third, and an unrated corporate loan in full. The sum is **risk-weighted assets (RWA)**." },
        { kind: "formula", expr: "Credit RWA = Σ (Exposure × Risk weight)", terms: [["Exposure", "The amount lent or invested in each category"], ["Risk weight", "A regulator-set percentage reflecting the credit risk of that category"]] },
        { kind: "p", text: "Trading positions and operational risk (fraud, system failures, lawsuits) get their own capital charges. These are converted into RWA too and added on top." },
        { kind: "formula", expr: "CET1 ratio = CET1 capital ÷ (Credit RWA + Market and operational RWA)", terms: [["CET1 capital", "Common equity tier 1: paid-up shares plus retained earnings, less deductions such as goodwill and deferred tax assets"], ["Market and operational RWA", "Capital charges for trading and operational risk, expressed as RWA"]] },
      ],
    },
    {
      id: "worked",
      title: "A worked example",
      blocks: [
        { kind: "table", caption: `A small bank's book ($m). It holds ${money(cet1)}m of CET1 and ${money(otherRwa)}m of market and operational RWA.`, head: ["Exposure", "Amount", "Risk weight", "RWA"], rows: [
          ...book.map((b) => [b.name, num(b.amount), pct(b.riskWeight, 0), num(b.amount * b.riskWeight)]),
          ["Credit RWA", num(exposures), "", num(credit)],
        ] },
        { kind: "list", ordered: true, items: [
          `Credit RWA = ${book.map((b) => `${num(b.amount)} × ${pct(b.riskWeight, 0)}`).join(" + ")} = **${money(credit)}m**.`,
          `Total RWA = ${num(credit)} + ${num(otherRwa)} = **${money(rwa)}m**.`,
          `CET1 ratio = ${num(cet1)} ÷ ${num(rwa)} = **${pct(ratio, 2)}**.`,
        ] },
        { kind: "p", text: `The bank has ${money(exposures)}m of exposures but only ${money(credit)}m of credit RWA, so its **RWA density** is ${pct(density, 1)}. Density is the quickest way to compare how risky two banks' books are before you look at a single loan.` },
        { kind: "sheet", title: "A CET1 ratio you can change", task: "Change the amounts or weights in B and C. Try moving 200 from corporate loans to mortgages. Then press \"Try it yourself\" and rebuild RWA and the ratio.", rows: 11, cols: 4, widths: [240, 110, 110, 110],
          labels: { A1: "Exposure ($m)", B1: "Amount", C1: "Risk weight", D1: "RWA", A2: "Government bonds (AAA)", A3: "Residential mortgages", A4: "Retail loans", A5: "Corporate loans (unrated)", A6: "Credit RWA", A7: "Market and operational RWA", A8: "Total RWA", A9: "CET1 capital", A10: "CET1 ratio", A11: "Headroom over 7% ($m)" },
          heads: ["A1", "B1", "C1", "D1"],
          inputs: { B2: "300", C2: "0%", B3: "400", C3: "35%", B4: "200", C4: "75%", B5: "500", C5: "100%", D7: "110", D9: "81" },
          formulas: { D2: "=B2*C2", D3: "=B3*C3", D4: "=B4*C4", D5: "=B5*C5", B6: "=SUM(B2:B5)", D6: "=SUM(D2:D5)", D8: "=D6+D7", D10: "=D9/D8", D11: "=D9-7%*D8" },
          fmt: { B2: "n0", B3: "n0", B4: "n0", B5: "n0", B6: "n0", C2: "pct1", C3: "pct1", C4: "pct1", C5: "pct1", D2: "n1", D3: "n1", D4: "n1", D5: "n1", D6: "n1", D7: "n1", D8: "n1", D9: "n1", D10: "pct2", D11: "n1" } },
      ],
    },
    {
      id: "thresholds",
      title: "Minimums and buffers",
      blocks: [
        { kind: "p", text: `Basel III sets a CET1 minimum of **${pct(minimum, 1)}** of RWA, plus a **capital conservation buffer** of ${pct(buffer, 1)}, so ${pct(minimum + buffer, 1)} in total. Falling below the minimum is a regulatory breach. Falling into the buffer isn't a breach, but the bank faces automatic limits on dividends, buybacks and bonuses until it rebuilds.` },
        { kind: "p", text: `Our bank's ${pct(ratio, 2)} is ${zone(ratio)}. Its headroom over 7% is ${num(cet1)} − 7% × ${num(rwa)} = **${money(cet1 - 0.07 * rwa, 1)}m**. That's how much loss it could take before dividend limits kick in, ignoring the fact that a loss also shrinks RWA a little.` },
        { kind: "callout", tone: "desk", title: "What banks actually run at", text: [
          "Large banks also carry surcharges for being systemically important and buffers set by stress tests, so a bank is rarely managed at the bare 7%. Management sets a target above all of these, often in the low teens, and reports progress against it every quarter.",
          "India's RBI applies Basel III with a higher CET1 minimum than the Basel floor, so Indian banks' headline requirements are stricter than the textbook 7%. Check the RBI master circular for the current numbers before quoting them.",
        ] },
      ],
    },
    {
      id: "moves",
      title: "Three ways the ratio moves",
      blocks: [
        { kind: "table", caption: "Starting from the worked example", head: ["Event", "CET1 ($m)", "Total RWA ($m)", "CET1 ratio", "Where it lands"], rows: [
          ["Start", num(cet1), num(rwa), pct(ratio, 2), zone(ratio)],
          [`Move ${money(shift)}m from corporate loans to mortgages`, num(cet1), num(shiftedRwa), pct(shiftedRatio, 2), zone(shiftedRatio)],
          [`Write off ${money(loss)}m of corporate loans`, num(cet1 - loss), num(lossRwa), pct(lossRatio, 2), zone(lossRatio)],
        ] },
        { kind: "p", text: `**Changing the mix.** Moving ${money(shift)}m of lending from 100%-weighted corporate loans to 35%-weighted mortgages cuts RWA by ${money(rwa - shiftedRwa)}m and lifts the ratio to ${pct(shiftedRatio, 2)}, without a dollar of new capital and with the same total assets.` },
        { kind: "p", text: `**Taking a loss.** A ${money(loss)}m write-off hits capital in full but only trims RWA by ${money(rwa - lossRwa)}m, so the ratio falls to ${pct(lossRatio, 2)}. Losses hurt the numerator far more than they help the denominator.` },
        { kind: "callout", tone: "insight", title: "Two levers to hit a target", text: [
          `To reach an ${pct(target, 0)} target, the bank can raise ${pct(target, 0)} × ${num(rwa)} − ${num(cet1)} = **${money(capitalNeeded)}m** of new equity, or shrink RWA to ${num(cet1)} ÷ ${pct(target, 0)} = ${money(cet1 / target, 2)}m, a cut of **${money(rwaCut, 2)}m**. That means about ${money(rwaCut, 2)}m fewer corporate loans at a 100% weight.`,
          "Raising equity dilutes shareholders. Shrinking RWA means turning away borrowers. Most banks under pressure do some of each, and also hold back dividends, which builds capital from retained earnings.",
        ] },
      ],
    },
    {
      id: "leverage",
      title: "Why there's also a leverage ratio",
      blocks: [
        { kind: "p", text: "Risk weights are only as good as the assumptions behind them. Before 2008, many banks held assets with low weights that turned out to be very risky. A book can look well capitalised on RWA while being highly leveraged in plain terms." },
        { kind: "p", text: `So Basel III adds a backstop: the **leverage ratio**, Tier 1 capital ÷ total exposure (including off-balance-sheet items), with no risk weights at all and a minimum of 3%. A rough version for our bank, using CET1 and on-balance-sheet exposures, is ${num(cet1)} ÷ ${num(exposures)} = ${pct(simpleLeverage, 2)}.` },
        { kind: "callout", tone: "warning", title: "Don't mix the denominators", text: [
          `CET1 ÷ RWA (${pct(ratio, 2)}) and capital ÷ exposures (${pct(simpleLeverage, 2)}) are different ratios with different minimums. Dividing by total assets when the question asks for the CET1 ratio is the most common mistake in bank capital problems.`,
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Risk weights are fixed numbers from a table.", practice: "Large banks may use internal models to set their own weights. Since the 2017 reforms, an output floor stops model-based RWA from falling below 72.5% of the standardised figure, once it's fully phased in." },
    { theory: "A higher CET1 ratio means a safer bank.", practice: "Analysts check how the ratio was reached. A ratio lifted by shifting into low-weight assets, or by optimistic models, is weaker than one built from retained earnings. That's why RWA density and the leverage ratio are read alongside it." },
    { theory: "A mortgage has a 35% weight.", practice: "That's the old standardised weight. Under the 2017 Basel III reforms the weight depends on the loan-to-value ratio, from 20% for low-LTV loans up to 70%, so the same book can produce different RWA." },
  ],
  mistakes: [
    `Dividing CET1 by total exposures instead of RWA: ${num(cet1)} ÷ ${num(exposures)} = ${pct(simpleLeverage, 2)} instead of ${pct(ratio, 2)}.`,
    `Forgetting market and operational RWA: ${num(cet1)} ÷ ${num(credit)} = ${pct(cet1 / credit, 2)} overstates the ratio.`,
    "Treating the conservation buffer as part of the minimum. Dropping into the buffer restricts payouts; only dropping below 4.5% is a breach.",
    "Counting goodwill or other intangibles as CET1. They're deducted, because they can't absorb losses in a crisis.",
  ],
  interview: [
    { q: "How can a bank raise its CET1 ratio without raising capital?", a: `Cut risk-weighted assets: lend more against low-weight collateral like mortgages and less as unsecured corporate loans, sell or securitise high-weight assets, or cut trading positions. In the worked example, moving ${money(shift)}m from corporate loans to mortgages lifts the ratio from ${pct(ratio, 2)} to ${pct(shiftedRatio, 2)} with no new equity. The bank can also retain earnings by cutting dividends, which adds capital without issuing shares.` },
    { q: "Why do regulators use risk-weighted assets rather than total assets?", a: "Because the same amount of equity is a much bigger cushion against a book of government bonds than against unsecured loans. Risk weights make capital requirements follow risk, so banks aren't punished for holding safe assets. The leverage ratio then backs this up in case the weights are wrong." },
    { q: "A bank's CET1 ratio is 7.5%. Its loan book takes a loss equal to 1% of RWA. What happens?", a: "Capital falls by about 1% of RWA, so the ratio drops to roughly 6.5%. That's above the 4.5% minimum but inside the 2.5% conservation buffer, so the bank faces automatic limits on dividends and bonuses until it rebuilds." },
  ],
  quiz: [
    { q: "Exposures: 100 at 0%, 200 at 35% and 300 at 100%. Market and operational RWA are 30. CET1 is 40. What is the CET1 ratio?", options: ["6.67%", "8.33%", "10.00%", "12.12%"], answer: 2, why: `RWA = 0 + 70 + 300 + 30 = 400, and 40 ÷ 400 = ${pct(quizRatio, 2)}. 6.67% divides by total exposures (600), and 12.12% leaves out the 70 from mortgages.` },
    { q: "Which of these is a regulatory breach under Basel III?", options: ["A CET1 ratio of 6%", "A CET1 ratio of 4%", "A CET1 ratio of 8%", "None of these"], answer: 1, why: "Below 4.5% is a breach. 6% is inside the conservation buffer: payouts are restricted, but it isn't a breach." },
    { q: "A bank moves lending from unrated corporate loans to residential mortgages. Assets and capital don't change. Its CET1 ratio:", options: ["Rises", "Falls", "Stays the same", "Can't be told"], answer: 0, why: "Mortgages carry a lower risk weight, so RWA falls and the ratio rises with the same capital." },
  ],
  apply: {
    problems: ["cet1-ratio"],
    models: [],
    cases: [],
    tools: [],
  },
  glossary: [
    { term: "Risk-weighted assets (RWA)", definition: "Exposures scaled by regulator-set risk weights, plus charges for market and operational risk. The denominator of bank capital ratios." },
    { term: "Risk weight", definition: "The percentage of an exposure counted in RWA, reflecting its credit risk: 0% for top-rated sovereign bonds, 100% for unrated corporate loans." },
    { term: "CET1 capital", definition: "Common equity tier 1: paid-up shares and retained earnings, less deductions such as goodwill. A bank's highest-quality, loss-absorbing capital." },
    { term: "CET1 ratio", definition: "CET1 capital ÷ risk-weighted assets. Basel III requires at least 4.5%, plus a 2.5% conservation buffer." },
    { term: "Capital conservation buffer", definition: "A 2.5% layer of CET1 above the minimum. A bank inside it faces limits on dividends, buybacks and bonuses." },
    { term: "RWA density", definition: "Credit RWA ÷ total exposures: a quick read on how risky a bank's book is." },
    { term: "Leverage ratio", definition: "Tier 1 capital ÷ total exposure, with no risk weights. Basel III's backstop to the risk-based ratios, with a 3% minimum." },
  ],
};
