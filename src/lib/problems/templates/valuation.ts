import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";
import { capm, enterpriseValue, gordonGrowth, releverBeta, twoStageDDM, unleverBeta, fcff } from "@/lib/finance/corporate";
import { n, p, table } from "../explain";

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
        solution: {
          idea: [
            "Shareholders want two kinds of compensation: for waiting (the risk-free rate) and for bearing risk they cannot diversify away.",
            "CAPM measures that undiversifiable risk with beta: how much the stock tends to move when the whole market moves. A beta of 1 moves with the market; above 1 it amplifies market swings; below 1 it dampens them. The stock's risk premium is its beta times the premium for holding the market.",
          ],
          formulas: [
            { expr: "Re = Rf + β × (Rm − Rf)", terms: [
              ["Rf", "Risk-free rate, usually a government bond yield"],
              ["β", "Beta: sensitivity of the stock to market moves"],
              ["Rm − Rf", "Equity market risk premium: the extra return investors demand for holding the market over risk-free bonds"],
            ] },
          ],
          steps: [
            p(`The stock's risk premium = β × MRP = ${b.toFixed(2)} × ${pct(mrp)} = ${pct(b * mrp, 3)}.`),
            p(`Re = ${pct(rf)} + ${pct(b * mrp, 3)} = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            `Shareholders require **${ans.toFixed(2)}%** a year. ${b > 1 ? `With beta above 1 that is more than the market's own ${pct(rf + mrp)}.` : b < 1 ? `With beta below 1 that is less than the market's own ${pct(rf + mrp)}.` : "With beta of 1 that equals the market's own return."}`,
            "This feeds into WACC and is the rate for discounting cash flows to equity. Only systematic risk is priced: company-specific risk can be diversified away, so CAPM pays nothing for it.",
          ],
          mistakes: [
            `Treating the premium as the market return and subtracting Rf again: ${pct(rf + b * (mrp - rf), 3)}. The question already gives Rm − Rf.`,
            `Forgetting the risk-free rate: ${pct(b * mrp, 3)}.`,
          ],
          excel: [`\`=${n(rf)}+${b}*${n(mrp)}\``],
        },
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
      const pr = pick(rng, 10, 120, 1), s = pick(rng, 20, 200, 5), debt = pick(rng, 50, 900, 10), cash = pick(rng, 20, 400, 10);
      const nci = pick(rng, 0, 80, 5), pref = pick(rng, 0, 100, 25);
      const ans = enterpriseValue({ sharePrice: pr, dilutedShares: s, debt, cash, minorityInterest: nci, preferred: pref });
      const eq = pr * s;
      return {
        blocks: [{ kind: "table", head: ["Item", "Value"], rows: [
          ["Share price", money(pr)], ["Diluted shares", `${s}m`], ["Total debt", `${money(debt)}m`], ["Cash", `${money(cash)}m`],
          ["Preferred stock", `${money(pref)}m`], ["Non-controlling interest", `${money(nci)}m`],
        ] }],
        question: "What is enterprise value, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.5 },
        solution: {
          idea: [
            "Enterprise value is the value of the operating business itself, regardless of how it is financed. Think of buying a house: the price is the same whether the owner has a mortgage or not, but the owner's equity is only the price less the mortgage.",
            "Start from what shareholders own (market cap), add every other claim on the business (debt, preferred stock, minority holders), and subtract cash, which is not needed to run the operations and would effectively come back to a buyer.",
          ],
          formulas: [
            { expr: "EV = Equity value + Debt + Preferred + Non-controlling interest − Cash", terms: [
              ["Equity value", "Share price × diluted shares (market capitalisation)"],
              ["Debt", "All interest-bearing borrowings"],
              ["Preferred", "Preferred stock, a claim senior to common equity"],
              ["Non-controlling interest", "Outsiders' share of subsidiaries the company consolidates"],
              ["Cash", "Cash and equivalents, a non-operating asset"],
            ] },
          ],
          steps: [
            p(`Equity value = ${money(pr)} × ${s}m = ${money(eq)}m.`),
            table(["", "$m"], [["Equity value", num(eq)], ["+ Debt", num(debt)], ["+ Preferred stock", num(pref)], ["+ Non-controlling interest", num(nci)], ["− Cash", num(-cash)], ["Enterprise value", `**${num(ans)}**`]]),
          ],
          meaning: [
            `The operating business is valued at **${money(ans)}m**, of which common shareholders own ${money(eq)}m.`,
            "EV pairs with metrics that belong to all capital providers (revenue, EBITDA, EBIT). Equity value pairs with metrics after interest (net income, EPS). NCI is added because EBITDA includes 100% of the subsidiaries the company controls.",
          ],
          mistakes: [
            `Adding cash instead of subtracting it: ${money(ans + 2 * cash)}m.`,
            `Leaving out preferred and NCI: ${money(ans - pref - nci)}m.`,
            "Using basic instead of diluted shares, which understates equity value.",
          ],
          excel: [`\`=${pr}*${s}+${debt}+${pref}+${nci}-${cash}\``],
        },
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
      const d1 = d0 * (1 + g);
      return {
        blocks: [{ kind: "p", text: `A stock just paid a dividend of **${money(d0, 2)}**. Dividends grow at **${pct(g)}** a year forever and the required return is **${pct(r)}**.` }],
        question: "What is the share price today?",
        answer: ans, unit: "$", tolerance: { abs: 0.01, rel: 0.001 },
        solution: {
          idea: [
            "A share is worth the present value of every dividend it will ever pay. If dividends grow at a constant rate forever, that infinite sum collapses to a simple formula.",
            "The intuition: each year's dividend is bigger by g but discounted by r. What matters is the gap r − g. The smaller the gap, the more slowly future dividends fade in value, and the higher the price.",
          ],
          formulas: [
            { expr: "P₀ = D₁ / (r − g)", terms: [
              ["D₁", "Next year's dividend = D₀ × (1 + g). The formula needs the next payment, not the one just paid"],
              ["r", "Required return on equity"],
              ["g", "Constant growth rate of dividends, forever (must be below r)"],
            ] },
          ],
          steps: [
            p(`D₁ = ${money(d0, 2)} × (1 + ${pct(g)}) = ${money(d1, 4)}.`),
            p(`r − g = ${pct(r)} − ${pct(g)} = ${pct(r - g)}.`),
            p(`P₀ = ${money(d1, 4)} / ${(r - g).toFixed(4)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `At ${money(ans, 2)}, the stock's dividend yield is D₁/P₀ = ${pct(d1 / ans, 2)}, which is r − g. Total return = yield + growth = ${pct(r - g)} + ${pct(g)} = ${pct(r)}.`,
            `The model is very sensitive to the spread: raise growth by half a point to ${pct(g + 0.005)} and the price becomes ${money(gordonGrowth(d0, r, g + 0.005), 2)}. If g approaches r the price heads to infinity, which is why g must be a sustainable long-run rate.`,
          ],
          mistakes: [
            `Using D₀ instead of D₁: ${money(d0 / (r - g), 2)}.`,
            "Using it for a company whose growth will not be stable, or where g ≥ r. Use a multi-stage model instead.",
          ],
          excel: [`\`=${d0}*(1+${n(g)})/(${n(r)}-${n(g)})\``],
        },
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
      const d0 = pick(rng, 1, 4, 0.25), gh = pick(rng, 0.08, 0.2, 0.01), yrs = pick(rng, 3, 5, 1), gs = pick(rng, 0.02, 0.04, 0.005), r = pick(rng, 0.08, 0.12, 0.005);
      const ans = twoStageDDM(d0, r, gh, yrs, gs);
      const divs = Array.from({ length: yrs }, (_, i) => d0 * Math.pow(1 + gh, i + 1));
      const pvDivs = divs.reduce((s, d, i) => s + d / Math.pow(1 + r, i + 1), 0);
      const dn = divs[yrs - 1], dn1 = dn * (1 + gs);
      const tv = dn1 / (r - gs), pvTv = tv / Math.pow(1 + r, yrs);
      const rows = divs.map((d, i) => [String(i + 1), money(d, 4), (1 / Math.pow(1 + r, i + 1)).toFixed(4), money(d / Math.pow(1 + r, i + 1), 4)]);
      rows.push([`${yrs} (terminal value)`, money(tv, 4), (1 / Math.pow(1 + r, yrs)).toFixed(4), money(pvTv, 4)]);
      rows.push(["Total", "", "", `**${money(ans, 4)}**`]);
      return {
        blocks: [{ kind: "p", text: `A company just paid **${money(d0, 2)}** per share. Dividends will grow **${pct(gh)}** a year for **${yrs} years**, then **${pct(gs)}** forever. The required return is **${pct(r)}**.` }],
        question: "What is the intrinsic value per share today?",
        answer: ans, unit: "$", tolerance: { abs: 0.05, rel: 0.001 },
        solution: {
          idea: [
            "A young or fast-growing company cannot grow faster than the economy forever. The two-stage model splits its future into a high-growth phase you forecast year by year, and a mature phase where growth settles to a stable rate.",
            "Value = PV of each high-growth dividend + PV of the mature phase. The mature phase is a growing perpetuity, so its value at the end of the high-growth phase (the terminal value) comes from the Gordon formula. That terminal value is a lump sum sitting in year N, so it is discounted N years, like any other year-N cash flow.",
          ],
          formulas: [
            { expr: "Dₜ = D₀ × (1 + g_high)ᵗ, for t = 1 … N", terms: [["g_high", "Growth during the high-growth phase"], ["N", "Length of the high-growth phase in years"]] },
            { expr: "TV_N = D_{N+1} / (r − g_stable), where D_{N+1} = D_N × (1 + g_stable)", terms: [
              ["TV_N", "Value at the end of year N of all dividends from year N+1 onward"],
              ["g_stable", "Growth forever after year N"],
            ] },
            { expr: "P₀ = Σ Dₜ / (1 + r)ᵗ + TV_N / (1 + r)ᴺ", terms: [["r", "Required return on equity"]] },
          ],
          steps: [
            p(`**1. High-growth dividends.** Grow ${money(d0, 2)} at ${pct(gh)} a year for ${yrs} years: ${divs.map((d, i) => `D${i + 1} = ${money(d, 4)}`).join(", ")}.`),
            p(`**2. Terminal value at year ${yrs}.** D${yrs + 1} = ${money(dn, 4)} × (1 + ${pct(gs)}) = ${money(dn1, 4)}. TV = ${money(dn1, 4)} / (${pct(r)} − ${pct(gs)}) = ${money(tv, 4)}.`),
            p(`**3. Discount everything at ${pct(r)}.** The terminal value is discounted ${yrs} years, the same as D${yrs}:`),
            table(["Year", "Cash flow", "Discount factor", "Present value"], rows),
            p(`P₀ = ${money(pvDivs, 4)} + ${money(pvTv, 4)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `The intrinsic value is **${money(ans, 2)}** a share. If the stock trades below that, the model says it is cheap, given these growth and return assumptions.`,
            `${pct(pvTv / ans, 1)} of the value comes from the terminal value. That is typical, and it is why small changes to the stable growth rate or the required return move the answer a lot.`,
          ],
          mistakes: [
            `Discounting the terminal value ${yrs + 1} years instead of ${yrs}: ${money(pvDivs + tv / Math.pow(1 + r, yrs + 1), 2)}. TV is already a year-${yrs} value.`,
            `Using D${yrs} instead of D${yrs + 1} in the terminal value: ${money(pvDivs + dn / (r - gs) / Math.pow(1 + r, yrs), 2)}.`,
            "Applying the high growth rate inside the terminal value. After year N the stable rate applies.",
          ],
          excel: [
            `With D1…D${yrs} in B2:B${yrs + 1}: \`=NPV(${n(r)},B2:B${yrs + 1})+B${yrs + 1}*(1+${n(gs)})/(${n(r)}-${n(gs)})/(1+${n(r)})^${yrs}\`.`,
            `Each dividend: in B2 \`=${d0}*(1+${n(gh)})^A2\` with the year in column A.`,
          ],
        },
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
      const f1 = 1 + (1 - t) * de1, f2 = 1 + (1 - t) * de2;
      return {
        blocks: [{ kind: "p", text: `A comparable company has a levered beta of **${bl.toFixed(2)}** and a debt-to-equity ratio of **${de1.toFixed(2)}**. Your target will run at debt-to-equity of **${de2.toFixed(2)}**. Both pay tax at **${pct(t)}**.` }],
        question: "Using the Hamada formula, what is the target's relevered beta? Three decimals.",
        answer: ans, unit: "", tolerance: { abs: 0.002 },
        solution: {
          idea: [
            "A stock's observed beta mixes two risks. **Business risk** comes from what the company does (selling cars, running hospitals). **Financial risk** comes from how it is funded: debt holders are paid first, so the more debt there is, the more the equity swings with every change in the business.",
            "Two companies in the same business share business risk but can have very different debt levels. So you cannot borrow a comparable's beta as is. First strip out its leverage to get the unlevered (asset) beta, which reflects business risk alone. Then add back the leverage your target will carry.",
            "The tax term appears because interest is tax-deductible, which makes debt slightly less burdensome to equity holders.",
          ],
          formulas: [
            { expr: "βu = βL / (1 + (1 − t) × D/E)", terms: [
              ["βL", "Levered (equity) beta, what you observe in the market"],
              ["βu", "Unlevered (asset) beta: business risk only"],
              ["D/E", "Debt-to-equity ratio at market values"],
              ["t", "Tax rate"],
            ] },
            { expr: "βL,target = βu × (1 + (1 − t) × D/E_target)", terms: [["D/E_target", "The target's own capital structure"]] },
          ],
          steps: [
            p(`**1. Comparable's leverage factor** = 1 + (1 − ${n(t)}) × ${de1.toFixed(2)} = ${f1.toFixed(4)}.`),
            p(`**2. Unlever:** βu = ${bl.toFixed(2)} / ${f1.toFixed(4)} = ${bu.toFixed(4)}.`),
            p(`**3. Target's leverage factor** = 1 + (1 − ${n(t)}) × ${de2.toFixed(2)} = ${f2.toFixed(4)}.`),
            p(`**4. Relever:** βL = ${bu.toFixed(4)} × ${f2.toFixed(4)} = **${ans.toFixed(3)}**.`),
            table(["", "D/E", "Leverage factor 1 + (1 − t) × D/E", "Beta"], [
              ["Comparable (observed)", de1.toFixed(2), f1.toFixed(4), bl.toFixed(2)],
              ["Business risk only (unlevered)", "0", "1.0000", bu.toFixed(4)],
              ["Target (relevered)", de2.toFixed(2), f2.toFixed(4), `**${ans.toFixed(3)}**`],
            ]),
          ],
          meaning: [
            `The target's equity beta is **${ans.toFixed(3)}**, ${ans > bl ? "higher than" : ans < bl ? "lower than" : "the same as"} the comparable's ${bl.toFixed(2)} because it carries ${de2 > de1 ? "more" : de2 < de1 ? "less" : "the same"} debt relative to equity.`,
            "Use this beta in CAPM to get the target's cost of equity. In practice you unlever several comparables, take the median unlevered beta, and relever once.",
            "Hamada assumes debt is risk-free (debt beta of zero) and that debt stays at a fixed amount. For heavily indebted companies those assumptions break down.",
          ],
          mistakes: [
            `Leaving out the tax term: ${(bl / (1 + de1) * (1 + de2)).toFixed(3)}.`,
            `Relevering with the comparable's D/E instead of the target's, which just gives back ${bl.toFixed(3)}.`,
            "Using debt-to-capital (D/V) instead of debt-to-equity (D/E).",
          ],
          excel: [`\`=${bl}/(1+(1-${n(t)})*${de1})*(1+(1-${n(t)})*${de2})\``],
        },
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
      const fcf = pick(rng, 50, 400, 5), g = pick(rng, 0.015, 0.035, 0.005), w = pick(rng, 0.07, 0.12, 0.005), yrs = pick(rng, 5, 10, 1);
      const fcf1 = fcf * (1 + g);
      const tv = fcf1 / (w - g);
      const ans = tv / Math.pow(1 + w, yrs);
      return {
        blocks: [{ kind: "p", text: `In the final year (year **${yrs}**) of a DCF forecast, unlevered free cash flow is **${money(fcf)}m**. Long-run growth is **${pct(g)}** and WACC is **${pct(w)}**. Use end-of-year discounting.` }],
        question: "What is the present value of the terminal value, in $m?",
        answer: ans, unit: "$m", tolerance: { rel: 0.001 },
        solution: {
          idea: [
            "A DCF forecasts cash flows for a few years, but the business keeps going after that. The terminal value captures every cash flow beyond the forecast in one number.",
            `The Gordon growth method assumes cash flow grows at a steady rate forever after year ${yrs}. The formula then gives the value of that perpetuity **as of year ${yrs}**, so it still has to be brought back to today.`,
          ],
          formulas: [
            { expr: "TV_N = FCF_{N+1} / (WACC − g) = FCF_N × (1 + g) / (WACC − g)", terms: [
              ["FCF_N", "Free cash flow in the last forecast year"],
              ["g", "Perpetual growth rate, at or below long-run nominal GDP growth"],
              ["WACC", "Discount rate for unlevered cash flows"],
            ] },
            { expr: "PV(TV) = TV_N / (1 + WACC)ᴺ", terms: [["N", "The final forecast year, where the TV sits"]] },
          ],
          steps: [
            p(`FCF in year ${yrs + 1} = ${money(fcf)}m × (1 + ${pct(g)}) = ${money(fcf1, 3)}m.`),
            p(`TV at year ${yrs} = ${money(fcf1, 3)}m / (${pct(w)} − ${pct(g)}) = ${money(tv, 2)}m.`),
            p(`Discount factor = 1 / (1 + ${pct(w)})^${yrs} = ${(1 / Math.pow(1 + w, yrs)).toFixed(4)}.`),
            p(`PV = ${money(tv, 2)}m × ${(1 / Math.pow(1 + w, yrs)).toFixed(4)} = **${money(ans, 1)}m**.`),
          ],
          meaning: [
            `The terminal value is ${(tv / fcf).toFixed(1)}x the final-year cash flow. Today it is worth ${money(ans, 1)}m, and in most DCFs it is more than half of enterprise value, so the growth and WACC assumptions deserve the most scrutiny.`,
            "Sanity-check it by converting to an implied exit multiple (TV ÷ final-year EBITDA) and comparing with where peers trade.",
          ],
          mistakes: [
            `Not growing the final cash flow by one year: ${money(fcf / (w - g) / Math.pow(1 + w, yrs), 1)}m.`,
            `Discounting ${yrs + 1} years because the formula uses FCF_{N+1}: ${money(tv / Math.pow(1 + w, yrs + 1), 1)}m. The TV is a year-${yrs} value.`,
            `Forgetting to discount at all: ${money(tv, 1)}m.`,
          ],
          excel: [`\`=${fcf}*(1+${n(g)})/(${n(w)}-${n(g)})/(1+${n(w)})^${yrs}\``],
        },
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
      const mean = comps.reduce((a, b) => a + b, 0) / 5;
      return {
        blocks: [
          { kind: "p", text: `Five comparable companies trade at these EV/EBITDA multiples:` },
          { kind: "table", head: ["Comp", "A", "B", "C", "D", "E"], rows: [["EV/EBITDA", ...comps.map((c) => `${c.toFixed(1)}x`)]] },
          { kind: "p", text: `Your target has EBITDA of **${money(ebitda)}m**, net debt of **${money(nd)}m** and **${sh}m** diluted shares.` },
        ],
        question: "Using the median multiple, what is the implied share price?",
        answer: ans, unit: "$", tolerance: { abs: 0.01, rel: 0.001 },
        solution: {
          idea: [
            "If similar businesses sell for about N times their EBITDA, yours is probably worth about the same multiple. Comparable company analysis borrows the market's pricing of peers.",
            "EV/EBITDA is an enterprise value multiple, so applying it gives the target's **enterprise value**. To get to the shareholders' slice you must subtract net debt, then divide by shares.",
          ],
          formulas: [
            { expr: "Implied EV = Median multiple × Target EBITDA", terms: [["Median", "The middle value when sorted; less distorted by outliers than the mean"]] },
            { expr: "Implied share price = (Implied EV − Net debt) / Diluted shares", terms: [["Net debt", "Debt minus cash (negative means net cash, which adds to equity)"]] },
          ],
          steps: [
            p(`Sort the multiples: ${sorted.map((c) => `${c.toFixed(1)}x`).join(", ")}. The median is the third: **${med.toFixed(1)}x**.`),
            p(`Implied EV = ${med.toFixed(1)} × ${money(ebitda)}m = ${money(med * ebitda, 1)}m.`),
            p(`Equity value = ${money(med * ebitda, 1)}m − ${money(nd)}m = ${money(med * ebitda - nd, 1)}m.${nd < 0 ? " Net debt is negative (net cash), so equity is worth more than EV." : ""}`),
            p(`Per share = ${money(med * ebitda - nd, 1)}m / ${sh}m = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `On peer pricing, the shares are worth about **${money(ans, 2)}**. In practice you would show a range, for example from the 25th to the 75th percentile multiple, rather than one point.`,
            "Multiples are only as good as the peer set. Check that the comps really have similar growth, margins and risk.",
          ],
          mistakes: [
            `Using the mean (${mean.toFixed(2)}x) instead of the median: ${money((mean * ebitda - nd) / sh, 2)}.`,
            `Forgetting to subtract net debt: ${money((med * ebitda) / sh, 2)}. An EV multiple gives EV, not equity value.`,
            `Adding net debt instead of subtracting: ${money((med * ebitda + nd) / sh, 2)}.`,
          ],
          excel: [`\`=(MEDIAN(${comps.join(",")})*${ebitda}-(${nd}))/${sh}\``],
        },
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
      const interest = pick(rng, 5, 60, 5);
      const nopat = ebit * (1 - t);
      return {
        blocks: [{ kind: "table", head: ["Item", "$m"], rows: [["EBIT", num(ebit)], ["Tax rate", pct(t)], ["D&A", num(da)], ["Capital expenditure", num(capex)], ["Increase in net working capital", num(dnwc)], ["Interest expense", num(interest)]] }],
        question: "What is unlevered free cash flow, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.05 },
        solution: {
          idea: [
            "Unlevered free cash flow is the cash the business generates from its operations after paying taxes and reinvesting in itself, **before** any payments to lenders or shareholders. It belongs to all capital providers together.",
            "Because it is measured before financing, tax is computed as if the company had no debt (on EBIT, not on pre-tax income) and interest is left out entirely. The cost of debt shows up instead in the WACC used to discount it.",
          ],
          formulas: [
            { expr: "FCFF = EBIT × (1 − t) + D&A − Capex − ΔNWC", terms: [
              ["EBIT × (1 − t)", "NOPAT: operating profit after tax, as if unlevered"],
              ["D&A", "Added back because it is a non-cash charge"],
              ["Capex", "Cash spent on long-term assets"],
              ["ΔNWC", "Cash tied up in extra working capital (a decrease releases cash)"],
            ] },
          ],
          steps: [
            table(["", "$m"], [
              ["EBIT", num(ebit, 1)],
              [`− Taxes on EBIT at ${pct(t)}`, num(-ebit * t, 2)],
              ["= NOPAT", num(nopat, 2)],
              ["+ D&A", num(da, 1)],
              ["− Capex", num(-capex, 1)],
              ["− Increase in NWC", num(-dnwc, 1)],
              ["= Unlevered FCF", `**${num(ans, 2)}**`],
            ]),
            p(`${ebit} × ${(1 - t).toFixed(2)} + ${da} − ${capex} − (${dnwc}) = **${money(ans, 1)}m**.`),
          ],
          meaning: [
            `The business produces ${money(ans, 1)}m a year for debt and equity holders combined. Discount these at WACC to get enterprise value.`,
            "Interest expense is a distractor here: it is a payment to one group of capital providers, so it sits below the line for unlevered cash flow.",
          ],
          mistakes: [
            `Deducting interest: ${money(ans - interest * (1 - t), 2)}m (after tax). That moves you towards levered cash flow, which would be discounted at the cost of equity instead.`,
            `Adding the increase in working capital instead of subtracting it: ${money(ans + 2 * dnwc, 1)}m.`,
            `Taxing EBITDA instead of EBIT: ${money((ebit + da) * (1 - t) - capex - dnwc, 2)}m.`,
          ],
          excel: [`\`=${ebit}*(1-${n(t)})+${da}-${capex}-(${dnwc})\``],
        },
      };
    },
  },
];
