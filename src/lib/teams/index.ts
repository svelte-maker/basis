// Team solving: several people build one model, each owning a part. Pure logic, no database,
// so the grading, credit split and claim rules are unit tested.
import { gradeModel, MAX_ENTRY, type GradeReport } from "@/lib/models/grade";
import { MODEL_POINTS, type ModelInstance } from "@/lib/models";
import type { Difficulty } from "@/lib/problems/types";
import type { Raw } from "@/lib/sheets";
import { partOfCell, type PartSpec } from "./splits";

export * from "./splits";

export const TEAM_MIN = 2;
/** Points for the whole team on top of each person's share when the joined-up model passes every check. */
export const INTEGRATION_BONUS = 0.2;
/** A claim with no edits for this long can be taken over by a teammate. */
export const STALE_CLAIM_MS = 24 * 60 * 60 * 1000;
export const TEAM_DAYS = 7;

/** A cell the team has written, and who wrote it. */
export type TeamCell = { value: string; authorId: string };

/** The task as a team plays it: the solo checks plus each part's extra checks. */
export function teamInstance(inst: ModelInstance, parts: PartSpec[]): ModelInstance {
  return { ...inst, graded: [...inst.graded, ...parts.flatMap((p) => p.extra ?? [])] };
}

/** Who may type in a cell: the claimer of the part whose rows hold it. Locked cells and cells outside every part belong to nobody. */
export function ownerOf(inst: ModelInstance, parts: PartSpec[], claims: Record<string, string | null>, a: string): string | null {
  const spec = inst.cells[a];
  if (spec && spec.kind !== "calc") return null;
  const p = partOfCell(parts, a);
  return p ? claims[p.key] ?? null : null;
}

export function gradedIn(inst: ModelInstance, part: PartSpec) {
  return inst.graded.filter((g) => partOfCell([part], g.cell));
}

const valuesOf = (cells: Record<string, TeamCell>): Raw => Object.fromEntries(Object.entries(cells).map(([a, c]) => [a, c.value]));

/**
 * Grade one part on its own. Every calc cell outside the part takes the reference formula, so a teammate's
 * mistake upstream never costs this part anything, and this part's mistakes never cost theirs.
 * `inst` must be the team instance (see teamInstance).
 */
export function gradePart(inst: ModelInstance, part: PartSpec, cells: Record<string, TeamCell>): GradeReport {
  const sheet: Raw = valuesOf(cells);
  for (const [a, f] of Object.entries(inst.answer)) if (!partOfCell([part], a)) sheet[a] = f;
  return gradeModel({ ...inst, graded: gradedIn(inst, part) }, sheet);
}

/** The whole team sheet graded as one model, as a solo candidate's would be. */
export function gradeIntegrated(inst: ModelInstance, cells: Record<string, TeamCell>): GradeReport {
  return gradeModel(inst, valuesOf(cells));
}

/** Share of a part's formula cells each person wrote. Only calc cells count, so padding a part with notes earns nothing. */
export function authorShares(inst: ModelInstance, part: PartSpec, cells: Record<string, TeamCell>): Record<string, number> {
  const counts: Record<string, number> = {};
  let n = 0;
  for (const [a, c] of Object.entries(cells)) {
    if (inst.cells[a]?.kind !== "calc" || !partOfCell([part], a) || !c.value.trim()) continue;
    counts[c.authorId] = (counts[c.authorId] ?? 0) + 1;
    n++;
  }
  return Object.fromEntries(Object.entries(counts).map(([u, k]) => [u, k / n]));
}

/** A part's own grade. `report` holds per-cell detail for spreadsheet parts. */
export type PartScore = { score: number; earned: number; total: number; report?: GradeReport };

/**
 * Anything a team can split: a model task or a case study. Work is stored as address → text cells,
 * and every address belongs to exactly one part, which is what makes credit checkable.
 */
export type TeamTask = {
  kind: "model" | "case";
  slug: string;
  title: string;
  difficulty: Difficulty;
  /** Points one person earns for solving the task alone. The team shares this. */
  pool: number;
  parts: { key: string; title: string; blurb: string; weight: number }[];
  /** The part an editable address belongs to; undefined for locked or unknown addresses. */
  partOf: (addr: string) => string | undefined;
  /** Whether a value is acceptable for an address (shape and size). */
  accepts: (addr: string, value: string) => boolean;
  gradePart: (key: string, cells: Record<string, TeamCell>) => PartScore;
  /** Who wrote the part, as shares that add up to 1 (empty if nothing is written). */
  shares: (key: string, cells: Record<string, TeamCell>) => Record<string, number>;
  /** The whole task graded together, 0 to 1. */
  integrated: (cells: Record<string, TeamCell>) => number;
  /** Whether members may check a part before the team finishes. Only spreadsheet parts: a free check on a number or a choice gives the answer away. */
  checkable: (key: string) => boolean;
};

const reportScore = (r: GradeReport): PartScore => ({ score: r.score, earned: r.earned, total: r.total, report: r });

