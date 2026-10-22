import { annuityFV, effectiveAnnualRate, fv, irr, mirr, npv, paybackPeriod, pmt, pv } from "@/lib/finance/tvm";
import { money, num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Time value of money ----------

const tvFv = fv(10_000, 0.08, 5);
const tvPv = pv(10_000, 0.08, 5);
const earMonthly = effectiveAnnualRate(0.12, 12);
const earDaily = effectiveAnnualRate(0.12, 365);
const earCont = effectiveAnnualRate(0.12, Infinity);
const sipFv = annuityFV(500, 0.01, 240);
const homePmt = pmt(0.09 / 12, 240, 200_000);
const homeInterest = homePmt * 240 - 200_000;
const prepayMonths = Math.log(1 / (1 - (200_000 * 0.0075) / 2500)) / Math.log(1.0075);

export const timeValueOfMoney: Lesson = {
  slug: "time-value-of-money",
  title: "Time value of money: the one idea behind all of finance",
  summary: "Why a dollar today beats a dollar next year, and how compounding, discounting, annuities and effective rates follow from that single fact.",
  module: "foundations",
  level: "Foundation",
  prerequisites: [],
  outcomes: [
    "Move any cash flow forward (compound) or backward (discount) in time without memorising separate formulas.",
    "Value annuities and perpetuities, the building blocks of loans, bonds and terminal values.",
    "Convert between nominal and effective rates, and explain why a 12% loan can cost 12.68%.",
    "Do all of it in Excel with FV, PV, PMT, NPER and RATE, and know their sign conventions.",
  ],
  hook: [
    "A bank offers you a fixed deposit at 8% for five years. A friend offers to repay a loan of yours with $10,000 in five years instead of $7,000 today. A home-loan brochure advertises 9% but the monthly EMI feels much bigger than 9% of anything. Every one of these is the same question in disguise: **what is money at one date worth at another date?**",
    "Valuation, bond pricing, loan EMIs, IRR, pension planning and option pricing all rest on this single idea. Get it into your bones and the rest of finance becomes bookkeeping on top.",
  ],
  sections: [
    {
      id: "why",
      title: "Why money has a time value",
      blocks: [
        { kind: "p", text: "A dollar today is worth more than a dollar in a year for three separate reasons, and it helps to keep them apart because each one shows up in a different part of the discount rate:" },
        { kind: "list", items: [
          "**Opportunity cost.** A dollar today can be invested and earn a return. Waiting means giving that return up. This is the **real risk-free rate**.",
          "**Inflation.** Prices rise, so a future dollar buys less. Add expected inflation and you get the **nominal risk-free rate**, roughly the government bond yield.",
          "**Risk.** A promised future dollar might not arrive. The less certain it is, the more you discount it. This is the **risk premium**, and it is where most of the judgement in finance lives.",
        ] },
        { kind: "callout", tone: "insight", title: "The discount rate is a price", text: [
          "When an analyst says \"discount at 11%\", they are saying \"investors who take this kind of risk demand 11% a year\". The discount rate is not a property of the cash flows; it is the return the market requires for bearing their timing and risk. That is why the same cash flows can be worth very different amounts to a government (low rate) and a venture investor (high rate).",
        ] },
      ],
    },
    {
      id: "compounding",
      title: "Compounding and discounting",
      blocks: [
        { kind: "p", text: "Money growing at rate r for one period becomes PV × (1 + r). Over n periods the growth compounds, because each period's interest itself earns interest:" },
        { kind: "formula", expr: "FV = PV × (1 + r)^n", terms: [["FV", "future value: what the money is worth after n periods"], ["PV", "present value: what it is worth today"], ["r", "rate per period (a year, a month: it must match n)"], ["n", "number of periods"]] },
        { kind: "p", text: "Discounting is the same equation solved the other way. It answers \"what amount today grows into this future amount?\"" },
        { kind: "formula", expr: "PV = FV / (1 + r)^n", terms: [["1 / (1 + r)^n", "the **discount factor**: today's value of $1 received at n"]] },
        { kind: "h", text: "Worked example" },
        { kind: "p", text: `$10,000 invested at 8% a year for 5 years grows to **${money(tvFv, 2)}**. Run it the other way: $10,000 promised in 5 years is worth **${money(tvPv, 2)}** today at 8%. So your friend's offer of $10,000 in five years versus $7,000 now: at 8%, the future $10,000 is worth only ${money(tvPv, 0)} today, so take the $7,000.` },
        { kind: "table", head: ["Year", "Opening", "Interest at 8%", "Closing"], rows: [0, 1, 2, 3, 4].map((y) => {
          const open = fv(10_000, 0.08, y);
          return [String(y + 1), money(open, 2), money(open * 0.08, 2), money(open * 1.08, 2)];
        }), caption: "Interest grows every year because it is earned on a growing balance." },
        { kind: "callout", tone: "insight", title: "The rule of 72", text: [
          "Money doubles in roughly 72 ÷ (rate in %) years. At 8%, about 9 years; at 12%, about 6. It is accurate to within a few months for rates between 4% and 15% and is the fastest sanity check you can do in an interview or a meeting.",
        ] },
      ],
    },
    {
      id: "annuities",
      title: "Annuities and perpetuities: valuing a stream",
      blocks: [
        { kind: "p", text: "Most real cash flows are streams: rent, EMIs, coupons, dividends, monthly SIP investments. You could discount each payment separately, but two closed forms save the work." },
        { kind: "formula", expr: "PV of annuity = C × [1 − (1 + r)^−n] / r", terms: [["C", "the level payment each period"], ["n", "number of payments"], ["r", "rate per period"]] },
        { kind: "formula", expr: "FV of annuity = C × [(1 + r)^n − 1] / r", terms: [] },
        { kind: "formula", expr: "PV of growing perpetuity = C₁ / (r − g)", terms: [["C₁", "the **next** payment, one period from now"], ["g", "growth rate of the payment forever; must be below r"]] },
        { kind: "p", text: `**SIP example.** Investing $500 a month for 20 years at 1% a month (about 12% a year) builds **${money(sipFv, 0)}**. You put in only ${money(500 * 240, 0)}; the rest is compounding. This is why starting five years earlier matters more than investing a little more each month.` },
        { kind: "p", text: "The growing perpetuity is the most important formula in valuation. It is the **Gordon growth model** for share prices and the **terminal value** in every DCF. Its weakness is obvious from the denominator: as g approaches r, the value explodes, so small changes in assumptions move it a lot." },
        { kind: "callout", tone: "warning", title: "Ordinary annuity or annuity due?", text: [
          "The formulas above assume payments at the **end** of each period (an ordinary annuity: loan EMIs, bond coupons). Rent and insurance premiums are paid at the **start** (an annuity due). An annuity due is worth exactly (1 + r) times the ordinary one, because every payment arrives one period earlier. In Excel this is the final `type` argument: 0 for end, 1 for start.",
        ] },
      ],
    },
    {
      id: "rates",
      title: "Nominal versus effective rates",
      blocks: [
        { kind: "p", text: "A rate quoted \"12% a year, compounded monthly\" means 1% a month. Because each month's interest compounds, a year at 1% a month is worth more than 12%." },
        { kind: "formula", expr: "EAR = (1 + APR / m)^m − 1", terms: [["APR", "the nominal annual rate that is quoted"], ["m", "compounding periods per year"], ["EAR", "effective annual rate: what you actually earn or pay over a year"]] },
        { kind: "table", head: ["12% quoted, compounded", "Effective annual rate"], rows: [
          ["Annually", "12%"],
          ["Monthly", pct(earMonthly, 3)],
          ["Daily", pct(earDaily, 3)],
          ["Continuously (e^0.12 − 1)", pct(earCont, 3)],
        ] },
        { kind: "callout", tone: "desk", title: "Where this matters on the job", text: [
          "Credit cards, payday loans and buy-now-pay-later products quote monthly rates that look small. A \"2% a month\" card costs (1.02)^12 − 1 = 26.8% a year. Regulators in many countries require lenders to disclose an APR or effective rate for exactly this reason, and banks' treasury desks always compare instruments on an effective basis.",
        ] },
        { kind: "p", text: `**Home-loan example.** A $200,000 loan at 9% for 20 years has a monthly payment of **${money(homePmt, 2)}** (rate 0.75% a month, 240 months). Over the life of the loan you repay ${money(homePmt * 240, 0)}, of which **${money(homeInterest, 0)}** is interest: more than the original loan. Early payments are mostly interest, which is why a prepayment in year 2 saves far more than one in year 18.` },
      ],
    },
    {
      id: "excel",
      title: "In Excel: the five TVM functions",
      blocks: [
        { kind: "p", text: "Excel's TVM functions all share the same five arguments: `rate`, `nper`, `pmt`, `pv` and `fv`. Give any four and a function solves for the fifth. They use a **cash-flow sign convention**: money leaving your pocket is negative, money arriving is positive. If you forget, you get a negative answer or a #NUM! error." },
        { kind: "excel", title: "Each line solves one example from this lesson", rows: [
          ["B1", "=FV(8%, 5, 0, -10000)", money(tvFv, 2)],
          ["B2", "=PV(8%, 5, 0, 10000)", `−${money(tvPv, 2)}`],
          ["B3", "=PMT(9%/12, 240, -200000)", money(homePmt, 2)],
          ["B4", "=FV(1%, 240, -500)", money(sipFv, 2)],
          ["B5", "=NPER(9%/12, 2500, -200000)", `${num(prepayMonths, 1)} months`],
          ["B6", "=RATE(5, 0, -7000, 10000)", pct(Math.pow(10_000 / 7_000, 1 / 5) - 1, 2)],
          ["B7", "=(1+12%/12)^12-1", pct(earMonthly, 3)],
        ] },
        { kind: "p", text: `B5 shows the power of prepaying: raising the EMI from ${money(homePmt, 0)} to $2,500 cuts the loan from 240 months to about ${num(prepayMonths, 0)}. B6 tells you the friend's offer implies a return of ${pct(Math.pow(10_000 / 7_000, 1 / 5) - 1, 2)} a year, below the 8% fixed deposit.` },
      ],
    },
  ],
  gap: [
    { theory: "One discount rate for every year.", practice: "Banks and bond desks use a different rate for each maturity (the yield curve). A 1-year cash flow and a 10-year cash flow are discounted at different rates." },
    { theory: "Cash flows arrive exactly at year end.", practice: "Real cash flows arrive on specific dates. Practitioners use XNPV and XIRR with actual dates, and DCFs often use a mid-year convention." },
    { theory: "Rates are given.", practice: "Choosing the rate is the hard part. Two analysts with identical forecasts can disagree on value only because they disagree on risk." },
    { theory: "Compounding is annual unless stated.", practice: "Loans compound monthly, bonds semi-annually (US) or annually (many European), money markets daily. Always ask \"compounded how often?\" before comparing two rates." },
  ],
  mistakes: [
    "Mixing periods: using an annual rate with monthly periods. 9% for 240 months is not 9% per month; divide the rate by 12.",
    "Treating the growing perpetuity numerator as today's payment. The formula needs **next** period's payment, C₀ × (1 + g).",
    "Comparing a nominal rate with an effective one. 12% compounded monthly beats 12.5% compounded annually? No: 12.68% vs 12.5%, so it costs more.",
    "Forgetting Excel's sign convention, then \"fixing\" it with ABS() and losing track of which flows are in and out.",
  ],
  interview: [
    { q: "Would you rather have $1,000 today or $1,100 in a year?", a: "It depends on the rate I can earn and the risk of the $1,100. At a 10% required return they are equal. If I can safely earn more than 10%, or the future payment is risky, I take $1,000 today. The point is that the comparison only makes sense after discounting." },
    { q: "What is the present value of a perpetuity paying $100 a year at 5%?", a: "$100 ÷ 0.05 = $2,000. If the payment grows at 2% a year and the next payment is $100, it is $100 ÷ (0.05 − 0.02) = $3,333." },
    { q: "Why is a 30-year loan so much more expensive in total interest than a 15-year loan?", a: "Because the balance stays high for longer. Each EMI is mostly interest in the early years, and on a 30-year loan the principal is paid down slowly, so interest is charged on a large balance for many more periods." },
  ],
  quiz: [
    { q: "$1,000 grows at 10% a year. Roughly how many years until it doubles?", options: ["5", "7", "10", "14"], answer: 1, why: "Rule of 72: 72 ÷ 10 ≈ 7.2 years. The exact answer is ln 2 ÷ ln 1.1 = 7.27." },
    { q: "Which is worth more today at a positive discount rate: an ordinary annuity or an annuity due with the same payments?", options: ["Ordinary annuity", "Annuity due", "They are equal", "It depends on the number of payments"], answer: 1, why: "Each payment of an annuity due arrives one period earlier, so its value is the ordinary annuity × (1 + r)." },
    { q: "A loan quotes 18% a year compounded monthly. What is the effective annual rate?", options: ["18.00%", "18.81%", "19.56%", "21.60%"], answer: 2, why: "(1 + 0.18/12)^12 − 1 = 1.015^12 − 1 = 19.56%." },
    { q: "In a growing perpetuity, what happens to value as growth approaches the discount rate?", options: ["It approaches zero", "It stays roughly constant", "It rises without limit", "It becomes negative"], answer: 2, why: "The denominator r − g shrinks toward zero, so value explodes. That is why terminal growth assumptions must stay well below the discount rate." },
  ],
  apply: {
    problems: ["effective-annual-rate", "loan-payment", "project-npv"],
    models: ["term-loan-amortisation"],
    cases: [],
    tools: ["tvm", "loan"],
  },
  glossary: [
    { term: "Present value", definition: "What a future cash flow is worth today, found by discounting it at the required return." },
    { term: "Discount factor", definition: "1 ÷ (1 + r)^n: today's value of one unit of money received n periods from now." },
    { term: "Annuity", definition: "A stream of equal payments at regular intervals for a fixed number of periods." },
    { term: "Perpetuity", definition: "A stream of payments that continues forever. With growth g and rate r, worth C₁ ÷ (r − g)." },
    { term: "Effective annual rate (EAR)", definition: "The rate actually earned or paid over a year once intra-year compounding is included." },
    { term: "APR", definition: "Annual percentage rate: the nominal yearly rate quoted before the effect of compounding." },
  ],
};

// ---------- Capital budgeting ----------

const proj = [-1000, 300, 400, 400, 300];
const projNpv = npv(0.1, proj);
const projIrr = irr(proj);
const projMirr = mirr(proj, 0.1, 0.1);
const projPayback = paybackPeriod(proj);
const projDiscPayback = paybackPeriod(proj, 0.1);
const smallA = [-100, 150];
const bigB = [-1000, 1300];
const multi = [-100, 230, -132];

export const capitalBudgeting: Lesson = {
  slug: "npv-irr-capital-budgeting",
  title: "NPV, IRR and payback: deciding what to invest in",
  summary: "How companies decide which projects to fund, why NPV is the rule that creates value, and where IRR and payback mislead.",
  module: "foundations",
  level: "Foundation",
  prerequisites: ["time-value-of-money"],
  outcomes: [
    "Compute NPV, IRR, MIRR, payback and discounted payback for a project.",
    "Explain why a positive NPV is the same thing as creating shareholder value.",
    "Spot the three situations where IRR gives the wrong answer: scale, timing and multiple sign changes.",
    "Use XNPV and XIRR for cash flows on real dates, the way funds and deal teams do.",
  ],
  hook: [
    "A manufacturing company has ₹500 crore to spend and five proposals on the table: a new plant, a solar rooftop, an ERP upgrade, an acquisition and a share buyback. Each team swears its project is the best. The CFO needs one consistent yardstick.",
    "That yardstick is **net present value**. It is the most important decision rule in corporate finance, and it is exactly what an equity analyst does when valuing a whole company: a company is just a portfolio of projects.",
  ],
  sections: [
    {
      id: "npv",
      title: "Net present value",
      blocks: [
        { kind: "formula", expr: "NPV = Σ CFₜ / (1 + r)ᵗ  for t = 0 … n", terms: [["CFₜ", "cash flow in year t; CF₀ is usually the negative upfront investment"], ["r", "the required return for projects of this risk (often the WACC)"]] },
        { kind: "p", text: "NPV is what the project is worth today **over and above** what it costs, after paying every investor the return they require. A positive NPV means the project earns more than the cost of capital, so accepting it raises the value of the firm by exactly the NPV. A negative NPV destroys value even if the project is \"profitable\" in accounting terms." },
        { kind: "h", text: "Worked example" },
        { kind: "p", text: `A project costs $1,000 and returns $300, $400, $400 and $300 over four years. The company's cost of capital is 10%.` },
        { kind: "table", head: ["Year", "Cash flow", "Discount factor at 10%", "Present value"], rows: proj.map((cf, t) => [String(t), money(cf), num(1 / Math.pow(1.1, t), 4), money(cf / Math.pow(1.1, t), 2)]).concat([["", "", "NPV", money(projNpv, 2)]]) },
        { kind: "p", text: `NPV is **${money(projNpv, 2)}**: accept. Shareholders end up ${money(projNpv, 0)} richer than if the company had returned the $1,000 to them.` },
        { kind: "callout", tone: "insight", title: "NPV is additive", text: [
          "The NPV of two projects together is the sum of their NPVs. No other rule has this property. It is why NPV lets a CFO rank and combine projects, and why a DCF of a whole company is the sum of the present values of its cash flows.",
        ] },
      ],
    },
    {
      id: "irr",
      title: "Internal rate of return",
      blocks: [
        { kind: "p", text: "IRR is the discount rate that makes NPV exactly zero. It is the project's own compound annual return. The rule: accept if IRR is above the cost of capital." },
        { kind: "formula", expr: "0 = Σ CFₜ / (1 + IRR)ᵗ", terms: [["IRR", "solved by trial and error: there is no closed-form formula for more than two cash flows"]] },
        { kind: "p", text: `For the project above, IRR is **${pct(projIrr, 2)}**, above the 10% hurdle, so IRR agrees with NPV here. Executives love IRR because a percentage is easy to compare with a hurdle rate. But it has three well-known failures.` },
        { kind: "h", text: "Failure 1: scale" },
        { kind: "p", text: `Project A costs $100 and returns $150 next year: IRR ${pct(irr(smallA), 0)}, NPV at 10% ${money(npv(0.1, smallA), 2)}. Project B costs $1,000 and returns $1,300: IRR ${pct(irr(bigB), 0)}, NPV ${money(npv(0.1, bigB), 2)}. If you can only pick one, IRR picks A, but B makes shareholders ${money(npv(0.1, bigB) - npv(0.1, smallA), 2)} richer. Percentages ignore size.` },
        { kind: "h", text: "Failure 2: reinvestment and timing" },
        { kind: "p", text: "IRR implicitly assumes interim cash flows are reinvested at the IRR itself. A project with a 40% IRR that pays back quickly assumes you can keep finding 40% opportunities. **MIRR** fixes this by reinvesting at a realistic rate (usually the cost of capital)." },
        { kind: "p", text: `For our project, MIRR with 10% finance and reinvestment rates is **${pct(projMirr, 2)}**, lower than the ${pct(projIrr, 2)} IRR and a fairer description of the return you will actually earn.` },
        { kind: "h", text: "Failure 3: more than one IRR" },
        { kind: "p", text: `When cash flows change sign more than once (an upfront cost, then inflows, then a big clean-up or decommissioning cost), there can be several IRRs. Cash flows of −100, +230, −132 have IRRs of **both 10% and 20%**: plug either rate in and NPV is zero (to the cent: ${money(npv(0.1, multi), 2)} and ${money(npv(0.2, multi), 2)}). Which one is \"the\" return? Neither. Use NPV.` },
      ],
    },
    {
      id: "payback",
      title: "Payback and discounted payback",
      blocks: [
        { kind: "p", text: "Payback is the time it takes to recover the initial investment. It ignores the time value of money and everything after the payback date, which is why textbooks dismiss it. Managers still use it, for good reasons: it is a crude measure of **liquidity and risk**. A project that pays back in 2 years is less exposed to technology change or political risk than one that pays back in 9." },
        { kind: "table", head: ["Year", "Cash flow", "Cumulative", "PV at 10%", "Cumulative PV"], rows: proj.map((cf, t) => {
          const cum = proj.slice(0, t + 1).reduce((s, x) => s + x, 0);
          const cumPv = proj.slice(0, t + 1).reduce((s, x, k) => s + x / Math.pow(1.1, k), 0);
          return [String(t), money(cf), money(cum), money(cf / Math.pow(1.1, t), 2), money(cumPv, 2)];
        }) },
        { kind: "p", text: `Simple payback is **${num(projPayback, 2)} years** (after year 2 you still need $300 of year 3's $400). Discounted payback, which uses present values, is **${num(projDiscPayback, 2)} years**. Discounted payback is always longer, and a project with positive NPV always has a discounted payback within its life.` },
      ],
    },
    {
      id: "cash-flows",
      title: "Which cash flows count",
      blocks: [
        { kind: "p", text: "Most capital budgeting errors in practice are not discounting errors; they are errors in deciding which cash flows belong in the analysis. The rule: include **incremental, after-tax cash flows** that happen because of the decision, and nothing else." },
        { kind: "list", items: [
          "**Sunk costs are out.** The ₹20 crore already spent on a feasibility study is gone whether you build or not.",
          "**Opportunity costs are in.** If the plant uses land the company could sell for ₹50 crore, that ₹50 crore is a cost of the project.",
          "**Working capital is in.** A new product line needs inventory and receivables up front; that cash comes back when the project winds down.",
          "**Cannibalisation is in.** If a new phone steals sales from the old model, only the net gain counts.",
          "**Financing costs are out of the cash flows.** Interest is captured in the discount rate (WACC). Subtracting interest and discounting at WACC counts it twice.",
          "**Depreciation is out, but its tax shield is in.** Depreciation is not cash, but it reduces taxes, which is cash.",
        ] },
        { kind: "callout", tone: "desk", title: "How it really happens", text: [
          "In large companies, project cash flows are built by the business team and challenged by FP&A. The arguments are almost never about the formula; they are about the volume ramp-up, price erosion, and whether the terminal value is realistic. Experienced reviewers look first at what share of NPV comes after year 5, because that is where optimism hides.",
        ] },
      ],
    },
    {
      id: "excel",
      title: "In Excel",
      blocks: [
        { kind: "p", text: "Excel's `NPV` function is a famous trap: it assumes the **first** value in the range is one period away. Put the year-0 investment outside the function." },
        { kind: "excel", title: "Cash flows in B2:F2 (year 0 to 4), rate 10% in B1", rows: [
          ["B4", "=B2+NPV(B1, C2:F2)", money(projNpv, 2)],
          ["B5", "=NPV(B1, B2:F2)", `${money(projNpv / 1.1, 2)}  ← wrong: discounts year 0 by a year`],
          ["B6", "=IRR(B2:F2)", pct(projIrr, 2)],
          ["B7", "=MIRR(B2:F2, B1, B1)", pct(projMirr, 2)],
          ["B8", "=XIRR(values, dates)", "IRR on actual dates, annualised"],
        ] },
        { kind: "p", text: "Funds, project finance teams and anyone with irregular dates use `XNPV` and `XIRR`, which take a column of dates and compound on the actual days between flows. The Basis model task on fund returns makes you build exactly this." },
      ],
    },
  ],
  gap: [
    { theory: "Accept every positive-NPV project.", practice: "Capital is rationed. Companies rank projects by NPV per rupee invested (profitability index) and fund the best until the budget runs out." },
    { theory: "Use one hurdle rate, the WACC.", practice: "Riskier divisions or countries get higher hurdle rates. Many firms also add a cushion of a few percentage points to offset optimistic forecasts." },
    { theory: "Payback is a flawed rule; ignore it.", practice: "Boards ask for payback in nearly every capex approval, especially in volatile markets, as a quick measure of how long capital is at risk." },
    { theory: "IRR assumes reinvestment at the IRR.", practice: "PE funds still headline IRR because LPs compare funds on it, but sophisticated LPs also ask for MOIC and look at how subscription lines and early exits inflate IRR." },
  ],
  mistakes: [
    `Using Excel's NPV over the whole range including year 0, which here gives ${money(projNpv / 1.1, 2)} instead of ${money(projNpv, 2)}.`,
    "Ranking mutually exclusive projects by IRR instead of NPV.",
    "Including sunk costs or excluding opportunity costs.",
    "Subtracting interest from cash flows and then discounting at WACC, counting the cost of debt twice.",
    "Forgetting that working capital invested at the start comes back at the end.",
  ],
  interview: [
    { q: "NPV and IRR give different rankings for two projects. Which do you follow?", a: "NPV. It measures the value created in currency, it is additive, and it uses a realistic reinvestment rate. IRR can mislead on scale, timing and when cash flows change sign more than once." },
    { q: "Can a project have a high IRR and a negative NPV?", a: "Not for a conventional project with one outflow followed by inflows. If IRR is above the discount rate, NPV is positive. With non-conventional flows (multiple sign changes) the link breaks, which is one reason to rely on NPV." },
    { q: "Should depreciation be in a project's cash flows?", a: "Depreciation itself is not a cash flow, but because it is tax-deductible it reduces cash taxes. So I compute taxes after depreciation, then add depreciation back: the tax shield of depreciation × tax rate stays in." },
  ],
  quiz: [
    { q: "A project's IRR is 14% and the cost of capital is 11%. For a conventional project, NPV is:", options: ["Negative", "Zero", "Positive", "Can't tell"], answer: 2, why: "With one sign change, NPV is positive at any discount rate below the IRR." },
    { q: "Which cost should be excluded from a project's cash flows?", options: ["Extra working capital", "Market research already paid for", "Lost sales of an existing product", "Rent you could have earned on idle land"], answer: 1, why: "Money already spent is sunk: it doesn't change with the decision. The others are incremental." },
    { q: "Excel `=NPV(10%, B2:F2)` where B2 is the year-0 cost. The result is:", options: ["Correct", "Too high by the year-0 cost", "The true NPV divided by 1.1", "The IRR"], answer: 2, why: "Excel's NPV treats the first value as one period away, so every flow is discounted one extra year: the result is the true NPV ÷ 1.1." },
    { q: "Why can a project have two IRRs?", options: ["Because its NPV is zero", "Because its cash flows change sign more than once", "Because the discount rate is negative", "Because of inflation"], answer: 1, why: "Each sign change can add a root to the NPV polynomial. Two sign changes allow up to two IRRs." },
  ],
  apply: {
    problems: ["project-npv", "project-irr", "payback-period"],
    models: ["fund-returns-xirr"],
    cases: [],
    tools: ["tvm"],
  },
  glossary: [
    { term: "Net present value (NPV)", definition: "The sum of a project's discounted cash flows, including the initial investment. Positive NPV creates value." },
    { term: "Internal rate of return (IRR)", definition: "The discount rate that makes NPV zero: the project's own compound annual return." },
    { term: "MIRR", definition: "Modified IRR: assumes interim cash flows are reinvested at a chosen rate, usually the cost of capital." },
    { term: "Payback period", definition: "Years until cumulative cash flows recover the initial investment, ignoring discounting." },
    { term: "Sunk cost", definition: "Money already spent that cannot be recovered. It should not affect a decision." },
    { term: "Hurdle rate", definition: "The minimum return a project must earn to be accepted, usually the cost of capital plus any risk adjustment." },
  ],
};
