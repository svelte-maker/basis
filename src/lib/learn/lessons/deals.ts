import { accretionDilution } from "@/lib/finance/corporate";
import { europeanWaterfall } from "@/lib/finance/funds";
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
    problems: ["lbo-sources-and-uses", "lbo-exit-returns", "irr-from-moic", "leverage-and-coverage", "dividend-recap-irr", "fund-waterfall-carry"],
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

// ---------- Private equity fund economics: the distribution waterfall ----------

const fund = { contributed: 100, years: 5, hurdle: 0.08, carry: 0.2 };
const fundPref = fund.contributed * (Math.pow(1 + fund.hurdle, fund.years) - 1);
const fundCatchUp = (fund.carry / (1 - fund.carry)) * fundPref;
const wf = (proceeds: number) => europeanWaterfall({ ...fund, proceeds });
const wfBase = wf(200);
const wfCases = [130, 155, 200, 300].map((p) => ({ proceeds: p, w: wf(p) }));
const gpShare = (p: number, w: ReturnType<typeof wf>) => (p > fund.contributed ? w.gp / (p - fund.contributed) : 0);
const fullCarryFrom = fund.contributed + fundPref + fundCatchUp;
const fundMoic = wfBase.lp / fund.contributed, grossMoic = 200 / fund.contributed;
const netIrr = Math.pow(fundMoic, 1 / fund.years) - 1, grossIrr = Math.pow(grossMoic, 1 / fund.years) - 1;
// Quiz: catch-up zone, 100 in, 8% hurdle over 5 years
const quizCu = wf(150);

