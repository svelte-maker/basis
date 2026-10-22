import { pick } from "@/lib/problems/rng";
import { Layout } from "../layout";
import type { ModelTask } from "../types";

const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;

export const dcfModel: ModelTask = {
  slug: "five-year-dcf",
  title: "Five-year unlevered DCF to a share price",
  track: "Valuation",
  difficulty: "Hard",
  skills: ["DCF", "Free cash flow build", "Terminal value", "EV to equity bridge"],
  functions: ["NPV", "SUM"],
  minutes: 35,
  generate(rng) {
    const rev = pick(rng, 400, 2000, 10);
    const g = pick(rng, 0.04, 0.14, 0.005);
    const margin = pick(rng, 0.15, 0.32, 0.005);
    const da = pick(rng, 0.03, 0.06, 0.0025);
    const capex = pick(rng, 0.04, 0.08, 0.0025);
    const nwc = pick(rng, 0.08, 0.18, 0.01);
    const tax = pick(rng, 0.21, 0.3, 0.01);
    const wacc = pick(rng, 0.08, 0.115, 0.0025);
    const tg = pick(rng, 0.02, 0.035, 0.0025);
    const netDebt = Math.round(rev * pick(rng, 0.2, 1.2, 0.05));
    const shares = pick(rng, 40, 400, 5);

    const L = new Layout(33, 7, [250, 100, 96, 96, 96, 96, 96]);
    L.head("A1", "Unlevered DCF ($m)")
      .label("A3", "Revenue, last fiscal year").input("B3", rev, "n1")
      .label("A4", "Revenue growth (each year)").input("B4", g, "pct1")
      .label("A5", "EBITDA margin").input("B5", margin, "pct1")
      .label("A6", "D&A (% of revenue)").input("B6", da, "pct2")
      .label("A7", "Capex (% of revenue)").input("B7", capex, "pct2")
      .label("A8", "Net working capital (% of revenue)").input("B8", nwc, "pct1")
      .label("A9", "Tax rate").input("B9", tax, "pct1")
      .label("A10", "WACC").input("B10", wacc, "pct2")
      .label("A11", "Terminal growth").input("B11", tg, "pct2")
      .label("A12", "Net debt").input("B12", netDebt, "n1")
      .label("A13", "Diluted shares (m)").input("B13", shares, "n1")
      .head("A15", "Forecast").head("B15", "Last FY").head("C15", "Year 1").head("D15", "Year 2").head("E15", "Year 3").head("F15", "Year 4").head("G15", "Year 5")
      .label("A16", "Revenue").given("B16", "=B3", "n1")
      .calcRow(16, "C", "G", "={p}16*(1+$B$4)", "n1")
      .label("A17", "EBITDA").calcRow(17, "C", "G", "={c}16*$B$5", "n1")
      .label("A18", "D&A").calcRow(18, "C", "G", "={c}16*$B$6", "n1")
      .label("A19", "EBIT").calcRow(19, "C", "G", "={c}17-{c}18", "n1")
      .label("A20", "Tax on EBIT").calcRow(20, "C", "G", "={c}19*$B$9", "n1")
      .label("A21", "Capex").calcRow(21, "C", "G", "={c}16*$B$7", "n1")
      .label("A22", "Increase in net working capital").calcRow(22, "C", "G", "=({c}16-{p}16)*$B$8", "n1")
      .label("A23", "Unlevered free cash flow").calcRow(23, "C", "G", "={c}19-{c}20+{c}18-{c}21-{c}22", "n1")
      .head("A25", "Valuation")
      .label("A26", "PV of forecast cash flows").calc("B26", "=NPV(B10,C23:G23)", "n1")
      .label("A27", "Terminal value at year 5").calc("B27", "=G23*(1+B11)/(B10-B11)", "n1")
      .label("A28", "PV of terminal value").calc("B28", "=B27/(1+B10)^5", "n1")
      .label("A29", "Enterprise value").calc("B29", "=B26+B28", "n1")
      .label("A30", "Equity value").calc("B30", "=B29-B12", "n1")
      .label("A31", "Value per share ($)").calc("B31", "=B30/B13", "n2")
      .label("A32", "Terminal value as % of EV").calc("B32", "=B28/B29", "pct1");
    L.grade("C23", "Free cash flow, year 1", 2)
      .grade("G23", "Free cash flow, year 5", 2)
      .grade("B26", "PV of forecast cash flows", 2)
      .grade("B27", "Terminal value", 2)
      .grade("B28", "PV of terminal value", 1)
      .grade("B29", "Enterprise value", 2)
      .grade("B30", "Equity value", 1)
      .grade("B31", "Value per share", 2)
      .grade("B32", "Terminal value share of EV", 1);
    return L.build({
      shocks: [
        { label: "WACC up 1 point", set: { B10: wacc + 0.01 } },
        { label: "growth down 2 points", set: { B4: g - 0.02 } },
        { label: "EBITDA margin up 3 points", set: { B5: margin + 0.03 } },
        { label: "terminal growth down 0.5 points", set: { B11: tg - 0.005 } },
        { label: "net debt doubled", set: { B12: netDebt * 2 } },
      ],
      brief: [
        `You're valuing a mid-cap industrial company. Last fiscal year it booked **$${rev.toFixed(1)}m** of revenue. The base case grows revenue **${pct(g)}** a year for five years at a **${pct(margin)}** EBITDA margin.`,
        `Value the business with a five-year unlevered DCF, discounting at a **${pct(wacc, 2)}** WACC with a Gordon growth terminal value at **${pct(tg, 2)}**. Then bridge to equity value per share.`,
      ],
      steps: [
        "Forecast revenue in C16:G16, growing from last year's revenue (B16).",
        "Build EBITDA, D&A, EBIT and tax on EBIT (EBIT × tax rate) for each year.",
        "Capex is a % of revenue. The increase in net working capital is the NWC % times the change in revenue from the year before.",
        "Unlevered free cash flow = EBIT − tax on EBIT + D&A − capex − increase in NWC.",
        "Discount the five cash flows to today (end-of-year convention) in B26. Excel's **NPV** does this in one step.",
        "Terminal value at year 5 with Gordon growth on year 5's cash flow, then discount it back five years.",
        "Enterprise value, less net debt, gives equity value; divide by diluted shares for value per share.",
      ],
      solution: [
        "**Why unlevered.** Free cash flow to the firm is the cash available to all capital providers before any financing. So it's discounted at WACC, the blended cost of debt and equity, and gives enterprise value. Debt is subtracted only at the end.",
        "**Revenue and margins.** `=B16*(1+$B$4)` grows revenue; EBITDA is `=C16*$B$5`. EBIT subtracts D&A because depreciation is a real cost of using up assets, even though it isn't a cash outflow.",
        "**Tax on EBIT, not on profit before tax.** Interest is a financing cost, so the unlevered model taxes operating profit as if the company had no debt. The tax benefit of debt is captured in WACC through the after-tax cost of debt.",
        "**Back to cash.** Add back D&A (non-cash), subtract capex (cash spent on assets) and the increase in working capital. A growing company ties up cash in receivables and inventory: `=(C16-B16)*$B$8`.",
        "**Discounting.** `=NPV(B10,C23:G23)` discounts year 1 by one period, year 2 by two, and so on. NPV assumes the first value is one period away, which is why the range starts at year 1, not today. Writing it out with `SUMPRODUCT` and discount factors gives the same answer.",
        "**Terminal value.** The business is assumed to grow at the terminal rate forever after year 5: TV = FCF₅ × (1 + g) / (WACC − g). That's a value at the end of year 5, so it's discounted five years: `=B27/(1+B10)^5`. A common mistake is to discount it six years or to forget to grow FCF₅ by (1 + g).",
        "**Bridge to equity.** Enterprise value belongs to all capital providers; subtracting net debt leaves what belongs to shareholders. Divide by diluted shares, not basic, so options and convertibles are counted.",
        "**Sanity check.** Terminal value is usually 60% to 80% of EV in a five-year DCF. A much higher share means the answer depends mostly on the terminal assumptions, so test them with a sensitivity table.",
      ],
    });
  },
};
