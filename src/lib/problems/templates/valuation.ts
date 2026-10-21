import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";
import { capm, enterpriseValue, gordonGrowth, releverBeta, twoStageDDM, unleverBeta, fcff } from "@/lib/finance/corporate";

export const valuation: Template[] = [
  {
    slug: "capm-cost-of-equity",
    title: "Cost of equity with CAPM",
    track: "Valuation",
    difficulty: "Easy",
    concepts: ["CAPM", "Cost of equity"],
    generate(rng) {
      const rf = pick(rng, 0.02, 0.05, 0.0025), b = pick(rng, 0.6, 1.8, 0.05), mrp = pick(rng, 0.04, 0.07, 0.0025);
      const ans = capm(rf, b, mrp) * 100;
      return {
        blocks: [{ kind: "p", text: `The risk-free rate is **${pct(rf)}**, the stock's beta is **${b.toFixed(2)}** and the equity market risk premium is **${pct(mrp)}**.` }],
        question: "What is the cost of equity? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`Re = ${pct(rf)} + ${b.toFixed(2)} × ${pct(mrp)} = **${ans.toFixed(3)}%**.`],
      };
    },
  },
  {
    slug: "enterprise-value-bridge",
    title: "Bridge from market cap to EV",
    track: "Valuation",
    difficulty: "Easy",
    concepts: ["Enterprise value", "Equity value"],
    generate(rng) {
      const p = pick(rng, 10, 120, 1), s = pick(rng, 20, 200, 5), debt = pick(rng, 50, 900, 10), cash = pick(rng, 20, 400, 10);
      const nci = pick(rng, 0, 80, 5), pref = pick(rng, 0, 100, 25);
      const ans = enterpriseValue({ sharePrice: p, dilutedShares: s, debt, cash, minorityInterest: nci, preferred: pref });
      return {
        blocks: [{ kind: "table", head: ["Item", "Value"], rows: [
          ["Share price", money(p)], ["Diluted shares", `${s}m`], ["Total debt", `${money(debt)}m`], ["Cash", `${money(cash)}m`],
          ["Preferred stock", `${money(pref)}m`], ["Non-controlling interest", `${money(nci)}m`],
        ] }],
        question: "What is enterprise value, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.5 },
        solution: [`Equity value = ${p} × ${s} = ${money(p * s)}m.`, `EV = equity + debt + preferred + NCI − cash = **${money(ans)}m**.`],
      };
    },
  },
  {
    slug: "gordon-growth-price",
    title: "Gordon growth share price",
    track: "Valuation",
    difficulty: "Easy",
    concepts: ["Dividend discount model"],
    generate(rng) {
      const d0 = pick(rng, 0.5, 5, 0.1), g = pick(rng, 0.01, 0.06, 0.005), r = g + pick(rng, 0.03, 0.08, 0.005);
      const ans = gordonGrowth(d0, r, g);
      return {
        blocks: [{ kind: "p", text: `A stock just paid a dividend of **${money(d0, 2)}**. Dividends grow at **${pct(g)}** a year forever and the required return is **${pct(r)}**.` }],
        question: "What is the share price today?",
        answer: ans, unit: "$", tolerance: { abs: 0.01, rel: 0.001 },
        solution: [`D1 = ${d0.toFixed(2)} × (1 + ${pct(g)}) = ${(d0 * (1 + g)).toFixed(4)}.`, `P0 = D1 / (r − g) = **${money(ans, 2)}**.`, "A common miss is using D0 instead of D1."],
      };
    },
  },
  {
    slug: "two-stage-ddm",
    title: "Two-stage dividend discount model",
    track: "Valuation",
    difficulty: "Hard",
    concepts: ["Dividend discount model", "Multi-stage growth"],
    generate(rng) {
      const d0 = pick(rng, 1, 4, 0.25), gh = pick(rng, 0.08, 0.2, 0.01), n = pick(rng, 3, 5, 1), gs = pick(rng, 0.02, 0.04, 0.005), r = pick(rng, 0.08, 0.12, 0.005);
      const ans = twoStageDDM(d0, r, gh, n, gs);
      return {
        blocks: [{ kind: "p", text: `A company just paid **${money(d0, 2)}** per share. Dividends will grow **${pct(gh)}** a year for **${n} years**, then **${pct(gs)}** forever. The required return is **${pct(r)}**.` }],
        question: "What is the intrinsic value per share today?",
        answer: ans, unit: "$", tolerance: { abs: 0.05, rel: 0.001 },
        solution: [
          `Discount each high-growth dividend D1…D${n} at ${pct(r)}.`,
          `Terminal value at year ${n} = D${n} × (1 + ${pct(gs)}) / (${pct(r)} − ${pct(gs)}), discounted ${n} years.`,
          `Total = **${money(ans, 2)}**.`,
        ],
      };
    },
  },
  {
    slug: "unlever-relever-beta",
    title: "Unlever and relever beta",
    track: "Valuation",
    difficulty: "Hard",
    concepts: ["Beta", "Capital structure", "Hamada"],
    generate(rng) {
      const bl = pick(rng, 0.8, 1.8, 0.05), de1 = pick(rng, 0.1, 1, 0.05), de2 = pick(rng, 0.2, 1.5, 0.05), t = pick(rng, 0.2, 0.3, 0.01);
      const bu = unleverBeta(bl, de1, t);
      const ans = releverBeta(bu, de2, t);
      return {
        blocks: [{ kind: "p", text: `A comparable company has a levered beta of **${bl.toFixed(2)}** and a debt-to-equity ratio of **${de1.toFixed(2)}**. Your target will run at debt-to-equity of **${de2.toFixed(2)}**. Both pay tax at **${pct(t)}**.` }],
        question: "Using the Hamada formula, what is the target's relevered beta? Three decimals.",
        answer: ans, unit: "", tolerance: { abs: 0.002 },
        solution: [`βu = ${bl.toFixed(2)} / (1 + (1 − ${t}) × ${de1}) = ${bu.toFixed(4)}.`, `βL = ${bu.toFixed(4)} × (1 + (1 − ${t}) × ${de2}) = **${ans.toFixed(3)}**.`],
      };
    },
  },
  {
    slug: "terminal-value-gordon",
    title: "Terminal value and its present value",
    track: "Valuation",
    difficulty: "Medium",
    concepts: ["DCF", "Terminal value"],
    generate(rng) {
      const fcf = pick(rng, 50, 400, 5), g = pick(rng, 0.015, 0.035, 0.005), w = pick(rng, 0.07, 0.12, 0.005), n = pick(rng, 5, 10, 1);
      const tv = (fcf * (1 + g)) / (w - g);
      const ans = tv / Math.pow(1 + w, n);
      return {
        blocks: [{ kind: "p", text: `In the final year (year **${n}**) of a DCF forecast, unlevered free cash flow is **${money(fcf)}m**. Long-run growth is **${pct(g)}** and WACC is **${pct(w)}**. Use end-of-year discounting.` }],
        question: "What is the present value of the terminal value, in $m?",
        answer: ans, unit: "$m", tolerance: { rel: 0.001 },
        solution: [`TV(year ${n}) = ${fcf} × (1 + ${pct(g)}) / (${pct(w)} − ${pct(g)}) = ${money(tv, 1)}m.`, `PV = TV / (1 + ${pct(w)})^${n} = **${money(ans, 1)}m**.`],
      };
    },
  },
  {
    slug: "implied-price-from-multiple",
    title: "Implied share price from EV/EBITDA",
    track: "Valuation",
    difficulty: "Medium",
    concepts: ["Comparables", "Multiples"],
    generate(rng) {
      const comps = [0, 1, 2, 3, 4].map(() => pick(rng, 6, 16, 0.1));
      const sorted = [...comps].sort((a, b) => a - b);
      const med = sorted[2];
      const ebitda = pick(rng, 50, 500, 5), nd = pick(rng, -100, 800, 10), sh = pick(rng, 20, 200, 5);
      const ans = (med * ebitda - nd) / sh;
      return {
        blocks: [
          { kind: "p", text: `Five comparable companies trade at these EV/EBITDA multiples:` },
          { kind: "table", head: ["Comp", "A", "B", "C", "D", "E"], rows: [["EV/EBITDA", ...comps.map((c) => `${c.toFixed(1)}x`)]] },
          { kind: "p", text: `Your target has EBITDA of **${money(ebitda)}m**, net debt of **${money(nd)}m** and **${sh}m** diluted shares.` },
        ],
        question: "Using the median multiple, what is the implied share price?",
        answer: ans, unit: "$", tolerance: { abs: 0.01, rel: 0.001 },
        solution: [`Median = ${med.toFixed(1)}x.`, `EV = ${med.toFixed(1)} × ${ebitda} = ${money(med * ebitda, 1)}m. Equity = EV − net debt = ${money(med * ebitda - nd, 1)}m.`, `Per share = **${money(ans, 2)}**.`],
      };
    },
  },
  {
    slug: "unlevered-free-cash-flow",
    title: "Unlevered free cash flow",
    track: "Valuation",
    difficulty: "Medium",
    concepts: ["DCF", "FCFF"],
    generate(rng) {
      const ebit = pick(rng, 50, 600, 5), t = pick(rng, 0.2, 0.3, 0.01), da = pick(rng, 10, 120, 5), capex = pick(rng, 20, 150, 5), dnwc = pick(rng, -20, 40, 5);
      const ans = fcff(ebit, t, da, capex, dnwc);
      return {
        blocks: [{ kind: "table", head: ["Item", "$m"], rows: [["EBIT", num(ebit)], ["Tax rate", pct(t)], ["D&A", num(da)], ["Capital expenditure", num(capex)], ["Increase in net working capital", num(dnwc)], ["Interest expense", num(pick(rng, 5, 60, 5))]] }],
        question: "What is unlevered free cash flow, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.05 },
        solution: [`FCFF = EBIT × (1 − t) + D&A − capex − ΔNWC.`, `${ebit} × ${(1 - t).toFixed(2)} + ${da} − ${capex} − (${dnwc}) = **${money(ans, 1)}m**.`, "Interest is ignored: unlevered cash flow belongs to all capital providers."],
      };
    },
  },
];
