import type { Difficulty } from "@/lib/problems/types";
import { publicView as publicModel, type PublicInstance } from "@/lib/models";
import { appleDcf } from "./studies/apple-dcf";
import { hyundaiIpo } from "./studies/hyundai-ipo";
import type { CasePart, CaseStudy } from "./types";

export * from "./types";

/** Real cases are fixed data, so each is built once. */
export const CASES: CaseStudy[] = [hyundaiIpo(), appleDcf()];

const bySlug = new Map(CASES.map((c) => [c.slug, c]));
if (bySlug.size !== CASES.length) throw new Error("Duplicate case slug");

export function getCase(slug: string): CaseStudy | undefined {
  return bySlug.get(slug);
}

export function getPart(c: CaseStudy, key: string): CasePart | undefined {
  return c.parts.find((p) => p.key === key);
}

/** Practice points for working through a whole case, scaled by the share of part points earned. */
export const CASE_POINTS: Record<Difficulty, number> = { Easy: 20, Medium: 35, Hard: 50 };

export function casePoints(c: CaseStudy): number {
  return c.parts.reduce((s, p) => s + p.points, 0);
}

/** What the browser may see before a part is done: no answers, no solutions, no reference formulas. */
export type PublicPart =
  | { key: string; kind: "numeric"; title: string; points: number; skills: string[]; prompt: string[]; unit: string }
  | { key: string; kind: "choice"; title: string; points: number; skills: string[]; prompt: string[]; options: string[] }
  | { key: string; kind: "model"; title: string; points: number; skills: string[]; prompt: string[]; model: PublicInstance };

export function publicPart(p: CasePart): PublicPart {
  const base = { key: p.key, title: p.title, points: p.points, skills: p.skills, prompt: p.prompt };
  switch (p.kind) {
    case "numeric": return { ...base, kind: "numeric", unit: p.unit };
    case "choice": return { ...base, kind: "choice", options: p.options };
    case "model": return { ...base, kind: "model", model: publicModel(p.model) };
  }
}

export type PublicCase = Omit<CaseStudy, "parts" | "printed" | "used" | "checks"> & { parts: PublicPart[] };

export function publicCase(c: CaseStudy): PublicCase {
  const { parts, printed: _p, used: _u, checks: _c, ...rest } = c;
  return { ...rest, parts: parts.map(publicPart) };
}
