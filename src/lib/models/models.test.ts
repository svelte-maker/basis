import { describe, expect, it } from "vitest";
import { evaluateSheet, isError } from "@/lib/sheets";
import { runDcf } from "@/lib/finance/dcf";
import { gradeModel, referenceCells } from "./grade";
import { instantiateModel, MODEL_TASKS, publicView } from ".";

const SEEDS = Array.from({ length: 150 }, (_, i) => `seed-${i}`);

describe.each(MODEL_TASKS.map((t) => [t.slug, t] as const))("%s", (slug, task) => {
  it("is well formed", () => {
    const inst = instantiateModel(slug, "x");
    for (const g of inst.graded) expect(inst.cells[g.cell]?.kind, g.cell).toBe("calc");
    for (const [a, s] of Object.entries(inst.cells)) if (s.kind === "calc") expect(inst.answer[a], a).toBeDefined();
    for (const a of Object.keys(inst.answer)) expect(inst.cells[a]?.kind, a).toBe("calc");
    expect(inst.widths.length).toBe(inst.cols);
    expect(inst.steps.length).toBeGreaterThan(0);
    expect(inst.solution.length).toBeGreaterThanOrEqual(4);
    expect(task.skills.length).toBeGreaterThan(0);
  });

  it("reference model scores 100% on every seed, with finite outputs", () => {
    for (const seed of SEEDS) {
      const inst = instantiateModel(slug, seed);
      const s = evaluateSheet(referenceCells(inst), inst.rows, inst.cols);
      for (const a of Object.keys(inst.answer)) {
        const v = s.values[a];
        expect(isError(v), `${seed} ${a} = ${JSON.stringify(v)}`).toBe(false);
        if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
      }
      const r = gradeModel(inst, inst.answer);
      expect(r.score, `${seed}: ${JSON.stringify(r.cells.filter((c) => c.status !== "ok"))}`).toBe(1);
    }
  });

  it("an empty sheet scores zero", () => {
    const r = gradeModel(instantiateModel(slug, "y"), {});
    expect(r.score).toBe(0);
    expect(r.cells.every((c) => c.status === "empty")).toBe(true);
  });

  it("typed-in answers fail the live-model check on every graded cell", () => {
    for (const seed of SEEDS.slice(0, 40)) {
      const inst = instantiateModel(slug, seed);
      const s = evaluateSheet(referenceCells(inst), inst.rows, inst.cols);
      const typed = Object.fromEntries(Object.keys(inst.answer).map((a) => [a, String(s.values[a])]));
      const r = gradeModel(inst, typed);
      for (const c of r.cells) expect(c.status, `${seed} ${c.cell}`).toBe("hardcoded");
    }
  });

  it("can't overwrite the given inputs", () => {
    const inst = instantiateModel(slug, "z");
    const input = Object.entries(inst.cells).find(([, s]) => s.kind === "input")![0];
    const r = gradeModel(inst, { ...inst.answer, [input]: "999999" });
    expect(r.score).toBe(1);
  });

  it("never sends the answer to the browser", () => {
    const view = JSON.stringify(publicView(instantiateModel(slug, "w")));
    expect(view).not.toContain('"answer"');
    expect(view).not.toContain('"solution"');
  });
});

describe("grader feedback", () => {
  it("flags a missing required function", () => {
    const inst = instantiateModel("term-loan-amortisation", "q");
    const manual = { ...inst.answer, B7: "=B3*B4/(1-(1+B4)^-B5)" };
    const r = gradeModel(inst, manual);
    expect(r.cells.find((c) => c.cell === "B7")!.status).toBe("missing-function");
    expect(r.cells.filter((c) => c.cell !== "B7").every((c) => c.status === "ok")).toBe(true);
  });

  it("accepts a required function used in a helper cell", () => {
    const inst = instantiateModel("fund-returns-xirr", "q");
    const r = gradeModel(inst, { ...inst.answer, D2: "=XIRR(B6:B13,A6:A13)", B16: "=D2" });
    expect(r.cells.find((c) => c.cell === "B16")!.status).toBe("ok");
  });

  it("gives partial credit and reports wrong cells", () => {
    const inst = instantiateModel("five-year-dcf", "q");
    const r = gradeModel(inst, { ...inst.answer, B27: "=G23/(B10-B11)" }); // forgot to grow FCF by (1 + g)
    const bad = r.cells.filter((c) => c.status !== "ok").map((c) => c.cell);
    expect(bad).toEqual(expect.arrayContaining(["B27", "B28", "B29", "B30", "B31", "B32"]));
    expect(r.score).toBeGreaterThan(0.3);
    expect(r.score).toBeLessThan(1);
  });

  it("partly hardcoded formulas are caught", () => {
    const inst = instantiateModel("term-loan-amortisation", "q");
    const rate = inst.cells.B4.v;
    const r = gradeModel(inst, { ...inst.answer, C11: `=C10*${rate}` });
    expect(r.cells.find((c) => c.cell === "B15")!.status).toBe("hardcoded");
  });
});

