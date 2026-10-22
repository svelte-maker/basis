// Grading a model: output values, the live-model check under shocked inputs, and required functions.
import { evaluateSheet, functionsBehind, isError, isFormula, parseAddr, type Raw, type Scalar } from "@/lib/sheets";
import type { GradedCell, ModelInstance } from "./types";

export type CellStatus = "ok" | "empty" | "error" | "wrong" | "hardcoded" | "missing-function";

export type CellResult = {
  cell: string;
  label: string;
  points: number;
  earned: number;
  status: CellStatus;
  /** Which shock broke the cell, for "hardcoded". */
  shock?: string;
  /** Functions the cell needed, for "missing-function". */
  missing?: string[];
};

export type GradeReport = { score: number; earned: number; total: number; cells: CellResult[] };

export const MAX_ENTRY = 500;

/** Keep only cells the candidate may edit, inside the grid, at a sane length. Locked cells always come from the task. */
export function sanitize(inst: ModelInstance, input: Record<string, unknown>): Raw {
  const out: Raw = {};
  for (const [a, v] of Object.entries(input ?? {})) {
    const p = parseAddr(a);
    if (!p || p.r >= inst.rows || p.c >= inst.cols || typeof v !== "string") continue;
    const key = a.toUpperCase().replace(/\$/g, "");
    const spec = inst.cells[key];
    if (spec && spec.kind !== "calc") continue;
    const s = v.slice(0, MAX_ENTRY);
    if (s.trim()) out[key] = s;
  }
  return out;
}

export function givenCells(inst: ModelInstance): Raw {
  const out: Raw = {};
  for (const [a, s] of Object.entries(inst.cells)) if (s.kind !== "calc" && s.v !== "") out[a] = s.v;
  return out;
}

export function referenceCells(inst: ModelInstance): Raw {
  return { ...givenCells(inst), ...inst.answer };
}

function matches(got: Scalar, expected: Scalar, tol: GradedCell["tol"]): boolean {
  if (typeof expected === "number") {
    if (typeof got !== "number") return false;
    const t = Math.max(tol?.abs ?? 1e-6, (tol?.rel ?? 5e-4) * Math.abs(expected));
    return Math.abs(got - expected) <= t + 1e-12;
  }
  if (typeof expected === "string" && typeof got === "string") return got.trim().toLowerCase() === expected.trim().toLowerCase();
  return got === expected;
}

export function gradeModel(inst: ModelInstance, candidate: Raw): GradeReport {
  const given = givenCells(inst);
  const user = { ...sanitize(inst, candidate), ...given };
  const ref = referenceCells(inst);
  const { rows, cols } = inst;
  const mine = evaluateSheet(user, rows, cols);
  const theirs = evaluateSheet(ref, rows, cols);
  const shocked = inst.shocks.map((s) => {
    const set = Object.fromEntries(Object.entries(s.set).map(([k, v]) => [k, String(v)]));
    return { label: s.label, mine: evaluateSheet({ ...user, ...set }, rows, cols), theirs: evaluateSheet({ ...ref, ...set }, rows, cols) };
  });

  const cells = inst.graded.map((g): CellResult => {
    const base = { cell: g.cell, label: g.label, points: g.points, earned: 0 };
    const got = mine.values[g.cell] ?? null;
    if (got === null) return { ...base, status: "empty" };
    if (isError(got)) return { ...base, status: "error" };
    if (!matches(got, theirs.values[g.cell] ?? null, g.tol)) return { ...base, status: "wrong" };
    for (const s of shocked) {
      if (!matches(s.mine.values[g.cell] ?? null, s.theirs.values[g.cell] ?? null, g.tol)) {
        return { ...base, status: "hardcoded", shock: s.label };
      }
    }
    if (g.requires?.length) {
      const used = isFormula(mine, g.cell) ? functionsBehind(mine, g.cell) : new Set<string>();
      const missing = g.requires.filter((anyOf) => !anyOf.some((f) => used.has(f))).map((anyOf) => anyOf.join(" or "));
      if (missing.length) return { ...base, status: "missing-function", missing };
    }
    return { ...base, status: "ok", earned: g.points };
  });

  const total = cells.reduce((s, c) => s + c.points, 0);
  const earned = cells.reduce((s, c) => s + c.earned, 0);
  return { score: total ? earned / total : 0, earned, total, cells };
}
