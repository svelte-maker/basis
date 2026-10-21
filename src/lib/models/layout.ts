import type { Fmt } from "@/lib/sheets";
import type { CellSpec, GradedCell, ModelInstance, Shock } from "./types";

/** Small builder so task files read like the sheet they describe. */
export class Layout {
  cells: Record<string, CellSpec> = {};
  answer: Record<string, string> = {};
  graded: GradedCell[] = [];

  constructor(public rows: number, public cols: number, public widths: number[]) {}

  head(a: string, text: string) { this.cells[a] = { v: text, kind: "head" }; return this; }
  label(a: string, text: string) { this.cells[a] = { v: text, kind: "label" }; return this; }
  note(a: string, text: string) { this.cells[a] = { v: text, kind: "note" }; return this; }
  input(a: string, v: number | string, fmt?: Fmt) { this.cells[a] = { v: String(v), kind: "input", fmt }; return this; }
  /** A locked formula the candidate is given (for example a link to an input). */
  given(a: string, formula: string, fmt?: Fmt) { this.cells[a] = { v: formula, kind: "input", fmt }; return this; }
  calc(a: string, formula: string, fmt?: Fmt) { this.cells[a] = { v: "", kind: "calc", fmt }; this.answer[a] = formula; return this; }
  /** A row of calc cells across columns, formula written for the first column with {c} for this column and {p} for the previous one. */
  calcRow(row: number, fromCol: string, toCol: string, formula: string | ((c: string, p: string, i: number) => string), fmt?: Fmt) {
    const start = fromCol.charCodeAt(0), end = toCol.charCodeAt(0);
    for (let k = start; k <= end; k++) {
      const c = String.fromCharCode(k), p = String.fromCharCode(k - 1), i = k - start;
      const f = typeof formula === "function" ? formula(c, p, i) : formula.replaceAll("{c}", c).replaceAll("{p}", p);
      this.calc(`${c}${row}`, f, fmt);
    }
    return this;
  }
  grade(cell: string, label: string, points: number, extra: Partial<Pick<GradedCell, "tol" | "requires">> = {}) {
    this.graded.push({ cell, label, points, ...extra });
    return this;
  }

  build(rest: { shocks: Shock[]; brief: string[]; steps: string[]; solution: string[] }): ModelInstance {
    return { rows: this.rows, cols: this.cols, widths: this.widths, cells: this.cells, answer: this.answer, graded: this.graded, ...rest };
  }
}
