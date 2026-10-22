// Apple Inc.: a DCF on the fiscal 2025 Form 10-K. Reported figures come from the filing's XBRL data
// (SEC company facts API), cited by accession number and XBRL element. The forecast assumptions are
// Basis's, labelled hypothetical, and never change the reported history.
import { Layout } from "@/lib/models/layout";
import { Casebook } from "../book";
import type { CaseStudy } from "../types";

const TENK = "aapl-10k-fy2025";
const FY25 = "Fiscal 2025 (year ended September 27, 2025)";
const AT_FY25 = "As at September 27, 2025";

export function appleDcf(): CaseStudy {
  const b = new Casebook([
    {
      id: TENK,
      title: "Apple Inc. Form 10-K for the fiscal year ended September 27, 2025",
      issuer: "Apple Inc.",
      publisher: "SEC EDGAR",
      url: "https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm",
      dated: "2025-10-31",
      ref: "Accession 0000320193-25-000079",
      dataUrl: "https://data.sec.gov/api/xbrl/companyfacts/CIK0000320193.json",
      locatorNote: "Figures are cited by the XBRL element tagged in this filing. Labels are the XBRL element labels; values are in US$ million except shares.",
    },
  ]);
  const is = { source: TENK, period: FY25, section: "Income statement (XBRL)" };
  const bs = { source: TENK, period: AT_FY25, section: "Balance sheet (XBRL)" };
  const cf = { source: TENK, period: FY25, section: "Cash flow statement (XBRL)" };

  b.fig("rev", { ...is, value: 416161, unit: "USD million", label: "Revenue from Contract with Customer, Excluding Assessed Tax", xbrl: "us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax" });
  b.fig("cogs", { ...is, value: 220960, unit: "USD million", label: "Cost of Goods and Services Sold", xbrl: "us-gaap:CostOfGoodsAndServicesSold" });
  b.fig("rd", { ...is, value: 34550, unit: "USD million", label: "Research and Development Expense", xbrl: "us-gaap:ResearchAndDevelopmentExpense" });
  b.fig("sga", { ...is, value: 27601, unit: "USD million", label: "Selling, General and Administrative Expense", xbrl: "us-gaap:SellingGeneralAndAdministrativeExpense" });
  b.fig("ebit", { ...is, value: 133050, unit: "USD million", label: "Operating Income (Loss)", xbrl: "us-gaap:OperatingIncomeLoss" });
  b.fig("pbt", { ...is, value: 132729, unit: "USD million", label: "Income (Loss) from Continuing Operations before Income Taxes", xbrl: "us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest" });
  b.fig("tax", { ...is, value: 20719, unit: "USD million", label: "Income Tax Expense (Benefit)", xbrl: "us-gaap:IncomeTaxExpenseBenefit" });
  b.fig("ni", { ...is, value: 112010, unit: "USD million", label: "Net Income (Loss)", xbrl: "us-gaap:NetIncomeLoss" });

  b.fig("da", { ...cf, value: 11698, unit: "USD million", label: "Depreciation, Depletion and Amortization", xbrl: "us-gaap:DepreciationDepletionAndAmortization" });
  b.fig("sbc", { ...cf, value: 12863, unit: "USD million", label: "Share-based Payment Arrangement, Noncash Expense", xbrl: "us-gaap:ShareBasedCompensation" });
  b.fig("otherNoncash", { ...cf, value: 89, unit: "USD million", label: "Other Noncash Income (Expense)", xbrl: "us-gaap:OtherNoncashIncomeExpense" });
  b.fig("dAR", { ...cf, value: 6682, unit: "USD million", label: "Increase (Decrease) in Accounts Receivable", xbrl: "us-gaap:IncreaseDecreaseInAccountsReceivable" });
  b.fig("dOtherRec", { ...cf, value: 347, unit: "USD million", label: "Increase (Decrease) in Other Receivables", xbrl: "us-gaap:IncreaseDecreaseInOtherReceivables" });
  b.fig("dInv", { ...cf, value: -1400, unit: "USD million", label: "Increase (Decrease) in Inventories", xbrl: "us-gaap:IncreaseDecreaseInInventories" });
  b.fig("dOtherAssets", { ...cf, value: 9197, unit: "USD million", label: "Increase (Decrease) in Other Operating Assets", xbrl: "us-gaap:IncreaseDecreaseInOtherOperatingAssets" });
  b.fig("dAP", { ...cf, value: 902, unit: "USD million", label: "Increase (Decrease) in Accounts Payable", xbrl: "us-gaap:IncreaseDecreaseInAccountsPayable" });
  b.fig("dOtherLiab", { ...cf, value: -11076, unit: "USD million", label: "Increase (Decrease) in Other Operating Liabilities", xbrl: "us-gaap:IncreaseDecreaseInOtherOperatingLiabilities" });
  b.fig("cfo", { ...cf, value: 111482, unit: "USD million", label: "Net Cash Provided by (Used in) Operating Activities", xbrl: "us-gaap:NetCashProvidedByUsedInOperatingActivities" });
  b.fig("capex", { ...cf, value: 12715, unit: "USD million", label: "Payments to Acquire Property, Plant, and Equipment", xbrl: "us-gaap:PaymentsToAcquirePropertyPlantAndEquipment" });

  b.fig("cash", { ...bs, value: 35934, unit: "USD million", label: "Cash and Cash Equivalents, at Carrying Value", xbrl: "us-gaap:CashAndCashEquivalentsAtCarryingValue" });
  b.fig("msCur", { ...bs, value: 18763, unit: "USD million", label: "Marketable Securities, Current", xbrl: "us-gaap:MarketableSecuritiesCurrent" });
  b.fig("msNon", { ...bs, value: 77723, unit: "USD million", label: "Marketable Securities, Noncurrent", xbrl: "us-gaap:MarketableSecuritiesNoncurrent" });
  b.fig("cp", { ...bs, value: 7979, unit: "USD million", label: "Commercial Paper", xbrl: "us-gaap:CommercialPaper" });
  b.fig("debtCur", { ...bs, value: 12350, unit: "USD million", label: "Long-term Debt, Current Maturities", xbrl: "us-gaap:LongTermDebtCurrent" });
  b.fig("debtNon", { ...bs, value: 78328, unit: "USD million", label: "Long-term Debt, Excluding Current Maturities", xbrl: "us-gaap:LongTermDebtNoncurrent" });
  b.fig("dilShares", { ...is, value: 15004.697, unit: "shares", label: "Weighted Average Number of Shares Outstanding, Diluted (millions)", xbrl: "us-gaap:WeightedAverageNumberOfDilutedSharesOutstanding" });
  b.fig("sharesOut", { source: TENK, value: 14776.353, unit: "shares", label: "Entity Common Stock, Shares Outstanding (millions), as of October 17, 2025", period: "As of October 17, 2025 (cover page)", section: "Cover page (dei)", xbrl: "dei:EntityCommonStockSharesOutstanding" });

  // Basis assumptions for the forecast
  const why = "A Basis assumption for this exercise, not a forecast by Apple or Basis.";
  b.assume("g1", { value: 0.06, unit: "%", label: "Revenue growth, year 1", why });
  b.assume("g2", { value: 0.06, unit: "%", label: "Revenue growth, year 2", why });
  b.assume("g3", { value: 0.05, unit: "%", label: "Revenue growth, year 3", why });
  b.assume("g4", { value: 0.05, unit: "%", label: "Revenue growth, year 4", why });
  b.assume("g5", { value: 0.04, unit: "%", label: "Revenue growth, year 5", why });
  b.assume("wacc", { value: 0.085, unit: "%", label: "WACC", why });
  b.assume("tg", { value: 0.03, unit: "%", label: "Terminal growth", why });
  b.assume("nwc", { value: 0, unit: "%", label: "Increase in net working capital, % of the change in revenue", why: "Held at zero to keep the exercise on the main drivers. Apple's reported working capital moves a lot year to year (part 2)." });

  const v = (id: string) => b.v(id);
  const wcCash = -v("dAR") - v("dOtherRec") - v("dInv") - v("dOtherAssets") + v("dAP") + v("dOtherLiab");
  b.check("Revenue − cost of sales − R&D − SG&A = operating income", v("rev") - v("cogs") - v("rd") - v("sga"), v("ebit"), 0);
  b.check("Pre-tax income − tax = net income", v("pbt") - v("tax"), v("ni"), 0);
  b.check("Operating cash flow rebuilds: net income + D&A + SBC − other non-cash + working capital", v("ni") + v("da") + v("sbc") - v("otherNoncash") + wcCash, v("cfo"), 0);

  const margin = v("ebit") / v("rev");
  const t = v("tax") / v("pbt");
  const nopat = v("ebit") * (1 - t);
  const ufcf = nopat + v("da") - v("capex") + wcCash;
  const netCash = v("cash") + v("msCur") + v("msNon") - v("cp") - v("debtCur") - v("debtNon");
  const daPct = v("da") / v("rev"), capexPct = v("capex") / v("rev");
  const growth = ["g1", "g2", "g3", "g4", "g5"].map(v);
  const wacc = v("wacc"), tg = v("tg");
  v("nwc");
  const revs: number[] = [];
  let r = v("rev");
  for (const g of growth) { r *= 1 + g; revs.push(r); }
  const flows = revs.map((x) => x * margin * (1 - t) + x * daPct - x * capexPct);
  const pvFlows = flows.reduce((s, f, i) => s + f / Math.pow(1 + wacc, i + 1), 0);
  const tv = (flows[4] * (1 + tg)) / (wacc - tg);
  const pvTv = tv / Math.pow(1 + wacc, 5);
  const ev = pvFlows + pvTv;
  const equity = ev + netCash;
  const perShare = equity / v("sharesOut");
  const tvShare = (pvTv / ev) * 100;

  const cols = ["C", "D", "E", "F", "G"];
  const L = new Layout(42, 7, [300, 110, 100, 100, 100, 100, 100]);
  L.head("A1", "Apple Inc. DCF (US$ million unless stated)")
    .head("A2", "Reported, fiscal 2025 Form 10-K")
    .label("A3", "Revenue").input("B3", b.xl(v("rev")), "n0")
    .label("A4", "Operating income").input("B4", b.xl(v("ebit")), "n0")
    .label("A5", "Income before taxes").input("B5", b.xl(v("pbt")), "n0")
    .label("A6", "Income tax expense").input("B6", b.xl(v("tax")), "n0")
    .label("A7", "Depreciation and amortization").input("B7", b.xl(v("da")), "n0")
    .label("A8", "Capital expenditure").input("B8", b.xl(v("capex")), "n0")
    .label("A9", "Cash and cash equivalents").input("B9", b.xl(v("cash")), "n0")
    .label("A10", "Marketable securities, current").input("B10", b.xl(v("msCur")), "n0")
    .label("A11", "Marketable securities, non-current").input("B11", b.xl(v("msNon")), "n0")
    .label("A12", "Commercial paper").input("B12", b.xl(v("cp")), "n0")
    .label("A13", "Term debt, current").input("B13", b.xl(v("debtCur")), "n0")
    .label("A14", "Term debt, non-current").input("B14", b.xl(v("debtNon")), "n0")
    .label("A15", "Shares outstanding, cover page (millions)").input("B15", b.xl(v("sharesOut")), "n1")
    .head("A17", "Basis assumptions (hypothetical)")
    .label("A18", "Revenue growth").input("C18", b.xl(growth[0]), "pct1").input("D18", b.xl(growth[1]), "pct1").input("E18", b.xl(growth[2]), "pct1").input("F18", b.xl(growth[3]), "pct1").input("G18", b.xl(growth[4]), "pct1")
    .label("A19", "WACC").input("B19", b.xl(wacc), "pct2")
    .label("A20", "Terminal growth").input("B20", b.xl(tg), "pct2")
    .head("A22", "Ratios held from fiscal 2025")
    .label("A23", "Operating margin").calc("B23", "=B4/B3", "pct2")
    .label("A24", "Effective tax rate").calc("B24", "=B6/B5", "pct2")
    .label("A25", "D&A, % of revenue").calc("B25", "=B7/B3", "pct2")
    .label("A26", "Capex, % of revenue").calc("B26", "=B8/B3", "pct2")
    .head("A28", "Forecast").head("B28", "FY2025").head("C28", "Year 1").head("D28", "Year 2").head("E28", "Year 3").head("F28", "Year 4").head("G28", "Year 5")
    .label("A29", "Revenue").given("B29", "=B3", "n0")
    .calcRow(29, "C", "G", "={p}29*(1+{c}18)", "n0")
    .label("A30", "NOPAT").calcRow(30, "C", "G", "={c}29*$B$23*(1-$B$24)", "n0")
    .label("A31", "+ D&A").calcRow(31, "C", "G", "={c}29*$B$25", "n0")
    .label("A32", "− Capex").calcRow(32, "C", "G", "={c}29*$B$26", "n0")
    .label("A33", "Unlevered free cash flow").calcRow(33, "C", "G", "={c}30+{c}31-{c}32", "n0")
    .head("A35", "Valuation")
    .label("A36", "PV of forecast cash flows").calc("B36", "=NPV(B19,C33:G33)", "n0")
    .label("A37", "PV of terminal value").calc("B37", "=G33*(1+B20)/(B19-B20)/(1+B19)^5", "n0")
    .label("A38", "Enterprise value").calc("B38", "=B36+B37", "n0")
    .label("A39", "Net cash").calc("B39", "=SUM(B9:B11)-SUM(B12:B14)", "n0")
    .label("A40", "Equity value").calc("B40", "=B38+B39", "n0")
    .label("A41", "Value per share (US$)").calc("B41", "=B40/B15", "n2")
    .label("A42", "Terminal value, % of EV").calc("B42", "=B37/B38", "pct1");
  L.grade("B23", "Operating margin", 1)
    .grade("B24", "Effective tax rate", 1)
    .grade("C33", "Free cash flow, year 1", 2)
    .grade("G33", "Free cash flow, year 5", 2)
    .grade("B36", "PV of forecast cash flows", 2, { requires: [["NPV", "SUMPRODUCT", "XNPV"]] })
    .grade("B37", "PV of terminal value", 3)
    .grade("B39", "Net cash", 2)
    .grade("B41", "Value per share", 3)
    .grade("B42", "Terminal value share of EV", 1);
  const model = L.build({
    shocks: [
      { label: "WACC is a point higher", set: { B19: wacc + 0.01 } },
      { label: "terminal growth is half a point lower", set: { B20: tg - 0.005 } },
      { label: "year 1 growth is two points higher", set: { C18: growth[0] + 0.02 } },
      { label: `fiscal 2025 capex is US$${b.n(5000, 0)} million higher`, set: { B8: v("capex") + 5000 } },
    ],
    brief: ["Reported inputs are the fiscal 2025 Form 10-K figures from the exhibits. The growth path, WACC and terminal growth are Basis assumptions, shown in their own block. Build the model so every output flows from those inputs."],
    steps: [
      "Compute the fiscal 2025 ratios you'll hold flat: operating margin, effective tax rate, and D&A and capex as a share of revenue.",
      "Grow revenue by each year's rate, then build unlevered free cash flow: NOPAT + D&A − capex (working capital is held flat by assumption).",
      "Discount the five cash flows at WACC with NPV, and the Gordon growth terminal value from the year 5 cash flow.",
      "Bridge to equity with net cash (cash and marketable securities less commercial paper and term debt) and divide by the cover-page share count.",
    ],
    solution: [
      "**End-of-year discounting.** `=NPV(B19,C33:G33)` discounts the first value by one period, which is right here because C33 is a full year away. The terminal value sits at the end of year 5, so it is discounted by `(1+B19)^5`.",
      "**Terminal value.** `=G33*(1+B20)/(B19-B20)` values every cash flow after year 5, growing at B20 forever. It is most of the answer, which is why the checker flexes B19 and B20.",
      "**Net cash.** Apple's marketable securities are investments it can sell; counting the non-current ones as cash is the usual convention for a cash-rich company, but say so when you present the number.",
      "**Shares.** Use the latest count (cover page), not the fiscal-year weighted average: Apple buys back shares every quarter, so the average overstates today's count.",
    ],
  });

  const ex = (label: string, id: string, dp = 0) => ({ label, cells: [b.cell(id, dp)] });
  const assumptionsRow = (label: string, id: string) => ({ label, cells: [{ text: b.pct(v(id), 1) }] });

  return b.build({
    slug: "apple-dcf-fy2025",
    title: "Apple (fiscal 2025): DCF from the 10-K",
    company: "Apple Inc.",
    kind: "real-data hypothetical",
    track: "Valuation",
    difficulty: "Hard",
    minutes: 90,
    topics: ["DCF", "Free cash flow", "Net cash", "Terminal value", "Share count"],
    summary: "Take Apple's fiscal 2025 10-K, build unlevered free cash flow and net cash from the filing, then value the company with a five-year DCF under stated assumptions.",
    brief: [
      `Apple's fiscal 2025 ended on September 27, 2025, and its Form 10-K was filed on October 31, 2025. Reported figures below are the filing's own XBRL data in US$ million, each linked to its XBRL element.`,
      "This is a **real-data hypothetical**: the history is exactly as reported, and the forecast assumptions (growth, WACC, terminal growth) are Basis's, shown separately. The answer is not a price target.",
      "Parts are graded on their own against the reported figures and the stated assumptions.",
    ],
    exhibits: [
      {
        key: "is", title: "Exhibit 1. Income statement, fiscal 2025 (US$ million)", note: "XBRL elements from the fiscal 2025 Form 10-K.",
        head: ["", "Fiscal 2025"],
        rows: [ex("Revenue", "rev"), ex("Cost of sales", "cogs"), ex("Research and development", "rd"), ex("Selling, general and administrative", "sga"), ex("Operating income", "ebit"), ex("Income before income taxes", "pbt"), ex("Income tax expense", "tax"), ex("Net income", "ni")],
      },
      {
        key: "cf", title: "Exhibit 2. Cash flow items, fiscal 2025 (US$ million)", note: "Changes in operating assets and liabilities are as tagged: a positive change in an asset is a use of cash.",
        head: ["", "Fiscal 2025"],
        rows: [
          ex("Depreciation and amortization", "da"), ex("Share-based compensation expense", "sbc"), ex("Other non-cash income (expense)", "otherNoncash"),
          ex("Increase in accounts receivable", "dAR"), ex("Increase in other receivables", "dOtherRec"), ex("Increase (decrease) in inventories", "dInv"),
          ex("Increase in other operating assets", "dOtherAssets"), ex("Increase in accounts payable", "dAP"), ex("Increase (decrease) in other operating liabilities", "dOtherLiab"),
          ex("Cash generated by operating activities", "cfo"), ex("Payments for property, plant and equipment", "capex"),
        ],
      },
      {
        key: "bs", title: "Exhibit 3. Balance sheet items and shares", note: "Balance sheet at September 27, 2025 in US$ million; shares in millions.",
        head: ["", "As reported"],
        rows: [
          ex("Cash and cash equivalents", "cash"), ex("Marketable securities, current", "msCur"), ex("Marketable securities, non-current", "msNon"),
          ex("Commercial paper", "cp"), ex("Term debt, current", "debtCur"), ex("Term debt, non-current", "debtNon"),
          ex("Diluted weighted average shares, fiscal 2025 (millions)", "dilShares", 3), ex("Shares outstanding at October 17, 2025 (millions)", "sharesOut", 3),
        ],
      },
      {
        key: "assumptions", title: "Exhibit 4. Basis assumptions (hypothetical)", note: "Not forecasts by Apple or by Basis. Change them in the model to see how much they matter.",
        head: ["", "Assumption"],
        rows: [
          assumptionsRow("Revenue growth, year 1", "g1"), assumptionsRow("Revenue growth, year 2", "g2"), assumptionsRow("Revenue growth, year 3", "g3"),
          assumptionsRow("Revenue growth, year 4", "g4"), assumptionsRow("Revenue growth, year 5", "g5"),
          { label: "WACC", cells: [{ text: b.pct(wacc, 2) }] }, { label: "Terminal growth", cells: [{ text: b.pct(tg, 2) }] },
          { label: "Increase in net working capital", cells: [{ text: "Held at zero" }] },
        ],
      },
    ],
    parts: [
      {
        key: "op-margin", kind: "numeric", title: "Operating margin", points: 6, skills: ["Financial statement analysis"],
        prompt: ["What was Apple's operating margin in fiscal 2025? Answer in percent to two decimal places."],
        answer: margin * 100, unit: "%", tol: { abs: 0.01 },
        solution: {
          idea: [
            "Operating margin is the share of each dollar of revenue left after the costs of running the business (cost of sales and operating expenses), before interest and tax. It is the main driver of a DCF: the forecast mostly applies it to future revenue.",
            "Check the statement ties before you use it: revenue less each cost line should give the reported operating income.",
          ],
          formulas: [{ expr: "Operating margin = Operating income ÷ Revenue", terms: [["Operating income", "revenue − cost of sales − R&D − SG&A"], ["Revenue", "total net revenue for the year"]] }],
          steps: [
            b.p(`Tie-out: ${b.show("rev", 0)} − ${b.show("cogs", 0)} − ${b.show("rd", 0)} − ${b.show("sga", 0)} = ${b.n(v("rev") - v("cogs") - v("rd") - v("sga"), 0)}, the reported operating income.`),
            b.p(`Operating margin = ${b.show("ebit", 0)} ÷ ${b.show("rev", 0)} = **${b.n(margin * 100)}%**.`),
          ],
          meaning: [
            `Close to a third of revenue becomes operating profit, very high for a company that sells mostly hardware. It reflects pricing power and a growing, higher-margin services business. Holding it flat in the forecast is itself a judgment: a mix shift toward services would raise it.`,
          ],
          mistakes: [
            `Using net income gives a net margin of ${b.pct(v("ni") / v("rev"))}, which mixes in tax and non-operating items.`,
            `Using gross profit gives ${b.pct((v("rev") - v("cogs")) / v("rev"))}, before R&D and SG&A.`,
          ],
          excel: [`\`=${b.xl(v("ebit"))}/${b.xl(v("rev"))}\`, formatted as a percentage.`],
        },
      },
      {
        key: "ufcf-fy2025", kind: "numeric", title: "Unlevered free cash flow, fiscal 2025", points: 12, skills: ["Free cash flow build", "Working capital"],
        prompt: [
          "Build Apple's fiscal 2025 unlevered free cash flow: operating income taxed at the effective tax rate (income tax expense ÷ income before taxes), plus depreciation and amortization, less capital expenditure, plus the cash effect of the changes in operating assets and liabilities in Exhibit 2.",
          "Treat share-based compensation as a real expense (don't add it back). Answer in US$ million to the nearest million.",
        ],
        answer: ufcf, unit: "US$ million", tol: { abs: 1 },
        solution: {
          idea: [
            "**Unlevered** free cash flow is the cash the operations generate for all capital providers, before any interest is paid. It is what a DCF discounts at WACC.",
            "Start from operating income, take tax as if the company had no debt (NOPAT), add back the non-cash D&A, subtract the investment the business needs (capex) and the cash tied up in working capital.",
            "The working capital lines are where people go wrong. In XBRL, a positive change in an **asset** means the asset grew, which uses cash; a positive change in a **liability** means it grew, which provides cash.",
          ],
          formulas: [
            { expr: "t = Income tax expense ÷ Income before taxes", terms: [["t", "effective tax rate for the year"]] },
            { expr: "UFCF = EBIT × (1 − t) + D&A − Capex + ΔWC cash", terms: [["EBIT", "operating income"], ["D&A", "depreciation and amortization, non-cash"], ["Capex", "payments for property, plant and equipment"], ["ΔWC cash", "− increases in operating assets + increases in operating liabilities"]] },
          ],
          steps: [
            b.p(`Effective tax rate t = ${b.show("tax", 0)} ÷ ${b.show("pbt", 0)} = ${b.pct(t)}.`),
            b.p(`NOPAT = ${b.show("ebit", 0)} × (1 − ${b.n(t, 4)}) = ${b.n(nopat, 0)}.`),
            b.table(["Working capital line", "Tagged change", "Cash effect"], [
              ["Accounts receivable", b.show("dAR", 0), b.n(-v("dAR"), 0)],
              ["Other receivables", b.show("dOtherRec", 0), b.n(-v("dOtherRec"), 0)],
              ["Inventories", b.show("dInv", 0), b.n(-v("dInv"), 0)],
              ["Other operating assets", b.show("dOtherAssets", 0), b.n(-v("dOtherAssets"), 0)],
              ["Accounts payable", b.show("dAP", 0), b.n(v("dAP"), 0)],
              ["Other operating liabilities", b.show("dOtherLiab", 0), b.n(v("dOtherLiab"), 0)],
              ["**Total**", "", `**${b.n(wcCash, 0)}**`],
            ]),
            b.p(`Cross-check: ${b.show("ni", 0)} + ${b.show("da", 0)} + ${b.show("sbc", 0)} − ${b.show("otherNoncash", 0)} + (${b.n(wcCash, 0)}) = ${b.n(v("ni") + v("da") + v("sbc") - v("otherNoncash") + wcCash, 0)}, the reported operating cash flow. The working capital signs are right.`),
            b.p(`UFCF = ${b.n(nopat, 0)} + ${b.show("da", 0)} − ${b.show("capex", 0)} + (${b.n(wcCash, 0)}) = **US$${b.n(ufcf, 0)} million**.`),
          ],
          meaning: [
            `Working capital absorbed US$${b.n(-wcCash, 0)} million of cash this year, so UFCF is well below NOPAT. One year's swing is not a trend: that is why the forecast holds working capital flat rather than repeating it.`,
            `Apple's capex is small relative to its profit (${b.pct(capexPct)} of revenue), so free cash flow tracks NOPAT closely in a normal year.`,
          ],
          mistakes: [
            `Adding back share-based compensation gives ${b.n(ufcf + v("sbc"), 0)}. SBC is paid in shares rather than cash, but it is a real cost to shareholders. If you add it back, you must count the extra shares it creates.`,
            `Flipping the working capital signs (adding asset increases) gives ${b.n(nopat + v("da") - v("capex") - wcCash, 0)}.`,
            `Ignoring working capital gives ${b.n(nopat + v("da") - v("capex"), 0)}.`,
          ],
          excel: [`\`=${b.xl(v("ebit"))}*(1-${b.xl(v("tax"))}/${b.xl(v("pbt"))})+${b.xl(v("da"))}-${b.xl(v("capex"))}+(-${b.xl(v("dAR"))}-${b.xl(v("dOtherRec"))}+${b.xl(-v("dInv"))}-${b.xl(v("dOtherAssets"))}+${b.xl(v("dAP"))}${b.xl(v("dOtherLiab"))})\``],
        },
      },
      {
        key: "net-cash", kind: "numeric", title: "Net cash at year end", points: 8, skills: ["EV to equity bridge"],
        prompt: ["Compute Apple's net cash at September 27, 2025: cash and cash equivalents plus current and non-current marketable securities, less commercial paper and current and non-current term debt. Answer in US$ million (negative if net debt)."],
        answer: netCash, unit: "US$ million", tol: { abs: 0.5 },
        solution: {
          idea: [
            "A DCF values the operating business (enterprise value). To get to what the shares are worth, add what shareholders own on top (cash and investments) and subtract what ranks ahead of them (debt).",
            "Apple holds a large portfolio of marketable securities, much of it long-dated. Treating all of it as cash-like is the usual convention because it can be sold, but it is a choice you should state.",
          ],
          formulas: [{ expr: "Net cash = Cash + Marketable securities (current + non-current) − Commercial paper − Term debt (current + non-current)", terms: [["Commercial paper", "short-term unsecured borrowing"], ["Term debt", "bonds and notes"]] }],
          steps: [
            b.table(["Item", "US$ million"], [
              ["Cash and cash equivalents", b.show("cash", 0)], ["+ Marketable securities, current", b.show("msCur", 0)], ["+ Marketable securities, non-current", b.show("msNon", 0)],
              ["− Commercial paper", `(${b.show("cp", 0)})`], ["− Term debt, current", `(${b.show("debtCur", 0)})`], ["− Term debt, non-current", `(${b.show("debtNon", 0)})`],
              ["**Net cash**", `**${b.n(netCash, 0)}**`],
            ]),
          ],
          meaning: [
            `Apple has US$${b.n(netCash, 0)} million more cash and securities than debt. Some of that cash goes back to shareholders through buybacks, which is also why the share count keeps falling (Exhibit 3).`,
          ],
          mistakes: [
            `Leaving out non-current marketable securities gives ${b.n(netCash - v("msNon"), 0)}, turning net cash into net debt.`,
            `Forgetting commercial paper gives ${b.n(netCash + v("cp"), 0)}.`,
          ],
          excel: [`\`=SUM(${b.xl(v("cash"))},${b.xl(v("msCur"))},${b.xl(v("msNon"))})-SUM(${b.xl(v("cp"))},${b.xl(v("debtCur"))},${b.xl(v("debtNon"))})\``],
        },
      },
      {
        key: "sbc-treatment", kind: "choice", title: "Share-based compensation in a DCF", points: 5, skills: ["Free cash flow build", "Dilution"],
        prompt: [`Apple's cash flow statement adds back US$${b.show("sbc", 0)} million of share-based compensation (SBC) as a non-cash expense. In an unlevered DCF, which treatment is consistent?`],
        options: [
          "Add SBC back to free cash flow and use today's share count: it is non-cash, so it doesn't reduce value",
          "Leave SBC as an expense in free cash flow (don't add it back), and use today's share count",
          "Add SBC back and also deduct it from enterprise value as if it were debt",
          "Ignore SBC entirely because it is excluded from operating income",
        ],
        correct: 1,
        solution: {
          idea: [
            "SBC pays employees with shares instead of cash. The company keeps the cash, but existing shareholders are diluted, which is a real cost to them.",
            "A DCF must count the cost once. Either keep it as an expense in free cash flow (the cleaner choice), or add it back and forecast the future dilution in the share count. Adding it back and ignoring dilution overstates value.",
          ],
          formulas: [{ expr: "Value per share = Equity value ÷ Shares", terms: [["Equity value", "falls if SBC is kept as an expense"], ["Shares", "rises over time if SBC is added back and dilution is modelled"]] }],
          steps: [b.p(`SBC was ${b.pct(v("sbc") / v("rev"))} of fiscal 2025 revenue. Adding it back without modelling dilution would raise every year's free cash flow by about that share of revenue. The consistent choice here is **leave SBC as an expense and use today's share count**.`)],
          meaning: ["Analysts disagree on presentation, not on the economics: the cost has to show up somewhere. Sell-side models that add SBC back often show flattering values for that reason."],
          mistakes: ["Adding SBC back because the cash flow statement does. The cash flow statement measures cash, not value to existing shareholders.", "Claiming SBC is excluded from operating income: it is included in the expense lines."],
          excel: ["In the model, compute FCF from operating income (which already includes SBC as a cost) and don't add a separate SBC line."],
        },
      },
      {
        key: "dcf-model", kind: "model", title: "Build the five-year DCF", points: 30, skills: ["DCF", "Terminal value", "EV to equity bridge", "Excel modelling"],
        prompt: ["Build the DCF in the sheet. The checker flexes WACC, terminal growth, year 1 growth and capex, so every output must flow from the inputs."],
        model,
        solution: {
          idea: [
            "A DCF says a business is worth the cash it will generate, discounted for time and risk. Here five years are forecast explicitly and everything after year 5 is captured by a terminal value that grows at a steady rate forever.",
            "Holding fiscal 2025's margin, tax rate, D&A and capex ratios flat keeps the forecast anchored in reported numbers; the assumptions only set growth and the discount rate.",
          ],
          formulas: [
            { expr: "UFCF(t) = Revenue(t) × [m × (1 − tax) + d − c]", terms: [["m", "operating margin"], ["tax", "effective tax rate"], ["d", "D&A as a share of revenue"], ["c", "capex as a share of revenue"]] },
            { expr: "TV(5) = UFCF(5) × (1 + g) ÷ (WACC − g)", terms: [["g", "terminal growth"], ["WACC", "weighted average cost of capital"]] },
            { expr: "EV = Σ UFCF(t) ÷ (1 + WACC)^t + TV(5) ÷ (1 + WACC)^5", terms: [["t", "year 1 to 5, end-of-year convention"]] },
          ],
          steps: [
            b.table(["", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"], [
              ["Revenue", ...revs.map((x) => b.n(x, 0))],
              ["UFCF", ...flows.map((x) => b.n(x, 0))],
              ["Discount factor", ...flows.map((_, i) => b.n(1 / Math.pow(1 + wacc, i + 1), 4))],
              ["PV", ...flows.map((x, i) => b.n(x / Math.pow(1 + wacc, i + 1), 0))],
            ]),
            b.p(`PV of forecast = ${b.n(pvFlows, 0)}. Terminal value = ${b.n(flows[4], 0)} × (1 + ${b.pct(tg)}) ÷ (${b.pct(wacc)} − ${b.pct(tg)}) = ${b.n(tv, 0)}, worth ${b.n(pvTv, 0)} today.`),
            b.p(`EV = ${b.n(ev, 0)}. Equity value = EV + net cash ${b.n(netCash, 0)} = ${b.n(equity, 0)}. Per share = ${b.n(equity, 0)} ÷ ${b.show("sharesOut", 3)} = **US$${b.n(perShare)}**.`),
          ],
          meaning: [
            `The terminal value is ${b.n(tvShare, 1)}% of EV, so the answer mostly rests on WACC and terminal growth. Move WACC by a point and the value per share moves by far more than any change to year 1 growth: try it in your model.`,
            "This value is a function of Basis's assumptions, not a view on Apple's share price.",
          ],
          mistakes: [
            "Discounting the terminal value by four years instead of five, or putting it into the NPV range as a sixth cash flow without care.",
            "Subtracting net cash instead of adding it.",
            `Dividing by the fiscal-year diluted average (${b.show("dilShares", 3)} million) instead of the latest share count.`,
          ],
          excel: [`\`=NPV(${b.xl(wacc)},C33:G33)+G33*(1+${b.xl(tg)})/(${b.xl(wacc)}-${b.xl(tg)})/(1+${b.xl(wacc)})^5\` gives EV from the free cash flow row.`],
        },
      },
      {
        key: "tv-share", kind: "numeric", title: "How much rests on the terminal value", points: 6, skills: ["Terminal value", "Sensitivity"],
        prompt: ["Using the model's base assumptions, what percentage of enterprise value comes from the present value of the terminal value? Answer to one decimal place."],
        answer: tvShare, unit: "%", tol: { abs: 0.05 },
        solution: {
          idea: [
            "A DCF has two pieces: the forecast years you model in detail and the terminal value standing in for every year after. The share of value in the terminal piece tells you how much your answer depends on the least visible assumptions.",
          ],
          formulas: [{ expr: "TV share = PV(TV) ÷ EV", terms: [["PV(TV)", "terminal value discounted five years"], ["EV", "PV of forecast + PV(TV)"]] }],
          steps: [b.p(`${b.n(pvTv, 0)} ÷ ${b.n(ev, 0)} = **${b.n(tvShare, 1)}%**.`)],
          meaning: [
            `Around three quarters of the value sits beyond year 5, typical for a mature, high-margin company growing near the economy's rate. A share far above that suggests the forecast period is too short or growth too back-loaded.`,
          ],
          mistakes: [
            `Using the undiscounted terminal value gives ${b.n((tv / (pvFlows + tv)) * 100, 1)}%.`,
            "Dividing by equity value instead of EV.",
          ],
          excel: ["`=B37/B38` in the model."],
        },
      },
    ],
  });
}