export const fundWaterfall: Lesson = {
  slug: "private-equity-fund-waterfall",
  title: "Private equity fund economics: carried interest, hurdle and the waterfall",
  summary: "How a private equity fund splits its profits: return of capital, the preferred return (hurdle), the GP catch-up and the 80/20 carry split, with a worked whole-fund waterfall and why net returns differ from gross.",
  module: "deals",
  level: "Advanced",
  prerequisites: ["leveraged-buyouts"],
  outcomes: [
    "Run a whole-fund (European) distribution waterfall tier by tier: return of capital, preferred return, catch-up and carry split.",
    "Explain why, once a fund clears its hurdle by enough, the GP ends up with exactly its carry share of total profit.",
    "Tell a whole-fund waterfall from a deal-by-deal (American) one, and explain clawback.",
    "Compare gross and net returns and say where the gap comes from.",
  ],
  hook: [
    "A buyout fund turns its investors' money into twice as much. Everyone celebrates, and then the investors (the **limited partners**, or LPs) open the distribution notice and find they got a good deal less than twice their money back. The rest went to the manager (the **general partner**, or GP) as **carried interest**.",
    "Carry is how private equity managers get rich, and the rules that decide it, the **distribution waterfall**, sit in every fund's limited partnership agreement. Interviewers at funds, placement agents and fund-of-funds ask about it, and it is one of the clearest places where the textbook's 'IRR' and an investor's actual return part ways.",
  ],
  sections: [
    {
      id: "players",
      title: "Who's who: LPs, GPs, fees and carry",
      blocks: [
        { kind: "p", text: "A private equity fund is usually a limited partnership with a ten-year life. **LPs** (pension funds, insurers, endowments, sovereign wealth funds, family offices) commit the money. The **GP** runs the fund, finds the deals and is paid two ways." },
        { kind: "list", items: [
          "**Management fee:** typically around 2% a year of committed capital during the investment period, often stepping down later. It pays salaries and running costs, whatever the returns.",
          "**Carried interest:** typically 20% of the fund's profits, paid only if the LPs have first received their money back and a minimum return. This is the performance pay, and it is where the waterfall comes in.",
        ] },
        { kind: "callout", tone: "insight", title: "The bucket picture", text: [
          "Think of proceeds as water poured into a row of buckets. Each bucket must be full before anything spills into the next. The order of the buckets is the waterfall, and it decides who gets paid, and when.",
        ] },
      ],
    },
    {
      id: "tiers",
      title: "The four tiers of a whole-fund waterfall",
      blocks: [
        { kind: "table", head: ["Tier", "Who gets it", "Until"], rows: [
          ["1. Return of capital", "100% to LPs", "LPs have their contributions back"],
          ["2. Preferred return (hurdle)", "100% to LPs", `LPs have earned the hurdle, here ${pct(fund.hurdle, 0)} a year compounded`],
          ["3. GP catch-up", "100% to the GP", `the GP has ${pct(fund.carry, 0)} of all profit paid out so far`],
          ["4. Carry split", `${pct(1 - fund.carry, 0)} LPs, ${pct(fund.carry, 0)} GP`, "everything that is left"],
        ] },
        { kind: "formula", expr: "Preferred return = C × ((1 + h)^T − 1)", terms: [["C", "capital contributed"], ["h", "hurdle rate a year, compounded annually"], ["T", "years from contribution to distribution"]] },
        { kind: "formula", expr: "Full catch-up = carry ÷ (1 − carry) × preferred return", terms: [["carry", "the GP's profit share, e.g. 20%"], ["preferred return", "the tier 2 amount the LPs received"]] },
        { kind: "p", text: `Why carry ÷ (1 − carry)? After the catch-up the GP must hold 20% of the profit paid so far, and the LPs the other 80%. The LPs' share is the preferred return, so the GP needs 20/80 = 0.25 times it. With ${money(fund.contributed)}m in, an ${pct(fund.hurdle, 0)} hurdle and ${fund.years} years, the preferred return is **${money(fundPref, 2)}m** and the full catch-up is **${money(fundCatchUp, 2)}m**.` },
      ],
    },
    {
      id: "worked",
      title: `A worked waterfall: ${money(fund.contributed)}m in, ${money(200)}m out`,
      blocks: [
        { kind: "p", text: `LPs contribute ${money(fund.contributed)}m at the start. After ${fund.years} years the fund has sold everything and distributes ${money(200)}m in one go. Ignore fees for now.` },
        { kind: "table", head: ["Tier", "Paid", "Left to distribute"], rows: [
          ["Proceeds", "", money(200, 2) + "m"],
          ["1. Return of capital (LPs)", money(wfBase.returnOfCapital, 2) + "m", money(200 - wfBase.returnOfCapital, 2) + "m"],
          ["2. Preferred return (LPs)", money(wfBase.preferred, 2) + "m", money(200 - wfBase.returnOfCapital - wfBase.preferred, 2) + "m"],
          ["3. GP catch-up (GP)", money(wfBase.catchUp, 2) + "m", money(wfBase.residual, 2) + "m"],
          [`4. Split: ${pct(1 - fund.carry, 0)} LPs / ${pct(fund.carry, 0)} GP`, `${money((1 - fund.carry) * wfBase.residual, 2)}m / ${money(fund.carry * wfBase.residual, 2)}m`, money(0, 2) + "m"],
          ["**GP carried interest**", `**${money(wfBase.gp, 2)}m**`, ""],
          ["**LPs in total**", `**${money(wfBase.lp, 2)}m**`, ""],
        ] },
        { kind: "p", text: `Profit is ${money(200 - fund.contributed)}m and the GP's carry is ${money(wfBase.gp, 2)}m: exactly **${pct(gpShare(200, wfBase), 1)}** of profit. The hurdle didn't reduce the GP's pay at all here. That surprises most people the first time.` },
        { kind: "sheet", title: "A whole-fund waterfall you can change", task: "Change the proceeds in B3. Try 130, 155 and 300 and watch the GP's share of profit in B14. Then press \"Try it yourself\" and rebuild the tiers with MIN.", rows: 14, cols: 2, widths: [300, 130],
          labels: { A1: "Whole-fund waterfall ($m)", A2: "Capital contributed", A3: "Proceeds distributed", A4: "Years", A5: "Hurdle (compounded)", A6: "Carry", A8: "1. Return of capital", A9: "2. Preferred return", A10: "3. GP catch-up", A11: "4. Left to split", A12: "GP carried interest", A13: "LPs in total", A14: "GP share of profit" },
          heads: ["A1"],
          inputs: { B2: "100", B3: "200", B4: "5", B5: "8%", B6: "20%" },
          formulas: { B8: "=MIN(B3,B2)", B9: "=MIN(B3-B8,B2*((1+B5)^B4-1))", B10: "=MIN(B3-B8-B9,B6/(1-B6)*B9)", B11: "=B3-B8-B9-B10", B12: "=B10+B6*B11", B13: "=B3-B12", B14: "=IF(B3>B2,B12/(B3-B2),0)" },
          fmt: { B2: "n2", B3: "n2", B5: "pct1", B6: "pct1", B8: "n2", B9: "n2", B10: "n2", B11: "n2", B12: "n2", B13: "n2", B14: "pct1" } },
      ],
    },
    {
      id: "zones",
      title: "Three zones: below the hurdle, in the catch-up, full carry",
      blocks: [
        { kind: "table", caption: `Same fund, different exits (${money(fund.contributed)}m in, ${fund.years} years, ${pct(fund.hurdle, 0)} hurdle, ${pct(fund.carry, 0)} carry)`, head: ["Proceeds", "Profit", "GP carry", "GP share of profit", "Zone"], rows: wfCases.map(({ proceeds, w }) => [
          money(proceeds) + "m", money(proceeds - fund.contributed) + "m", money(w.gp, 2) + "m", pct(gpShare(proceeds, w), 1),
          w.residual > 0 ? "Full carry" : w.catchUp > 0 ? "In the catch-up" : "Below the hurdle",
        ]) },
        { kind: "list", items: [
          `**Below the hurdle** (proceeds up to ${money(fund.contributed + fundPref, 2)}m): the LPs take everything and the GP gets nothing.`,
          `**In the catch-up** (up to ${money(fullCarryFrom, 2)}m): the GP takes 100% of every extra dollar, so its share of profit climbs fast.`,
          `**Full carry** (above ${money(fullCarryFrom, 2)}m): the GP holds exactly ${pct(fund.carry, 0)} of total profit, and every extra dollar splits ${pct(1 - fund.carry, 0)}/${pct(fund.carry, 0)}.`,
        ] },
        { kind: "callout", tone: "insight", title: "The hurdle decides whether, not how much", text: [
          "With a full catch-up, a fund that does well pays the GP the same 20% of profit as a fund with no hurdle at all. The hurdle protects LPs in mediocre outcomes. It doesn't trim the GP's share in good ones.",
        ] },
      ],
    },
    {
      id: "american",
      title: "Whole-fund versus deal-by-deal, and clawback",
      blocks: [
        { kind: "p", text: "Everything above is a **whole-fund (European)** waterfall: LPs get back all contributed capital across the fund, plus the hurdle, before the GP sees any carry. It is the LP-friendly structure, standard in Europe and increasingly common elsewhere." },
        { kind: "p", text: "A **deal-by-deal (American)** waterfall runs the tiers on each exit separately. The GP can earn carry on an early winner while later deals are still under water. That is good for the GP's cash flow and risky for LPs: if later deals lose money, the GP may have been paid carry on profits the fund as a whole never made." },
        { kind: "callout", tone: "desk", title: "Clawback and escrow", text: [
          "Because of that risk, deal-by-deal funds have a **clawback**: at the end of the fund's life the GP must give back any carry above its share of whole-fund profit. In practice LPs also negotiate an **escrow** (part of each carry payment is held back) and personal guarantees from the partners, because chasing individual partners for money they've already spent and paid tax on is hard.",
        ] },
      ],
    },
    {
      id: "net",
      title: "Gross versus net: what investors actually earn",
      blocks: [
        { kind: "p", text: `In the worked example the deals returned ${num(grossMoic, 2)}x, a gross IRR of ${pct(grossIrr, 1)} over ${fund.years} years. After carry the LPs got ${money(wfBase.lp, 2)}m, a net ${num(fundMoic, 2)}x and ${pct(netIrr, 1)}, before management fees. Fees widen the gap further, because they're paid on committed capital every year whether or not the deals work.` },
        { kind: "list", items: [
          "**Gross** returns are what the deals made. They're what GPs lead with in a pitch.",
          "**Net** returns are what LPs received after fees, carry and fund expenses. They're what LPs compare across managers and against public markets.",
          "**DPI** (distributions to paid-in) counts only cash actually returned. **TVPI** adds the value of what the fund still holds. Early in a fund's life, DPI is low and TVPI rests on the GP's own valuations.",
        ] },
        { kind: "callout", tone: "warning", title: "Don't apply 20% to the whole gain and stop", text: [
          `20% × ${money(200 - fund.contributed)}m = ${money(fund.carry * (200 - fund.contributed))}m happens to be right here, because the fund is in full carry. Below ${money(fullCarryFrom, 2)}m of proceeds it's wrong: always run the tiers.`,
        ] },
      ],
    },
  ],
  gap: [
    { theory: "One contribution at the start and one distribution at the end.", practice: "Capital is drawn down over several years as deals close and returned as each exit happens, so the hurdle is tracked as an IRR on dated cash flows, and the waterfall is rerun on every distribution." },
    { theory: "Carry is 20% with an 8% hurdle and a full catch-up.", practice: "Terms are negotiated. Some funds have no hurdle, partial catch-ups (say 50/50), tiered carry that rises to 25–30% above a higher return, or fee offsets for deal and monitoring fees." },
    { theory: "The GP is paid when the fund makes money.", practice: "In a deal-by-deal fund the GP can be paid early and asked to give it back later. Clawback, escrow and guarantees decide whether LPs ever see that money again." },
    { theory: "The IRR is the return.", practice: "LPs judge managers on net IRR, net TVPI and DPI, and on how cash actually came back. A high IRR with little cash distributed doesn't pay pensions." },
  ],
  mistakes: [
    "Applying 20% to total profit without checking whether the fund cleared the hurdle and the catch-up.",
    "Using a simple hurdle (8% × years) when the agreement says compounded.",
    "Forgetting return of capital before the preferred return, which double-counts profit.",
    "Sizing the catch-up as 20% of the preferred return instead of 20/80 of it.",
    "Quoting gross returns as if they were what investors earned.",
  ],
  interview: [
    { q: "Walk me through a distribution waterfall.", a: "Proceeds go first to the LPs until they've got their capital back, then to the LPs until they've earned the preferred return, usually 8% a year. Then the GP gets a catch-up, often 100% of proceeds until it has 20% of the profit paid so far. After that everything splits 80/20 between LPs and GP." },
    { q: "Does an 8% hurdle mean the GP only earns carry on returns above 8%?", a: "Not with a full catch-up. The hurdle decides whether the GP gets carry. Once the fund clears the hurdle and the catch-up, the GP has exactly 20% of all profit, as if there were no hurdle. Only without a catch-up does carry apply just to profit above the hurdle." },
    { q: "Why do LPs prefer a European waterfall?", a: "Because the GP earns no carry until the whole fund has returned capital and the hurdle. In an American, deal-by-deal waterfall the GP can be paid on early winners before the losers show up, and LPs then rely on clawback to get money back." },
  ],
  quiz: [
    { q: `LPs contribute ${money(fund.contributed)}m; after ${fund.years} years the fund distributes ${money(150)}m. Hurdle ${pct(fund.hurdle, 0)} compounded, full catch-up, ${pct(fund.carry, 0)} carry. GP carry is about:`, options: [money(fund.carry * 50) + "m", money(quizCu.gp, 2) + "m", money(0) + "m", money(fund.carry * Math.max(0, 50 - fundPref), 2) + "m"], answer: 1, why: `After ${money(fund.contributed)}m of capital and ${money(fundPref, 2)}m of preferred return, ${money(quizCu.gp, 2)}m is left. That's less than the full catch-up of ${money(fundCatchUp, 2)}m, so the GP takes all of it.` },
    { q: "With a full catch-up, a fund far above its hurdle pays the GP:", options: ["20% of profit above the hurdle", "20% of total profit", "20% of total proceeds", "Nothing until the fund ends"], answer: 1, why: "The catch-up exists to bring the GP to its full carry share of all profit." },
    { q: "Which waterfall lets the GP earn carry before the whole fund has returned capital?", options: ["Whole-fund (European)", "Deal-by-deal (American)", "Both", "Neither"], answer: 1, why: "Deal-by-deal runs the tiers on each exit, so an early winner can pay carry while other deals are still under water." },
  ],
  apply: {
    problems: ["fund-waterfall-carry"],
    models: [],
    cases: [],
    tools: [],
  },
  glossary: [
    { term: "Limited partner (LP)", definition: "An investor in a private equity fund, such as a pension fund or endowment." },
    { term: "General partner (GP)", definition: "The manager that runs a private equity fund and earns fees and carried interest." },
    { term: "Distribution waterfall", definition: "The order in which a fund's proceeds are paid to LPs and the GP." },
    { term: "Preferred return (hurdle)", definition: "The minimum return LPs receive before the GP earns carry, often 8% a year." },
    { term: "GP catch-up", definition: "The waterfall tier that gives the GP most or all proceeds until it holds its full carry share of profit." },
    { term: "Clawback", definition: "The GP's obligation to return carry it received above its share of whole-fund profit." },
    { term: "DPI", definition: "Distributions to paid-in capital: cash returned to LPs ÷ cash they contributed." },
  ],
};
