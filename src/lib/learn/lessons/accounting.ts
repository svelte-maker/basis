import { computeRatios, dupont, type Statements } from "@/lib/finance/ratios";
import { money, num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- One year of a small company, built so all three statements tie ----------

export const mini = (() => {
  const tax = 0.25;
  const is = { revenue: 1000, cogs: 600, opex: 200, da: 50, interest: 20 };
  const ebitda = is.revenue - is.cogs - is.opex;
  const ebit = ebitda - is.da;
  const ebt = ebit - is.interest;
  const taxExp = ebt * tax;
  const ni = ebt - taxExp;
  const open = { cash: 100, ar: 120, inv: 150, ppe: 500, ap: 90, debt: 300, shareCap: 200, re: 280 };
  const flows = { capex: 80, ar: 140, inv: 165, ap: 100, debtRepaid: 50, dividends: 30 };
  const dAr = flows.ar - open.ar, dInv = flows.inv - open.inv, dAp = flows.ap - open.ap;
  const cfo = ni + is.da - dAr - dInv + dAp;
  const cfi = -flows.capex;
  const cff = -flows.debtRepaid - flows.dividends;
  const close = {
    cash: open.cash + cfo + cfi + cff, ar: flows.ar, inv: flows.inv, ppe: open.ppe + flows.capex - is.da,
    ap: flows.ap, debt: open.debt - flows.debtRepaid, shareCap: open.shareCap, re: open.re + ni - flows.dividends,
  };
  const assets = (b: typeof open) => b.cash + b.ar + b.inv + b.ppe;
  const liabEq = (b: typeof open) => b.ap + b.debt + b.shareCap + b.re;
  return { tax, is, ebitda, ebit, ebt, taxExp, ni, open, flows, dAr, dInv, dAp, cfo, cfi, cff, close, assets, liabEq };
})();

const m = mini;

export const threeStatements: Lesson = {
  slug: "three-financial-statements",
  title: "The three financial statements and how they link",
  summary: "Income statement, balance sheet and cash flow statement: what each one tells you, and the exact links that make them a single connected system.",
  module: "accounting",
  level: "Foundation",
  prerequisites: [],
  outcomes: [
    "Read an income statement, balance sheet and cash flow statement and say what question each answers.",
    "Trace any transaction through all three statements and show that the balance sheet still balances.",
    "Build the cash flow statement from two balance sheets and an income statement (the indirect method).",
    "Answer the classic interview question: \"Depreciation goes up by $10. Walk me through the statements.\"",
  ],
  hook: [
    "A company reports record profits and goes bankrupt six months later. Another reports losses for a decade and becomes one of the most valuable firms on earth. Both stories are true, and neither is a mystery once you can read all three statements together.",
    "Profit is an opinion shaped by accounting rules; cash is a fact. The three statements are how you hold both at once.",
  ],
  sections: [
    {
      id: "each",
      title: "What each statement answers",
      blocks: [
        { kind: "table", head: ["Statement", "Question it answers", "Covers"], rows: [
          ["Income statement (P&L)", "Did the business make a profit?", "A period: a quarter or a year"],
          ["Balance sheet", "What does it own and owe, and what is left for shareholders?", "A single date"],
          ["Cash flow statement", "Where did cash actually come from and go?", "A period"],
        ] },
        { kind: "p", text: "The income statement uses **accrual accounting**: revenue is recorded when it is earned (the goods are delivered), not when cash arrives, and costs are matched to the revenue they helped produce. That is more informative about economic performance, but it means profit and cash can drift far apart." },
        { kind: "p", text: "The balance sheet always obeys **Assets = Liabilities + Equity**. Every transaction touches at least two lines so that the identity holds. Equity is a residual: what would be left for shareholders if every asset were sold at book value and every liability repaid." },
        { kind: "p", text: "The cash flow statement reconciles profit to cash in three buckets: **operating** (running the business), **investing** (buying and selling long-term assets) and **financing** (dealing with lenders and shareholders)." },
      ],
    },
    {
      id: "example",
      title: "One year, all three statements",
      blocks: [
        { kind: "p", text: "Here is a small company over one year. Tax is 25%. Follow the numbers: every figure on the cash flow statement comes from the income statement or from a change between the two balance sheets." },
        { kind: "table", caption: "Income statement", head: ["Line", "Amount"], rows: [
          ["Revenue", money(m.is.revenue)],
          ["Cost of goods sold", money(-m.is.cogs)],
          ["Operating expenses", money(-m.is.opex)],
          ["**EBITDA**", money(m.ebitda)],
          ["Depreciation", money(-m.is.da)],
          ["**EBIT** (operating profit)", money(m.ebit)],
          ["Interest", money(-m.is.interest)],
          ["Pre-tax profit", money(m.ebt)],
          ["Tax at 25%", money(-m.taxExp, 1)],
          ["**Net income**", money(m.ni, 1)],
        ] },
        { kind: "table", caption: "Balance sheet", head: ["", "Opening", "Closing", "Change"], rows: [
          ["Cash", money(m.open.cash, 1), money(m.close.cash, 1), money(m.close.cash - m.open.cash, 1)],
          ["Receivables", money(m.open.ar), money(m.close.ar), money(m.dAr)],
          ["Inventory", money(m.open.inv), money(m.close.inv), money(m.dInv)],
          ["PP&E (net)", money(m.open.ppe), money(m.close.ppe), money(m.close.ppe - m.open.ppe)],
          ["**Total assets**", money(m.assets(m.open), 1), money(m.assets(m.close), 1), ""],
          ["Payables", money(m.open.ap), money(m.close.ap), money(m.dAp)],
          ["Debt", money(m.open.debt), money(m.close.debt), money(m.close.debt - m.open.debt)],
          ["Share capital", money(m.open.shareCap), money(m.close.shareCap), money(0)],
          ["Retained earnings", money(m.open.re), money(m.close.re, 1), money(m.close.re - m.open.re, 1)],
          ["**Liabilities + equity**", money(m.liabEq(m.open), 1), money(m.liabEq(m.close), 1), ""],
        ] },
        { kind: "table", caption: "Cash flow statement (indirect method)", head: ["Line", "Amount", "Where it comes from"], rows: [
          ["Net income", money(m.ni, 1), "Bottom of the income statement"],
          ["+ Depreciation", money(m.is.da), "Non-cash expense, added back"],
          ["− Increase in receivables", money(-m.dAr), "Sales made but not yet collected"],
          ["− Increase in inventory", money(-m.dInv), "Cash tied up in stock"],
          ["+ Increase in payables", money(m.dAp), "Bills not yet paid: cash kept"],
          ["**Cash from operations**", money(m.cfo, 1), ""],
          ["− Capex", money(m.cfi), "Purchase of PP&E"],
          ["**Cash from investing**", money(m.cfi), ""],
          ["− Debt repaid", money(-m.flows.debtRepaid), "Change in debt"],
          ["− Dividends", money(-m.flows.dividends), "Paid to shareholders"],
          ["**Cash from financing**", money(m.cff), ""],
          ["**Net change in cash**", money(m.cfo + m.cfi + m.cff, 1), "Equals the change in the cash line"],
        ] },
        { kind: "callout", tone: "insight", title: "The four links to memorise", text: [
          "1. **Net income** flows to the top of the cash flow statement and into **retained earnings** (less dividends).",
          "2. **Depreciation** reduces PP&E on the balance sheet and is added back on the cash flow statement.",
          "3. Every change in a **working capital** line (receivables, inventory, payables) appears in cash from operations, with the opposite sign for assets.",
          "4. The **net change in cash** at the bottom of the cash flow statement equals the change in the cash line on the balance sheet. If it doesn't, the model is broken.",
        ] },
        { kind: "p", text: `Notice what happened: the company earned ${money(m.ni, 1)} of profit, yet its cash **fell** by ${money(m.open.cash - m.close.cash, 1)}. Growth in receivables and inventory absorbed cash, and it spent on capex, repaid debt and paid dividends. Profit did not lie; it just answers a different question.` },
      ],
    },
    {
      id: "walk",
      title: "Walk me through it: depreciation up by $10",
      blocks: [
        { kind: "p", text: "This is the most common accounting question in finance interviews. Assume a 25% tax rate." },
        { kind: "list", ordered: true, items: [
          "**Income statement.** Operating profit falls by $10. Tax falls by $10 × 25% = $2.50. Net income falls by **$7.50**.",
          "**Cash flow statement.** Net income is down $7.50, but depreciation is a non-cash expense, so add back the $10. Cash from operations **rises by $2.50**. That $2.50 is the tax saved: the depreciation tax shield.",
          "**Balance sheet.** Cash is up $2.50. PP&E is down $10. Total assets fall by **$7.50**. On the other side, retained earnings fall by the $7.50 drop in net income. Both sides fall by $7.50: it balances.",
        ] },
        { kind: "callout", tone: "desk", title: "Why interviewers love this question", text: [
          "It tests whether you understand that the statements are one system rather than three lists. Strong candidates always finish by checking that the balance sheet balances. Follow-ups you should be ready for: an inventory write-down (same shape as depreciation), buying a $100 machine with debt (no income statement effect on day one), and issuing shares to pay off debt.",
        ] },
      ],
    },
    {
      id: "quality",
      title: "Reading between the lines: earnings quality",
      blocks: [
        { kind: "p", text: "Because accrual accounting involves judgement, analysts compare profit with cash to judge **earnings quality**. Persistent gaps deserve questions:" },
        { kind: "list", items: [
          "**Receivables growing much faster than revenue.** Sales may be pushed to customers with generous credit, or recognised early.",
          "**Cash from operations persistently below net income.** Profit is not turning into cash. A ratio of CFO to net income well below 1 for years is a classic warning sign.",
          "**Capitalising costs.** Recording an expense as an asset (capitalised software, customer acquisition costs) lifts profit today and pushes cost into future depreciation.",
          "**One-off items that recur.** \"Exceptional\" restructuring charges that appear every year are not exceptional.",
        ] },
        { kind: "callout", tone: "desk", title: "Where to look in a real annual report", text: [
          "The notes to the accounts matter more than the statements. Revenue recognition policy, related-party transactions, contingent liabilities, and the auditor's report (look for any qualification or emphasis of matter) are where problems surface first. In Indian annual reports, also read the Key Audit Matters and the related-party note; in US 10-Ks, read Risk Factors and MD&A.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Statements are prepared once a year and are final.", practice: "Companies restate prior years, reclassify lines and change segment reporting. Analysts always pull the latest restated figures before comparing years." },
    { theory: "Net income is the measure of performance.", practice: "Markets mostly price EBITDA, operating profit and free cash flow, and companies report their own \"adjusted\" versions. A big part of the job is reconciling adjusted figures back to the reported ones." },
    { theory: "Cash flow statement categories are clear-cut.", practice: "Interest paid can sit in operating or financing under IFRS; lease payments split between the two under IFRS 16. Comparing companies means reclassifying to a common basis." },
    { theory: "The balance sheet shows what assets are worth.", practice: "It mostly shows historical cost. Brands, software, people and customer relationships built in-house barely appear, which is why technology companies trade far above book value." },
  ],
  mistakes: [
    "Adding an increase in receivables to cash from operations. An increase in an asset uses cash, so it is subtracted.",
    "Forgetting the tax effect when walking through a change in an expense.",
    "Putting capex on the income statement. It goes to the balance sheet (PP&E) and reaches the income statement only through depreciation.",
    "Treating dividends as an expense. They are a distribution of profit, deducted from retained earnings, never from net income.",
  ],
  interview: [
    { q: "If you could look at only one statement to judge a company's health, which would you pick?", a: "The cash flow statement. It is hardest to manipulate, it shows whether profit becomes cash, and it shows how the business funds itself. I would still want the balance sheet next, to see leverage and liquidity." },
    { q: "A company buys $100 of inventory on credit. What changes?", a: "Nothing on the income statement. On the balance sheet, inventory rises $100 and payables rise $100. On the cash flow statement, nothing yet: the inventory increase (−$100) and payables increase (+$100) cancel in cash from operations." },
    { q: "How can a profitable company run out of cash?", a: "If its working capital grows faster than its profit (customers paying slowly, inventory building up) or it spends heavily on capex and debt repayments. Fast-growing firms are particularly exposed, because growth itself consumes cash." },
  ],
  quiz: [
    { q: "Receivables rose by $40 during the year. In the indirect cash flow statement this is:", options: ["+$40 in operating", "−$40 in operating", "−$40 in investing", "Not shown"], answer: 1, why: "An increase in an operating asset means revenue was booked but not collected, so it is subtracted from net income to reach cash." },
    { q: "A company issues $500 of new shares for cash. Which statement does NOT change on the day?", options: ["Balance sheet", "Cash flow statement", "Income statement", "All of them change"], answer: 2, why: "Raising equity is a financing flow: cash and share capital rise. There is no revenue or expense." },
    { q: "With a 30% tax rate, a $20 increase in depreciation changes cash by:", options: ["−$20", "−$14", "+$6", "$0"], answer: 2, why: "Net income falls by $14, depreciation adds back $20, so cash rises by $6: the tax shield, $20 × 30%." },
    { q: "Where do dividends paid appear?", options: ["Income statement expense", "Cash from operations", "Cash from financing and retained earnings", "Cash from investing"], answer: 2, why: "Dividends are a distribution to owners: a financing outflow and a reduction in retained earnings." },
  ],
  apply: {
    problems: ["retained-earnings-rollforward", "depreciation-and-cash", "cfo-indirect-method", "gross-margin"],
    models: [],
    cases: [{ slug: "hyundai-motor-india-ipo-2024", parts: ["ebitda-rebuild"] }, { slug: "apple-dcf-fy2025", parts: ["op-margin"] }],
    tools: ["ratios"],
  },
  glossary: [
    { term: "Accrual accounting", definition: "Recording revenue when earned and costs when incurred, regardless of when cash moves." },
    { term: "Retained earnings", definition: "Cumulative net income kept in the business rather than paid out as dividends." },
    { term: "EBITDA", definition: "Earnings before interest, taxes, depreciation and amortisation: a proxy for operating cash profit before capex and working capital." },
    { term: "EBIT", definition: "Earnings before interest and taxes: operating profit after depreciation and amortisation." },
    { term: "Indirect method", definition: "Building cash from operations by starting with net income and adjusting for non-cash items and working capital changes." },
    { term: "Earnings quality", definition: "How well reported profit reflects sustainable, cash-generating performance." },
  ],
};

// ---------- Working capital ----------

const dso = (m.close.ar / m.is.revenue) * 365;
const dio = (m.close.inv / m.is.cogs) * 365;
const dpo = (m.close.ap / m.is.cogs) * 365;
const ccc = dso + dio - dpo;
const oneDaySales = m.is.revenue / 365;

export const workingCapital: Lesson = {
  slug: "working-capital",
  title: "Working capital and the cash conversion cycle",
  summary: "Why growing companies run out of cash, how DSO, DIO and DPO measure the cash tied up in operations, and how the change in working capital enters free cash flow.",
  module: "accounting",
  level: "Core",
  prerequisites: ["three-financial-statements"],
  outcomes: [
    "Compute DSO, DIO, DPO and the cash conversion cycle from a balance sheet and income statement.",
    "Explain why an increase in net working capital reduces free cash flow.",
    "Forecast working capital in a model using days or percentage-of-revenue drivers.",
    "Recognise negative working capital business models and why they are so valuable.",
  ],
  hook: [
    "A garment exporter wins its biggest-ever order. To fulfil it, the company buys fabric up front, pays its workers weekly, ships in three months and gets paid by the foreign buyer 90 days after that. Six months of costs with no cash coming in. The order is profitable, and it nearly bankrupts the company.",
    "This is working capital. It is the least glamorous topic in finance and one of the most common reasons good businesses fail.",
  ],
  sections: [
    {
      id: "what",
      title: "What working capital is",
      blocks: [
        { kind: "formula", expr: "Net working capital (operating) = Receivables + Inventory − Payables", terms: [["Receivables", "money customers owe for goods already delivered"], ["Inventory", "goods bought or made but not yet sold, carried at cost"], ["Payables", "money owed to suppliers: credit the business receives"]] },
        { kind: "p", text: "Accountants define working capital as all current assets minus all current liabilities. Analysts prefer an **operating** definition that excludes cash and short-term debt, because those are financing decisions. Other operating items such as prepaid expenses, accrued expenses and customer advances belong in it too when they are material." },
        { kind: "p", text: "Working capital is cash that the business has to keep invested just to operate. When it **rises**, cash is consumed. When it **falls**, cash is released. That is why the cash flow statement subtracts an increase in receivables and adds an increase in payables." },
      ],
    },
    {
      id: "ccc",
      title: "The cash conversion cycle",
      blocks: [
        { kind: "formula", expr: "CCC = DSO + DIO − DPO", terms: [["DSO", "days sales outstanding = Receivables ÷ Revenue × 365"], ["DIO", "days inventory outstanding = Inventory ÷ COGS × 365"], ["DPO", "days payables outstanding = Payables ÷ COGS × 365"]] },
        { kind: "p", text: "Picture one rupee: it leaves when the supplier is paid and comes back when the customer pays. The CCC is the number of days it is away." },
        { kind: "p", text: `Using the closing balance sheet of the company from the three-statement lesson (revenue ${money(m.is.revenue)}, COGS ${money(m.is.cogs)}):` },
        { kind: "table", head: ["Measure", "Calculation", "Days"], rows: [
          ["DSO", `${money(m.close.ar)} ÷ ${money(m.is.revenue)} × 365`, num(dso, 1)],
          ["DIO", `${money(m.close.inv)} ÷ ${money(m.is.cogs)} × 365`, num(dio, 1)],
          ["DPO", `${money(m.close.ap)} ÷ ${money(m.is.cogs)} × 365`, num(dpo, 1)],
          ["**CCC**", "DSO + DIO − DPO", `**${num(ccc, 1)}**`],
        ] },
        { kind: "p", text: `For about ${num(ccc, 0)} days, every sale has to be funded by the company itself. One day of sales is ${money(oneDaySales, 2)}; cutting DSO by 10 days would free about ${money(oneDaySales * 10, 0)} of cash, permanently.` },
        { kind: "callout", tone: "insight", title: "Negative working capital: getting paid to grow", text: [
          "Some businesses collect from customers before they pay suppliers: supermarkets that sell stock within days but pay suppliers in 30–60, subscription software billed annually in advance, airlines and travel sites that take payment months before the trip, and marketplaces that hold sellers' money before settling. Their CCC is negative, so growth **releases** cash instead of consuming it. Investors pay a premium for this, because the business can fund its own expansion.",
        ] },
      ],
    },
    {
      id: "fcf",
      title: "Working capital in free cash flow and models",
      blocks: [
        { kind: "p", text: "In a DCF, free cash flow subtracts the **change** in net working capital, not its level:" },
        { kind: "formula", expr: "FCF = EBIT × (1 − t) + D&A − Capex − ΔNWC", terms: [["ΔNWC", "this year's NWC minus last year's. Positive when working capital grows, which reduces cash flow"]] },
        { kind: "p", text: "Forecasting works one of two ways. The simple way: NWC as a percentage of revenue (if NWC is 20% of revenue and revenue grows by 100, NWC grows by 20 and FCF falls by 20). The better way, used in bank and equity research models, is to forecast each line from its own days driver:" },
        { kind: "excel", title: "Forecasting balances from days drivers", rows: [
          ["Receivables", "=Revenue * DSO / 365", "Grows with sales and with slower collection"],
          ["Inventory", "=COGS * DIO / 365", "Driven by cost, not price"],
          ["Payables", "=COGS * DPO / 365", "Supplier credit"],
          ["Change in NWC", "=(AR+Inv−AP) − (AR+Inv−AP last year)", "Feeds FCF with a minus sign"],
        ] },
        { kind: "callout", tone: "warning", title: "The seasonal trap", text: [
          "Year-end balances can mislead. Retailers in India often close their books in March, after the festive season inventory has cleared; US retailers close in January, after the holidays. Their year-end working capital is at its lowest point of the year. Where quarterly data exists, analysts average the four quarter-end balances.",
        ] },
      ],
    },
    {
      id: "levers",
      title: "How companies manage it",
      blocks: [
        { kind: "list", items: [
          "**Collect faster:** early-payment discounts, tighter credit terms, invoice discounting or factoring (selling receivables to a bank). In India, the TReDS platforms let small suppliers discount invoices on large buyers.",
          "**Hold less stock:** better demand forecasting, just-in-time supply, fewer SKUs.",
          "**Pay later:** negotiate longer supplier terms, or use **supply chain finance**, where a bank pays the supplier early and the buyer pays the bank later. Rating agencies increasingly treat large supply chain finance programmes as hidden debt.",
        ] },
        { kind: "callout", tone: "desk", title: "What lenders look at", text: [
          "Banks lending working capital lines set a \"drawing power\" from monthly stock and debtor statements, typically lending against receivables under 90 days old and inventory at a haircut. Ageing schedules (how much of receivables is 0–30, 31–60, 61–90 and 90+ days old) matter more to a credit officer than the average DSO.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Use year-end balances to compute DSO, DIO, DPO.", practice: "Use average balances, and quarterly data where possible, to strip out seasonality and window dressing at year end." },
    { theory: "Working capital as a fixed % of revenue.", practice: "Models forecast each line from days drivers, because collection terms, inventory policy and supplier terms move independently." },
    { theory: "Lower working capital is always better.", practice: "Squeezing suppliers too hard raises prices or breaks supply chains; too little inventory loses sales. The best level is a trade-off, and it varies by industry." },
  ],
  mistakes: [
    "Subtracting the level of NWC in FCF instead of the change.",
    "Computing DIO and DPO on revenue rather than COGS: inventory and payables are carried at cost.",
    "Including cash and short-term debt in operating working capital, which double counts them when you later bridge to equity value.",
    "Assuming working capital released by a shrinking business is sustainable cash flow. It is a one-off.",
  ],
  interview: [
    { q: "Why does a growing company need more cash even if it is profitable?", a: "Because its receivables and inventory grow with sales. That increase in working capital is cash invested in the business that does not show up as an expense on the income statement." },
    { q: "Which is better, a CCC of 60 days or −20 days?", a: "All else equal, −20: customers fund the business. But it depends on the industry; a negative cycle achieved by delaying supplier payments can strain the supply chain or hide financial stress." },
  ],
  quiz: [
    { q: "DSO 45, DIO 60, DPO 30. The cash conversion cycle is:", options: ["15 days", "75 days", "105 days", "135 days"], answer: 1, why: "45 + 60 − 30 = 75 days." },
    { q: "Net working capital rose from $200 to $260. The effect on free cash flow is:", options: ["+$60", "−$60", "−$260", "None"], answer: 1, why: "An increase in NWC absorbs cash: subtract the change of $60." },
    { q: "Which business is most likely to have negative working capital?", options: ["A heavy-machinery maker selling on 120-day credit", "A supermarket chain", "A wine producer ageing stock for years", "A construction contractor"], answer: 1, why: "Supermarkets sell stock for cash within days and pay suppliers weeks later." },
  ],
  apply: {
    problems: ["cash-conversion-cycle", "cfo-indirect-method", "unlevered-free-cash-flow"],
    models: [],
    cases: [{ slug: "apple-dcf-fy2025", parts: ["ufcf-fy2025"] }],
    tools: ["ratios"],
  },
  glossary: [
    { term: "Net working capital (NWC)", definition: "Operating current assets minus operating current liabilities, usually receivables + inventory − payables." },
    { term: "DSO", definition: "Days sales outstanding: average days to collect from customers. Receivables ÷ revenue × 365." },
    { term: "DIO", definition: "Days inventory outstanding: average days stock is held. Inventory ÷ COGS × 365." },
    { term: "DPO", definition: "Days payables outstanding: average days taken to pay suppliers. Payables ÷ COGS × 365." },
    { term: "Cash conversion cycle (CCC)", definition: "DSO + DIO − DPO: days between paying suppliers and collecting from customers." },
    { term: "Factoring", definition: "Selling receivables to a financier at a discount to get cash before customers pay." },
  ],
};

// ---------- Depreciation and inventory ----------

const assetCost = 100_000, salvage = 10_000, life = 5;
const sl = (assetCost - salvage) / life;
const ddbRows = (() => {
  const rate = 2 / life;
  let book = assetCost;
  const rows: { year: number; open: number; dep: number; close: number }[] = [];
  for (let y = 1; y <= life; y++) {
    let dep = y === life ? book - salvage : Math.min(book * rate, book - salvage);
    dep = Math.max(0, dep);
    rows.push({ year: y, open: book, dep, close: book - dep });
    book -= dep;
  }
  return rows;
})();
const lots = [{ units: 100, cost: 10 }, { units: 200, cost: 12 }, { units: 100, cost: 15 }];
const sold = 250;
const totalCost = lots.reduce((s, l) => s + l.units * l.cost, 0);
const totalUnits = lots.reduce((s, l) => s + l.units, 0);
const costOf = (order: typeof lots) => {
  let left = sold, cogs = 0;
  for (const l of order) { const u = Math.min(left, l.units); cogs += u * l.cost; left -= u; }
  return cogs;
};
const fifoCogs = costOf(lots);
const lifoCogs = costOf([...lots].reverse());
const avgCogs = (totalCost / totalUnits) * sold;

export const depreciationInventory: Lesson = {
  slug: "depreciation-and-inventory",
  title: "Depreciation and inventory: the judgement calls inside profit",
  summary: "Straight-line versus accelerated depreciation, FIFO versus LIFO versus weighted average, and how each choice moves profit, tax and the balance sheet.",
  module: "accounting",
  level: "Core",
  prerequisites: ["three-financial-statements"],
  outcomes: [
    "Compute straight-line and double-declining-balance depreciation schedules.",
    "Compute cost of goods sold and ending inventory under FIFO, LIFO and weighted average.",
    "Explain how these choices shift profit between years without changing total cash.",
    "Adjust for accounting differences when comparing companies.",
  ],
  hook: [
    "Two airlines buy identical aircraft. One depreciates them over 20 years, the other over 25. With nothing else different, the second reports higher profit every year, and its shares can look cheaper on a P/E basis. Neither company has more cash.",
    "Depreciation and inventory costing are where accounting judgement quietly shapes reported profit. Analysts who can see through them have an edge.",
  ],
  sections: [
    {
      id: "depreciation",
      title: "Why depreciation exists",
      blocks: [
        { kind: "p", text: "A machine bought for $100,000 helps earn revenue for years. Expensing it all on day one would show a huge loss in year one and inflated profits after. The **matching principle** spreads the cost over the asset's useful life instead. Depreciation is that allocation: it is not a cash flow, and it is not an estimate of market value." },
        { kind: "formula", expr: "Straight-line depreciation = (Cost − Salvage value) / Useful life", terms: [["Salvage value", "what you expect to sell the asset for at the end of its life"], ["Useful life", "years the company expects to use it, a management estimate"]] },
        { kind: "formula", expr: "Double-declining balance = Opening book value × (2 / Useful life)", terms: [["2 / life", "twice the straight-line rate; applied to the falling book value, never below salvage"]] },
        { kind: "p", text: `Take an asset costing ${money(assetCost)} with a ${money(salvage)} salvage value and a ${life}-year life. Straight-line gives **${money(sl)} a year**. Double-declining balance front-loads the expense:` },
        { kind: "table", head: ["Year", "Opening book value", "DDB depreciation (40%)", "Closing book value", "Straight-line"], rows: ddbRows.map((r) => [String(r.year), money(r.open), money(r.dep), money(r.close), money(sl)]) },
        { kind: "p", text: `Both methods expense exactly ${money(assetCost - salvage)} over five years. Accelerated depreciation simply moves expense earlier: lower profit early, higher profit later. The final year's charge is the amount needed to land on salvage value.` },
        { kind: "callout", tone: "desk", title: "Book versus tax depreciation", text: [
          "Companies often use straight-line in their published accounts and accelerated depreciation for tax, because tax authorities allow faster write-offs to encourage investment (India's Income Tax Act uses written-down-value rates by block of assets; the US allows MACRS and bonus depreciation). The gap creates a **deferred tax liability**: tax deferred to later years. Seeing a growing deferred tax liability on a balance sheet usually means the company is investing heavily.",
        ] },
      ],
    },
    {
      id: "inventory",
      title: "Inventory costing: FIFO, LIFO, weighted average",
      blocks: [
        { kind: "p", text: "When identical units were bought at different prices, which cost goes to COGS when one is sold? The answer is a policy choice." },
        { kind: "table", caption: "Purchases during the year", head: ["Lot", "Units", "Cost per unit", "Total"], rows: lots.map((l, i) => [i === 0 ? "Opening stock" : `Purchase ${i}`, num(l.units), money(l.cost), money(l.units * l.cost)]).concat([["**Total**", num(totalUnits), "", money(totalCost)]]) },
        { kind: "p", text: `The company sells **${sold} units**. Prices have been rising.` },
        { kind: "table", head: ["Method", "Assumes the units sold are", "COGS", "Ending inventory", "Gross profit effect"], rows: [
          ["FIFO", "The oldest (first in, first out)", money(fifoCogs), money(totalCost - fifoCogs), "Highest profit when prices rise"],
          ["Weighted average", `All at the average cost, ${money(totalCost / totalUnits, 2)}`, money(avgCogs, 1), money(totalCost - avgCogs, 1), "In between"],
          ["LIFO", "The newest (last in, first out)", money(lifoCogs), money(totalCost - lifoCogs), "Lowest profit and tax when prices rise"],
        ] },
        { kind: "p", text: "Total cost is the same under every method: only the split between COGS (this year's expense) and ending inventory (an asset carried to next year) changes. In rising prices FIFO shows a more current balance sheet but stale COGS; LIFO shows current COGS but a stale balance sheet." },
        { kind: "callout", tone: "warning", title: "LIFO is not allowed under IFRS or Ind AS", text: [
          "LIFO is permitted only under US GAAP, where companies like it because it lowers taxable profit when prices rise. Indian, European and most other companies use FIFO or weighted average. US filers using LIFO must disclose a **LIFO reserve** (the difference from FIFO), which lets analysts restate them to FIFO for comparison: add the reserve to inventory, and add the change in the reserve to COGS-based profit.",
        ] },
      ],
    },
    {
      id: "analyst",
      title: "Thinking like an analyst",
      blocks: [
        { kind: "list", items: [
          "**Check useful lives against peers.** If one company depreciates trucks over 12 years and peers use 8, its profits are flattered. Depreciation ÷ gross PP&E gives an implied average life.",
          "**Watch for changes in estimates.** A company that extends useful lives in a bad year is managing earnings.",
          "**Use EBITDA carefully.** EBITDA strips out depreciation, which avoids method differences but also ignores the very real cost of replacing assets. For capital-heavy firms, compare EBITDA − capex.",
          "**Inventory write-downs.** Inventory is carried at the lower of cost and net realisable value. A sudden write-down often signals obsolete stock or falling prices, as in electronics or fashion.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Depreciation reflects the asset's wear and tear.", practice: "Lives are management estimates, often set by policy and tax convenience. Two companies' depreciation charges are rarely comparable without adjustment." },
    { theory: "Choose FIFO or LIFO and apply it.", practice: "Most companies use weighted average or FIFO with standard costing; the real analyst work is spotting write-downs and obsolescence, not the method." },
    { theory: "Depreciation has no cash effect.", practice: "It saves tax, which is cash. And capex to replace assets is very real cash, which is why credit analysts focus on EBITDA minus maintenance capex." },
  ],
  mistakes: [
    "Applying the DDB rate to cost minus salvage. It is applied to the opening book value; salvage only sets the floor.",
    "Thinking the depreciation method changes total expense over the asset's life. It only changes timing.",
    "Forgetting that under rising prices LIFO gives higher COGS, lower profit and lower tax.",
    "Comparing a LIFO company with a FIFO company without using the LIFO reserve.",
  ],
  interview: [
    { q: "Why would a company prefer accelerated depreciation for tax?", a: "It defers tax. More depreciation early means lower taxable income and lower tax now; the tax is paid later. With the time value of money, deferring tax is worth real money." },
    { q: "Prices are rising. Which inventory method gives the highest net income?", a: "FIFO, because the older, cheaper units go to cost of goods sold. LIFO gives the lowest income and the lowest tax." },
  ],
  quiz: [
    { q: "Asset cost $50,000, salvage $5,000, life 9 years. Straight-line depreciation is:", options: ["$5,000", "$5,556", "$6,000", "$11,111"], answer: 0, why: "(50,000 − 5,000) ÷ 9 = $5,000." },
    { q: "Under rising prices, LIFO compared with FIFO gives:", options: ["Higher COGS and higher inventory", "Higher COGS and lower inventory", "Lower COGS and higher inventory", "The same COGS"], answer: 1, why: "LIFO expenses the newest, most expensive units and leaves the oldest, cheapest in inventory." },
    { q: "Switching from straight-line to accelerated depreciation does what to total depreciation over the asset's life?", options: ["Increases it", "Decreases it", "Leaves it unchanged", "Depends on the tax rate"], answer: 2, why: "Total depreciation is always cost minus salvage. Only the timing changes." },
  ],
  apply: {
    problems: ["straight-line-depreciation", "double-declining-balance", "fifo-vs-lifo", "depreciation-and-cash"],
    models: [],
    cases: [],
    tools: [],
  },
  glossary: [
    { term: "Matching principle", definition: "Recognising costs in the same period as the revenue they help generate." },
    { term: "Salvage value", definition: "The expected value of an asset at the end of its useful life." },
    { term: "Double-declining balance", definition: "Accelerated depreciation at twice the straight-line rate, applied to the falling book value." },
    { term: "FIFO", definition: "First in, first out: the oldest inventory costs are expensed first." },
    { term: "LIFO", definition: "Last in, first out: the newest inventory costs are expensed first. Allowed under US GAAP only." },
    { term: "LIFO reserve", definition: "The difference between inventory at FIFO and at LIFO, disclosed by LIFO users." },
    { term: "Deferred tax liability", definition: "Tax that will be payable in future because taxable profit has so far been lower than book profit." },
  ],
};

// ---------- Ratio analysis ----------

const fin: Statements = {
  revenue: 2000, cogs: 1200, opex: 400, da: 80, interestExpense: 40, taxExpense: 70, netIncome: 210,
  cash: 150, receivables: 250, inventory: 300, currentAssets: 750, totalAssets: 1750,
  payables: 200, currentLiabilities: 380, totalDebt: 500, totalEquity: 900, retainedEarnings: 600,
  cfo: 260, capex: 110, sharePrice: 42, sharesOutstanding: 100,
};
const groups = computeRatios(fin);
const r = (name: string) => groups.flatMap((g) => g.items).find((i) => i.name === name)!.value;
const dp = dupont(fin);

export const ratioAnalysis: Lesson = {
  slug: "ratio-analysis",
  title: "Ratio analysis: reading a company in ten numbers",
  summary: "Profitability, efficiency, liquidity, leverage and valuation ratios, the DuPont breakdown of ROE, and how analysts use ratios to ask better questions.",
  module: "accounting",
  level: "Core",
  prerequisites: ["three-financial-statements", "working-capital"],
  outcomes: [
    "Compute and interpret the core ratios in five families: profitability, efficiency, liquidity, leverage and valuation.",
    "Decompose return on equity with DuPont to see whether it comes from margins, turnover or leverage.",
    "Compare companies sensibly: same industry, same definitions, trends over time.",
    "Use ratios the way lenders and equity analysts do, as a list of questions rather than answers.",
  ],
  hook: [
    "Two companies both report a 20% return on equity. One earns it with high margins and little debt. The other earns thin margins and borrows five times its equity. One is a fortress; the other is one bad year from trouble. A single ratio can't tell them apart. A handful of ratios, read together, can.",
  ],
  sections: [
    {
      id: "families",
      title: "The five families",
      blocks: [
        { kind: "p", text: `Here is one company: revenue ${money(fin.revenue)}, net income ${money(fin.netIncome)}, total assets ${money(fin.totalAssets)}, equity ${money(fin.totalEquity)}, debt ${money(fin.totalDebt)}, cash ${money(fin.cash)}, share price $${fin.sharePrice} on ${fin.sharesOutstanding} shares. All ratios below are computed by the same code as the Basis ratio tool.` },
        { kind: "table", head: ["Family", "Ratio", "Formula", "Value", "What it asks"], rows: [
          ["Profitability", "Gross margin", "(Revenue − COGS) / Revenue", pct(r("Gross margin"), 1), "Pricing power and production cost"],
          ["", "EBITDA margin", "EBITDA / Revenue", pct(r("EBITDA margin"), 1), "Operating profitability before capital intensity"],
          ["", "Net margin", "Net income / Revenue", pct(r("Net margin"), 1), "What reaches shareholders"],
          ["", "Return on equity", "Net income / Equity", pct(r("Return on equity"), 1), "Return on shareholders' money"],
          ["Efficiency", "Asset turnover", "Revenue / Total assets", `${num(r("Asset turnover"), 2)}x`, "How hard the assets work"],
          ["", "Cash conversion cycle", "DSO + DIO − DPO", `${num(r("Cash conversion cycle"), 0)} days`, "Cash tied up in operations"],
          ["Liquidity", "Current ratio", "Current assets / Current liabilities", `${num(r("Current ratio"), 2)}x`, "Can it pay bills due within a year?"],
          ["", "Quick ratio", "(CA − Inventory) / CL", `${num(r("Quick ratio"), 2)}x`, "Same, without relying on selling stock"],
          ["Leverage", "Net debt / EBITDA", "(Debt − Cash) / EBITDA", `${num(r("Net debt / EBITDA"), 2)}x`, "Years of operating profit to repay debt"],
          ["", "Interest coverage", "EBIT / Interest", `${num(r("Interest coverage"), 1)}x`, "Cushion before interest can't be paid"],
          ["Valuation", "P/E", "Market cap / Net income", `${num(r("P/E"), 1)}x`, "Price paid per unit of profit"],
          ["", "EV / EBITDA", "EV / EBITDA", `${num(r("EV / EBITDA"), 1)}x`, "Price of the whole business"],
          ["", "FCF yield", "(CFO − Capex) / Market cap", pct(r("FCF yield"), 1), "Cash return at today's price"],
        ] },
        { kind: "callout", tone: "insight", title: "A ratio is a question, not an answer", text: [
          "A current ratio of 2 is \"good\" for a manufacturer and wasteful for a supermarket. Interest coverage of 3x is comfortable for a utility with stable cash flows and dangerous for a cyclical miner. Ratios only mean something against the company's own history and against close peers.",
        ] },
      ],
    },
    {
      id: "dupont",
      title: "DuPont: where does ROE come from?",
      blocks: [
        { kind: "formula", expr: "ROE = Net margin × Asset turnover × Equity multiplier", terms: [["Net margin", "Net income / Revenue: profitability"], ["Asset turnover", "Revenue / Assets: efficiency"], ["Equity multiplier", "Assets / Equity: leverage"]] },
        { kind: "table", head: ["Driver", "Value"], rows: [
          ["Net margin", pct(dp.netMargin, 2)],
          ["× Asset turnover", `${num(dp.assetTurnover, 3)}x`],
          ["× Equity multiplier", `${num(dp.equityMultiplier, 3)}x`],
          ["= ROE", pct(dp.roe, 2)],
        ] },
        { kind: "p", text: "The decomposition shows **how** a company earns its return. Luxury brands earn ROE through margin; supermarkets through turnover; banks through leverage (an equity multiplier of 10x or more). When ROE improves, DuPont tells you whether the business got better or just borrowed more." },
        { kind: "callout", tone: "desk", title: "Why the Hyundai case asks about RoNW", text: [
          "Indian IPO prospectuses headline return on net worth. A company that pays out large dividends or buys back shares shrinks its equity, which lifts RoNW without any improvement in the business. The Hyundai Motor India case makes you check this against the balance sheet.",
        ] },
      ],
    },
    {
      id: "pitfalls",
      title: "Pitfalls that catch even professionals",
      blocks: [
        { kind: "list", items: [
          "**Mixing a flow with a stock.** Net income covers a year; equity is measured at a date. Use average equity (opening + closing ÷ 2) for ROE, especially when equity changed a lot.",
          "**Inconsistent definitions.** \"EBITDA\" in one company's report may exclude share-based pay or rent; in another it may not. Rebuild from the statements.",
          "**Negative denominators.** A company with negative equity has a meaningless ROE. A loss-making company has no P/E.",
          "**Leases.** Since IFRS 16 and Ind AS 116, most leases sit on the balance sheet as debt, which raised reported EBITDA and leverage for retailers and airlines overnight. Compare like with like across that change.",
          "**Window dressing.** Some companies pay down short-term debt just before year end to flatter liquidity ratios and borrow again in the new year.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Compute ratios from one year's statements.", practice: "Analysts look at five to ten years of trends and at quarterly data, and they care more about the direction of a ratio than its level." },
    { theory: "Standard formulas apply everywhere.", practice: "Each industry has its own key ratios: banks use NIM, CASA ratio and gross NPAs; retailers use same-store sales and sales per square foot; SaaS uses net revenue retention." },
    { theory: "High ROE means a great business.", practice: "Lenders and analysts always check whether high ROE comes from leverage, buybacks or one-off gains. ROIC (return on all capital) is harder to flatter." },
  ],
  mistakes: [
    "Calling a high current ratio good without checking whether the current assets are slow-moving inventory or doubtful receivables.",
    "Computing interest coverage with EBITDA when the lender's covenant uses EBIT, or vice versa.",
    "Comparing ratios across industries with different business models.",
    "Ignoring that a share buyback mechanically raises ROE and EPS.",
  ],
  interview: [
    { q: "ROE went from 15% to 20%. Is that good news?", a: "Maybe. I would run DuPont to see whether it came from margins or turnover (good) or from more leverage or a smaller equity base after buybacks (riskier, or neutral). I would also check ROIC, which is not affected by leverage." },
    { q: "What is the difference between ROE and ROIC?", a: "ROE is net income over equity, so it rises with leverage. ROIC is after-tax operating profit over all invested capital (debt plus equity), so it measures how well the business itself uses capital, regardless of how it is financed." },
  ],
  quiz: [
    { q: "Net margin 5%, asset turnover 2x, equity multiplier 3x. ROE is:", options: ["10%", "15%", "30%", "60%"], answer: 2, why: "5% × 2 × 3 = 30%." },
    { q: "Which change raises ROE without improving the business?", options: ["Higher gross margin", "Faster inventory turnover", "Borrowing to buy back shares", "Lower operating costs"], answer: 2, why: "Buying back shares with debt raises the equity multiplier, lifting ROE, but adds financial risk." },
    { q: "The quick ratio excludes which item from current assets?", options: ["Cash", "Receivables", "Inventory", "Marketable securities"], answer: 2, why: "Inventory may take time to sell, so the quick ratio leaves it out." },
  ],
  apply: {
    problems: ["gross-margin", "leverage-and-coverage", "debt-service-coverage"],
    models: [],
    cases: [{ slug: "hyundai-motor-india-ipo-2024", parts: ["ronw-average", "ebitda-rebuild"] }, { slug: "apple-dcf-fy2025", parts: ["op-margin"] }],
    tools: ["ratios"],
  },
  glossary: [
    { term: "Return on equity (ROE)", definition: "Net income ÷ shareholders' equity." },
    { term: "ROIC", definition: "Return on invested capital: after-tax operating profit ÷ (debt + equity), independent of financing." },
    { term: "DuPont analysis", definition: "Splitting ROE into net margin × asset turnover × equity multiplier." },
    { term: "Current ratio", definition: "Current assets ÷ current liabilities: a measure of short-term liquidity." },
    { term: "Interest coverage", definition: "EBIT ÷ interest expense: how many times operating profit covers interest." },
    { term: "Return on net worth (RoNW)", definition: "The term Indian filings use for return on equity." },
  ],
};