describe("reference models agree with independent calculations", () => {
  it("DCF matches the finance library", () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const inst = instantiateModel("five-year-dcf", seed);
      const n = (a: string) => Number(inst.cells[a].v);
      const s = evaluateSheet(referenceCells(inst), inst.rows, inst.cols).values;
      const lib = runDcf({
        baseRevenue: n("B3"), revenueGrowth: Array(5).fill(n("B4")), ebitMargin: Array(5).fill(n("B5") - n("B6")),
        taxRate: n("B9"), daPctRevenue: n("B6"), capexPctRevenue: n("B7"), nwcPctRevenue: n("B8"), wacc: n("B10"),
        terminal: { method: "gordon", growth: n("B11") }, midYear: false, netDebt: n("B12"), dilutedShares: n("B13"),
      });
      expect(s.B29 as number).toBeCloseTo(lib.enterpriseValue, 6);
      expect(s.B31 as number).toBeCloseTo(lib.perShare, 6);
    }
  });

  it("loan schedule pays off to zero and matches the annuity formula", () => {
    for (const seed of SEEDS) {
      const inst = instantiateModel("term-loan-amortisation", seed);
      const s = evaluateSheet(referenceCells(inst), inst.rows, inst.cols).values;
      const P = Number(inst.cells.B3.v), r = Number(inst.cells.B4.v);
      expect(s.B7 as number).toBeCloseTo((P * r) / (1 - Math.pow(1 + r, -5)), 8);
      expect(Math.abs(s.G13 as number)).toBeLessThan(1e-8);
    }
  });

  it("LBO free cash flow always covers mandatory amortisation, base case and shocks", () => {
    for (const seed of SEEDS) {
      const inst = instantiateModel("lbo-debt-sweep", seed);
      for (const set of [{}, ...inst.shocks.map((x) => x.set)]) {
        const raw = { ...referenceCells(inst), ...Object.fromEntries(Object.entries(set).map(([k, v]) => [k, String(v)])) };
        const s = evaluateSheet(raw, inst.rows, inst.cols).values;
        for (const c of "CDEFG") {
          expect(s[`${c}25`] as number, `${seed} ${c}`).toBeGreaterThan(s[`${c}27`] as number);
          expect(s[`${c}29`] as number).toBeGreaterThanOrEqual(0);
        }
        expect(s.B36 as number).toBeCloseTo(Math.pow(s.B35 as number, 1 / 5) - 1, 8);
      }
    }
  });

  it("IPO: promoters end below their pre-issue holding and fresh shares rise at the lower band", () => {
    for (const seed of SEEDS) {
      const inst = instantiateModel("ipo-fresh-issue-ofs", seed);
      const s = evaluateSheet(referenceCells(inst), inst.rows, inst.cols).values;
      expect(s.B18 as number).toBeLessThan(Number(inst.cells.B4.v));
      expect(s.B18 as number).toBeGreaterThan(0);
      expect(s.B22 as number).toBeLessThan(s.B17 as number);
    }
  });

  it("fund: XNPV at the XIRR is zero", () => {
    for (const seed of SEEDS) {
      const inst = instantiateModel("fund-returns-xirr", seed);
      const s = evaluateSheet({ ...referenceCells(inst), B3: "=B16" }, inst.rows, inst.cols).values;
      expect(Math.abs(s.B17 as number)).toBeLessThan(1e-6);
    }
  });
});
