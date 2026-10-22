import { summarize, impliedPerShare, type Comp } from "@/lib/finance/comps";
import { capm, enterpriseValue, fcff, gordonGrowth, releverBeta, treasuryStockMethod, twoStageDDM, unleverBeta, wacc } from "@/lib/finance/corporate";
import { dcfSensitivity, runDcf, type DcfInput } from "@/lib/finance/dcf";
import { money, num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Cost of capital ----------

const rf = 0.07, erp = 0.06, peerBeta = 1.3, peerDE = 0.5, targetDE = 0.25, tax = 0.25;
const bu = unleverBeta(peerBeta, peerDE, tax);
const bl = releverBeta(bu, targetDE, tax);
const ke = capm(rf, bl, erp);
const kd = 0.09;
const eqW = 1 / (1 + targetDE), dW = targetDE / (1 + targetDE);
const w = wacc({ equityValue: eqW, debtValue: dW, costOfEquity: ke, preTaxCostOfDebt: kd, taxRate: tax });

export const costOfCapital: Lesson = {
  slug: "cost-of-capital-wacc",
  title: "Cost of capital: CAPM, beta and WACC",
  summary: "How to estimate the return investors require: the cost of equity from CAPM, unlevering and relevering beta, the after-tax cost of debt, and weighting them into WACC.",
  module: "valuation",
  level: "Core",
  prerequisites: ["time-value-of-money"],
  outcomes: [
    "Estimate a cost of equity with CAPM and explain each input.",
    "Unlever a peer's beta and relever it at a target capital structure.",
    "Compute an after-tax cost of debt and a WACC using market-value weights.",
    "Defend your choices of risk-free rate, equity risk premium and beta the way a valuation team must.",
  ],
  hook: [
    "In a DCF, one percentage point on the discount rate can move the value by 15–25%. Yet many students treat WACC as a number handed down from above. In practice it is built from market data and judgement, and investment committees spend real time arguing about it.",
    "This lesson builds a WACC from scratch for a private company with no share price of its own, which is exactly the situation in most deals.",
  ],
  sections: [
    {
      id: "idea",
      title: "What the cost of capital is",
      blocks: [
        { kind: "p", text: "A company is funded by shareholders and lenders. Each expects a return that compensates for the risk it takes. The **weighted average cost of capital** is the blended return the company must earn on its assets to satisfy both. It is the discount rate for unlevered free cash flows, because those cash flows belong to all capital providers." },
        { kind: "formula", expr: "WACC = E/V × kₑ + D/V × k_d × (1 − t)", terms: [["E, D", "market values of equity and debt"], ["V", "E + D"], ["kₑ", "cost of equity"], ["k_d", "pre-tax cost of debt"], ["t", "marginal tax rate: interest is tax-deductible"]] },
        { kind: "callout", tone: "insight", title: "Debt is cheaper, but not free", text: [
          "Debt costs less than equity because lenders are paid first and interest is tax-deductible. So why not fund everything with debt? Because as leverage rises, equity becomes riskier (its beta rises), lenders demand more, and the risk of financial distress grows. The textbook Modigliani-Miller result says that without taxes and distress costs, capital structure wouldn't matter at all. In reality there is a sweet spot, and most companies sit in a range their industry and rating agencies tolerate.",
        ] },
      ],
    },
    {
      id: "capm",
      title: "The cost of equity with CAPM",
      blocks: [
        { kind: "formula", expr: "kₑ = r_f + β × (E[r_m] − r_f)", terms: [["r_f", "risk-free rate: the yield on a long-dated government bond in the currency of the cash flows"], ["β", "beta: how much the stock moves with the market. 1 = moves with it; 1.5 = 50% more"], ["E[r_m] − r_f", "equity risk premium (ERP): the extra return investors expect from equities over government bonds"]] },
        { kind: "p", text: "CAPM says investors are only paid for risk they cannot diversify away. A company's own bad luck (a factory fire, a failed product) averages out across a portfolio; its sensitivity to the whole economy does not. Beta measures that sensitivity." },
        { kind: "h", text: "Choosing the inputs" },
        { kind: "list", items: [
          "**Risk-free rate.** Match the currency and duration of the cash flows. For rupee cash flows, use the 10-year Government of India bond yield; for dollar cash flows, the 10-year US Treasury. Never mix a rupee forecast with a US Treasury yield.",
          "**Equity risk premium.** Usually 5–7% for mature markets in practice; for emerging markets, some practitioners add a country risk premium. Sources: historical averages, surveys, and implied ERPs backed out of current market prices (Aswath Damodaran publishes these each year).",
          "**Beta.** A regression of the stock's returns on the market's, typically two years of weekly or five years of monthly data. Raw betas are noisy, so data providers often adjust them toward 1 (Bloomberg's adjusted beta = 0.67 × raw + 0.33).",
        ] },
      ],
    },
    {
      id: "beta",
      title: "Unlevering and relevering beta",
      blocks: [
        { kind: "p", text: "An observed beta mixes two risks: the business risk of the industry and the financial risk from the company's debt. A private company, or one whose debt is about to change, needs its beta rebuilt from peers." },
        { kind: "formula", expr: "β_unlevered = β_levered / [1 + (1 − t) × D/E]", terms: [["β_unlevered", "asset beta: business risk alone, as if the company had no debt"]] },
        { kind: "formula", expr: "β_levered = β_unlevered × [1 + (1 − t) × D/E]", terms: [["D/E", "the target's own debt-to-equity ratio, at market values"]] },
        { kind: "h", text: "Worked example" },
        { kind: "p", text: `You are valuing a private company. Listed peers have an average beta of ${peerBeta} at a debt-to-equity of ${num(peerDE, 2)}. Your target will run at a D/E of ${num(targetDE, 2)}. Tax rate ${pct(tax, 0)}, risk-free rate ${pct(rf, 0)}, ERP ${pct(erp, 0)}, pre-tax cost of debt ${pct(kd, 0)}.` },
        { kind: "table", head: ["Step", "Calculation", "Result"], rows: [
          ["Unlever peer beta", `${peerBeta} ÷ [1 + 0.75 × ${peerDE}]`, num(bu, 4)],
          ["Relever at target D/E", `${num(bu, 4)} × [1 + 0.75 × ${targetDE}]`, num(bl, 4)],
          ["Cost of equity", `${pct(rf, 0)} + ${num(bl, 4)} × ${pct(erp, 0)}`, pct(ke, 2)],
          ["After-tax cost of debt", `${pct(kd, 0)} × (1 − ${pct(tax, 0)})`, pct(kd * (1 - tax), 2)],
          ["Weights from D/E", `E/V = 1 ÷ ${num(1 + targetDE, 2)}, D/V = ${targetDE} ÷ ${num(1 + targetDE, 2)}`, `${pct(eqW, 0)} / ${pct(dW, 0)}`],
          ["**WACC**", `${pct(eqW, 0)} × ${pct(ke, 2)} + ${pct(dW, 0)} × ${pct(kd * (1 - tax), 2)}`, `**${pct(w, 2)}**`],
        ] },
        { kind: "callout", tone: "desk", title: "How teams actually do it", text: [
          "A valuation team pulls 5–15 peers, unlevers each beta separately at that peer's own D/E and tax rate, takes the median (not the mean, to limit outliers), and relevers at the target's expected long-run capital structure. Then they sanity-check: does the resulting WACC look sensible next to broker reports and the company's own disclosures? Courts and auditors review these choices in fairness opinions and impairment tests, so every input needs a source.",
        ] },
      ],
    },
    {
      id: "debt",
      title: "The cost of debt and the weights",
      blocks: [
        { kind: "list", items: [
          "**Cost of debt** is the rate the company would pay to borrow **today**, not the coupon on old bonds. Use the yield on its traded bonds, or a credit spread for its rating added to the risk-free rate.",
          "**Tax shield.** Multiply by (1 − t) because interest reduces taxable profit. Use the marginal rate, and only if the company actually pays tax: a loss-making start-up gets no shield.",
          "**Weights** use **market values**, not book values, because they represent what investors could get by selling their stakes today. For a private company, use a target capital structure from peers.",
        ] },
        { kind: "callout", tone: "warning", title: "The circularity", text: [
          "WACC needs the market value of equity, but you are computing WACC to find the value of equity. Practitioners break the loop by using a target capital structure (a D/E the company is expected to hold) rather than the current one.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Beta is a precise measure of risk.", practice: "Betas are noisy and change with the period, frequency and index used. Teams use peer medians, adjusted betas and judgement, and show WACC as a range." },
    { theory: "CAPM gives the cost of equity.", practice: "Many practitioners add premiums CAPM doesn't have: size premiums for small companies, country risk premiums for emerging markets, or company-specific premiums. Each is debated." },
    { theory: "WACC is constant over the forecast.", practice: "If leverage will change a lot, as in an LBO, practitioners use APV (adjusted present value) or vary the discount rate, because a single WACC no longer fits." },
    { theory: "Use the current capital structure.", practice: "Use the target or industry long-run structure; current market weights can be distorted by a temporary share price move or a pending refinancing." },
  ],
  mistakes: [
    "Mixing currencies: a rupee forecast discounted with a US risk-free rate.",
    "Using book values of equity for the weights.",
    "Using the historic coupon as the cost of debt instead of the current yield.",
    "Relevering at the peers' D/E instead of the target's.",
    "Forgetting the tax shield on debt, or applying it to a company that pays no tax.",
  ],
  interview: [
    { q: "Why do we unlever and relever beta?", a: "Observed betas include the effect of each peer's leverage. Unlevering strips that out to get the business risk, and relevering adds back the financial risk at the target's own capital structure." },
    { q: "Which is higher, the cost of equity or WACC?", a: "The cost of equity, for any company with debt: WACC blends equity with debt, which is cheaper, especially after the tax shield." },
    { q: "Interest rates rise by 1%. What happens to a DCF value?", a: "The risk-free rate rises, so both the cost of equity and the cost of debt rise, WACC rises, and the present value of future cash flows falls. Long-duration businesses with most value in the terminal value, like high-growth tech, fall the most." },
  ],
  quiz: [
    { q: "Risk-free 6%, beta 1.2, ERP 5%. Cost of equity is:", options: ["7.2%", "11%", "12%", "13.2%"], answer: 2, why: "6% + 1.2 × 5% = 12%." },
    { q: "A company adds debt. Its levered beta:", options: ["Falls", "Stays the same", "Rises", "Becomes 1"], answer: 2, why: "More debt makes equity riskier, so the levered beta rises even though the business is the same." },
    { q: "Why is the cost of debt multiplied by (1 − t)?", options: ["Lenders pay tax on interest", "Interest is tax-deductible for the company", "To convert to real terms", "To adjust for inflation"], answer: 1, why: "Interest reduces taxable profit, so the effective cost to the company is lower by the tax saved." },
  ],
  apply: {
    problems: ["capm-cost-of-equity", "unlever-relever-beta", "wacc"],
    models: ["five-year-dcf"],
    cases: [{ slug: "apple-dcf-fy2025", parts: ["dcf-model"] }],
    tools: ["wacc"],
  },
  glossary: [
    { term: "WACC", definition: "Weighted average cost of capital: the blended required return of equity and after-tax debt, weighted by market values." },
    { term: "CAPM", definition: "Capital asset pricing model: cost of equity = risk-free rate + beta × equity risk premium." },
    { term: "Beta", definition: "Sensitivity of a stock's returns to the market's. Measures non-diversifiable risk." },
    { term: "Equity risk premium (ERP)", definition: "The extra return investors expect from equities over risk-free government bonds." },
    { term: "Unlevered beta", definition: "Beta with the effect of debt removed: the business risk alone. Also called asset beta." },
    { term: "Risk-free rate", definition: "The return on a default-free government bond in the currency and horizon of the cash flows." },
  ],
};

// ---------- Free cash flow ----------

const ebit = 400, da = 60, capex = 90, dNwc = 25;
const ufcf = fcff(ebit, tax, da, capex, dNwc);
const interest = 30, netBorrow = 20;
const fcfeVal = ufcf - interest * (1 - tax) + netBorrow;

export const freeCashFlow: Lesson = {
  slug: "free-cash-flow",
  title: "Free cash flow: what a business really generates",
  summary: "Unlevered and levered free cash flow, how to build each from the statements, and the judgement calls (share-based pay, leases, maintenance capex) that change valuations.",
  module: "valuation",
  level: "Core",
  prerequisites: ["three-financial-statements", "working-capital"],
  outcomes: [
    "Build unlevered free cash flow (FCFF) from EBIT and explain every adjustment.",
    "Distinguish FCFF from levered free cash flow (FCFE) and pair each with the right discount rate.",
    "Make and defend the hard calls: share-based compensation, leases, maintenance versus growth capex.",
  ],
  hook: [
    "Investors don't buy profits; they buy cash they can eventually take out of a business. Free cash flow is that cash: what is left after the company has paid its operating costs, its taxes and the investment it needs to keep growing.",
    "Get the definition wrong and every number downstream, from enterprise value to share price, is wrong with it.",
  ],
  sections: [
    {
      id: "ufcf",
      title: "Unlevered free cash flow",
      blocks: [
        { kind: "formula", expr: "FCFF = EBIT × (1 − t) + D&A − Capex − ΔNWC", terms: [["EBIT × (1 − t)", "NOPAT: operating profit after tax, as if the company had no debt"], ["D&A", "added back: non-cash expense"], ["Capex", "cash spent on long-term assets"], ["ΔNWC", "increase in net working capital: cash tied up in operations"]] },
        { kind: "p", text: "\"Unlevered\" means before any payments to lenders. Tax is computed on EBIT, ignoring the interest deduction, because the benefit of debt is captured in the after-tax cost of debt inside WACC. FCFF is the cash available to **all** capital providers, so it is discounted at WACC and gives **enterprise value**." },
        { kind: "table", head: ["Line", "Amount"], rows: [
          ["EBIT", money(ebit)],
          ["− Tax at 25% on EBIT", money(-ebit * tax)],
          ["= NOPAT", money(ebit * (1 - tax))],
          ["+ D&A", money(da)],
          ["− Capex", money(-capex)],
          ["− Increase in NWC", money(-dNwc)],
          ["**= Unlevered FCF**", `**${money(ufcf)}**`],
        ] },
      ],
    },
    {
      id: "fcfe",
      title: "Levered free cash flow",
      blocks: [
        { kind: "formula", expr: "FCFE = FCFF − Interest × (1 − t) + Net borrowing", terms: [["Net borrowing", "new debt raised minus debt repaid"]] },
        { kind: "p", text: `With interest of ${money(interest)} and net new borrowing of ${money(netBorrow)}, FCFE is ${money(ufcf)} − ${money(interest * (1 - tax), 1)} + ${money(netBorrow)} = **${money(fcfeVal, 1)}**. FCFE is the cash available to shareholders alone, so it is discounted at the **cost of equity** and gives **equity value** directly.` },
        { kind: "table", head: ["Cash flow", "Belongs to", "Discount at", "Gives"], rows: [
          ["Unlevered FCF (FCFF)", "Debt and equity holders", "WACC", "Enterprise value"],
          ["Levered FCF (FCFE)", "Equity holders", "Cost of equity", "Equity value"],
          ["Dividends", "Equity holders", "Cost of equity", "Equity value (DDM)"],
        ] },
        { kind: "callout", tone: "warning", title: "The mismatch error", text: [
          "Discounting FCFE at WACC, or FCFF at the cost of equity, is one of the most common valuation errors. Match the cash flow to the capital it belongs to. Banks and insurers are valued on FCFE or dividends, because for them debt is raw material, not financing.",
        ] },
      ],
    },
    {
      id: "judgement",
      title: "The judgement calls",
      blocks: [
        { kind: "h", text: "Share-based compensation" },
        { kind: "p", text: "Many technology companies pay employees partly in stock. It is a non-cash expense, so it is added back in cash from operations, and many \"adjusted\" FCF figures exclude it. But it is a real cost: shareholders are diluted. Treat it consistently: either keep it as an expense in FCF (the conservative and increasingly standard approach) or add it back and model the future dilution in the share count. Never add it back and ignore dilution. The Apple case makes you decide." },
        { kind: "h", text: "Maintenance versus growth capex" },
        { kind: "p", text: "Capex has two parts: what keeps existing capacity running and what builds new capacity. Companies rarely split them. In the terminal year of a DCF, capex should support only the terminal growth rate, so a common rule is to set capex modestly above D&A for a growing company, never far below it." },
        { kind: "h", text: "Leases" },
        { kind: "p", text: "Under IFRS 16 and Ind AS 116, lease payments are split into depreciation and interest, so EBITDA excludes rent. If you use post-IFRS 16 EBITDA, treat lease liabilities as debt in the EV bridge. If you deduct lease payments in FCF, don't also subtract lease liabilities. Consistency is everything." },
        { kind: "callout", tone: "desk", title: "What practitioners check first", text: [
          "FCF conversion (FCF ÷ net income or FCF ÷ EBITDA) over several years. A company whose FCF consistently trails its profits has an earnings quality problem or heavy reinvestment needs; either way, valuing it on earnings multiples will overstate its worth.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "FCF has one definition.", practice: "Companies, data providers and analysts each use their own. \"Free cash flow\" in a press release is often CFO − capex (a levered measure) and may exclude leases or acquisitions." },
    { theory: "Capex is a clear number.", practice: "Acquisitions, capitalised software and leased assets are all forms of investment that may not appear in the capex line. Serial acquirers can look cash-rich while spending heavily on deals." },
    { theory: "Stock comp is non-cash, add it back.", practice: "Serious investors treat it as a real expense. At some large tech firms it is a big share of operating cash flow." },
  ],
  mistakes: [
    "Taxing EBIT after subtracting interest in an unlevered FCF.",
    "Subtracting the level of working capital instead of its change.",
    "Adding back share-based compensation and ignoring the dilution it causes.",
    "Discounting levered FCF at WACC.",
  ],
  interview: [
    { q: "Why do we use EBIT and not net income for unlevered FCF?", a: "Net income is after interest, which is a payment to lenders. Unlevered FCF should be the cash available to all capital providers, so I start from operating profit and tax it as if there were no debt. The tax benefit of debt goes into WACC instead." },
    { q: "Walk me from net income to levered free cash flow.", a: "Net income, plus D&A and other non-cash charges, minus the increase in working capital, gives cash from operations. Subtract capex and add net borrowing and you have FCFE." },
  ],
  quiz: [
    { q: "EBIT 200, tax 25%, D&A 30, capex 50, NWC up 10. Unlevered FCF is:", options: ["120", "140", "170", "180"], answer: 0, why: "200 × 0.75 = 150; 150 + 30 − 50 − 10 = 120." },
    { q: "Levered FCF should be discounted at:", options: ["WACC", "Cost of debt", "Cost of equity", "Risk-free rate"], answer: 2, why: "It belongs to shareholders only, so it is discounted at the return they require." },
  ],
  apply: {
    problems: ["unlevered-free-cash-flow", "cfo-indirect-method", "depreciation-and-cash"],
    models: ["five-year-dcf"],
    cases: [{ slug: "apple-dcf-fy2025", parts: ["ufcf-fy2025", "sbc-treatment"] }],
    tools: ["dcf"],
  },
  glossary: [
    { term: "Unlevered free cash flow (FCFF)", definition: "Cash available to all capital providers: NOPAT + D&A − capex − increase in NWC." },
    { term: "Levered free cash flow (FCFE)", definition: "Cash available to shareholders after interest and net debt flows." },
    { term: "NOPAT", definition: "Net operating profit after tax: EBIT × (1 − tax rate)." },
    { term: "Share-based compensation", definition: "Paying employees in shares or options. Non-cash, but it dilutes existing shareholders." },
    { term: "Maintenance capex", definition: "Capital spending needed to keep existing capacity running, as opposed to growth capex." },
  ],
};

// ---------- DCF ----------

export const dcfCase: DcfInput = {
  baseRevenue: 1000, revenueGrowth: [0.10, 0.09, 0.08, 0.07, 0.06], ebitMargin: [0.18, 0.19, 0.20, 0.20, 0.20],
  taxRate: 0.25, daPctRevenue: 0.04, capexPctRevenue: 0.05, nwcPctRevenue: 0.10,
  wacc: 0.09, terminal: { method: "gordon", growth: 0.03 }, midYear: false, netDebt: 300, dilutedShares: 100,
};
const dcf = runDcf(dcfCase);
const dcfMid = runDcf({ ...dcfCase, midYear: true });
const dcfExit = runDcf({ ...dcfCase, terminal: { method: "exit", evEbitda: 10 } });
const sensW = [0.08, 0.09, 0.10], sensG = [0.02, 0.03, 0.04];
const sens = dcfSensitivity(dcfCase, sensW, sensG);

export const dcfValuation: Lesson = {
  slug: "dcf-valuation",
  title: "Discounted cash flow valuation, end to end",
  summary: "Build a DCF from forecast to share price: projecting free cash flow, terminal value by growth and by exit multiple, the mid-year convention, the bridge to equity, and sensitivity tables.",
  module: "valuation",
  level: "Core",
  prerequisites: ["free-cash-flow", "cost-of-capital-wacc"],
  outcomes: [
    "Forecast five years of unlevered free cash flow from revenue, margin and reinvestment drivers.",
    "Compute a terminal value with the Gordon growth method and an exit multiple, and cross-check one with the other.",
    "Bridge from enterprise value to equity value and value per share.",
    "Build and read a WACC × growth sensitivity table, and explain why the terminal value dominates.",
  ],
  hook: [
    "Every serious valuation, from an equity research target price to a fairness opinion in a merger, has a DCF somewhere in it. It is the only method that values a business from first principles: the cash it will produce and the risk of that cash.",
    "It is also easy to abuse. A DCF is a machine for turning assumptions into a number, and the number is only as good as the assumptions. This lesson teaches you to build one and, just as importantly, to interrogate one.",
  ],
  sections: [
    {
      id: "structure",
      title: "The structure",
      blocks: [
        { kind: "list", ordered: true, items: [
          "**Forecast** unlevered free cash flow for an explicit period, usually 5–10 years, until the business reaches a steady state.",
          "**Terminal value**: the value of all cash flows after the forecast, as a single number at the end of the forecast.",
          "**Discount** both at WACC to today. Their sum is **enterprise value**.",
          "**Bridge** to equity value: subtract net debt and other claims.",
          "**Divide** by diluted shares for value per share.",
        ] },
        { kind: "formula", expr: "EV = Σ FCFₜ / (1 + WACC)ᵗ + TVₙ / (1 + WACC)ⁿ", terms: [["FCFₜ", "unlevered free cash flow in year t"], ["TVₙ", "terminal value at the end of year n"]] },
      ],
    },
    {
      id: "forecast",
      title: "Step 1: the forecast",
      blocks: [
        { kind: "p", text: `A company with ${money(dcfCase.baseRevenue)} of revenue today. Growth slows from 10% to 6%; EBIT margin expands from 18% to 20%. D&A is 4% of revenue, capex 5%, net working capital 10%. Tax 25%, WACC 9%.` },
        { kind: "table", head: ["Year", "Revenue", "EBIT", "NOPAT", "+ D&A", "− Capex", "− ΔNWC", "FCF", "Discount factor", "PV"], rows: dcf.years.map((y) => [
          String(y.year), num(y.revenue, 1), num(y.ebit, 1), num(y.nopat, 1), num(y.da, 1), num(-y.capex, 1), num(-y.changeNwc, 1), num(y.fcf, 1), num(y.discountFactor, 4), num(y.pv, 1),
        ]).concat([["", "", "", "", "", "", "", "", "Sum of PVs", num(dcf.sumPv, 1)]]) },
        { kind: "callout", tone: "desk", title: "Where forecasts come from", text: [
          "Revenue drivers come from the business: volume × price, stores × sales per store, users × revenue per user. Analysts start from management guidance and industry data, then form their own view. A forecast is credible when each driver can be explained and checked against history and peers, not when it is precise.",
        ] },
      ],
    },
    {
      id: "terminal",
      title: "Step 2: terminal value",
      blocks: [
        { kind: "formula", expr: "TV (Gordon) = FCFₙ × (1 + g) / (WACC − g)", terms: [["g", "perpetual growth rate: at or below long-run nominal GDP growth"]] },
        { kind: "formula", expr: "TV (exit multiple) = EBITDAₙ × EV/EBITDA multiple", terms: [["multiple", "what comparable companies trade at today"]] },
        { kind: "p", text: `With 3% perpetual growth, terminal value is ${money(dcf.terminalValue, 1)}, worth **${money(dcf.pvTerminal, 1)}** today. That is **${pct(dcf.terminalShare, 1)} of enterprise value**. Most of the value of a DCF sits beyond the forecast you so carefully built.` },
        { kind: "p", text: `**Cross-check.** The Gordon terminal value implies an exit multiple of **${num(dcf.impliedExitMultiple, 1)}x** final-year EBITDA. If comparable companies trade at 10x, that is consistent. Using a 10x exit multiple instead gives ${money(dcfExit.perShare, 2)} per share, versus ${money(dcf.perShare, 2)} with Gordon growth. Always compute both and ask why they differ.` },
        { kind: "callout", tone: "warning", title: "Terminal growth discipline", text: [
          "No company can grow faster than the economy forever, or it would eventually become the economy. Terminal growth should be at or below long-run nominal GDP growth in the currency of the forecast (and in rupee terms that includes higher Indian inflation). And the terminal year must look like a steady state: capex in line with growth, margins sustainable.",
        ] },
      ],
    },
    {
      id: "bridge",
      title: "Steps 3–5: to value per share",
      blocks: [
        { kind: "table", head: ["", "Amount"], rows: [
          ["Sum of PV of FCF", money(dcf.sumPv, 1)],
          ["+ PV of terminal value", money(dcf.pvTerminal, 1)],
          ["**= Enterprise value**", money(dcf.enterpriseValue, 1)],
          ["− Net debt", money(-dcfCase.netDebt, 1)],
          ["**= Equity value**", money(dcf.equityValue, 1)],
          ["÷ Diluted shares", num(dcfCase.dilutedShares)],
          ["**= Value per share**", money(dcf.perShare, 2)],
        ] },
        { kind: "p", text: "Net debt is the simplest bridge. A full bridge also subtracts preferred stock, minority (non-controlling) interests, lease liabilities if EBITDA excludes rent, and unfunded pensions, and adds non-operating assets such as investments in associates. Diluted shares come from the treasury stock method (see the multiples lesson)." },
        { kind: "h", text: "The mid-year convention" },
        { kind: "p", text: `Cash flows arrive through the year, not on 31 December. Discounting each year's cash flow by half a year less (t − 0.5) reflects that. Here it lifts value per share from ${money(dcf.perShare, 2)} to **${money(dcfMid.perShare, 2)}**. Banks use it by default; for a Gordon terminal value the same half-year shift applies.` },
      ],
    },
    {
      id: "sensitivity",
      title: "Sensitivity: the honest answer is a range",
      blocks: [
        { kind: "table", caption: "Value per share. Rows: WACC. Columns: terminal growth.", head: ["WACC \\ g", ...sensG.map((g) => pct(g, 0))], rows: sens.map((row, i) => [pct(sensW[i], 0), ...row.map((v) => money(v, 2))]) },
        { kind: "p", text: `Moving WACC and terminal growth by just one point each spans ${money(Math.min(...sens.flat()), 2)} to ${money(Math.max(...sens.flat()), 2)} per share, more than a 2x range. This is why a DCF on its own is never the answer: it is a framework for arguing about the assumptions that matter.` },
        { kind: "callout", tone: "desk", title: "How a DCF is used in practice", text: [
          "In investment banking, the DCF appears on a \"football field\" chart next to trading comparables, precedent transactions and, for LBO candidates, an LBO floor. In equity research, it supports a target price and is reverse-engineered: \"what growth does today's share price imply?\" That reverse DCF is often more useful than the forward one.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Forecast five years and stop.", practice: "High-growth companies need 10 years or more before they reach a steady state, otherwise the terminal value carries unsustainable growth." },
    { theory: "Discount at year-end.", practice: "Banks use the mid-year convention and real valuation dates, with a stub period for the part-year until the first forecast year end." },
    { theory: "The DCF gives the value.", practice: "It gives one view. Deals are priced off comps and precedents; the DCF is used to show the price is defensible and to test what the market price implies." },
    { theory: "WACC stays constant.", practice: "For companies whose leverage changes sharply, practitioners use adjusted present value or year-by-year discount rates." },
  ],
  mistakes: [
    "Letting terminal growth exceed long-run GDP growth, or approach WACC.",
    "Using final-year FCF with unusual capex or working capital as the base for the terminal value.",
    "Discounting the terminal value by n + 1 years, or forgetting to discount it at all.",
    "Subtracting gross debt but forgetting to add cash, or mixing basic and diluted shares.",
    "Presenting a DCF value to the cent without a sensitivity table.",
  ],
  interview: [
    { q: "Walk me through a DCF.", a: "Project unlevered free cash flow for five to ten years from revenue, margin, tax, D&A, capex and working capital. Compute a terminal value with a perpetual growth rate or an exit multiple. Discount both at WACC to get enterprise value, subtract net debt and other claims for equity value, and divide by diluted shares." },
    { q: "Which assumptions matter most?", a: "WACC and terminal value, because the terminal value is usually 60–80% of enterprise value. After that, the margin and growth path drive the forecast cash flows." },
    { q: "How would you value a company with negative cash flows today?", a: "A DCF still works if you forecast far enough to reach positive, stable cash flows, often ten years or more, and use a higher discount rate or scenario weights for the risk that it never gets there. I would cross-check with revenue multiples." },
  ],
  quiz: [
    { q: "FCF in the final year is 100, WACC 10%, g 2%. The Gordon terminal value is:", options: ["1,000", "1,250", "1,275", "1,020"], answer: 2, why: "100 × 1.02 ÷ (0.10 − 0.02) = 102 ÷ 0.08 = 1,275." },
    { q: "Raising WACC from 9% to 10%, everything else equal, does what to value?", options: ["Raises it", "Lowers it", "No change", "Depends on net debt"], answer: 1, why: "A higher discount rate reduces the present value of every cash flow, especially the distant terminal value." },
    { q: "The mid-year convention typically:", options: ["Lowers value", "Raises value", "Has no effect", "Only affects the terminal value"], answer: 1, why: "Cash flows are discounted for half a year less, so their present values are higher." },
    { q: "Enterprise value is 2,000, debt 500, cash 200, 100 diluted shares. Value per share is:", options: ["$15", "$17", "$20", "$23"], answer: 1, why: "Equity = 2,000 − 500 + 200 = 1,700; ÷ 100 = $17." },
  ],
  apply: {
    problems: ["terminal-value-gordon", "enterprise-value-bridge", "unlevered-free-cash-flow", "wacc"],
    models: ["five-year-dcf"],
    cases: [{ slug: "apple-dcf-fy2025", parts: ["dcf-model", "tv-share", "net-cash"] }],
    tools: ["dcf"],
  },
  glossary: [
    { term: "DCF", definition: "Discounted cash flow: valuing a business as the present value of its expected free cash flows." },
    { term: "Terminal value", definition: "The value at the end of the forecast of all cash flows beyond it." },
    { term: "Gordon growth method", definition: "Terminal value = next year's cash flow ÷ (discount rate − perpetual growth)." },
    { term: "Exit multiple method", definition: "Terminal value = final-year EBITDA × a multiple from comparable companies." },
    { term: "Mid-year convention", definition: "Discounting each year's cash flow from the middle of the year to reflect cash arriving throughout it." },
    { term: "Reverse DCF", definition: "Solving for the growth or margin assumptions implied by the current share price." },
  ],
};

// ---------- Multiples and enterprise value ----------

const peers: Comp[] = [
  { name: "Peer A", ev: 5200, marketCap: 4600, revenue: 2600, ebitda: 520, netIncome: 250 },
  { name: "Peer B", ev: 3300, marketCap: 3000, revenue: 1800, ebitda: 300, netIncome: 160 },
  { name: "Peer C", ev: 8400, marketCap: 7000, revenue: 3500, ebitda: 700, netIncome: 330 },
  { name: "Peer D", ev: 2100, marketCap: 1700, revenue: 1400, ebitda: 190, netIncome: 85 },
  { name: "Peer E", ev: 6000, marketCap: 5600, revenue: 2400, ebitda: 480, netIncome: 270 },
];
const stats = summarize(peers);
const target = { revenue: 2000, ebitda: 360, netIncome: 180, netDebt: 400, shares: 100 };
const implied = impliedPerShare(target, stats);
const tsmShares = treasuryStockMethod(50, [{ count: 10, strike: 30 }, { count: 4, strike: 60 }]);
const evEx = enterpriseValue({ sharePrice: 50, dilutedShares: 100 + tsmShares, debt: 900, cash: 250, minorityInterest: 60 });

export const multiplesEv: Lesson = {
  slug: "enterprise-value-and-multiples",
  title: "Enterprise value, equity value and valuation multiples",
  summary: "The difference between enterprise and equity value, the full EV bridge, diluted shares with the treasury stock method, and how to value a company with trading comparables.",
  module: "valuation",
  level: "Core",
  prerequisites: ["three-financial-statements"],
  outcomes: [
    "Explain enterprise value versus equity value and bridge between them, including minorities and preferred stock.",
    "Count diluted shares with the treasury stock method.",
    "Pick the right multiple: EV-based multiples with EV-based metrics, equity multiples with equity metrics.",
    "Build a trading comps table and turn it into an implied share price range.",
  ],
  hook: [
    "When people say a company is \"worth ₹1.5 lakh crore\" they usually mean its market capitalisation: the equity. But if you bought every share, you would also inherit its debt and its cash. A buyer cares about the whole business. That is enterprise value, and confusing the two is one of the fastest ways to fail a finance interview.",
  ],
  sections: [
    {
      id: "ev",
      title: "Enterprise value versus equity value",
      blocks: [
        { kind: "formula", expr: "EV = Equity value + Debt − Cash + Preferred + Minority interest − Non-operating investments", terms: [["Equity value", "share price × diluted shares (market capitalisation)"], ["Minority interest", "the part of consolidated subsidiaries owned by outsiders"], ["Non-operating investments", "e.g. stakes in associates, whose earnings sit below EBITDA"]] },
        { kind: "p", text: "Think of buying a house with a mortgage. The house's value is the enterprise value; your equity is what's left after the mortgage. If the house came with a safe full of cash, you would effectively pay less for it. EV is **capital-structure neutral**: two identical businesses with different debt levels have the same EV but different equity values." },
        { kind: "callout", tone: "insight", title: "The consistency rule", text: [
          "A multiple's numerator and denominator must belong to the same investors. EBITDA and revenue are earned before any payment to lenders, so they belong to all capital providers: pair them with **EV**. Net income is what's left for shareholders after interest: pair it with **equity value** (P/E). EV/Net income or Price/EBITDA mixes the two and means nothing.",
        ] },
      ],
    },
    {
      id: "dilution",
      title: "Diluted shares: the treasury stock method",
      blocks: [
        { kind: "p", text: "Options and warrants that are in the money will become shares. The treasury stock method assumes they are exercised and that the company uses the exercise cash to buy back shares at the current price." },
        { kind: "formula", expr: "Net new shares = Options × (1 − Strike / Share price)  for each in-the-money tranche", terms: [] },
        { kind: "p", text: `Share price $50. Tranche 1: 10 options at $30 (in the money) adds 10 × (1 − 30/50) = 4 shares. Tranche 2: 4 options at $60 is out of the money: ignore. Net new shares: **${num(tsmShares, 1)}**. With 100 basic shares, diluted shares are ${num(100 + tsmShares, 1)}.` },
        { kind: "p", text: `Now the full bridge, with debt $900, cash $250 and minority interest $60: EV = $50 × ${num(100 + tsmShares, 1)} + 900 − 250 + 60 = **${money(evEx, 0)}**.` },
        { kind: "callout", tone: "desk", title: "Where to find the inputs", text: [
          "Share counts come from the latest filing's cover page or a recent exchange disclosure, not the weighted average in the EPS note. Option tranches and strike prices sit in the share-based payment note. Debt includes short- and long-term borrowings and, post-IFRS 16, usually lease liabilities. Bankers keep a \"capitalisation table\" for this and update it every time a filing comes out.",
        ] },
      ],
    },
    {
      id: "comps",
      title: "Trading comparables",
      blocks: [
        { kind: "p", text: "Relative valuation asks: what do investors pay for similar businesses today? Pick peers with the same business model, growth, margins, risk and ideally size and geography. Then compute their multiples." },
        { kind: "table", head: ["Peer", "EV", "Mkt cap", "Revenue", "EBITDA", "Net income", "EV/Revenue", "EV/EBITDA", "P/E"], rows: peers.map((c) => [c.name, num(c.ev), num(c.marketCap), num(c.revenue), num(c.ebitda), num(c.netIncome), `${num(c.ev / c.revenue, 2)}x`, `${num(c.ev / c.ebitda, 1)}x`, `${num(c.marketCap / c.netIncome, 1)}x`]).concat([
          ["**25th percentile**", "", "", "", "", "", `${num(stats.evRevenue.q1, 2)}x`, `${num(stats.evEbitda.q1, 1)}x`, `${num(stats.pe.q1, 1)}x`],
          ["**Median**", "", "", "", "", "", `${num(stats.evRevenue.median, 2)}x`, `${num(stats.evEbitda.median, 1)}x`, `${num(stats.pe.median, 1)}x`],
          ["**75th percentile**", "", "", "", "", "", `${num(stats.evRevenue.q3, 2)}x`, `${num(stats.evEbitda.q3, 1)}x`, `${num(stats.pe.q3, 1)}x`],
        ]) },
        { kind: "p", text: `The target has revenue ${money(target.revenue)}, EBITDA ${money(target.ebitda)}, net income ${money(target.netIncome)}, net debt ${money(target.netDebt)} and ${target.shares} shares. Apply each multiple. For EV multiples, subtract net debt before dividing by shares; for P/E, don't.` },
        { kind: "table", head: ["Multiple", "25th pct", "Median", "75th pct"], rows: [
          ["EV/Revenue", ...implied.evRevenue.map((v) => money(v, 2))],
          ["EV/EBITDA", ...implied.evEbitda.map((v) => money(v, 2))],
          ["P/E", ...implied.pe.map((v) => money(v, 2))],
        ] },
        { kind: "p", text: "The output is a range, not a point. EV/EBITDA is usually the anchor for industrial and consumer companies; P/E for banks and insurers; EV/Revenue only when earnings are negative or not meaningful." },
        { kind: "callout", tone: "warning", title: "Forward or trailing?", text: [
          "Trailing (LTM) multiples use the last twelve months' actual numbers; forward multiples use next year's consensus forecast. Markets price the future, so forward multiples are standard in research. Whatever you use, use the same basis for the peers and the target.",
        ] },
      ],
    },
    {
      id: "precedents",
      title: "Precedent transactions and control premiums",
      blocks: [
        { kind: "p", text: "Precedent transactions use the multiples paid in past acquisitions of similar companies. They are usually higher than trading multiples because they include a **control premium** (typically 20–40% over the undisturbed share price) for synergies and control. They are also backward-looking: a deal done at the peak of a cycle may not be a guide today." },
      ],
    },
  ],
  gap: [
    { theory: "Pick comparable companies.", practice: "There are rarely perfect comparables. Analysts argue over the peer set more than over the maths, and companies choose flattering peers in their own IPO documents." },
    { theory: "Use the median multiple.", practice: "Analysts position the target within the range: a faster-growing, higher-margin company deserves a multiple above the median, and they justify it with a regression of multiples on growth or ROIC." },
    { theory: "EBITDA is EBITDA.", practice: "Every company adjusts it differently. Rebuild EBITDA for each peer on the same definition (pre- or post-leases, excluding one-offs) before comparing." },
  ],
  mistakes: [
    "Pairing EV with net income or equity value with EBITDA.",
    "Using basic rather than diluted shares.",
    "Including out-of-the-money options in the diluted count.",
    "Subtracting net debt after applying a P/E multiple.",
    "Ignoring minority interest when the company consolidates a partly owned subsidiary.",
  ],
  interview: [
    { q: "A company raises $100 of debt and holds it as cash. What happens to EV?", a: "Nothing. Debt rises by $100 and cash rises by $100, which cancel in the bridge. Equity value is also unchanged." },
    { q: "Why add minority interest to EV?", a: "Because consolidated EBITDA includes 100% of subsidiaries even when the parent owns less. To keep the multiple consistent, EV must include the value of the part owned by others." },
    { q: "Can enterprise value be lower than equity value?", a: "Yes, when a company has more cash than debt (net cash). Its EV is below its market capitalisation, as with many cash-rich technology companies and, in the Basis case, Hyundai Motor India." },
  ],
  quiz: [
    { q: "Market cap 1,000, debt 300, cash 100, minority interest 50. EV is:", options: ["1,150", "1,250", "1,300", "1,450"], answer: 1, why: "1,000 + 300 − 100 + 50 = 1,250." },
    { q: "Which multiple is consistent?", options: ["EV / Net income", "Market cap / EBITDA", "EV / EBITDA", "Market cap / Revenue"], answer: 2, why: "EBITDA is pre-interest, available to all capital providers, so it pairs with EV." },
    { q: "Share price $40, 20 options with strike $30. Net new shares under TSM:", options: ["5", "15", "20", "0"], answer: 0, why: "20 × (1 − 30/40) = 5." },
  ],
  apply: {
    problems: ["enterprise-value-bridge", "implied-price-from-multiple", "diluted-shares-tsm"],
    models: ["trading-comps-lookups"],
    cases: [{ slug: "hyundai-motor-india-ipo-2024", parts: ["pe-premium", "ev-ebitda", "mcap-floor"] }, { slug: "apple-dcf-fy2025", parts: ["net-cash"] }],
    tools: ["comps"],
  },
  glossary: [
    { term: "Enterprise value (EV)", definition: "The value of a company's operations to all capital providers: equity + debt − cash + preferred + minorities − non-operating assets." },
    { term: "Equity value", definition: "The value belonging to shareholders: share price × diluted shares." },
    { term: "Treasury stock method", definition: "Counting dilution from in-the-money options by assuming the exercise cash buys back shares at the current price." },
    { term: "Trading comparables", definition: "Valuing a company from the multiples at which similar listed companies trade." },
    { term: "Precedent transactions", definition: "Valuing a company from the multiples paid in past acquisitions of similar companies." },
    { term: "Control premium", definition: "The amount an acquirer pays above the market price to gain control of a company." },
    { term: "Minority interest", definition: "The share of consolidated subsidiaries owned by outside shareholders. Also called non-controlling interest." },
  ],
};

// ---------- Dividend discount ----------

const d0 = 2, ddmR = 0.10, ddmG = 0.05;
const ggm = gordonGrowth(d0, ddmR, ddmG);
const two = twoStageDDM(d0, ddmR, 0.15, 5, 0.04);

export const dividendDiscount: Lesson = {
  slug: "dividend-discount-model",
  title: "Dividend discount models",
  summary: "Valuing shares from the dividends they pay: the Gordon growth model, two-stage models, the sustainable growth formula, and why banks are still valued this way.",
  module: "valuation",
  level: "Foundation",
  prerequisites: ["time-value-of-money", "cost-of-capital-wacc"],
  outcomes: [
    "Value a stable dividend payer with the Gordon growth model.",
    "Value a company in two growth phases with a two-stage model.",
    "Link growth to fundamentals: g = retention ratio × ROE.",
    "Back out the market's implied required return or growth from a share price.",
  ],
  hook: [
    "A shareholder who never sells receives only one thing from the company: dividends. So the value of a share should be the present value of all future dividends. That is the oldest valuation model there is, and for banks, utilities and mature consumer companies it is still one of the most useful.",
  ],
  sections: [
    {
      id: "gordon",
      title: "The Gordon growth model",
      blocks: [
        { kind: "formula", expr: "P₀ = D₁ / (r − g) = D₀ × (1 + g) / (r − g)", terms: [["D₀", "dividend just paid"], ["D₁", "next year's dividend"], ["r", "cost of equity"], ["g", "constant dividend growth forever, below r"]] },
        { kind: "p", text: `A company just paid a $${d0} dividend, growing 5% a year forever; cost of equity is 10%. P₀ = 2 × 1.05 ÷ (0.10 − 0.05) = **${money(ggm, 2)}**.` },
        { kind: "p", text: "Rearranged, the model gives the market's implied return: **r = D₁ / P₀ + g**, dividend yield plus growth. This is how analysts sanity-check a cost of equity for a utility." },
      ],
    },
    {
      id: "two-stage",
      title: "Two-stage models",
      blocks: [
        { kind: "p", text: "Few companies grow at one rate forever. A two-stage model discounts each dividend during a high-growth phase, then adds a Gordon terminal value at the end." },
        { kind: "table", head: ["Year", "Dividend (15% growth)", "PV at 10%"], rows: [1, 2, 3, 4, 5].map((t) => {
          const d = d0 * Math.pow(1.15, t);
          return [String(t), money(d, 4), money(d / Math.pow(1.1, t), 4)];
        }) },
        { kind: "p", text: `After year 5, growth settles at 4%. Terminal value at year 5 = D₆ ÷ (0.10 − 0.04), discounted five years. Total value: **${money(two, 2)}**, compared with ${money(ggm, 2)} for the constant-growth version.` },
      ],
    },
    {
      id: "growth",
      title: "Where growth comes from",
      blocks: [
        { kind: "formula", expr: "g = b × ROE", terms: [["b", "retention ratio: share of earnings not paid out (1 − payout ratio)"], ["ROE", "return on equity on the reinvested earnings"]] },
        { kind: "p", text: "A company that pays out 40% of earnings and earns 15% on equity can sustainably grow dividends at 0.6 × 15% = 9%. Growth is not free: it comes from reinvesting earnings that could have been paid out. Growth only creates value if ROE is above the cost of equity." },
        { kind: "callout", tone: "desk", title: "Why banks are valued on dividends or equity", text: [
          "For a bank, debt (deposits) is raw material, not financing, so FCFF and WACC don't make sense. Analysts use dividend discount models, residual income models, or the justified P/B ratio: P/B = (ROE − g) ÷ (r − g). A bank earning an ROE above its cost of equity should trade above book value.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Value = PV of dividends.", practice: "Many companies return cash through buybacks instead of dividends. Analysts use total shareholder payout or FCFE models instead." },
    { theory: "Growth is constant forever.", practice: "Practitioners use two- or three-stage models, and payout ratios that rise as growth slows." },
  ],
  mistakes: [
    "Using D₀ instead of D₁ in the numerator.",
    "Applying Gordon growth to a company growing faster than its cost of equity.",
    "Ignoring buybacks for companies that return cash mainly that way.",
  ],
  interview: [
    { q: "When would you use a DDM rather than a DCF?", a: "For financial institutions where free cash flow is hard to define, and for mature companies with stable, predictable payout policies such as utilities." },
  ],
  quiz: [
    { q: "D₀ = $3, g = 4%, r = 9%. Price is:", options: ["$60.00", "$62.40", "$33.33", "$75.00"], answer: 1, why: "3 × 1.04 ÷ 0.05 = $62.40." },
    { q: "Payout ratio 30%, ROE 20%. Sustainable growth:", options: ["6%", "14%", "20%", "30%"], answer: 1, why: "Retention 70% × 20% = 14%." },
  ],
  apply: {
    problems: ["gordon-growth-price", "two-stage-ddm", "capm-cost-of-equity"],
    models: [],
    cases: [],
    tools: [],
  },
  glossary: [
    { term: "Dividend discount model (DDM)", definition: "Valuing a share as the present value of expected future dividends." },
    { term: "Retention ratio", definition: "Share of earnings kept in the business: 1 − payout ratio." },
    { term: "Sustainable growth rate", definition: "Retention ratio × ROE: the growth a company can fund from its own earnings." },
    { term: "Justified P/B", definition: "(ROE − g) ÷ (r − g): the price-to-book ratio implied by a company's returns and growth." },
  ],
};