/** A model task as a team plays it. `inst` must be the team instance (see teamInstance). */
export function modelTeamTask(meta: { slug: string; title: string; difficulty: Difficulty }, inst: ModelInstance, parts: PartSpec[]): TeamTask {
  const byKey = new Map(parts.map((p) => [p.key, p]));
  return {
    kind: "model", ...meta, pool: MODEL_POINTS[meta.difficulty],
    parts: parts.map((p) => ({ key: p.key, title: p.title, blurb: p.blurb, weight: gradedIn(inst, p).reduce((s, g) => s + g.points, 0) })),
    partOf: (a) => {
      const spec = inst.cells[a];
      if (spec && spec.kind !== "calc") return undefined;
      return partOfCell(parts, a)?.key;
    },
    accepts: (_a, v) => v.length <= MAX_ENTRY,
    gradePart: (k, cells) => reportScore(gradePart(inst, byKey.get(k)!, cells)),
    shares: (k, cells) => authorShares(inst, byKey.get(k)!, cells),
    integrated: (cells) => gradeIntegrated(inst, cells).score,
    checkable: () => true,
  };
}

export type PartResult = { key: string; title: string; weight: number; value: number; report: PartScore; shares: Record<string, number> };
export type MemberResult = { userId: string; eligible: boolean; reason?: string; raw: number; bonus: number; points: number; contribution: number };
export type TeamResult = { pool: number; integrated: { score: number }; bonusEarned: boolean; parts: PartResult[]; members: MemberResult[] };

/**
 * Split the task's points across the team.
 * pool = the points one person earns for solving the task alone.
 * Each part is worth pool × (its weight / all weights). A part earns value × its own score,
 * split between the people who wrote it. If the whole task passes every check,
 * everyone's share grows by INTEGRATION_BONUS. Ineligible members are shown their contribution but earn nothing.
 */
export function scoreTask(task: TeamTask, cells: Record<string, TeamCell>, members: { userId: string; ineligible?: string }[]): TeamResult {
  const totalWeight = task.parts.reduce((s, p) => s + p.weight, 0);
  const partResults = task.parts.map((p): PartResult => ({
    key: p.key, title: p.title, weight: p.weight, value: totalWeight ? (task.pool * p.weight) / totalWeight : 0,
    report: task.gradePart(p.key, cells), shares: task.shares(p.key, cells),
  }));
  const integrated = { score: task.integrated(cells) };
  const bonusEarned = integrated.score === 1;
  const memberResults = members.map((m): MemberResult => {
    let raw = 0, contribution = 0;
    for (const p of partResults) {
      const share = p.shares[m.userId] ?? 0;
      raw += p.value * p.report.score * share;
      contribution += (p.weight / (totalWeight || 1)) * share;
    }
    const bonus = bonusEarned ? raw * INTEGRATION_BONUS : 0;
    const points = m.ineligible ? 0 : Math.round(raw + bonus);
    return { userId: m.userId, eligible: !m.ineligible, reason: m.ineligible, raw, bonus, points, contribution };
  });
  return { pool: task.pool, integrated, bonusEarned, parts: partResults, members: memberResults };
}

/** scoreTask for a model task given its instance and split. */
export function scoreTeam(
  inst: ModelInstance, parts: PartSpec[], cells: Record<string, TeamCell>, difficulty: Difficulty,
  members: { userId: string; ineligible?: string }[],
): TeamResult {
  return scoreTask(modelTeamTask({ slug: "", title: "", difficulty }, inst, parts), cells, members);
}

export type ClaimState = { key: string; claimedById: string | null; activeAt: Date | null };

export type ClaimCheck = { ok: true; takeover: boolean } | { ok: false; reason: string };

/**
 * Whether a member may claim a part. Free parts can be claimed while you hold fewer than your fair share,
 * which leaves at least one part for each teammate. A claimed part can be taken over only once its owner
 * has gone STALE_CLAIM_MS without an edit, so nobody can sit on a part.
 */
export function canClaim(userId: string, key: string, claims: ClaimState[], memberCount: number, now = new Date()): ClaimCheck {
  const part = claims.find((c) => c.key === key);
  if (!part) return { ok: false, reason: "That part doesn't exist." };
  if (part.claimedById === userId) return { ok: false, reason: "You already have this part." };
  const mine = claims.filter((c) => c.claimedById === userId).length;
  const maxClaims = Math.max(1, claims.length - (memberCount - 1));
  if (mine >= maxClaims) return { ok: false, reason: `You can hold at most ${maxClaims} part${maxClaims === 1 ? "" : "s"} so each teammate gets one.` };
  if (!part.claimedById) return { ok: true, takeover: false };
  const idle = now.getTime() - (part.activeAt?.getTime() ?? 0);
  if (idle < STALE_CLAIM_MS) return { ok: false, reason: "A teammate is working on this part. You can take it over after 24 hours without edits." };
  return { ok: true, takeover: true };
}

/** A team finishes when everyone has marked ready (with at least two people) or its deadline passes. */
export function shouldFinalize(t: { deadline: Date; finalizedAt: Date | null }, members: { ready: boolean }[], now = new Date()): boolean {
  if (t.finalizedAt) return false;
  if (now >= t.deadline) return true;
  return members.length >= TEAM_MIN && members.every((m) => m.ready);
}
