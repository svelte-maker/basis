import type { Difficulty, Instance, Template, Track } from "./types";
import { seeded } from "./rng";
import { accounting } from "./templates/accounting";
import { corporate } from "./templates/corporate";
import { valuation } from "./templates/valuation";
import { bankingCredit, derivatives, fixedIncome, portfolioRisk, privateEquity } from "./templates/markets";

export * from "./types";

export const TEMPLATES: Template[] = [...accounting, ...corporate, ...valuation, ...fixedIncome, ...derivatives, ...privateEquity, ...portfolioRisk, ...bankingCredit];

const bySlug = new Map(TEMPLATES.map((t) => [t.slug, t]));
if (bySlug.size !== TEMPLATES.length) throw new Error("Duplicate problem slug");

export function getTemplate(slug: string): Template | undefined {
  return bySlug.get(slug);
}

/** Practice seed: stable per user and variant, so a refresh shows the same numbers. */
export function practiceSeed(userId: string, slug: string, variant: number): string {
  return `practice:${userId}:${slug}:v${variant}`;
}

export function contestSeed(contestId: string, userId: string, slug: string): string {
  return `contest:${contestId}:${userId}:${slug}`;
}

export function instantiate(slug: string, seed: string): Instance {
  const t = bySlug.get(slug);
  if (!t) throw new Error(`Unknown problem ${slug}`);
  return t.generate(seeded(seed));
}

/**
 * Parse what a person typed. Accepts "1,234.5", "$1,234", "12.5%", "(21.04)" for negatives,
 * the Unicode minus sign, and a trailing "x".
 */
export function parseAnswer(raw: string): number | null {
  let s = raw.trim().replace(/[−–]/g, "-").replace(/[$,\s%x×]/gi, "");
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const v = parseFloat(s);
  return neg ? -v : v;
}

export function isCorrect(value: number, inst: Pick<Instance, "answer" | "tolerance">): boolean {
  const tol = Math.max(inst.tolerance.abs ?? 0, (inst.tolerance.rel ?? 0) * Math.abs(inst.answer));
  return Math.abs(value - inst.answer) <= tol + 1e-9;
}

export const PRACTICE_POINTS: Record<Difficulty, number> = { Easy: 2, Medium: 5, Hard: 10 };
export const CONTEST_POINTS: Record<Difficulty, number> = { Easy: 300, Medium: 500, Hard: 800 };

export function templatesByTrack(): Record<Track, Template[]> {
  const out = {} as Record<Track, Template[]>;
  for (const t of TEMPLATES) (out[t.track] ??= []).push(t);
  return out;
}
