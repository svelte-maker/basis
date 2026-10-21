// Grading one case part. Each part is graded on its own against the reference, never against the
// candidate's earlier answers, so parts can be attempted in any order or by different people.
import { gradeModel, type GradeReport } from "@/lib/models/grade";
import type { CasePart, NumericPart } from "./types";

export type PartGrade = {
  key: string;
  /** Share of the part's points earned, 0 to 1. */
  score: number;
  earned: number;
  points: number;
  correct: boolean;
  /** For model parts: the per-cell report. */
  report?: GradeReport;
};

export type PartInput = { value?: string; choice?: number; cells?: Record<string, unknown> };

/** "₹1,592.58", "12.05%", "(43,960)", "−3.5" → number. Returns null for anything else. */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[₹$,\s]/g, "").replace(/(%|x)$/i, "").replace(/[−–]/g, "-");
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -n : n) : null;
}

export function numericCorrect(p: NumericPart, got: number): boolean {
  const t = Math.max(p.tol.abs ?? 0, (p.tol.rel ?? 0) * Math.abs(p.answer));
  return Math.abs(got - p.answer) <= t + 1e-9;
}

export function gradePart(p: CasePart, input: PartInput): PartGrade | null {
  const base = { key: p.key, points: p.points };
  switch (p.kind) {
    case "numeric": {
      const n = parseNumber(input.value ?? "");
      if (n === null) return null;
      const ok = numericCorrect(p, n);
      return { ...base, score: ok ? 1 : 0, earned: ok ? p.points : 0, correct: ok };
    }
    case "choice": {
      if (typeof input.choice !== "number" || input.choice < 0 || input.choice >= p.options.length) return null;
      const ok = input.choice === p.correct;
      return { ...base, score: ok ? 1 : 0, earned: ok ? p.points : 0, correct: ok };
    }
    case "model": {
      const report = gradeModel(p.model, (input.cells ?? {}) as Record<string, string>);
      return { ...base, score: report.score, earned: Math.round(report.score * p.points * 100) / 100, correct: report.score === 1, report };
    }
  }
}
