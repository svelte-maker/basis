import { accretionDilution } from "@/lib/finance/corporate";
import { runLbo, type LboInput } from "@/lib/finance/lbo";
import { irr } from "@/lib/finance/tvm";
import { money, num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- M&A: accretion and dilution ----------

const deal = { acquirerNetIncome: 500, acquirerShares: 100, targetNetIncome: 80, purchasePrice: 1200, acquirerSharePrice: 60, costOfDebt: 0.08, taxRate: 0.25 };
const allStock = accretionDilution({ ...deal, pctStock: 1 });
const half = accretionDilution({ ...deal, pctStock: 0.5 });
const allCash = accretionDilution({ ...deal, pctStock: 0 });
const acqPE = deal.acquirerSharePrice / (deal.acquirerNetIncome / deal.acquirerShares);
const purchasePE = deal.purchasePrice / deal.targetNetIncome;
// Pre-tax synergies that make the all-stock deal break even on EPS
const breakEvenSyn = ((allStock.standaloneEPS * (deal.acquirerShares + allStock.newShares)) - deal.acquirerNetIncome - deal.targetNetIncome) / (1 - deal.taxRate);
const withSyn = accretionDilution({ ...deal, pctStock: 1, synergies: breakEvenSyn });

export const mergers: Lesson = {
  slug: "mergers-accretion-dilution",
  title: "Mergers and acquisitions: accretion, dilution and value",
  summary: "How acquisitions are paid for and judged: purchase price and premium, cash versus stock, EPS accretion and dilution, synergies, and why an accretive deal can still destroy value.",
  module: "deals",
  level: "Advanced",
  prerequisites: ["enterprise-value-and-multiples", "cost-of-capital-wacc"],
  outcomes: [
    "Compute pro forma EPS and accretion or dilution for cash, stock and mixed deals.",
    "Predict accretion with the P/E shortcut: compare the buyer's P/E with the price paid, and the after-tax cost of debt with the target's earnings yield.",
    "Size the synergies needed to break even.",
    "Explain why EPS accretion is not the same as value creation.",
  ],
  hook: [
    "When a company announces an acquisition, the first question from analysts on the call is almost always: \"Is it accretive?\" Will earnings per share go up or down? CEOs know this, so deals get structured to be accretive.",
    "But a deal that raises EPS can still destroy value, and a dilutive deal can be a great one. Knowing the difference is what separates an M&A analyst from a calculator.",
  ],
  sections: [
    {
      id: "price",
      title: "What the buyer pays",
      blocks: [
        { kind: "p", text: "The **offer price** per share is usually set at a premium to the target's undisturbed share price, typically 20–40%, to persuade shareholders to sell and to pay for control. Multiply by diluted shares for the **equity purchase price**; add the target's net debt for the **enterprise value** paid (the buyer takes on the debt)." },
        { kind: "p", text: "The buyer can pay with **cash** (from its balance sheet or new debt), with **its own shares**, or a mix. The choice changes who bears the risk: in a stock deal, target shareholders become owners of the combined company and share the risk that synergies never arrive." },
      ],
    },
    {
      id: "accretion",
      title: "Accretion and dilution",
      blocks: [
        { kind: "formula", expr: "Pro forma EPS = (NI_acquirer + NI_target − After-tax interest on new debt + After-tax synergies) / (Acquirer shares + New shares issued)", terms: [["New shares", "stock portion of the price ÷ acquirer's share price"], ["After-tax interest", "debt raised × cost of debt × (1 − tax), plus forgone interest on any cash used"]] },
        { kind: "p", text: `An acquirer earns ${money(deal.acquirerNetIncome)} on ${deal.acquirerShares} shares (EPS ${money(allStock.standaloneEPS, 2)}) and trades at $${deal.acquirerSharePrice}, a P/E of ${num(acqPE, 1)}x. It buys a target earning ${money(deal.targetNetIncome)} for ${money(deal.purchasePrice)}, a purchase P/E of ${num(purchasePE, 1)}x. Debt costs 8% before tax; tax is 25%.` },
        { kind: "table", head: ["Consideration", "New shares", "After-tax interest", "Pro forma EPS", "Accretion / (dilution)"], rows: [
          ["100% stock", num(allStock.newShares, 1), money(0), money(allStock.proFormaEPS, 3), pct(allStock.accretion, 2)],
          ["50% stock, 50% debt", num(half.newShares, 1), money(deal.purchasePrice * 0.5 * deal.costOfDebt * (1 - deal.taxRate), 1), money(half.proFormaEPS, 3), pct(half.accretion, 2)],
          ["100% debt", num(allCash.newShares, 1), money(deal.purchasePrice * deal.costOfDebt * (1 - deal.taxRate), 1), money(allCash.proFormaEPS, 3), pct(allCash.accretion, 2)],
        ] },
        { kind: "callout", tone: "insight", title: "The shortcut every banker uses", text: [
          `**Stock deals:** accretive if the buyer's P/E is higher than the P/E it pays. Here the buyer's ${num(acqPE, 1)}x is below the ${num(purchasePE, 1)}x paid, so issuing shares is dilutive: it is buying expensive earnings with cheap currency.`,
          `**Debt deals:** accretive if the target's earnings yield (1 ÷ purchase P/E = ${pct(1 / purchasePE, 2)}) is above the after-tax cost of debt (${pct(deal.costOfDebt * (1 - deal.taxRate), 2)}). It is, so the debt-financed deal is accretive.`,
          "The general rule: a deal is accretive when the target's earnings yield exceeds the weighted cost of the acquisition currency: after-tax interest on debt, forgone after-tax interest on cash, and the buyer's own earnings yield on stock.",
        ] },
        { kind: "h", text: "Synergies" },
        { kind: "p", text: `How much in annual pre-tax synergies would make the all-stock deal neutral? The combined company needs ${money(allStock.standaloneEPS, 2)} × ${num(deal.acquirerShares + allStock.newShares)} shares = ${money(allStock.standaloneEPS * (deal.acquirerShares + allStock.newShares))} of earnings, ${money(allStock.standaloneEPS * (deal.acquirerShares + allStock.newShares) - deal.acquirerNetIncome - deal.targetNetIncome)} more than the two companies earn. Grossed up for tax, that is **${money(breakEvenSyn, 2)} of pre-tax synergies** a year (check: pro forma EPS with them is ${money(withSyn.proFormaEPS, 3)}).` },
        { kind: "p", text: "Synergies come in two kinds. **Cost synergies** (closing duplicate offices, combining procurement) are more reliable and arrive sooner. **Revenue synergies** (cross-selling) are frequently promised and often missed. Analysts typically credit cost synergies and haircut revenue synergies heavily." },
      ],
    },
    {
      id: "value",
      title: "Accretion is not value creation",
      blocks: [
        { kind: "p", text: "A buyer with a high P/E can make almost any stock deal accretive, and a cash-rich buyer earning 3% on deposits can make almost any cash deal accretive, because the bar is the cost of the currency, not the risk-adjusted return. Value is created only if the present value of the target's cash flows plus synergies exceeds the price paid, including the premium." },
        { kind: "formula", expr: "Value created for the buyer = PV(target standalone) + PV(synergies) − Price paid − Integration costs", terms: [] },
        { kind: "callout", tone: "desk", title: "What the deal team actually builds", text: [
          "A merger model combines the two companies' forecasts, adds purchase accounting (goodwill, asset write-ups and the extra depreciation they create), financing (new debt, its fees and interest), synergies phased in over two to three years and one-off integration costs, then shows accretion or dilution by year with a sensitivity to price and stock/cash mix. Alongside it sits a contribution analysis (what share of combined earnings each side brings versus the ownership it gets) and a DCF to test whether the price is justified.",
        ] },
        { kind: "callout", tone: "warning", title: "The track record", text: [
          "Study after study finds that acquirers' shareholders on average earn little or nothing from large acquisitions, while target shareholders capture most of the gains through the premium. Overpaying in competitive auctions (the winner's curse), optimistic synergies and integration failures are the usual causes.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Pay up to the value of the target plus synergies.", practice: "Buyers try to pay much less, sharing synergies with target shareholders only as much as competition forces. Auctions push prices toward the most optimistic bidder's view." },
    { theory: "Accretion/dilution on next year's EPS.", practice: "Boards look at years 1–3, before and after synergies and integration costs, and at the credit-rating impact of new debt." },
    { theory: "EPS is the measure.", practice: "Sophisticated investors look at return on invested capital versus WACC, and at whether the buyer will earn its cost of capital on the full price within a reasonable time." },
  ],
  mistakes: [
    "Forgetting the forgone interest on cash used to pay for a deal.",
    "Counting synergies before tax in pro forma net income.",
    "Using the target's share price instead of the acquirer's to compute new shares issued.",
    "Calling a deal good because it is accretive.",
  ],
  interview: [
    { q: "A buyer with a P/E of 20x acquires a target at 15x in an all-stock deal. Accretive or dilutive?", a: "Accretive, before synergies and fees: the buyer is issuing shares valued at 20x earnings to buy earnings at 15x." },
    { q: "Why might a company pay in stock even if it is dilutive?", a: "If it has little cash or debt capacity, if it thinks its own shares are overvalued, or if it wants target shareholders to share the risk of the combined company. The EPS effect is secondary to value and risk." },
  ],
  quiz: [
    { q: "Buyer P/E 25x, purchase P/E 30x, all-stock deal, no synergies. The deal is:", options: ["Accretive", "Dilutive", "Neutral", "Can't tell"], answer: 1, why: "It issues shares at 25x to buy earnings at 30x: dilutive." },
    { q: "After-tax cost of debt 5%, purchase P/E 16x, all-debt deal. The deal is:", options: ["Accretive", "Dilutive", "Neutral", "Can't tell"], answer: 0, why: "Earnings yield 1/16 = 6.25% exceeds the 5% after-tax cost of debt." },
  ],
  apply: {
    problems: ["eps-accretion-dilution", "diluted-shares-tsm", "enterprise-value-bridge"],
    models: [],
    cases: [],
    tools: ["comps"],
  },
  glossary: [
    { term: "Accretion / dilution", definition: "The percentage change in the acquirer's EPS caused by a deal." },
    { term: "Purchase premium", definition: "The offer price over the target's undisturbed share price." },
    { term: "Synergies", definition: "Cost savings or extra revenue that the combined company can achieve but the two could not separately." },
    { term: "Earnings yield", definition: "Earnings ÷ price: the inverse of the P/E ratio." },
    { term: "Goodwill", definition: "The excess of the purchase price over the fair value of the net assets acquired." },
    { term: "Contribution analysis", definition: "Comparing each party's share of combined revenue, EBITDA or earnings with its share of ownership after a merger." },
  ],
};

// ---------- LBO ----------

export const lboCase: LboInput = {
  entryEbitda: 100, entryMultiple: 10, leverageMultiple: 5, feesPct: 0.02, years: 5, ebitdaGrowth: 0.07,
  daPctEbitda: 0.2, capexPctEbitda: 0.2, nwcPctEbitda: 0.1, interestRate: 0.09, mandatoryAmortPct: 0.05,
  cashSweepPct: 1, taxRate: 0.25, exitMultiple: 10,
};
const lbo = runLbo(lboCase);
const lboExpand = runLbo({ ...lboCase, exitMultiple: 11 });
const lboLowLev = runLbo({ ...lboCase, leverageMultiple: 3 });
const valueCreated = lbo.exitEquity - lbo.entryEquity;
const moicIrr = (moic: number, years: number) => irr([-1, ...Array(years - 1).fill(0), moic]);

export const leveragedBuyouts: Lesson = {
  slug: "leveraged-buyouts",
  title: "Leveraged buyouts: how private equity makes its returns",
  summary: "Sources and uses, the debt schedule and cash sweep, IRR and MOIC, the three levers of LBO returns, and what really drives private equity value creation.",
  module: "deals",
  level: "Advanced",
  prerequisites: ["free-cash-flow", "npv-irr-capital-budgeting"],
  outcomes: [
    "Build sources and uses for a buyout.",
    "Run a simple debt schedule with mandatory amortisation and a cash sweep.",
    "Compute exit equity, MOIC and IRR, and convert between them.",
    "Attribute returns to EBITDA growth, multiple expansion and debt paydown.",
  ],
  hook: [
    "A private equity fund buys a company for 10x EBITDA, borrows half the price, and five years later sells it for the same multiple. The business grew, but not spectacularly. The fund still more than doubles its money.",
    "How? Leverage, the cash flow that repays it, and growth. An LBO model shows exactly where the return comes from, and why the same model is also an interview staple and a valuation floor in every sale process.",
  ],
  sections: [
    {
      id: "structure",
      title: "Sources and uses",
      blocks: [
        { kind: "p", text: `The sponsor buys a company with EBITDA of ${money(lboCase.entryEbitda)} at ${lboCase.entryMultiple}x, paying ${pct(lboCase.feesPct, 0)} in transaction fees, and funds it with ${lboCase.leverageMultiple}x EBITDA of debt at ${pct(lboCase.interestRate, 0)}.` },
        { kind: "table", head: ["Uses", "Amount", "Sources", "Amount"], rows: [
          ["Purchase enterprise value", money(lbo.entryEV), "Debt (5.0x EBITDA)", money(lbo.entryDebt)],
          ["Fees", money(lbo.fees), "Sponsor equity (the plug)", money(lbo.entryEquity)],
          ["**Total uses**", money(lbo.entryEV + lbo.fees), "**Total sources**", money(lbo.entryDebt + lbo.entryEquity)],
        ] },
        { kind: "p", text: "Sources must equal uses, so equity is the balancing figure. In real deals the debt is layered: senior term loans (cheapest, amortising), then high-yield bonds or private credit, sometimes mezzanine, each more expensive and more junior." },
      ],
    },
    {
      id: "schedule",
      title: "The debt schedule",
      blocks: [
        { kind: "p", text: "Each year the company's free cash flow after interest repays debt: first the **mandatory amortisation** (here 5% of the original loan), then a **cash sweep** of whatever is left. Interest is charged on the opening balance to avoid a circular reference." },
        { kind: "table", head: ["Year", "EBITDA", "Interest", "Free cash flow", "Mandatory", "Sweep", "Closing debt"], rows: lbo.schedule.map((y) => [String(y.year), num(y.ebitda, 1), num(y.interest, 1), num(y.fcf, 1), num(y.mandatory, 1), num(y.sweep, 1), num(y.debtEnd, 1)]) },
        { kind: "p", text: "Watch the virtuous circle: as debt falls, interest falls, so free cash flow rises and repays debt faster. That deleveraging is a large part of the return." },
      ],
    },
    {
      id: "returns",
      title: "Exit, MOIC and IRR",
      blocks: [
        { kind: "table", head: ["", "Amount"], rows: [
          ["Exit EBITDA (year 5)", money(lbo.schedule[lbo.schedule.length - 1].ebitda, 1)],
          ["× Exit multiple", `${lboCase.exitMultiple}x`],
          ["= Exit enterprise value", money(lbo.exitEV, 1)],
          ["− Remaining debt", money(-lbo.exitDebt, 1)],
          ["+ Cash", money(lbo.exitCash, 1)],
          ["**= Exit equity**", money(lbo.exitEquity, 1)],
          ["**MOIC** (exit equity ÷ entry equity)", `${num(lbo.moic, 2)}x`],
          ["**IRR**", pct(lbo.irr, 2)],
        ] },
        { kind: "formula", expr: "IRR = MOIC^(1 / years) − 1   (no interim cash flows)", terms: [["MOIC", "multiple on invested capital"]] },
        { kind: "table", caption: "Rules of thumb (no interim distributions)", head: ["MOIC", "3 years", "5 years", "7 years"], rows: [2, 2.5, 3].map((mo) => [`${mo}x`, pct(moicIrr(mo, 3), 1), pct(moicIrr(mo, 5), 1), pct(moicIrr(mo, 7), 1)]) },
        { kind: "callout", tone: "insight", title: "2x in 5 years ≈ 15%; 3x in 5 years ≈ 25%", text: [
          "Memorise these. Sponsors typically target a 20–25% gross IRR and 2.5–3x MOIC. Notice the tension: IRR rewards speed, MOIC rewards size. Returning money early boosts IRR but may leave money on the table, which is why investors ask for both.",
        ] },
      ],
    },
    {
      id: "levers",
      title: "Where the return comes from",
      blocks: [
        { kind: "table", head: ["Lever", "Contribution to equity gain"], rows: [
          ["EBITDA growth (at the entry multiple)", money(lbo.attribution.ebitdaGrowth, 1)],
          ["Multiple expansion", money(lbo.attribution.multipleExpansion, 1)],
          ["Debt paydown and cash build", money(lbo.attribution.debtPaydownAndCash, 1)],
          ["Fees", money(lbo.attribution.fees, 1)],
          ["**Total = exit equity − entry equity**", money(valueCreated, 1)],
        ] },
        { kind: "list", items: [
          `**Multiple expansion** is powerful and dangerous. Exiting at 11x instead of 10x lifts IRR from ${pct(lbo.irr, 1)} to ${pct(lboExpand.irr, 1)}. Responsible models assume exit multiple = entry multiple.`,
          `**Leverage** amplifies returns. With 3x debt instead of 5x, the sponsor writes a bigger cheque and IRR falls to ${pct(lboLowLev.irr, 1)}, even though the business performs identically. It also amplifies losses if EBITDA falls.`,
          "**Operational improvement** (pricing, procurement, add-on acquisitions, better management) is what the best funds claim drives their returns, and it is the only lever fully under their control.",
        ] },
        { kind: "callout", tone: "desk", title: "The LBO as a valuation floor", text: [
          "In a sale process, bankers run an LBO to answer: \"What could a financial sponsor pay and still earn 20%?\" That price is a floor for strategic buyers. Solve backwards: set the IRR target, then find the entry multiple that achieves it.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Interest on opening balances.", practice: "Real models compute interest on average balances with iterative calculation, include floating rates tied to SOFR or MCLR, commitment fees, and OID and financing fees amortised over the loan life." },
    { theory: "One tranche of debt.", practice: "Capital structures have several tranches with different covenants, amortisation and call features, plus revolving credit facilities for working capital." },
    { theory: "Exit at year 5.", practice: "Exits happen when markets allow: IPOs, sales to strategics, secondary buyouts to other funds, or dividend recapitalisations that return cash early." },
    { theory: "IRR is the return.", practice: "LPs care about net returns after fees and carry (typically 2% management fee and 20% carried interest), and about DPI: cash actually distributed." },
  ],
  mistakes: [
    "Forgetting fees in uses, which understates equity.",
    "Letting debt go negative in the sweep: cap repayments at the outstanding balance.",
    "Assuming multiple expansion to hit a target IRR.",
    "Computing MOIC on enterprise values instead of equity values.",
  ],
  interview: [
    { q: "Walk me through an LBO.", a: "A sponsor buys a company using a lot of debt and some equity. I set up sources and uses, project cash flows, use free cash flow to repay debt, then exit at a multiple of final-year EBITDA. Exit equity is exit EV less remaining debt plus cash; I compare it with the equity invested for MOIC and IRR." },
    { q: "What makes a good LBO candidate?", a: "Stable, predictable cash flows to service debt; low capex needs; a strong market position; room for operational improvement; a reasonable entry price; and a clear exit route." },
    { q: "How do you get a 2x MOIC in five years to an IRR quickly?", a: "2^(1/5) − 1, which is about 15%. A 3x in five years is about 25%." },
  ],
  quiz: [
    { q: "Entry equity 400, exit equity 1,000 after 5 years, no interim flows. MOIC is:", options: ["1.5x", "2.0x", "2.5x", "3.0x"], answer: 2, why: "1,000 ÷ 400 = 2.5x." },
    { q: "Which change raises IRR, everything else equal?", options: ["Higher entry multiple", "Less debt", "Faster debt paydown", "Higher interest rate"], answer: 2, why: "Faster paydown leaves more of exit EV for equity holders." },
    { q: "Approximate IRR of a 2x MOIC over 3 years:", options: ["15%", "26%", "33%", "41%"], answer: 1, why: "2^(1/3) − 1 ≈ 26%." },
  ],
  apply: {
    problems: ["lbo-sources-and-uses", "lbo-exit-returns", "irr-from-moic", "leverage-and-coverage", "dividend-recap-irr", "fund-waterfall-carry", "fund-multiples-tvpi"],
    models: ["lbo-debt-sweep"],
    cases: [],
    tools: ["lbo"],
  },
  glossary: [
    { term: "LBO", definition: "Leveraged buyout: an acquisition funded largely with debt, repaid from the target's cash flows." },
    { term: "Sources and uses", definition: "A table showing where the money for a deal comes from and how it is spent; the two must be equal." },
    { term: "Cash sweep", definition: "Using excess free cash flow to repay debt early." },
    { term: "MOIC", definition: "Multiple on invested capital: total value returned ÷ capital invested." },
    { term: "Multiple expansion", definition: "Exiting at a higher valuation multiple than the entry multiple." },
    { term: "Carried interest", definition: "The share of fund profits, typically 20%, paid to the private equity manager." },
  ],
};
