import { choice, pick } from "@/lib/problems/rng";
import { Layout } from "../layout";
import type { ModelTask } from "../types";

const PEERS = ["Peer A", "Peer B", "Peer C", "Peer D", "Peer E", "Peer F", "Peer G"];

export const compsLookup: ModelTask = {
  slug: "trading-comps-lookups",
  title: "Trading comps with lookups and a scenario switch",
  track: "Valuation",
  difficulty: "Medium",
  skills: ["Trading comparables", "Lookups", "Scenario switch"],
  functions: ["INDEX", "MATCH", "XLOOKUP", "MEDIAN", "COUNTIF", "CHOOSE"],
  minutes: 20,
  generate(rng) {
    const rows = PEERS.map((name) => {
      const ebitda = pick(rng, 60, 600, 5);
      const mult = pick(rng, 6, 14, 0.1);
      return { name, ebitda, ev: Math.round(ebitda * mult) };
    });
    const selected = choice(rng, PEERS);
    const other = choice(rng, PEERS.filter((p) => p !== selected));
    const target = pick(rng, 50, 400, 5);
    const scenario = pick(rng, 1, 3, 1);
    const cut = pick(rng, 9, 11, 0.5);

    const L = new Layout(24, 6, [200, 110, 110, 120, 96, 96]);
    L.head("A1", "Trading comparables ($m)")
      .head("A3", "Company").head("B3", "EV").head("C3", "EBITDA (LTM)").head("D3", "EV / EBITDA");
    rows.forEach((r, i) => {
      L.label(`A${4 + i}`, r.name).input(`B${4 + i}`, r.ev, "n0").input(`C${4 + i}`, r.ebitda, "n0").calc(`D${4 + i}`, `=B${4 + i}/C${4 + i}`, "x1");
    });
    L.label("A12", "Look up this peer").input("B12", selected, "text")
      .label("A13", "Its EV / EBITDA").calc("B13", "=INDEX(D4:D10,MATCH(B12,A4:A10,0))", "x2")
      .label("A14", "Median EV / EBITDA").calc("B14", "=MEDIAN(D4:D10)", "x2")
      .label("A15", "Peers trading above").input("B15", cut, "x1").calc("C15", '=COUNTIF(D4:D10,">"&B15)', "n0")
      .head("A17", "Scenario").head("C17", "Bear").head("D17", "Base").head("E17", "Bull")
      .label("A18", "Multiple vs peer median").input("C18", -1.5, "x1").input("D18", 0, "x1").input("E18", 1.5, "x1")
      .label("A19", "Selected scenario (1 bear, 2 base, 3 bull)").input("B19", scenario, "n0")
      .label("A20", "Target LTM EBITDA").input("B20", target, "n0")
      .label("A22", "Multiple applied").calc("B22", "=B14+INDEX(C18:E18,B19)", "x2")
      .label("A23", "Implied enterprise value").calc("B23", "=B20*B22", "n1");
    L.grade("D4", "EV / EBITDA, first peer", 1)
      .grade("B13", "Looked-up multiple", 3, { requires: [["MATCH", "XLOOKUP", "VLOOKUP"]] })
      .grade("B14", "Median multiple", 2, { requires: [["MEDIAN"]] })
      .grade("C15", "Count above the cut-off", 2, { requires: [["COUNTIF", "COUNTIFS"]] })
      .grade("B22", "Multiple for the scenario", 2, { requires: [["INDEX", "CHOOSE", "XLOOKUP", "HLOOKUP"]] })
      .grade("B23", "Implied enterprise value", 2);
    const next = (scenario % 3) + 1;
    // Move the cut-off to a level that is certain to change the count.
    const multiples = rows.map((r) => r.ev / r.ebitda);
    const above = multiples.filter((m) => m > cut).length;
    const newCut = above === multiples.length ? Math.ceil(Math.max(...multiples) * 10 + 1) / 10 : Math.floor(Math.min(...multiples) * 10 - 1) / 10;
    return L.build({
      shocks: [
        { label: `peer switched to ${other}`, set: { B12: other } },
        { label: `scenario switched to ${next}`, set: { B19: next } },
        { label: "every peer's EV up 10%", set: Object.fromEntries(rows.map((r, i) => [`B${4 + i}`, Math.round(r.ev * 1.1)])) },
        { label: `cut-off moved to ${newCut.toFixed(1)}x`, set: { B15: newCut } },
        { label: "target EBITDA up 10%", set: { B20: target * 1.1 } },
      ],
      brief: [
        "**Hypothetical peer set.** You're building the comps page for a pitch book. Seven listed peers are below with their enterprise value and last-twelve-months EBITDA.",
        "The MD wants a page that keeps working when the peer set or the case changes. So the lookups and the scenario switch must be formulas, never typed numbers.",
      ],
      steps: [
        "D4:D10: EV / EBITDA for each peer.",
        "B13: look up the multiple of the peer named in B12. Use **INDEX/MATCH** or **XLOOKUP**, so changing B12 changes the answer.",
        "B14: the median multiple (**MEDIAN**). Bankers use the median because one outlier can drag the mean.",
        "C15: how many peers trade above the cut-off in B15 (**COUNTIF**, building the criterion from the cell).",
        "B22: the multiple for the scenario chosen in B19: the peer median plus that scenario's adjustment from C18:E18 (**INDEX** or **CHOOSE**).",
        "B23: implied enterprise value of the target.",
      ],
      solution: [
        "**INDEX/MATCH.** `=MATCH(B12,A4:A10,0)` finds the row of the peer (0 means exact match) and `=INDEX(D4:D10, …)` returns the multiple in that row. It beats VLOOKUP because the lookup column doesn't have to be first and inserting a column doesn't break it. `=XLOOKUP(B12,A4:A10,D4:D10)` does the same in one function.",
        "**MEDIAN over AVERAGE.** Peer multiples are skewed by the odd company with depressed EBITDA, so the median is the standard central measure on a comps page.",
        "**COUNTIF with a cell in the criterion.** `=COUNTIF(D4:D10,\">\"&B15)` joins the operator to the cell's value. Writing `\">B15\"` would compare against the text B15 and count nothing.",
        "**Scenario switch.** `=B14+INDEX(C18:E18,B19)` picks the bear, base or bull adjustment by position. `=CHOOSE(B19,C18,D18,E18)` is the other common pattern. Every downstream number then flexes with one input, which is how real models toggle cases.",
        "**Implied EV** is target EBITDA × the selected multiple. Net debt would then bridge this to equity value.",
      ],
    });
  },
};
