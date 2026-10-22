import { pick } from "@/lib/problems/rng";
import { Layout } from "../layout";
import type { ModelTask } from "../types";

const pct = (x: number, dp = 1) => `${(x * 100).toFixed(dp)}%`;

export const lboSweep: ModelTask = {
  slug: "lbo-debt-sweep",
  title: "LBO with a cash sweep: debt paydown, MOIC and IRR",
  track: "Private Equity",
  difficulty: "Hard",
  skills: ["LBO", "Debt schedule", "Cash sweep", "Returns analysis"],
  functions: ["MIN", "MAX", "IRR"],
  minutes: 40,
  generate(rng) {
    const ebitda = pick(rng, 80, 200, 5);
    const entry = pick(rng, 8, 11, 0.5);
    const lev = pick(rng, 4, 5, 0.25);
    const rate = pick(rng, 0.07, 0.09, 0.0025);
    const amort = pick(rng, 0.01, 0.02, 0.005);
    const growth = pick(rng, 0.04, 0.1, 0.005);
    const capex = pick(rng, 0.18, 0.28, 0.01);
    const da = pick(rng, 0.1, 0.15, 0.01);
    const tax = 0.25;
    const exit = entry + pick(rng, -1, 1, 0.5);

    const L = new Layout(40, 7, [260, 96, 96, 96, 96, 96, 96]);
    L.head("A1", "Leveraged buyout ($m)")
      .label("A3", "Entry EBITDA").input("B3", ebitda, "n1")
      .label("A4", "Entry multiple (EV / EBITDA)").input("B4", entry, "x1")
      .label("A5", "Senior debt (x entry EBITDA)").input("B5", lev, "x2")
      .label("A6", "Interest rate on senior debt").input("B6", rate, "pct2")
      .label("A7", "Mandatory amortisation (% of original debt a year)").input("B7", amort, "pct1")
      .label("A8", "EBITDA growth").input("B8", growth, "pct1")
      .label("A9", "Capex + NWC investment (% of EBITDA)").input("B9", capex, "pct1")
      .label("A10", "D&A (% of EBITDA)").input("B10", da, "pct1")
      .label("A11", "Tax rate").input("B11", tax, "pct1")
      .label("A12", "Exit multiple (EV / EBITDA)").input("B12", exit, "x1")
      .head("A14", "Sources and uses")
      .label("A15", "Entry enterprise value").calc("B15", "=B3*B4", "n1")
      .label("A16", "Senior debt raised").calc("B16", "=B3*B5", "n1")
      .label("A17", "Sponsor equity").calc("B17", "=B15-B16", "n1")
      .head("A19", "Debt schedule").head("B19", "Close").head("C19", "Year 1").head("D19", "Year 2").head("E19", "Year 3").head("F19", "Year 4").head("G19", "Year 5")
      .label("A20", "EBITDA").given("B20", "=B3", "n1").calcRow(20, "C", "G", "={p}20*(1+$B$8)", "n1")
      .label("A21", "D&A").calcRow(21, "C", "G", "={c}20*$B$10", "n1")
      .label("A22", "Interest (on opening debt)").calcRow(22, "C", "G", "={c}26*$B$6", "n1")
      .label("A23", "Cash taxes").calcRow(23, "C", "G", "=({c}20-{c}21-{c}22)*$B$11", "n1")
      .label("A24", "Capex + NWC investment").calcRow(24, "C", "G", "={c}20*$B$9", "n1")
      .label("A25", "Free cash flow for debt repayment").calcRow(25, "C", "G", "={c}20-{c}22-{c}23-{c}24", "n1")
      .label("A26", "Opening debt").calcRow(26, "C", "G", (c, p, i) => (i === 0 ? "=$B$16" : `=${p}29`), "n1")
      .label("A27", "Mandatory amortisation").calcRow(27, "C", "G", "=MIN({c}26,$B$16*$B$7)", "n1")
      .label("A28", "Cash sweep").calcRow(28, "C", "G", "=MAX(0,MIN({c}25-{c}27,{c}26-{c}27))", "n1")
      .label("A29", "Closing debt").calcRow(29, "C", "G", "={c}26-{c}27-{c}28", "n1")
      .head("A31", "Exit and returns")
      .label("A32", "Exit enterprise value").calc("B32", "=G20*B12", "n1")
      .label("A33", "Debt at exit").calc("B33", "=G29", "n1")
      .label("A34", "Exit equity value").calc("B34", "=B32-B33", "n1")
      .label("A35", "MOIC").calc("B35", "=B34/B17", "x2")
      .label("A36", "IRR").calc("B36", "=IRR(B38:G38)", "pct1")
      .label("A38", "Sponsor cash flows").calc("B38", "=-B17", "n1")
      .calcRow(38, "C", "G", (c, _p, i) => (i === 4 ? "=B34" : "=0"), "n1");
    L.grade("B17", "Sponsor equity", 1)
      .grade("C25", "Free cash flow, year 1", 2)
      .grade("C28", "Cash sweep, year 1", 2)
      .grade("E29", "Closing debt, year 3", 2)
      .grade("G29", "Closing debt, year 5", 2)
      .grade("B32", "Exit enterprise value", 1)
      .grade("B34", "Exit equity value", 2)
      .grade("B35", "MOIC", 2)
      .grade("B36", "IRR", 2);
    return L.build({
      shocks: [
        { label: "interest rate up 1 point", set: { B6: rate + 0.01 } },
        { label: "entry multiple up 0.5x", set: { B4: entry + 0.5 } },
        { label: "exit multiple down 1x", set: { B12: exit - 1 } },
        { label: "EBITDA growth down 3 points", set: { B8: growth - 0.03 } },
        { label: "capex up 5 points of EBITDA", set: { B9: capex + 0.05 } },
      ],
      brief: [
        `A private equity fund buys a business with **$${ebitda}m** of EBITDA at **${entry.toFixed(1)}x**, funding **${lev.toFixed(2)}x** EBITDA with a senior term loan at **${pct(rate, 2)}** and the rest with equity.`,
        "The loan amortises a small fixed amount each year, and every dollar of free cash flow left after that sweeps to repay debt early. The fund exits at the end of year 5. Model the debt paydown and the fund's returns.",
      ],
      steps: [
        "Sources and uses: entry EV, debt raised, and the equity cheque that funds the rest (ignore fees).",
        "Grow EBITDA, then work out D&A, interest on the year's opening debt, cash taxes on (EBITDA − D&A − interest), and capex + NWC investment.",
        "Free cash flow for debt repayment = EBITDA − interest − cash taxes − capex + NWC investment.",
        "Debt schedule: opening debt, mandatory amortisation (a fixed % of the original loan, capped at what's outstanding), cash sweep of the remaining FCF (never below zero, never more than the debt left), closing debt.",
        "Exit EV at the exit multiple on year 5 EBITDA, less debt at exit, gives exit equity. Then MOIC, and IRR with **IRR** over the sponsor's cash flows in B38:G38.",
      ],
      solution: [
        "**Sources and uses.** The purchase price `=B3*B4` is funded by debt `=B3*B5` and equity, the plug: `=B15-B16`.",
        "**Interest on opening debt.** Charging interest on the opening balance avoids a circular reference: closing debt depends on the sweep, which depends on interest. Many banks use average debt with iterative calculation switched on. Opening balance is the cleaner choice for a test.",
        "**Cash taxes.** Interest is tax-deductible, so taxes fall as leverage rises: `=(C20-C21-C22)*$B$11`. This interest tax shield is one of the reasons LBOs use debt.",
        "**Free cash flow for debt repayment** starts from EBITDA because D&A is non-cash. Subtract the cash items: interest, taxes and reinvestment.",
        "**Mandatory amortisation** is a fixed share of the original loan: `=MIN(C26,$B$16*$B$7)`. The MIN stops you repaying more than is outstanding.",
        "**Cash sweep.** `=MAX(0,MIN(C25-C27,C26-C27))` sends what's left of FCF after amortisation to the lender, never more than the remaining debt and never negative. MIN and MAX are how every sweep, revolver and covenant test in a real model is written.",
        "**Returns.** Exit equity = exit EV − remaining debt. MOIC is exit equity ÷ equity invested. IRR over the cash flows (−equity today, zeros, exit equity in year 5) equals MOIC^(1/5) − 1 when there are no interim dividends. Debt paydown, EBITDA growth and multiple expansion are the three sources of the return.",
      ],
    });
  },
};
