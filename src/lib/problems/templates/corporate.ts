import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";
import { irr, npv, paybackPeriod, pmt, effectiveAnnualRate } from "@/lib/finance/tvm";
import { wacc, accretionDilution, treasuryStockMethod } from "@/lib/finance/corporate";
import { arr, discountTable, interpolationLine, irrTrialTable, irrTrials, n, p, table } from "../explain";

export const corporate: Template[] = [
  {
    slug: "project-npv",
    title: "Project NPV",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["NPV", "Capital budgeting"],
    generate(rng) {
      const c0 = pick(rng, 800, 2000, 50), r = pick(rng, 0.06, 0.14, 0.01);
      const cfs = [1, 2, 3].map(() => pick(rng, 200, 900, 25));
      const flows = [-c0, ...cfs];
      const ans = npv(r, flows);
      const pvIn = ans + c0;
      return {
        blocks: [
          { kind: "p", text: `A project costs **${money(c0)}** today and returns the cash flows below at the end of each year. The discount rate is **${pct(r)}**.` },
          { kind: "table", head: ["Year", "0", "1", "2", "3"], rows: [["Cash flow", ...flows.map((x) => num(x))]] },
        ],
        question: "What is the project's NPV?",
        answer: ans, unit: "$", tolerance: { abs: 0.1 },
        solution: {
          idea: [
            `A dollar received next year is worth less than a dollar today, because today's dollar could be invested at ${pct(r)} in the meantime. So future cash flows cannot simply be added to the cost.`,
            "Net present value converts every cash flow into today's dollars by discounting it at the required return, then adds them up. The result is the value the project creates (or destroys) over and above earning the required return elsewhere.",
          ],
          formulas: [
            { expr: "NPV = −C₀ + Σ CFₜ / (1 + r)ᵗ", terms: [
              ["C₀", "The upfront cost, paid today (t = 0)"],
              ["CFₜ", "The cash flow at the end of year t"],
              ["r", "The discount rate: the return investors could earn on a project of similar risk"],
              ["1 / (1 + r)ᵗ", "The discount factor: what $1 in year t is worth today"],
            ] },
          ],
          steps: [
            p(`Discount each cash flow at ${pct(r)}:`),
            discountTable(flows, r),
            p(`PV of inflows = ${cfs.map((c, i) => `${c}/${(1 + r).toFixed(2)}${i ? `^${i + 1}` : ""}`).join(" + ")} = ${money(pvIn, 2)}.`),
            p(`NPV = ${money(pvIn, 2)} − ${money(c0)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            ans >= 0
              ? `NPV is positive, so **accept**. The project returns more than ${pct(r)} and adds ${money(ans, 2)} of value today, on top of paying back the cost and the required return.`
              : `NPV is negative, so **reject**. The project's cash flows are worth only ${money(pvIn, 2)} today, less than the ${money(c0)} it costs; investing at ${pct(r)} elsewhere is better.`,
            `Undiscounted, the inflows total ${money(cfs.reduce((a, b) => a + b, 0))}. The gap to ${money(pvIn, 2)} is the cost of waiting.`,
          ],
          mistakes: [
            `Using Excel's NPV on the whole row including year 0. NPV() treats the first value as arriving in one year, so it discounts everything one period too far: ${money(ans / (1 + r), 2)}.`,
            `Not discounting at all: ${money(cfs.reduce((a, b) => a + b, 0) - c0)}.`,
          ],
          excel: [`\`=NPV(${n(r)},${cfs.join(",")})-${c0}\``, `Wrong: \`=NPV(${n(r)},${flows.join(",")})\` gives ${money(ans / (1 + r), 2)} because it discounts the year-0 cost too.`],
        },
      };
    },
  },
  {
    slug: "project-irr",
    title: "Project IRR",
    track: "Corporate Finance",
    difficulty: "Medium",
    concepts: ["IRR", "Capital budgeting"],
    generate(rng) {
      const c0 = pick(rng, 1000, 3000, 100);
      const cfs = [1, 2, 3, 4].map(() => pick(rng, 250, 1100, 50));
      const flows = [-c0, ...cfs];
      // Inflows that sum exactly to the cost give an IRR of exactly 0; clear the solver's −1e-15 noise.
      const r = Math.abs(irr(flows)) < 1e-9 ? 0 : irr(flows);
      if (!isFinite(r)) return this.generate(rng);
      const sum = cfs.reduce((a, b) => a + b, 0);
      const trials = irrTrials(flows, r);
      const pr = (x: number) => pct(x, 3);
      return {
        blocks: [
          { kind: "p", text: "A project has the cash flows below." },
          { kind: "table", head: ["Year", "0", "1", "2", "3", "4"], rows: [["Cash flow", ...flows.map((x) => num(x))]] },
        ],
        question: "What is its internal rate of return? Enter a percentage to two decimals.",
        answer: r * 100, unit: "%", tolerance: { abs: 0.02 },
        solution: {
          idea: [
            "The internal rate of return is the project's own rate of return: the annual rate at which the money you put in grows into the money you get back. Think of it as the interest rate on a loan you make to the project.",
            "Mechanically, it is the discount rate at which the present value of the inflows exactly equals the cost, so NPV is zero. Discount at a lower rate and NPV is positive; discount at a higher rate and it is negative. The IRR is the break-even point between the two.",
            "With more than two cash flows there is no formula to solve for it directly. You guess a rate, see whether NPV is above or below zero, and adjust. Spreadsheets do exactly this, just faster.",
          ],
          formulas: [
            { expr: "0 = −C₀ + CF₁/(1 + IRR) + CF₂/(1 + IRR)² + CF₃/(1 + IRR)³ + CF₄/(1 + IRR)⁴", terms: [
              ["C₀", `The upfront investment, here ${money(c0)}`],
              ["CFₜ", "The cash flow received at the end of year t"],
              ["IRR", "The single rate that makes the equation hold"],
            ] },
            { expr: "Next guess = r₂ − NPV₂ × (r₂ − r₁) / (NPV₂ − NPV₁)", terms: [
              ["r₁, r₂", "The last two rates tried"],
              ["NPV₁, NPV₂", "The NPV at each of those rates"],
              ["Why it works", "It draws a straight line between the two points and finds where that line crosses zero"],
            ] },
          ],
          steps: [
            p(`**Step 1: try 0%.** At a zero rate nothing is discounted, so NPV is just the sum of the cash flows: −${num(c0)} + ${cfs.join(" + ")} = **${num(sum - c0)}**. ${sum - c0 === 0 ? "That is exactly zero, so the IRR is **0%**: the project pays back its cost and nothing more." : sum - c0 > 0 ? "That is positive, so the IRR is above 0%." : "That is negative: even before allowing for the time value of money the project does not pay back its cost. So the IRR must be **below 0%**."}`),
            ...(r === 0 ? [] : [
              p(`**Step 2: try a second rate** on the other side: ${pr(trials[1].x)} gives NPV = ${num(trials[1].fx, 2)}.`),
              p(`**Step 3: interpolate.** ${interpolationLine(trials[0], trials[1], pr)}`),
              p("**Step 4: repeat** until NPV is within a cent of zero:"),
              irrTrialTable(trials),
            ]),
            p(`**Step 5: check** by discounting every cash flow at ${pct(r, 4)}. The present values of the inflows add back to the ${money(c0)} cost:`),
            discountTable(flows, r),
            p(`IRR = **${num(r * 100, 2)}%**.`),
          ],
          meaning: [
            r === 0
              ? `An IRR of **0.00%** means the project returns exactly its ${money(c0)} cost and nothing more. In economic terms it destroys value: the money comes back later, so you give up the return it could have earned elsewhere. NPV is negative at every positive discount rate, so it fails any sensible hurdle.`
              : r > 0
              ? `The project earns **${(r * 100).toFixed(2)}%** a year on the money tied up in it. Accept it if that beats the cost of capital (the hurdle rate) for a project of this risk; reject it if not. At any discount rate below ${pct(r)} its NPV is positive.`
              : `A **negative IRR** is not an error. It means the cash flows add up to less than the cost (${money(sum)} back for ${money(c0)} in), so the investment loses money in plain dollars, before any discounting. The project shrinks your capital by about ${pct(-r)} a year. Its NPV is negative at every positive discount rate, so it fails any sensible hurdle.`,
            "This project has one sign change (an outflow, then only inflows), so it has exactly one IRR. Projects whose cash flows switch sign more than once, for example with a big clean-up cost at the end, can have two IRRs or none; use NPV for those.",
            "When choosing between mutually exclusive projects, rank by NPV, not IRR. A small project can have a high IRR but create less value than a large one, and IRR implicitly assumes cash is reinvested at the IRR itself.",
          ],
          mistakes: [
            `Entering the decimal ${num(r, 4)} instead of the percentage ${num(r * 100, 2)}.`,
            "Stopping after one interpolation. A straight line between two far-apart guesses is only an approximation because the NPV curve bends; keep iterating until NPV is essentially zero.",
            r < 0 ? "Assuming the answer must be positive and searching only above 0%. Check the sign of NPV at 0% first; it tells you which side the IRR is on." : "Confusing IRR with the average annual cash flow divided by the cost. That ignores timing entirely.",
          ],
          excel: [
            `\`=IRR(${arr(flows, 0)})\` or, with the cash flows in B2:F2, \`=IRR(B2:F2)\`.`,
            r < 0 ? `For a negative IRR, give Excel a starting guess near the answer if it returns #NUM!: \`=IRR(B2:F2,-0.1)\`.` : "If Excel returns #NUM!, add a starting guess as the second argument, for example `=IRR(B2:F2,0.2)`.",
            `Check it: \`=NPV(IRR(B2:F2),C2:F2)+B2\` should return 0.`,
          ],
        },
      };
    },
  },
  {
    slug: "wacc",
    title: "Weighted average cost of capital",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["WACC", "Cost of capital"],
    generate(rng) {
      const e = pick(rng, 300, 900, 50), d = pick(rng, 100, 700, 50);
      const re = pick(rng, 0.08, 0.15, 0.005), rd = pick(rng, 0.03, 0.08, 0.005), t = pick(rng, 0.2, 0.3, 0.01);
      const ans = wacc({ equityValue: e, debtValue: d, costOfEquity: re, preTaxCostOfDebt: rd, taxRate: t }) * 100;
      const we = e / (e + d), wd = d / (e + d);
      return {
        blocks: [{ kind: "p", text: `A company has **${money(e)}m** of equity and **${money(d)}m** of debt at market value. Cost of equity is **${pct(re)}**, pre-tax cost of debt is **${pct(rd)}** and the tax rate is **${pct(t)}**.` }],
        question: "What is the WACC? Enter a percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "A company is funded by shareholders and lenders, and each expects a return. WACC is the blended return the company must earn on its assets to satisfy both, weighted by how much each has put in.",
            "Debt gets a discount: interest is tax-deductible, so each dollar of interest only costs the company (1 − tax rate) dollars after tax.",
          ],
          formulas: [
            { expr: "WACC = E/V × Re + D/V × Rd × (1 − t)", terms: [
              ["E, D", "Market value of equity and debt"],
              ["V = E + D", "Total capital"],
              ["Re", "Cost of equity, the return shareholders require"],
              ["Rd", "Pre-tax cost of debt, the yield lenders require"],
              ["t", "Marginal tax rate, which creates the interest tax shield"],
            ] },
          ],
          steps: [
            p(`V = ${e} + ${d} = ${money(e + d)}m. Weights: E/V = ${e}/${e + d} = ${we.toFixed(4)}, D/V = ${d}/${e + d} = ${wd.toFixed(4)}.`),
            p(`After-tax cost of debt = ${pct(rd)} × (1 − ${pct(t)}) = ${pct(rd * (1 - t), 3)}.`),
            table(["Source", "Weight", "Cost", "Weight × cost"], [
              ["Equity", we.toFixed(4), pct(re), pct(we * re, 3)],
              ["Debt (after tax)", wd.toFixed(4), pct(rd * (1 - t), 3), pct(wd * rd * (1 - t), 3)],
              ["WACC", "1.0000", "", `**${ans.toFixed(2)}%**`],
            ]),
          ],
          meaning: [
            `Projects with the same risk as the company's existing business must earn at least **${ans.toFixed(2)}%** to create value. It is also the rate used to discount unlevered free cash flow in a DCF.`,
            "WACC is only right for average-risk projects. A riskier venture needs a higher rate, even inside the same company.",
          ],
          mistakes: [
            `Forgetting the tax shield on debt: ${pct(we * re + wd * rd, 3)}.`,
            "Using book values for the weights. Use market values, because that is what investors would have to pay today.",
            "Applying (1 − t) to the cost of equity. Dividends are not tax-deductible.",
          ],
          excel: [`\`=${e}/${e + d}*${n(re)}+${d}/${e + d}*${n(rd)}*(1-${n(t)})\``],
        },
      };
    },
  },
  {
    slug: "payback-period",
    title: "Payback period",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["Payback", "Capital budgeting"],
    generate(rng) {
      const c0 = pick(rng, 500, 1500, 50);
      const cfs = [1, 2, 3, 4, 5].map(() => pick(rng, 150, 450, 10));
      const flows = [-c0, ...cfs];
      const ans = paybackPeriod(flows);
      if (!isFinite(ans)) return this.generate(rng);
      // Last year that still ends with the outlay unrecovered (cumulative can land exactly on zero)
      let full = 0;
      for (let t = 1, c = flows[0]; c + flows[t] < 0; c += flows[t], t++) full = t;
      let cum = 0;
      const rows = flows.map((cf, t) => { cum += cf; return [String(t), num(cf), num(cum), t === full + 1 ? "Turns positive here" : ""]; });
      const before = flows.slice(0, full + 1).reduce((a, b) => a + b, 0);
      return {
        blocks: [
          { kind: "p", text: "Cash arrives evenly through each year." },
          { kind: "table", head: ["Year", "0", "1", "2", "3", "4", "5"], rows: [["Cash flow", ...flows.map((x) => num(x))]] },
        ],
        question: "What is the payback period in years? Two decimals.",
        answer: ans, unit: "years", tolerance: { abs: 0.006 },
        solution: {
          idea: [
            "Payback asks a simple question: how long until the project has returned the cash put into it? It is a quick measure of liquidity and risk; the faster the money comes back, the less is exposed.",
            "Because cash arrives evenly through the year, the year in which the running total turns positive can be split: you only need the fraction of that year's cash that covers what is still outstanding.",
          ],
          formulas: [
            { expr: "Payback = Y + Unrecovered at the start of year Y+1 / Cash flow in year Y+1", terms: [
              ["Y", "The last full year in which the cumulative cash flow is still negative"],
              ["Unrecovered", "The amount still to be paid back at the end of year Y"],
            ] },
          ],
          steps: [
            table(["Year", "Cash flow", "Cumulative", ""], rows),
            p(`After year ${full} the project is still ${money(-before)} short. Year ${full + 1} brings ${money(flows[full + 1])}.`),
            p(`Fraction of year ${full + 1} needed = ${num(-before)} / ${num(flows[full + 1])} = ${(-before / flows[full + 1]).toFixed(4)}.`),
            p(`Payback = ${full} + ${(-before / flows[full + 1]).toFixed(4)} = **${ans.toFixed(2)} years**.`),
          ],
          meaning: [
            `The initial ${money(c0)} is back after about ${ans.toFixed(2)} years. Firms often set a maximum payback (say 3 years) as a screen.`,
            "Payback ignores the time value of money and every cash flow after the payback date, so it can reject a project with a large NPV. Use it alongside NPV, not instead of it. Discounted payback fixes the first flaw but not the second.",
          ],
          mistakes: [
            `Rounding up to a whole year (${full + 1}). The question says cash arrives evenly, so interpolate.`,
            "Dividing the shortfall by the cumulative total instead of by that year's cash flow.",
          ],
          excel: [
            "With cash flows in B2:G2, put `=SUM($B$2:B2)` in B3 and fill right for the cumulative row.",
            `Then payback = years before the turn + shortfall / next cash flow, here \`=${full}+${-before}/${flows[full + 1]}\`.`,
          ],
        },
      };
    },
  },
  {
    slug: "loan-payment",
    title: "Monthly loan payment",
    track: "Corporate Finance",
    difficulty: "Medium",
    concepts: ["Annuities", "Amortisation"],
    generate(rng) {
      const pr = pick(rng, 50_000, 600_000, 5_000), r = pick(rng, 0.03, 0.09, 0.0025), y = pick(rng, 5, 30, 5);
      const i = r / 12, nper = y * 12;
      const ans = pmt(i, nper, pr);
      const rows: string[][] = [];
      let bal = pr;
      for (let k = 1; k <= 3; k++) {
        const int = bal * i, prin = ans - int;
        bal -= prin;
        rows.push([String(k), money(ans, 2), money(int, 2), money(prin, 2), money(bal, 2)]);
      }
      const totalInt = ans * nper - pr;
      return {
        blocks: [{ kind: "p", text: `A borrower takes a **${money(pr)}** loan at **${pct(r)}** a year, compounded monthly, repaid in equal monthly instalments over **${y} years**.` }],
        question: "What is the monthly payment?",
        answer: ans, unit: "$", tolerance: { abs: 0.05 },
        solution: {
          idea: [
            "The borrower pays the same amount every month. Each payment first covers that month's interest on the balance still owed; whatever is left over pays down the principal.",
            "The right payment is the one whose stream of instalments, discounted at the loan rate, is worth exactly the amount borrowed today. That is the present value of an annuity, turned around to solve for the payment.",
          ],
          formulas: [
            { expr: "PMT = P × i / (1 − (1 + i)⁻ⁿ)", terms: [
              ["P", "The amount borrowed"],
              ["i", "The interest rate per period: the annual rate ÷ 12"],
              ["n", "The number of payments: years × 12"],
              ["(1 − (1 + i)⁻ⁿ) / i", "The annuity factor: the present value of $1 paid every month for n months"],
            ] },
          ],
          steps: [
            p(`Monthly rate i = ${pct(r)} / 12 = ${pct(i, 5)}. Number of payments n = ${y} × 12 = ${nper}.`),
            p(`(1 + i)⁻ⁿ = (1 + ${i.toFixed(6)})^−${nper} = ${Math.pow(1 + i, -nper).toFixed(6)}.`),
            p(`Annuity factor = (1 − ${Math.pow(1 + i, -nper).toFixed(6)}) / ${i.toFixed(6)} = ${((1 - Math.pow(1 + i, -nper)) / i).toFixed(4)}.`),
            p(`PMT = ${money(pr)} / ${((1 - Math.pow(1 + i, -nper)) / i).toFixed(4)} = **${money(ans, 2)}**.`),
            p("The first three months of the amortisation schedule:"),
            table(["Month", "Payment", "Interest", "Principal", "Balance"], rows),
          ],
          meaning: [
            `Over ${y} years the borrower pays ${money(ans * nper, 2)} in total, of which ${money(totalInt, 2)} is interest.`,
            `Early payments are mostly interest (${pct((pr * i) / ans, 1)} of the first one). As the balance falls, more of each payment goes to principal. That is why early overpayments save so much interest.`,
          ],
          mistakes: [
            `Using the annual rate with monthly periods: ${money(pmt(r, nper, pr), 2)}. Convert the rate to the period you pay in.`,
            `Using years as the number of periods: ${money(pmt(i, y, pr), 2)}.`,
            "Being confused by Excel's negative sign. PMT returns cash out as a negative number; put a minus in front of the principal to get a positive payment.",
          ],
          excel: [`\`=PMT(${n(r)}/12,${nper},-${pr})\``],
        },
      };
    },
  },
  {
    slug: "effective-annual-rate",
    title: "Effective annual rate",
    track: "Corporate Finance",
    difficulty: "Easy",
    concepts: ["Compounding", "EAR"],
    generate(rng) {
      const apr = pick(rng, 0.04, 0.24, 0.005);
      const freq = [2, 4, 12, 365][Math.floor(rng() * 4)];
      const label = { 2: "semi-annually", 4: "quarterly", 12: "monthly", 365: "daily" }[freq];
      const ans = effectiveAnnualRate(apr, freq) * 100;
      const rows = ([[1, "Annually"], [2, "Semi-annually"], [4, "Quarterly"], [12, "Monthly"], [365, "Daily"]] as const)
        .map(([m, l]) => [m === freq ? `**${l}**` : l, String(m), pct(apr / m, 4), m === freq ? `**${pct(effectiveAnnualRate(apr, m), 3)}**` : pct(effectiveAnnualRate(apr, m), 3)]);
      rows.push(["Continuously", "∞", "", pct(Math.exp(apr) - 1, 3)]);
      return {
        blocks: [{ kind: "p", text: `A credit product quotes an APR of **${pct(apr)}**, compounded **${label}**.` }],
        question: "What is the effective annual rate? Enter a percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "An APR is a quoted rate, not the rate you actually pay. The lender charges APR ÷ m each period, and each period's interest is added to the balance, so later interest is charged on earlier interest.",
            "The effective annual rate is what that compounding adds up to over a full year. It is the right number to compare products that compound at different frequencies.",
          ],
          formulas: [
            { expr: "EAR = (1 + APR / m)ᵐ − 1", terms: [["APR", "The quoted annual rate"], ["m", "Compounding periods per year"], ["APR / m", "The rate charged each period"]] },
          ],
          steps: [
            p(`Periodic rate = ${pct(apr)} / ${freq} = ${pct(apr / freq, 4)}.`),
            p(`Growth over the year = (1 + ${(apr / freq).toFixed(6)})^${freq} = ${Math.pow(1 + apr / freq, freq).toFixed(6)}.`),
            p(`EAR = ${Math.pow(1 + apr / freq, freq).toFixed(6)} − 1 = **${ans.toFixed(2)}%**.`),
            p("The same APR at different frequencies:"),
            table(["Compounding", "m", "Rate per period", "EAR"], rows),
          ],
          meaning: [
            `A borrower actually pays **${ans.toFixed(2)}%** a year, ${(ans - apr * 100).toFixed(2)} percentage points more than the headline ${pct(apr)}. The more often interest compounds, the bigger the gap, but it levels off: even continuous compounding only reaches ${pct(Math.exp(apr) - 1, 3)}.`,
          ],
          mistakes: [
            `Treating the APR as the effective rate (${pct(apr)}).`,
            `Entering the decimal ${(ans / 100).toFixed(4)} instead of the percentage.`,
          ],
          excel: [`\`=EFFECT(${n(apr)},${freq})\`, or \`=(1+${n(apr)}/${freq})^${freq}-1\`.`],
        },
      };
    },
  },
  {
    slug: "diluted-shares-tsm",
    title: "Diluted shares with the treasury stock method",
    track: "Corporate Finance",
    difficulty: "Medium",
    concepts: ["Dilution", "Treasury stock method"],
    generate(rng) {
      const basic = pick(rng, 50, 300, 5), price = pick(rng, 20, 80, 1);
      const o1 = { count: pick(rng, 2, 10, 0.5), strike: pick(rng, 5, price - 5, 1) };
      const o2 = { count: pick(rng, 2, 10, 0.5), strike: pick(rng, price - 10, price + 15, 1) };
      const net = treasuryStockMethod(price, [o1, o2]);
      const ans = basic + net;
      const rows = [o1, o2].map((o, i) => o.strike < price
        ? [`${"AB"[i]}`, num(o.count, 1), money(o.strike), "Yes", money(o.count * o.strike, 2) + "m", num((o.count * o.strike) / price, 3), num(o.count - (o.count * o.strike) / price, 3)]
        : [`${"AB"[i]}`, num(o.count, 1), money(o.strike), "No", "", "", "0"]);
      const itmGross = [o1, o2].filter((o) => o.strike < price).reduce((s, o) => s + o.count, 0);
      return {
        blocks: [
          { kind: "p", text: `A company has **${basic}m** basic shares and trades at **${money(price)}**. It has two tranches of options outstanding:` },
          { kind: "table", head: ["Tranche", "Options (m)", "Strike"], rows: [["A", num(o1.count, 1), money(o1.strike)], ["B", num(o2.count, 1), money(o2.strike)]] },
        ],
        question: "How many diluted shares are outstanding, in millions? Two decimals.",
        answer: ans, unit: "shares", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "Option holders can buy shares at the strike price. If the share trades above the strike they will exercise, and the share count rises. Valuation and per-share metrics must reflect those extra shares.",
            "The treasury stock method assumes the company takes the cash it receives on exercise and uses it to buy back shares at today's market price. Only the shares not covered by that buyback add to the count.",
            "Options with a strike at or above the share price would not be exercised, so they are ignored.",
          ],
          formulas: [
            { expr: "Net new shares = n − (n × K) / P = n × (1 − K / P)", terms: [
              ["n", "Number of in-the-money options"],
              ["K", "Strike price"],
              ["P", "Current share price"],
              ["n × K", "Cash the company receives on exercise"],
              ["(n × K) / P", "Shares that cash buys back"],
            ] },
          ],
          steps: [
            table(["Tranche", "Options (m)", "Strike", `In the money at ${money(price)}?`, "Proceeds", "Shares repurchased (m)", "Net new shares (m)"], rows),
            p(`Diluted shares = ${basic} + ${net.toFixed(3)} = **${ans.toFixed(2)}m**.`),
          ],
          meaning: [
            `Options add ${net.toFixed(3)}m shares, or ${pct(net / basic, 2)} dilution. Use the diluted count for market cap, EV and EPS.`,
            "Out-of-the-money options still matter if the price rises. In an acquisition, use the offer price, not today's price, which can bring more tranches into the money.",
          ],
          mistakes: [
            `Adding in-the-money options gross, with no buyback: ${(basic + itmGross).toFixed(2)}m.`,
            `Including out-of-the-money options too: ${(basic + [o1, o2].reduce((s, o) => s + o.count - (o.count * o.strike) / price, 0)).toFixed(2)}m. A holder would never pay more than market price.`,
            "Assuming the buyback happens at the strike price. It happens at the market price.",
          ],
          excel: [`\`=${basic}+IF(${o1.strike}<${price},${o1.count}*(1-${o1.strike}/${price}),0)+IF(${o2.strike}<${price},${o2.count}*(1-${o2.strike}/${price}),0)\``],
        },
      };
    },
  },
  {
    slug: "eps-accretion-dilution",
    title: "Merger accretion or dilution",
    track: "Corporate Finance",
    difficulty: "Hard",
    concepts: ["M&A", "EPS", "Accretion/dilution"],
    generate(rng) {
      const aNI = pick(rng, 200, 800, 10), aShares = pick(rng, 100, 400, 10), aPrice = pick(rng, 20, 90, 1);
      const tNI = pick(rng, 20, 150, 5), premiumPE = pick(rng, 10, 30, 1);
      const price = tNI * premiumPE, pctStock = pick(rng, 0, 1, 0.25), rd = pick(rng, 0.04, 0.09, 0.005), t = 0.25;
      const r = accretionDilution({ acquirerNetIncome: aNI, acquirerShares: aShares, targetNetIncome: tNI, purchasePrice: price, pctStock, acquirerSharePrice: aPrice, costOfDebt: rd, taxRate: t });
      const ans = r.accretion * 100;
      const debt = price * (1 - pctStock), atInt = debt * rd * (1 - t);
      const pfNI = aNI + tNI - atInt, pfShares = aShares + r.newShares;
      const aPE = aPrice / r.standaloneEPS;
      const yT = tNI / price, yA = 1 / aPE, kd = rd * (1 - t);
      const blended = pctStock * yA + (1 - pctStock) * kd;
      const pretaxEPS = (aNI + tNI - debt * rd) / pfShares;
      return {
        blocks: [
          { kind: "p", text: `An acquirer earns **${money(aNI)}m** on **${aShares}m** shares trading at **${money(aPrice)}**. It buys a target earning **${money(tNI)}m** for **${money(price)}m**.` },
          { kind: "p", text: `The deal is funded **${pct(pctStock, 0)} with new stock** at the current price and the rest with new debt at **${pct(rd)}**. Tax rate is **25%**. Ignore synergies and fees.` },
        ],
        question: "What is the EPS accretion (positive) or dilution (negative) in year 1? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.02 },
        solution: {
          idea: [
            "After the deal, the acquirer's shareholders own a bigger company. The question is whether each of their shares now earns more (accretive) or less (dilutive) than before.",
            "The acquirer is buying the target's earnings, and it pays for them in one of two ways. **New shares** spread the combined earnings over more shares. **New debt** leaves the share count alone but adds interest, which reduces earnings (less the tax saved).",
            "So the deal is accretive if the earnings it buys are greater than the cost of funding them. Every piece of the calculation follows from that.",
          ],
          formulas: [
            { expr: "Pro forma EPS = (NI_A + NI_T − Interest × (1 − t)) / (Shares_A + New shares)", terms: [
              ["NI_A, NI_T", "Net income of acquirer and target"],
              ["Interest", "Pre-tax interest on the new acquisition debt"],
              ["(1 − t)", "Interest is tax-deductible, so its after-tax cost is lower"],
              ["New shares", "Stock consideration ÷ acquirer's share price"],
            ] },
            { expr: "Accretion = Pro forma EPS / Standalone EPS − 1", terms: [["Standalone EPS", "NI_A ÷ Shares_A, the acquirer without the deal"]] },
            { expr: "Accretive ⇔ NI_T / Price > %Stock × (E/P)_A + %Debt × Rd × (1 − t)", terms: [
              ["NI_T / Price", "The target's earnings yield: what you earn per dollar spent"],
              ["(E/P)_A", "The acquirer's earnings yield (1 ÷ its P/E): the earnings given up per dollar of stock issued"],
              ["Rd × (1 − t)", "The after-tax cost of a dollar of debt"],
            ] },
          ],
          steps: [
            p(`**1. Standalone EPS** = ${aNI} / ${aShares} = ${money(r.standaloneEPS, 4)}. The acquirer's P/E is ${money(aPrice)} / ${money(r.standaloneEPS, 4)} = ${aPE.toFixed(2)}x.`),
            p(`**2. Stock funding.** ${pct(pctStock, 0)} × ${money(price)}m = ${money(price * pctStock, 1)}m of stock at ${money(aPrice)} a share = **${r.newShares.toFixed(3)}m new shares**.`),
            p(`**3. Debt funding.** ${pct(1 - pctStock, 0)} × ${money(price)}m = ${money(debt, 1)}m of debt. Interest = ${money(debt, 1)}m × ${pct(rd)} = ${money(debt * rd, 3)}m pre-tax, or ${money(atInt, 3)}m after 25% tax.`),
            table(["", "Acquirer", "+ Target", "− After-tax interest", "Pro forma"], [
              ["Net income ($m)", num(aNI, 2), num(tNI, 2), num(-atInt, 3), num(pfNI, 3)],
              ["Shares (m)", num(aShares, 3), num(r.newShares, 3), "", num(pfShares, 3)],
              ["EPS", money(r.standaloneEPS, 4), "", "", money(r.proFormaEPS, 4)],
            ]),
            p(`**4. Change** = ${money(r.proFormaEPS, 4)} / ${money(r.standaloneEPS, 4)} − 1 = **${ans.toFixed(2)}%** (${ans >= 0 ? "accretive" : "dilutive"}).`),
            p("**5. Sanity check with earnings yields.** Compare what the deal earns with what its funding costs:"),
            table(["", "Yield or cost", "Weight", "Contribution"], [
              ["Target earnings yield (earned)", pct(yT, 3), "", ""],
              ["Acquirer earnings yield (cost of stock)", pct(yA, 3), pct(pctStock, 0), pct(pctStock * yA, 3)],
              ["After-tax cost of debt", pct(kd, 3), pct(1 - pctStock, 0), pct((1 - pctStock) * kd, 3)],
              ["Blended cost of funding", "", "", pct(blended, 3)],
            ]),
            p(`The target earns ${pct(yT, 3)} against a funding cost of ${pct(blended, 3)}, so the deal is ${yT > blended ? "accretive" : yT < blended ? "dilutive" : "neutral"}, matching the full calculation.`),
          ],
          meaning: [
            ans >= 0
              ? `EPS rises ${ans.toFixed(2)}%. The acquirer pays ${premiumPE}x earnings for the target, ${premiumPE < aPE ? "cheaper than its own" : "more than its own"} ${aPE.toFixed(1)}x P/E${pctStock < 1 ? `, and debt costs only ${pct(kd, 2)} after tax` : ""}.`
              : `EPS falls ${(-ans).toFixed(2)}%. The acquirer pays ${premiumPE}x earnings for the target, ${premiumPE > aPE ? "more than its own" : "less than its own"} ${aPE.toFixed(1)}x P/E${pctStock < 1 ? `, with debt costing ${pct(kd, 2)} after tax` : ""}, so the funding costs more than the earnings bought.`,
            "Rule of thumb: an all-stock deal is accretive when the acquirer's P/E is higher than the P/E it pays. Debt-funded deals are usually accretive when interest rates are low.",
            "Accretion is not value creation. A deal can lift EPS and still destroy value if the price exceeds what the target is worth. Real models also add synergies, fees, and amortisation of acquired intangibles, which all move the answer.",
          ],
          mistakes: [
            `Forgetting the tax shield on interest: pro forma EPS ${money(pretaxEPS, 4)}, change ${pct(pretaxEPS / r.standaloneEPS - 1)}.`,
            "Issuing new shares at the target's value per share instead of at the acquirer's share price.",
            `Measuring the change in net income (${pct(pfNI / aNI - 1)}) instead of earnings per share.`,
          ],
          excel: [`\`=((${aNI}+${tNI}-${n(debt, 2)}*${n(rd)}*(1-0.25))/(${aShares}+${n(price * pctStock, 2)}/${aPrice}))/(${aNI}/${aShares})-1\``],
        },
      };
    },
  },
];
