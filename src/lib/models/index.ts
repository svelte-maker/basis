import { seeded } from "@/lib/problems/rng";
import type { Difficulty } from "@/lib/problems/types";
import { compsLookup } from "./tasks/comps";
import { dcfModel } from "./tasks/dcf";
import { fundReturns } from "./tasks/fund";
import { ipoPricing } from "./tasks/ipo";
import { lboSweep } from "./tasks/lbo";
import { loanSchedule } from "./tasks/loan";
import type { ModelInstance, ModelTask } from "./types";

export * from "./types";

export const MODEL_TASKS: ModelTask[] = [loanSchedule, fundReturns, ipoPricing, compsLookup, dcfModel, lboSweep];

const bySlug = new Map(MODEL_TASKS.map((t) => [t.slug, t]));
if (bySlug.size !== MODEL_TASKS.length) throw new Error("Duplicate model slug");

export function getModelTask(slug: string): ModelTask | undefined {
  return bySlug.get(slug);
}

export function modelSeed(userId: string, slug: string, variant: number): string {
  return `model:${userId}:${slug}:v${variant}`;
}

export function instantiateModel(slug: string, seed: string): ModelInstance {
  const t = bySlug.get(slug);
  if (!t) throw new Error(`Unknown model task ${slug}`);
  return t.generate(seeded(seed));
}

/** Practice points for a first full solve. Models carry more than quick problems: they take longer and test more. */
export const MODEL_POINTS: Record<Difficulty, number> = { Easy: 8, Medium: 15, Hard: 25 };

/** What the browser may see before the task is solved: no reference formulas, no solution. */
export type PublicInstance = Omit<ModelInstance, "answer" | "solution" | "shocks"> & { shocks: string[] };

export function publicView(inst: ModelInstance): PublicInstance {
  const { answer: _a, solution: _s, shocks, ...rest } = inst;
  return { ...rest, shocks: shocks.map((s) => s.label) };
}
