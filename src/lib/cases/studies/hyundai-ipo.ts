// Hyundai Motor India Limited: initial public offering, October 2024. A pure offer for sale.
// Every figure is from the final Prospectus filed with SEBI (dated October 17, 2024). Page numbers
// are the printed page numbers at the foot of each page (the PDF page is the printed page + 5).
import { Layout } from "@/lib/models/layout";
import { Casebook } from "../book";
import type { CaseStudy } from "../types";

const PROSPECTUS = "hmil-prospectus";
const FY24 = "Fiscal 2024 (year ended March 31, 2024)";
const FY23 = "Fiscal 2023 (year ended March 31, 2023)";
const AT_FY24 = "As at March 31, 2024";
const OFFER = "Offer, October 2024";

export function hyundaiIpo(): CaseStudy {
  const b = new Casebook([
    {
      id: PROSPECTUS,
      title: "Hyundai Motor India Limited – Prospectus dated October 17, 2024",
      issuer: "Hyundai Motor India Limited",
      publisher: "SEBI",
      url: "https://www.sebi.gov.in/sebi_data/attachdocs/oct-2024/1729225003827.pdf",
      dated: "2024-10-17",
      sha256: "f800cc182e83e7080f9f5b5a47b92abe2e270f55fac81c26d8a6afb01ee12c84",
      locatorNote: "Page numbers are the printed numbers at the foot of each page. Financial statements are in ₹ million.",
      pageOffset: 5,
    },
  ]);
  const src = { source: PROSPECTUS };

  // The offer (pages 90, 127, 403)
  b.fig("offerShares", { ...src, value: 142194700, unit: "shares", label: "Offer for Sale (Equity Shares of face value ₹ 10 each)", period: OFFER, page: 90, section: "The Offer" });
  b.fig("offerPrice", { ...src, value: 1960, unit: "INR", label: "Offer Price per Equity Share", period: OFFER, page: 403, section: "Offer Structure" });
  b.fig("floorPrice", { ...src, value: 1865, unit: "INR", label: "Floor price", period: OFFER, page: 127, section: "Basis for Offer Price – M. Weighted average cost of acquisition, floor price and cap price" });
  b.fig("empShares", { ...src, value: 778400, unit: "shares", label: "Employee Reservation Portion", period: OFFER, page: 90, section: "The Offer" });
  b.fig("empDiscount", { ...src, value: 186, unit: "INR", label: "Discount per Equity Share to Eligible Employees", period: OFFER, page: 90, section: "The Offer" });
  b.fig("empAmount", { ...src, value: 1380.88, unit: "INR million", label: "Employee Reservation Portion, aggregate amount", period: OFFER, page: 90, section: "The Offer" });
  b.fig("qibShares", { ...src, value: 70708150, unit: "shares", label: "Qualified Institutional Buyers (QIBs) Portion", period: OFFER, page: 90, section: "The Offer" });
  b.fig("anchorShares", { ...src, value: 42424890, unit: "shares", label: "Anchor Investor Portion", period: OFFER, page: 90, section: "The Offer" });
  b.fig("niiShares", { ...src, value: 21212445, unit: "shares", label: "Non-Institutional Portion", period: OFFER, page: 90, section: "The Offer" });
  b.fig("riiShares", { ...src, value: 49495705, unit: "shares", label: "Retail Portion", period: OFFER, page: 90, section: "The Offer" });
  b.fig("qibAmount", { ...src, value: 138587.97, unit: "INR million", label: "QIB Portion, aggregate amount", period: OFFER, page: 90, section: "The Offer" });
  b.fig("niiAmount", { ...src, value: 41576.39, unit: "INR million", label: "Non-Institutional Portion, aggregate amount", period: OFFER, page: 90, section: "The Offer" });
  b.fig("riiAmount", { ...src, value: 97011.58, unit: "INR million", label: "Retail Portion, aggregate amount", period: OFFER, page: 90, section: "The Offer" });
  b.fig("offerSize", { ...src, value: 278556.83, unit: "INR million", label: "Offer for Sale, aggregate amount", period: OFFER, page: 90, section: "The Offer" });
  b.fig("preShares", { ...src, value: 812541100, unit: "shares", label: "Equity Shares outstanding prior to the Offer", period: OFFER, page: 90, section: "The Offer" });
  b.fig("postShares", { ...src, value: 812541100, unit: "shares", label: "Equity Shares outstanding after the Offer", period: OFFER, page: 90, section: "The Offer" });
  b.fig("promoterPost", { ...src, value: 670346400, unit: "shares", label: "Hyundai Motor Company, post-Offer Equity Shares", period: OFFER, page: 17, section: "Summary – Aggregate pre-Offer and post-Offer Shareholding of our Promoter" });
  b.fig("promoterPostPct", { ...src, value: 82.5, unit: "%", label: "Hyundai Motor Company, % of post-Offer Equity Share capital", period: OFFER, page: 17, section: "Summary – Aggregate pre-Offer and post-Offer Shareholding of our Promoter" });
  b.fig("offerPctPost", { ...src, value: 17.5, unit: "%", label: "Offer as % of post-Offer paid-up Equity Share capital", period: OFFER, page: 403, section: "Offer Structure" });
  b.fig("netOfferPctPost", { ...src, value: 17.4, unit: "%", label: "Net Offer as % of post-Offer paid-up Equity Share capital", period: OFFER, page: 403, section: "Offer Structure" });
  b.fig("qibMaxPct", { ...src, value: 50, unit: "%", label: "QIBs: not more than 50% of the Net Offer", period: OFFER, page: 403, section: "Offer Structure" });
  b.fig("niiMinPct", { ...src, value: 15, unit: "%", label: "Non-Institutional Bidders: not less than 15% of the Net Offer", period: OFFER, page: 403, section: "Offer Structure" });
  b.fig("riiMinPct", { ...src, value: 35, unit: "%", label: "Retail Individual Bidders: not less than 35% of the Net Offer", period: OFFER, page: 403, section: "Offer Structure" });
  b.fig("offerExpenses", { ...src, value: 6241.2, unit: "INR million", label: "Total estimated Offer expenses", period: OFFER, page: 116, section: "Objects of the Offer – Offer-related Expenses" });

  // Basis for Offer Price (pages 118 to 120)
  b.fig("eps24", { ...src, value: 74.58, unit: "INR", label: "Diluted EPS", period: FY24, page: 118, section: "Basis for Offer Price – A. Basic and diluted earnings per share" });
  b.fig("pe24", { ...src, value: 26.28, unit: "x", label: "P/E at the Offer Price, based on diluted EPS for Financial Year 2024", period: FY24, page: 119, section: "Basis for Offer Price – B. P/E ratio in relation to Offer Price" });
  b.fig("peMaruti", { ...src, value: 28.84, unit: "x", label: "Maruti Suzuki India Limited – Price/earnings ratio", period: "Closing price October 16, 2024 / diluted EPS Financial Year 2024", page: 120, section: "Basis for Offer Price – F. Comparison of accounting ratios with listed industry peers" });
  b.fig("peTata", { ...src, value: 11.08, unit: "x", label: "Tata Motors Limited – Price/earnings ratio", period: "Closing price October 16, 2024 / diluted EPS Financial Year 2024", page: 120, section: "Basis for Offer Price – F. Comparison of accounting ratios with listed industry peers" });
  b.fig("peMM", { ...src, value: 30.44, unit: "x", label: "Mahindra & Mahindra Limited – Price/earnings ratio", period: "Closing price October 16, 2024 / diluted EPS Financial Year 2024", page: 120, section: "Basis for Offer Price – F. Comparison of accounting ratios with listed industry peers" });
  b.fig("peIndustryAvg", { ...src, value: 23.45, unit: "x", label: "Industry P/E ratio – Average", period: FY24, page: 119, section: "Basis for Offer Price – C. Industry P/E ratio" });
  b.fig("mcapBn", { ...src, value: 1592.58, unit: "INR billion", label: "Market capitalisation at the Offer Price (in ₹ billion)", period: OFFER, page: 120, section: "Basis for Offer Price – F. Comparison of accounting ratios with listed industry peers" });
  b.fig("ronw24", { ...src, value: 56.82, unit: "%", label: "Return On Net Worth", period: FY24, page: 119, section: "Basis for Offer Price – D. Return on Net Worth" });
  b.fig("ebitdaKpi", { ...src, value: 91326.16, unit: "INR million", label: "EBITDA (Excluding Other Income)", period: FY24, page: 121, section: "Basis for Offer Price – Key Performance Indicators" });

  // Restated consolidated financial information (pages 266 to 268)
  const pl = { ...src, period: FY24, page: 267, section: "Annexure II – Restated Consolidated Statement of Profit and Loss" };
  b.fig("revenue", { ...pl, value: 698290.57, unit: "INR million", label: "Revenue from operations" });
  b.fig("otherIncome", { ...pl, value: 14732.68, unit: "INR million", label: "Other income" });
  b.fig("totalIncome", { ...pl, value: 713023.25, unit: "INR million", label: "Total income" });
  b.fig("totalExpenses", { ...pl, value: 630624.51, unit: "INR million", label: "Total expenses" });
  b.fig("financeCosts", { ...pl, value: 1580.79, unit: "INR million", label: "Finance costs" });
  b.fig("da", { ...pl, value: 22079.31, unit: "INR million", label: "Depreciation and amortisation expense" });
  b.fig("pbt", { ...pl, value: 82398.74, unit: "INR million", label: "Profit before tax" });
  b.fig("tax", { ...pl, value: 21798.3, unit: "INR million", label: "Total tax expense" });
  b.fig("pat", { ...pl, value: 60600.44, unit: "INR million", label: "Profit for the period / year" });
  b.fig("tci", { ...pl, value: 60466.82, unit: "INR million", label: "Total comprehensive income for the period / year" });
  const bs = { ...src, period: AT_FY24, page: 266, section: "Annexure I – Restated Consolidated Statement of Assets and Liabilities" };
  b.fig("cash", { ...bs, value: 9732.15, unit: "INR million", label: "Cash and cash equivalents" });
  b.fig("bankOther", { ...bs, value: 80441.3, unit: "INR million", label: "Bank balance other than above" });
  b.fig("borrowNC", { ...bs, value: 6227.97, unit: "INR million", label: "Borrowings (non-current)" });
  b.fig("borrowC", { ...bs, value: 1451.18, unit: "INR million", label: "Borrowings (current)" });
  b.fig("equity24", { ...bs, value: 106656.57, unit: "INR million", label: "Total equity" });
  b.fig("totalAssets", { ...bs, value: 263492.45, unit: "INR million", label: "Total assets" });
  b.fig("totalLiab", { ...bs, value: 156835.88, unit: "INR million", label: "Total liabilities" });
  b.fig("equity23", { ...bs, value: 200548.18, unit: "INR million", label: "Total equity", period: "As at March 31, 2023" });
  b.fig("dividend", { ...src, value: 154358.43, unit: "INR million", label: "Dividend paid (including withholding Tax)", period: FY24, page: 268, section: "Annexure III – Restated Consolidated Statement of Cash Flows" });

  // The source must agree with itself before any part is written on it.
  const v = (id: string) => b.v(id);
  b.check("Offer shares × Offer Price, less the employee discount, equals the Offer size", (v("offerShares") * v("offerPrice") - v("empShares") * v("empDiscount")) / 1e6, v("offerSize"), 0.01);
  b.check("Employee shares × discounted price equals the Employee Reservation amount", (v("empShares") * (v("offerPrice") - v("empDiscount"))) / 1e6, v("empAmount"), 0.01);
  b.check("QIB amount equals QIB shares × Offer Price", (v("qibShares") * v("offerPrice")) / 1e6, v("qibAmount"), 0.01);
  b.check("Non-institutional amount equals its shares × Offer Price", (v("niiShares") * v("offerPrice")) / 1e6, v("niiAmount"), 0.01);
  b.check("Retail amount equals its shares × Offer Price", (v("riiShares") * v("offerPrice")) / 1e6, v("riiAmount"), 0.01);
  b.check("Employee + QIB + NII + retail shares equal the Offer", v("empShares") + v("qibShares") + v("niiShares") + v("riiShares"), v("offerShares"), 0);
  b.check("Promoter shares after the Offer equal shares before less shares sold", v("preShares") - v("offerShares"), v("promoterPost"), 0);
  b.check("Promoter post-Offer % ties", (v("promoterPost") / v("postShares")) * 100, v("promoterPostPct"), 0.005);
  b.check("Market cap at the Offer Price ties (₹ billion)", (v("postShares") * v("offerPrice")) / 1e9, v("mcapBn"), 0.005);
  b.check("P/E at the Offer Price ties", v("offerPrice") / v("eps24"), v("pe24"), 0.005);
  b.check("Industry average P/E is the mean of the three peers", (v("peMaruti") + v("peTata") + v("peMM")) / 3, v("peIndustryAvg"), 0.005);
  b.check("Revenue + other income = total income", v("revenue") + v("otherIncome"), v("totalIncome"));
  b.check("Total income − total expenses = profit before tax", v("totalIncome") - v("totalExpenses"), v("pbt"));
  b.check("Profit before tax − tax = profit", v("pbt") - v("tax"), v("pat"));
  b.check("EBITDA KPI rebuilds from the P&L", v("pat") + v("tax") + v("financeCosts") + v("da") - v("otherIncome"), v("ebitdaKpi"));
  b.check("Balance sheet balances", v("totalAssets"), v("equity24") + v("totalLiab"));
  b.check("Net worth rolls forward: opening + comprehensive income − dividend", v("equity23") + v("tci") - v("dividend"), v("equity24"));
  b.check("Return on net worth ties", (v("pat") / v("equity24")) * 100, v("ronw24"), 0.005);

  // Answers, from the cited figures only
  const offerSize = (v("offerShares") * v("offerPrice") - v("empShares") * v("empDiscount")) / 1e6;
  const grossNoDiscount = (v("offerShares") * v("offerPrice")) / 1e6;
  const netToHmc = offerSize - v("offerExpenses");
  const promoterPct = ((v("preShares") - v("offerShares")) / v("postShares")) * 100;
  const promoterWrong = ((v("preShares") - v("offerShares")) / (v("preShares") + v("offerShares"))) * 100;
  const mcapFloor = (v("postShares") * v("floorPrice")) / 1e6;
  const mcapOffer = (v("postShares") * v("offerPrice")) / 1e6;
  const peOffer = v("offerPrice") / v("eps24");
  const peAvg = (v("peMaruti") + v("peTata") + v("peMM")) / 3;
  const premium = (peOffer / peAvg - 1) * 100;
  const peMedian = v("peMaruti");
  const ebitda = v("pat") + v("tax") + v("financeCosts") + v("da") - v("otherIncome");
  const cashAll = v("cash") + v("bankOther");
  const debt = v("borrowNC") + v("borrowC");
  const netCash = cashAll - debt;
  const ev = mcapOffer - netCash;
  const evEbitda = ev / ebitda;
  const avgEquity = (v("equity23") + v("equity24")) / 2;
  const ronwAvg = (v("pat") / avgEquity) * 100;

  // The model part: the offer structure, rebuilt as a live sheet
  const L = new Layout(24, 3, [340, 140, 280]);
  L.head("A1", "Hyundai Motor India IPO: offer structure (₹ million unless stated)")
    .label("A3", "Offer Price (₹ per share)").input("B3", b.xl(v("offerPrice")), "n0")
    .label("A4", "Employee discount (₹ per share)").input("B4", b.xl(v("empDiscount")), "n0")
    .label("A5", "Equity shares outstanding (pre and post Offer)").input("B5", b.xl(v("preShares")), "n0")
    .label("A6", "Employee Reservation Portion (shares)").input("B6", b.xl(v("empShares")), "n0")
    .label("A7", "QIB Portion (shares)").input("B7", b.xl(v("qibShares")), "n0")
    .label("A8", "of which Anchor Investor Portion (shares)").input("B8", b.xl(v("anchorShares")), "n0")
    .label("A9", "Non-Institutional Portion (shares)").input("B9", b.xl(v("niiShares")), "n0")
    .label("A10", "Retail Portion (shares)").input("B10", b.xl(v("riiShares")), "n0")
    .head("A12", "Build")
    .label("A13", "Net Offer (shares)").calc("B13", "=SUM(B7,B9,B10)", "n0")
    .label("A14", "Total Offer (shares)").calc("B14", "=B13+B6", "n0")
    .label("A15", "Employee portion amount").calc("B15", "=B6*(B3-B4)/10^6", "n2")
    .label("A16", "QIB portion amount").calc("B16", "=B7*B3/10^6", "n2")
    .label("A17", "Non-Institutional portion amount").calc("B17", "=B9*B3/10^6", "n2")
    .label("A18", "Retail portion amount").calc("B18", "=B10*B3/10^6", "n2")
    .label("A19", "Total Offer size").calc("B19", "=SUM(B15:B18)", "n2")
    .label("A20", "Offer as % of post-Offer share capital").calc("B20", "=B14/B5", "pct2")
    .label("A21", "Net Offer as % of post-Offer share capital").calc("B21", "=B13/B5", "pct2")
    .label("A22", "Anchor share of the QIB Portion").calc("B22", "=B8/B7", "pct1")
    .label("A23", "Promoter holding after the Offer").calc("B23", "=(B5-B14)/B5", "pct2")
    .label("A24", "Market capitalisation at the Offer Price").calc("B24", "=B5*B3/10^6", "n2")
    .note("C13", "QIB + Non-Institutional + Retail")
    .note("C15", "Employees pay the Offer Price less the discount")
    .note("C19", "Prospectus, page 90: the Offer aggregate")
    .note("C23", "Pure OFS: shares outstanding don't change");
  L.grade("B13", "Net Offer shares", 1)
    .grade("B14", "Total Offer shares", 1)
    .grade("B15", "Employee portion amount", 2)
    .grade("B19", "Total Offer size", 3, { requires: [["SUM"]] })
    .grade("B20", "Offer % of post-Offer capital", 2)
    .grade("B21", "Net Offer % of post-Offer capital", 1)
    .grade("B22", "Anchor share of QIB", 1)
    .grade("B23", "Promoter holding after the Offer", 2)
    .grade("B24", "Market cap at the Offer Price", 2);
  const model = L.build({
    shocks: [
      { label: "Offer Price is set at the floor of the band", set: { B3: v("floorPrice") } },
      { label: "employee discount is removed", set: { B4: 0 } },
      { label: "Retail Portion is a million shares larger", set: { B10: v("riiShares") + 1e6 } },
    ],
    brief: [
      "The inputs are the Offer's own numbers from the Prospectus (pages 90 and 403). Rebuild the offer structure so it still holds when the price or the allocation changes, the way a deal team's offer model has to before the price is fixed.",
    ],
    steps: [
      "Add up the Net Offer (QIB, Non-Institutional and Retail) and the total Offer (Net Offer plus the Employee Reservation).",
      "Price each portion in ₹ million. Employees pay the Offer Price less their discount; everyone else pays the Offer Price.",
      "Total Offer size is the sum of the four portions. Check it against the Prospectus figure in the brief.",
      "Express the Offer and the Net Offer as a share of post-Offer capital, the anchor book as a share of the QIB Portion, and the promoter's holding after the Offer.",
      "Market capitalisation at the Offer Price, in ₹ million.",
    ],
    solution: [
      "**Why the share count doesn't move.** Every share in this Offer is an existing share sold by Hyundai Motor Company, so B5 is both the pre-Offer and post-Offer share count. The promoter's stake falls only because it sold: `=(B5-B14)/B5`.",
      "**The employee discount.** Employees bid at the Offer Price less the discount, so `=B6*(B3-B4)/10^6`. Leaving it out overstates the Offer by the discount times the employee shares.",
      "**Units.** Shares × rupees gives rupees; divide by 10^6 for ₹ million, the unit the Prospectus reports in. One crore is ten million, so ₹ million ÷ 10 gives ₹ crore.",
      "**Live checks.** The checker moves the price to the floor of the band, removes the discount and enlarges the retail book. Every amount must follow from B3, B4 and the share inputs, never from a typed total.",
    ],
  });

  const ex = (label: string, id: string, dp = 2) => ({ label, cells: [b.cell(id, dp)] });

  return b.build({
    slug: "hyundai-motor-india-ipo-2024",
    title: "Hyundai Motor India IPO (2024): a pure offer for sale",
    company: "Hyundai Motor India Limited",
    kind: "real",
    track: "Corporate Finance",
    difficulty: "Hard",
    minutes: 75,
    topics: ["IPO", "Offer for sale", "Book building", "Relative valuation", "EV/EBITDA", "Return on net worth"],
    summary: "An IPO that raised nothing for the company. Size the offer, follow the money, and test the price against listed peers using the Prospectus itself.",
    brief: [
      `In October 2024 Hyundai Motor Company sold part of its Indian subsidiary to the public. The Offer was **${b.show("offerShares", 0)} existing shares at ₹${b.show("offerPrice", 0)} each**, with no fresh issue. Every number in this case comes from the final Prospectus filed with SEBI, shown the way the company reports it: ₹ million, Indian fiscal years ending March 31, and the Prospectus's own line-item names.`,
      `The price band was ₹${b.show("floorPrice", 0)} to ₹${b.show("offerPrice", 0)} and the Offer was priced at the top. Eligible employees got a discount of ₹${b.show("empDiscount", 0)} per share. The exhibits below hold everything you need; each number links to its page in the Prospectus.`,
      "Work through the parts in order. Each part is graded on its own against the reported figures, so a slip in one part never carries into the next.",
    ],
    exhibits: [
      {
        key: "offer", title: "Exhibit 1. The Offer", note: "The Offer and Offer Structure sections, pages 90 and 403.",
        head: ["", "As reported"],
        rows: [
          ex("Offer for Sale (shares)", "offerShares", 0),
          ex("Offer Price (₹ per share)", "offerPrice", 0),
          ex("Floor price of the band (₹ per share)", "floorPrice", 0),
          ex("Employee Reservation Portion (shares)", "empShares", 0),
          ex("Employee discount (₹ per share)", "empDiscount", 0),
          ex("QIB Portion (shares)", "qibShares", 0),
          ex("  of which Anchor Investor Portion (shares)", "anchorShares", 0),
          ex("Non-Institutional Portion (shares)", "niiShares", 0),
          ex("Retail Portion (shares)", "riiShares", 0),
          ex("Equity shares outstanding before and after the Offer", "preShares", 0),
          ex("Total estimated Offer expenses (₹ million)", "offerExpenses"),
        ],
      },
      {
        key: "valuation", title: "Exhibit 2. Basis for Offer Price", note: "Pages 118 to 120. Peer P/E uses BSE closing prices on October 16, 2024.",
        head: ["", "As reported"],
        rows: [
          ex("Diluted EPS, Fiscal 2024 (₹)", "eps24"),
          ex("Maruti Suzuki India – P/E (x)", "peMaruti"),
          ex("Tata Motors – P/E (x)", "peTata"),
          ex("Mahindra & Mahindra – P/E (x)", "peMM"),
          ex("Return on Net Worth, Fiscal 2024 (%)", "ronw24"),
        ],
      },
      {
        key: "pl", title: "Exhibit 3. Restated consolidated statement of profit and loss, Fiscal 2024 (₹ million)", note: "Annexure II, page 267.",
        head: ["", "Fiscal 2024"],
        rows: [
          ex("Revenue from operations", "revenue"),
          ex("Other income", "otherIncome"),
          ex("Finance costs", "financeCosts"),
          ex("Depreciation and amortisation expense", "da"),
          ex("Profit before tax", "pbt"),
          ex("Total tax expense", "tax"),
          ex("Profit for the period / year", "pat"),
          ex("Total comprehensive income for the period / year", "tci"),
        ],
      },
      {
        key: "bs", title: "Exhibit 4. Balance sheet and cash flow items (₹ million)", note: "Annexure I, page 266, and Annexure III, page 268.",
        head: ["", "As reported"],
        rows: [
          ex("Cash and cash equivalents, March 31, 2024", "cash"),
          ex("Bank balance other than above, March 31, 2024", "bankOther"),
          ex("Borrowings (non-current), March 31, 2024", "borrowNC"),
          ex("Borrowings (current), March 31, 2024", "borrowC"),
          ex("Total equity, March 31, 2023", "equity23"),
          ex("Total equity, March 31, 2024", "equity24"),
          ex("Dividend paid (including withholding tax), Fiscal 2024", "dividend"),
        ],
      },
    ],
    parts: [
      {
        key: "offer-size", kind: "numeric", title: "Size the Offer", points: 8, skills: ["IPO sizing"],
        prompt: [`What is the total Offer size in ₹ million? Use the Offer shares, the Offer Price and the employee discount from Exhibit 1. Give your answer to two decimal places.`],
        answer: offerSize, unit: "₹ million", tol: { abs: 0.5 },
        solution: {
          idea: [
            "An IPO's headline size is shares sold × price. The one wrinkle is that not every buyer pays the same price: SEBI rules let a company offer employees a discount, and those shares bring in less.",
            "So the Offer size is the full value of all shares at the Offer Price, less the discount given away on the employee shares.",
          ],
          formulas: [{ expr: "Offer size = (N × P − Nₑ × D) ÷ 10^6", terms: [["N", "shares in the Offer"], ["P", "Offer Price per share"], ["Nₑ", "shares in the Employee Reservation Portion"], ["D", "employee discount per share"], ["10^6", "converts rupees to ₹ million, the Prospectus's unit"]] }],
          steps: [
            b.p(`All shares at the Offer Price: ${b.show("offerShares", 0)} × ₹${b.show("offerPrice", 0)} = ₹${b.n(grossNoDiscount)} million.`),
            b.p(`Discount given to employees: ${b.show("empShares", 0)} × ₹${b.show("empDiscount", 0)} = ₹${b.n((v("empShares") * v("empDiscount")) / 1e6)} million.`),
            b.p(`Offer size = ${b.n(grossNoDiscount)} − ${b.n((v("empShares") * v("empDiscount")) / 1e6)} = **₹${b.n(offerSize)} million**, which is the ₹${b.show("offerSize")} million on page 90.`),
          ],
          meaning: [
            `That is ₹${b.n(offerSize / 10)} crore. Size matters for how the book is built: a large Offer needs deep institutional demand, which is why up to half the Net Offer goes to QIBs and a large anchor book is placed the day before the issue opens.`,
            "The discount is small relative to the deal, but bankers and the Prospectus carry it to the rupee, and so should you.",
          ],
          mistakes: [
            `Ignoring the employee discount gives ₹${b.n(grossNoDiscount)} million, about ₹${b.n((v("empShares") * v("empDiscount")) / 1e6)} million too high. The tolerance rejects it.`,
            `Mixing units: answering in ₹ crore (${b.n(offerSize / 10)}) or in rupees. The question asks for ₹ million, the unit the Prospectus uses.`,
          ],
          excel: [`\`=(${b.xl(v("offerShares"))}*${b.xl(v("offerPrice"))}-${b.xl(v("empShares"))}*${b.xl(v("empDiscount"))})/10^6\``],
        },
      },
      {
        key: "who-gets-cash", kind: "choice", title: "Follow the money", points: 4, skills: ["Offer for sale", "Use of proceeds"],
        prompt: ["Who receives the money raised in this Offer?"],
        options: [
          "Hyundai Motor India, to fund the new Talegaon plant",
          "Hyundai Motor India, which then pays a special dividend to its parent",
          "Hyundai Motor Company, the selling promoter, after deducting Offer expenses and taxes",
          "It is split between the company and the promoter in proportion to their shareholdings",
        ],
        correct: 2,
        solution: {
          idea: [
            "An IPO can have two parts. A **fresh issue** creates new shares and the cash goes to the company. An **offer for sale (OFS)** is existing shareholders selling their shares, and the cash goes to them.",
            "This Offer was entirely an OFS: the Prospectus's cover lists the fresh issue size as \"Not applicable\". Hyundai Motor India itself received nothing.",
          ],
          formulas: [{ expr: "Company proceeds = fresh issue size; Seller proceeds = OFS size − seller's share of expenses", terms: [["fresh issue size", "new shares × price (zero here)"], ["OFS size", "existing shares sold × price"]] }],
          steps: [
            b.p("Objects of the Offer, page 115: \"Our Company will not receive any proceeds from the Offer and all the Offer Proceeds will be received by the Promoter Selling Shareholder after deduction of Offer related expenses and relevant taxes thereon.\""),
            b.p("So the answer is **Hyundai Motor Company, the selling promoter**."),
          ],
          meaning: [
            "Investors read an all-OFS IPO as a partial exit: the parent is monetising its stake, and none of the money funds growth. That is not a bad sign by itself, but it shifts the question from \"what will the company do with the money\" to \"is the seller leaving enough on the table for me\".",
            "It also explains why the company's share count and balance sheet don't change at listing.",
          ],
          mistakes: [
            "Assuming every IPO funds the company. Many Indian IPOs are mostly or entirely OFS.",
            "Confusing the pre-IPO dividend (Exhibit 4) with use of proceeds. The dividend was paid in Fiscal 2024, before the Offer, out of the company's own cash.",
          ],
          excel: ["No formula needed: this is read from the Objects of the Offer. In a model, keep a fresh-issue input and set it to zero, so the same sheet handles mixed IPOs."],
        },
      },
      {
        key: "net-to-promoter", kind: "numeric", title: "What the seller takes home", points: 6, skills: ["Offer for sale", "Offer expenses"],
        prompt: ["Before taxes, how much does Hyundai Motor Company receive from the Offer after the total estimated Offer expenses? Answer in ₹ million to two decimal places."],
        answer: netToHmc, unit: "₹ million", tol: { abs: 0.5 },
        solution: {
          idea: [
            "Bankers, lawyers, registrars, brokers and regulators are paid out of the Offer. In a pure OFS, the Prospectus says the selling shareholder bears almost all of it (the company pays only listing fees and some corporate advertising).",
            "So the seller's net cash is the Offer size less the estimated expenses, before any tax the seller owes.",
          ],
          formulas: [{ expr: "Net to seller = Offer size − Offer expenses", terms: [["Offer size", "₹ million raised from all bidders"], ["Offer expenses", "estimated total on page 116, including the bankers' fees"]] }],
          steps: [
            b.p(`Offer size = ₹${b.show("offerSize")} million (part 1).`),
            b.p(`Total estimated Offer expenses = ₹${b.show("offerExpenses")} million, ${b.pct(v("offerExpenses") / v("offerSize"))} of the Offer.`),
            b.p(`Net to Hyundai Motor Company = ${b.show("offerSize")} − ${b.show("offerExpenses")} = **₹${b.n(netToHmc)} million**.`),
          ],
          meaning: [
            `Fees of about ${b.pct(v("offerExpenses") / v("offerSize"))} are typical for a large Indian IPO; most of it is the book running lead managers' fee. On a smaller issue fixed costs push this percentage up.`,
            "The figure is an estimate in the Prospectus and before the seller's capital gains tax, so the cash Hyundai Motor Company finally kept is lower.",
          ],
          mistakes: [
            `Subtracting expenses from the company's cash: in a pure OFS the company receives nothing, so there is nothing to subtract them from.`,
            `Starting from the undiscounted ₹${b.n(grossNoDiscount)} million gives ₹${b.n(grossNoDiscount - v("offerExpenses"))} million.`,
          ],
          excel: [`\`=${b.xl(v("offerSize"))}-${b.xl(v("offerExpenses"))}\``],
        },
      },
      {
        key: "promoter-stake", kind: "numeric", title: "The promoter's stake after listing", points: 6, skills: ["Shareholding", "Dilution"],
        prompt: ["What percentage of the company does Hyundai Motor Company own after the Offer? Answer in percent to two decimal places."],
        answer: promoterPct, unit: "%", tol: { abs: 0.01 },
        solution: {
          idea: [
            "Before the IPO, Hyundai Motor Company owned all the shares (a handful through its nominees). An OFS moves shares from the seller to new investors without creating any, so the denominator stays the same and only the seller's share count falls.",
          ],
          formulas: [{ expr: "Stake after = (S − N) ÷ S", terms: [["S", "shares outstanding, the same before and after a pure OFS"], ["N", "shares sold in the Offer"]] }],
          steps: [
            b.p(`Shares the promoter keeps: ${b.show("preShares", 0)} − ${b.show("offerShares", 0)} = ${b.n(v("preShares") - v("offerShares"), 0)}.`),
            b.p(`Stake = ${b.n(v("preShares") - v("offerShares"), 0)} ÷ ${b.show("postShares", 0)} = **${b.n(promoterPct)}%**, matching the ${b.show("promoterPostPct")}% on page 17.`),
          ],
          meaning: [
            `The public now holds ${b.show("offerPctPost")}% of the company. Indian minimum public shareholding rules require promoters of large companies to sell down further within a set period after listing, so a promoter at ${b.n(promoterPct)}% should be expected to sell more over the coming years. That future supply of shares is something investors price in.`,
          ],
          mistakes: [
            `Treating the Offer as new shares and growing the denominator gives ${b.n(promoterWrong)}%. That would be right for a fresh issue, not an OFS.`,
            "Answering the public's share instead of the promoter's.",
          ],
          excel: [`\`=(${b.xl(v("preShares"))}-${b.xl(v("offerShares"))})/${b.xl(v("postShares"))}\`, formatted as a percentage.`],
        },
      },
      {
        key: "mcap-floor", kind: "numeric", title: "Valuation at the bottom of the band", points: 6, skills: ["Market capitalisation", "Price band"],
        prompt: ["Had the Offer been priced at the floor of the band, what would the market capitalisation at the Offer Price have been? Answer in ₹ million to two decimal places."],
        answer: mcapFloor, unit: "₹ million", tol: { abs: 0.5 },
        solution: {
          idea: [
            "Market capitalisation is every share outstanding times the price. Because no new shares were issued, the share count is the same at any point in the band, so the valuation moves exactly in step with the price.",
            "This is a **hypothetical** on real data: the Offer was actually priced at the cap.",
          ],
          formulas: [{ expr: "Market cap = S × P ÷ 10^6", terms: [["S", "shares outstanding after the Offer"], ["P", "price per share"], ["10^6", "rupees to ₹ million"]] }],
          steps: [
            b.p(`At the floor: ${b.show("postShares", 0)} × ₹${b.show("floorPrice", 0)} ÷ 10^6 = **₹${b.n(mcapFloor)} million**.`),
            b.p(`At the Offer Price: ${b.show("postShares", 0)} × ₹${b.show("offerPrice", 0)} ÷ 10^6 = ₹${b.n(mcapOffer)} million, the ₹${b.show("mcapBn")} billion on page 120.`),
            b.p(`Difference: ₹${b.n(mcapOffer - mcapFloor)} million, or ${b.pct(v("offerPrice") / v("floorPrice") - 1)} of the floor value.`),
          ],
          meaning: [
            `Pricing at the cap rather than the floor raised the seller ₹${b.n(((v("offerPrice") - v("floorPrice")) * v("offerShares")) / 1e6)} million more on the shares sold (ignoring the employee discount), and set every buyer's entry price that much higher. That trade-off between seller proceeds and the investor's first-day return is the central tension of IPO pricing.`,
            "In an IPO with a fresh issue, a lower price means more new shares for the same rupee amount, so market cap falls by less than the price. Here, with none, it falls one for one.",
          ],
          mistakes: [
            `Using only the shares sold (${b.show("offerShares", 0)}) instead of all shares outstanding gives the Offer size, not the company's value.`,
            "Dividing by 10^7 gives ₹ crore, not ₹ million.",
          ],
          excel: [`\`=${b.xl(v("postShares"))}*${b.xl(v("floorPrice"))}/10^6\``],
        },
      },
      {
        key: "pe-premium", kind: "numeric", title: "The price against listed peers", points: 10, skills: ["Relative valuation", "P/E"],
        prompt: ["At the Offer Price, what premium (or discount, as a negative number) does Hyundai Motor India's P/E on Fiscal 2024 diluted EPS carry to the simple average P/E of the three listed peers in Exhibit 2? Answer in percent to two decimal places."],
        answer: premium, unit: "%", tol: { abs: 0.05 },
        solution: {
          idea: [
            "A P/E says how many rupees investors pay for one rupee of annual profit. Comparing the IPO's P/E with listed peers tells you whether the stock is being sold richer or cheaper than what the market already pays for similar businesses.",
            "The Prospectus itself does this comparison (\"Basis for Offer Price\"), because SEBI requires the company to justify its price. Your job is to read it critically.",
          ],
          formulas: [
            { expr: "P/E = Offer Price ÷ diluted EPS", terms: [["Offer Price", "₹ per share paid by investors"], ["diluted EPS", "profit per share for Fiscal 2024, counting all potential shares"]] },
            { expr: "Premium = P/E(IPO) ÷ average P/E(peers) − 1", terms: [["average P/E(peers)", "simple mean of Maruti Suzuki, Tata Motors and Mahindra & Mahindra"]] },
          ],
          steps: [
            b.p(`IPO P/E = ₹${b.show("offerPrice", 0)} ÷ ₹${b.show("eps24")} = ${b.x(peOffer, 4)}.`),
            b.p(`Peer average = (${b.show("peMaruti")} + ${b.show("peTata")} + ${b.show("peMM")}) ÷ 3 = ${b.x(peAvg, 4)}.`),
            b.p(`Premium = ${b.n(peOffer, 4)} ÷ ${b.n(peAvg, 4)} − 1 = **${b.n(premium)}%**. Using the rounded ${b.show("pe24")} and ${b.show("peIndustryAvg")} from the Prospectus gives ${b.n((v("pe24") / v("peIndustryAvg") - 1) * 100)}%, which is also accepted.`),
          ],
          meaning: [
            `The issue was priced about ${b.n(premium, 0)}% above the peer average. Whether that is justified depends on the peer set: Tata Motors at ${b.show("peTata")}x is a conglomerate that includes Jaguar Land Rover and commercial vehicles, and it drags the average down. Excluding it, the other two average ${b.x((v("peMaruti") + v("peMM")) / 2)} and the IPO looks cheaper than both.`,
            `This is why analysts look at the median as well as the mean and ask whether each peer is truly comparable. The Prospectus's own Return on Net Worth of ${b.show("ronw24")}% is part of the case for a premium, but part 8 shows why that number flatters.`,
          ],
          mistakes: [
            `Using the median peer (Maruti Suzuki, ${b.show("peMaruti")}x) gives ${b.n((peOffer / peMedian - 1) * 100)}%, which is a different question.`,
            `Computing the difference in P/E points (${b.n(peOffer - peAvg)}) rather than a percentage.`,
            "Using the peers' basic EPS for some and diluted for others. The Prospectus uses diluted EPS throughout.",
          ],
          excel: [`\`=(${b.xl(v("offerPrice"))}/${b.xl(v("eps24"))})/AVERAGE(${b.xl(v("peMaruti"))},${b.xl(v("peTata"))},${b.xl(v("peMM"))})-1\``],
        },
      },
      {
        key: "ebitda-rebuild", kind: "numeric", title: "Rebuild EBITDA from the statements", points: 8, skills: ["Financial statement analysis", "Non-GAAP reconciliation"],
        prompt: ["The Prospectus reports \"EBITDA (Excluding Other Income)\" as a key performance indicator. Rebuild it for Fiscal 2024 from the profit and loss lines in Exhibit 3, in ₹ million to two decimal places."],
        answer: ebitda, unit: "₹ million", tol: { abs: 0.5 },
        solution: {
          idea: [
            "EBITDA is earnings before interest, tax, depreciation and amortisation: a rough measure of the cash profit the core business makes before financing and accounting for asset wear. It is not defined by Ind AS, so each company defines it, and you should always rebuild it from audited lines.",
            "Hyundai Motor India's definition (page 121, note 3) starts from profit, adds back tax, finance costs and D&A, and **removes other income**. That last step matters here: other income is mostly interest on the company's large bank deposits, which isn't part of making cars.",
          ],
          formulas: [{ expr: "EBITDA (excl. OI) = PAT + Tax + Finance costs + D&A − Other income", terms: [["PAT", "profit for the year"], ["Tax", "total tax expense"], ["Finance costs", "interest and similar costs"], ["D&A", "depreciation and amortisation expense"], ["Other income", "non-operating income, mainly interest on deposits"]] }],
          steps: [
            b.table(["Line (Exhibit 3)", "₹ million"], [
              ["Profit for the period / year", b.show("pat")],
              ["+ Total tax expense", b.show("tax")],
              ["+ Finance costs", b.show("financeCosts")],
              ["+ Depreciation and amortisation expense", b.show("da")],
              ["− Other income", `(${b.show("otherIncome")})`],
              ["**EBITDA (Excluding Other Income)**", `**${b.n(ebitda)}**`],
            ]),
            b.p(`This matches the KPI table on page 121 (₹${b.show("ebitdaKpi")} million). Margin: ${b.n(ebitda)} ÷ ${b.show("revenue")} = ${b.pct(ebitda / v("revenue"))}.`),
          ],
          meaning: [
            `Other income was ${b.pct(v("otherIncome") / v("pbt"))} of profit before tax in Fiscal 2024, so including it would flatter operating performance. It also shrinks after the dividend in part 8 drained the cash that earned it.`,
            "Use the operating number for EV/EBITDA (part 7): enterprise value excludes cash, so the earnings measure should exclude the income that cash earns.",
          ],
          mistakes: [
            `Forgetting to remove other income gives ₹${b.n(ebitda + v("otherIncome"))} million.`,
            `Taking D&A from the cash flow statement, which splits right-of-use depreciation out and gives a slightly different total. Use the P&L line.`,
            "Starting from profit before tax and adding tax again (double counting).",
          ],
          excel: [`\`=${b.xl(v("pat"))}+${b.xl(v("tax"))}+${b.xl(v("financeCosts"))}+${b.xl(v("da"))}-${b.xl(v("otherIncome"))}\``],
        },
      },
      {
        key: "ev-ebitda", kind: "numeric", title: "EV/EBITDA at the Offer Price", points: 12, skills: ["Enterprise value", "EV/EBITDA", "Net cash"],
        prompt: ["Compute EV/EBITDA at the Offer Price on Fiscal 2024 EBITDA (Excluding Other Income). For enterprise value, take market capitalisation at the Offer Price, subtract cash and cash equivalents and other bank balances, and add current and non-current borrowings, all as at March 31, 2024. Ignore lease liabilities. Answer as a multiple to two decimal places."],
        answer: evEbitda, unit: "x", tol: { abs: 0.01 },
        solution: {
          idea: [
            "P/E values only the equity and is distorted by how a company is financed and how much interest its cash earns. **Enterprise value** (EV) is the value of the operating business: what you would pay for all the equity, plus the debt you take on, minus the cash you get.",
            "Hyundai Motor India has far more cash than debt (net cash), so its EV is below its market cap.",
          ],
          formulas: [
            { expr: "EV = Market cap − (Cash + Other bank balances) + Borrowings", terms: [["Market cap", "shares outstanding × Offer Price"], ["Cash + Other bank balances", "cash and deposits, all available to the owner"], ["Borrowings", "current plus non-current debt"]] },
            { expr: "EV/EBITDA = EV ÷ EBITDA (excl. OI)", terms: [["EBITDA (excl. OI)", "part 7's operating earnings"]] },
          ],
          steps: [
            b.table(["Item", "₹ million"], [
              ["Market cap at ₹" + b.show("offerPrice", 0), b.n(mcapOffer)],
              ["− Cash and cash equivalents", `(${b.show("cash")})`],
              ["− Bank balance other than above", `(${b.show("bankOther")})`],
              ["+ Borrowings (non-current)", b.show("borrowNC")],
              ["+ Borrowings (current)", b.show("borrowC")],
              ["**Enterprise value**", `**${b.n(ev)}**`],
            ]),
            b.p(`Net cash = ${b.n(cashAll)} − ${b.n(debt)} = ₹${b.n(netCash)} million.`),
            b.p(`EV/EBITDA = ${b.n(ev)} ÷ ${b.n(ebitda)} = **${b.x(evEbitda)}**.`),
          ],
          meaning: [
            `At ${b.x(evEbitda)} the market is paying about ${b.n(evEbitda, 1)} years of current operating cash profit for the business. Compare it with listed carmakers on the same definition before calling it rich or cheap; the Prospectus doesn't give peer EV/EBITDA, so you would build it from their filings.`,
            `The March 2024 balance sheet already reflects the pre-IPO dividend. Had the cash been left in, EV would have been lower and the multiple would look cheaper, for the same business.`,
          ],
          mistakes: [
            `Skipping the bridge (market cap ÷ EBITDA) gives ${b.x(mcapOffer / ebitda)}.`,
            `Counting only cash and cash equivalents, not the other bank balances (deposits), gives ${b.x((mcapOffer - v("cash") + debt) / ebitda)}. In March 2024 most of the cash sat in deposits.`,
            `Using EBITDA including other income gives ${b.x(ev / (ebitda + v("otherIncome")))}: the cash is removed from EV but the interest it earns is kept in EBITDA.`,
          ],
          excel: [`\`=(${b.xl(v("postShares"))}*${b.xl(v("offerPrice"))}/10^6-(${b.xl(v("cash"))}+${b.xl(v("bankOther"))})+(${b.xl(v("borrowNC"))}+${b.xl(v("borrowC"))}))/${b.xl(ebitda)}\``],
        },
      },
      {
        key: "ronw-average", kind: "numeric", title: "Why return on net worth flatters", points: 10, skills: ["Return on equity", "Accounting forensics"],
        prompt: [
          `The Prospectus reports Return on Net Worth of ${b.show("ronw24")}% for Fiscal 2024, using closing net worth. Total equity fell from ₹${b.show("equity23")} million to ₹${b.show("equity24")} million during the year.`,
          "Recompute Fiscal 2024 return on net worth using **average** net worth (opening plus closing, divided by two). Answer in percent to two decimal places.",
        ],
        answer: ronwAvg, unit: "%", tol: { abs: 0.01 },
        solution: {
          idea: [
            "Return on net worth (return on equity) is profit ÷ the shareholders' capital that earned it. Profit is earned over the whole year, so the fairest denominator is the capital in place over the year, not the capital left at year end.",
            `That usually makes little difference. Here it makes a big one: in Fiscal 2024 the company paid its parent a dividend of ₹${b.show("dividend")} million (Exhibit 4), more than its profit for three years. Equity roughly halved, and dividing a full year's profit by the shrunken year-end equity inflates the ratio.`,
          ],
          formulas: [
            { expr: "RoNW (closing) = PAT ÷ Closing equity", terms: [["PAT", "profit for the year"], ["Closing equity", "total equity at March 31, 2024"]] },
            { expr: "RoNW (average) = PAT ÷ ((Opening + Closing equity) ÷ 2)", terms: [["Opening equity", "total equity at March 31, 2023"]] },
            { expr: "Closing equity = Opening equity + Total comprehensive income − Dividends", terms: [["Total comprehensive income", "profit plus other comprehensive income"]] },
          ],
          steps: [
            b.p(`Check the roll-forward first: ${b.show("equity23")} + ${b.show("tci")} − ${b.show("dividend")} = ${b.n(v("equity23") + v("tci") - v("dividend"))}, exactly the closing equity. The dividend explains the whole fall.`),
            b.p(`Average equity = (${b.show("equity23")} + ${b.show("equity24")}) ÷ 2 = ₹${b.n(avgEquity)} million.`),
            b.p(`RoNW (average) = ${b.show("pat")} ÷ ${b.n(avgEquity)} = **${b.n(ronwAvg)}%**, against ${b.show("ronw24")}% reported on closing equity.`),
          ],
          meaning: [
            `Both numbers are \"correct\" by their definitions, but ${b.show("ronw24")}% is not a run-rate investors will earn: it is partly an artefact of the pre-IPO dividend. A return near ${b.n(ronwAvg, 0)}% is still excellent for a carmaker.`,
            "The pattern is common before IPOs and buyouts: a parent extracts surplus cash through a dividend, which raises return ratios and lowers the cash a buyer pays for. Always roll equity forward and look for one-off distributions.",
          ],
          mistakes: [
            `Using opening equity alone gives ${b.n((v("pat") / v("equity23")) * 100)}%.`,
            `Using total comprehensive income instead of profit gives ${b.n((v("tci") / avgEquity) * 100)}%. The Prospectus's definition uses profit.`,
          ],
          excel: [`\`=${b.xl(v("pat"))}/AVERAGE(${b.xl(v("equity23"))},${b.xl(v("equity24"))})\`, formatted as a percentage.`],
        },
      },
      {
        key: "offer-structure-model", kind: "model", title: "Build the offer structure model", points: 20, skills: ["IPO sizing", "Book building", "Excel modelling"],
        prompt: ["Rebuild the Offer's structure as a live sheet. The checker changes the price, the discount and the retail book, so every cell must be a formula on the inputs."],
        model,
        solution: {
          idea: [
            `A book-built Indian IPO splits the Net Offer by investor type under SEBI rules: here not more than ${b.show("qibMaxPct", 0)}% to qualified institutional buyers (part of it placed with anchor investors the day before opening), not less than ${b.show("niiMinPct", 0)}% to non-institutional bidders and not less than ${b.show("riiMinPct", 0)}% to retail. Employees get a separate reserved portion, at a discount.`,
            "A good offer model makes every amount flow from the price and share inputs, so the deal team can re-run it the moment the price is fixed.",
          ],
          formulas: [
            { expr: "Portion amount = shares × price ÷ 10^6", terms: [["shares", "shares allotted to that category"], ["price", "Offer Price, or Offer Price − discount for employees"]] },
            { expr: "Offer % of capital = Offer shares ÷ shares outstanding", terms: [["shares outstanding", "unchanged by a pure OFS"]] },
          ],
          steps: [
            b.table(["Cell", "Formula", "Value"], [
              ["B13 Net Offer", "`=SUM(B7,B9,B10)`", b.n(v("qibShares") + v("niiShares") + v("riiShares"), 0)],
              ["B14 Total Offer", "`=B13+B6`", b.n(v("offerShares"), 0)],
              ["B15 Employee amount", "`=B6*(B3-B4)/10^6`", b.n((v("empShares") * (v("offerPrice") - v("empDiscount"))) / 1e6)],
              ["B19 Total Offer size", "`=SUM(B15:B18)`", b.n(offerSize)],
              ["B20 Offer % of capital", "`=B14/B5`", b.pct(v("offerShares") / v("postShares"))],
              ["B21 Net Offer % of capital", "`=B13/B5`", b.pct((v("qibShares") + v("niiShares") + v("riiShares")) / v("postShares"))],
              ["B22 Anchor share of QIB", "`=B8/B7`", b.pct(v("anchorShares") / v("qibShares"), 1)],
              ["B23 Promoter after Offer", "`=(B5-B14)/B5`", b.pct(promoterPct / 100)],
              ["B24 Market cap", "`=B5*B3/10^6`", b.n(mcapOffer)],
            ]),
            b.p(`Your total in B19 should tie to the Prospectus's ₹${b.show("offerSize")} million, and B20 and B21 to its ${b.show("offerPctPost")}% and ${b.show("netOfferPctPost")}%.`),
          ],
          meaning: [
            `Anchors took ${b.pct(v("anchorShares") / v("qibShares"), 1)} of the QIB Portion. A full anchor book signals institutional demand before retail investors bid, which is why bankers work hard to fill it.`,
            "Because the share count is fixed, the market cap line moves one for one with price. Add a fresh-issue input and this stops being true, which is a good test of whether your model is general.",
          ],
          mistakes: [
            "Typing the Prospectus totals into B19 instead of summing: the value matches, but the checker's price shock exposes it.",
            "Charging employees the full Offer Price.",
            "Adding the Offer shares to B5 for the post-Offer count, as if it were a fresh issue.",
          ],
          excel: ["Lay inputs out in one block (blue), calculations below (black), and refer to inputs by cell. `=SUM(B15:B18)` for the total keeps it live if a portion is resized."],
        },
      },
    ],
  });
}
