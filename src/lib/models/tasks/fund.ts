import { pick } from "@/lib/problems/rng";
import { serial } from "@/lib/sheets";
import { Layout } from "../layout";
import type { ModelTask } from "../types";

export const fundReturns: ModelTask = {
  slug: "fund-returns-xirr",
  title: "Fund returns on real dates: XIRR, XNPV and TVPI",
  track: "Private Equity",
  difficulty: "Medium",
  skills: ["Returns analysis", "Irregular cash flows"],
  functions: ["XIRR", "XNPV", "IRR", "SUMIF"],
  minutes: 20,
  generate(rng) {
    // Three capital calls in the first two years, then five distributions.
    let d = serial(pick(rng, 2015, 2019, 1), pick(rng, 1, 12, 1), pick(rng, 1, 28, 1));
    const dates: number[] = [];
    const gaps = [0, pick(rng, 120, 300, 1), pick(rng, 150, 400, 1), pick(rng, 400, 700, 1), pick(rng, 150, 400, 1), pick(rng, 150, 400, 1), pick(rng, 120, 360, 1), pick(rng, 100, 300, 1)];
    for (const g of gaps) { d += g; dates.push(d); }
    const calls = [pick(rng, 10, 25, 0.5), pick(rng, 5, 15, 0.5), pick(rng, 5, 12, 0.5)];
    const paidIn = calls.reduce((s, x) => s + x, 0);
    const tvpi = pick(rng, 1.3, 2.4, 0.05);
    const weights = [pick(rng, 1, 3, 1), pick(rng, 1, 3, 1), pick(rng, 2, 4, 1), pick(rng, 2, 5, 1), pick(rng, 1, 4, 1)];
    const wsum = weights.reduce((s, x) => s + x, 0);
    const dists = weights.map((w) => Math.round(((paidIn * tvpi * w) / wsum) * 10) / 10);
    const flows = [...calls.map((x) => -x), ...dists];
    const hurdle = 0.08;

    const L = new Layout(22, 4, [230, 120, 120, 120]);
    L.head("A1", "Fund cash flows ($m, from the investor's side)")
      .label("A3", "Hurdle rate").input("B3", hurdle, "pct1")
      .head("A5", "Date").head("B5", "Cash flow").head("C5", "Type");
    flows.forEach((f, i) => {
      L.input(`A${6 + i}`, dates[i], "date").input(`B${6 + i}`, f, "n1").label(`C${6 + i}`, f < 0 ? "Capital call" : "Distribution");
    });
    L.head("A15", "Results")
      .label("A16", "Net IRR on actual dates").calc("B16", "=XIRR(B6:B13,A6:A13)", "pct2")
      .label("A17", "NPV at the hurdle, actual dates").calc("B17", "=XNPV(B3,B6:B13,A6:A13)", "n2")
      .label("A18", "Total distributed").calc("B18", '=SUMIF(B6:B13,">0")', "n1")
      .label("A19", "Total paid in").calc("B19", '=-SUMIF(B6:B13,"<0")', "n1")
      .label("A20", "TVPI (total value / paid in)").calc("B20", "=B18/B19", "x2")
      .label("A21", "IRR if the flows were a year apart").calc("B21", "=IRR(B6:B13)", "pct2");
    L.grade("B16", "XIRR", 3, { requires: [["XIRR"]] })
      .grade("B17", "XNPV at hurdle", 3, { requires: [["XNPV"]] })
      .grade("B18", "Total distributed", 1, { requires: [["SUMIF", "SUMIFS"]] })
      .grade("B19", "Total paid in", 1, { requires: [["SUMIF", "SUMIFS"]] })
      .grade("B20", "TVPI", 1)
      .grade("B21", "IRR on annual spacing", 2, { requires: [["IRR"]] });
    return L.build({
      shocks: [
        { label: "last distribution 25% larger", set: { B13: Math.round(dists[4] * 12.5) / 10 } },
        { label: "last distribution six months later", set: { A13: dates[7] + 182 } },
        { label: "hurdle at 10%", set: { B3: 0.1 } },
        { label: "first call 20% larger", set: { B6: -Math.round(calls[0] * 12) / 10 } },
      ],
      brief: [
        "You're an analyst at a pension fund reviewing one of its private equity commitments. The fund called capital three times and has since made five distributions, on the dates below.",
        "The investment committee wants the net IRR on the actual dates, the value created over an **8%** hurdle, and the TVPI. It also wants to see how far off an IRR that ignores the real dates would be.",
      ],
      steps: [
        "B16: net IRR using the actual dates (**XIRR**).",
        "B17: NPV at the hurdle rate in B3, using the actual dates (**XNPV**).",
        "B18 and B19: total distributed and total paid in, with **SUMIF** on the sign of each flow. Show paid in as a positive number.",
        "B20: TVPI, distributions over paid-in capital.",
        "B21: the IRR you'd get if you treated the flows as exactly one year apart (**IRR**).",
      ],
      solution: [
        "**Why XIRR.** Fund cash flows land on irregular dates. IRR assumes equal periods, so it treats a call four months after the first one as a full year later. `=XIRR(B6:B13,A6:A13)` discounts each flow by its actual days from the first date, over a 365-day year.",
        "**XNPV** works the same way: `=XNPV(B3,B6:B13,A6:A13)`. Unlike NPV, it doesn't discount the first flow, because the first date is the valuation date. A positive XNPV at the hurdle means the fund beat 8% a year.",
        "**Paid in and distributed.** `=SUMIF(B6:B13,\">0\")` adds the distributions; `=-SUMIF(B6:B13,\"<0\")` adds the calls and flips the sign. Criteria are text, so the comparison sits in quotes.",
        "**TVPI** (also called MOIC) is distributions ÷ paid in. It ignores time: two funds with the same TVPI can have very different IRRs.",
        "**The annual-spacing trap.** `=IRR(B6:B13)` treats eight flows as eight years. Here the real holding period is different, so this IRR misstates the return. Limited partners always report IRR on actual dates for this reason.",
      ],
    });
  },
};
