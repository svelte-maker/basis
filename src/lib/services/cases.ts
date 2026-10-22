import "server-only";
import { db } from "@/lib/db";
import { CASE_POINTS, casePoints, getCase, getPart, type CasePart, type CaseStudy, type Solution } from "@/lib/cases";
import { gradePart, type PartGrade, type PartInput } from "@/lib/cases/grade";
import { sanitize } from "@/lib/models/grade";
import { basisRating, PRACTICE_BONUS_CAP } from "@/lib/rating/grades";

const MAX_INPUT_BYTES = 60_000;

/** Progress on one part. A part is done once it is solved or its answer was shown. */
export type PartProgress = { attempts: number; solved: boolean; revealed: boolean; best: number; draft?: Record<string, string> };
export type Progress = Record<string, PartProgress>;

const blank = (): PartProgress => ({ attempts: 0, solved: false, revealed: false, best: 0 });

export function parseProgress(json: string): Progress {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : {};
  } catch { return {}; }
}

export const isDone = (p?: PartProgress) => !!p && (p.solved || p.revealed);

/** A part opens once every part before it is done. */
export function unlocked(c: CaseStudy, progress: Progress, key: string): boolean {
  const i = c.parts.findIndex((p) => p.key === key);
  return i >= 0 && c.parts.slice(0, i).every((p) => isDone(progress[p.key]));
}

export async function caseState(userId: string, slug: string) {
  return db.caseState.upsert({ where: { userId_slug: { userId, slug } }, update: {}, create: { userId, slug } });
}

/** What a member sees once a part is done: the reference answer and the worked solution. */
export type PartReveal =
  | { kind: "numeric"; answer: number; unit: string; solution: Solution }
  | { kind: "choice"; correct: number; solution: Solution }
  | { kind: "model"; answer: Record<string, string>; notes: string[]; solution: Solution };

export function revealOf(p: CasePart): PartReveal {
  switch (p.kind) {
    case "numeric": return { kind: "numeric", answer: p.answer, unit: p.unit, solution: p.solution };
    case "choice": return { kind: "choice", correct: p.correct, solution: p.solution };
    case "model": return { kind: "model", answer: p.model.answer, notes: p.model.solution, solution: p.solution };
  }
}

export type CaseResult =
  | { status: "invalid"; message: string }
  | { status: "graded"; grade: PartGrade; progress: PartProgress; reveal?: PartReveal; completed: boolean; pointsAwarded: number; ratingBefore: number; ratingAfter: number; reason?: string };

/** Share of the case's points earned on parts solved without first viewing the answer. */
export function earnedShare(c: CaseStudy, progress: Progress): number {
  const earned = c.parts.reduce((s, p) => s + (progress[p.key]?.revealed ? 0 : (progress[p.key]?.best ?? 0) * p.points), 0);
  return earned / casePoints(c);
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type CaseRow = Awaited<ReturnType<typeof caseState>>;

/** Store progress and, the first time every part is done, award practice points for the parts earned. */
async function saveProgress(tx: Tx, userId: string, c: CaseStudy, state: CaseRow, all: Progress) {
  const completed = c.parts.every((p) => isDone(all[p.key]));
  const first = completed && !state.everCompleted;
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
  const before = basisRating(user.glickoRating, user.practicePoints);
  let after = before, reason: string | undefined;
  if (first) {
    const points = Math.round(CASE_POINTS[c.difficulty] * earnedShare(c, all));
    if (points > 0) {
      const u2 = await tx.user.update({ where: { id: userId }, data: { practicePoints: { increment: points } } });
      after = basisRating(u2.glickoRating, u2.practicePoints);
      if (user.practicePoints >= PRACTICE_BONUS_CAP) reason = "Practice bonus is at its cap. Contests move your rating from here.";
      if (after !== before) await tx.ratingEvent.create({ data: { userId, kind: "practice", delta: after - before, ratingAfter: after, note: `Case: ${c.title}` } });
    } else reason = "No rating points, because every part's answer was viewed before it was solved.";
  } else if (completed) reason = "Rating points are only awarded the first time you complete a case.";
  await tx.caseState.update({
    where: { id: state.id },
    data: { parts: JSON.stringify(all), completed, ...(first ? { everCompleted: true, completedAt: new Date() } : {}) },
  });
  return { pointsAwarded: after - before, ratingBefore: before, ratingAfter: after, reason };
}

export async function submitPart(userId: string, slug: string, key: string, input: PartInput): Promise<CaseResult> {
  const c = getCase(slug);
  const part = c && getPart(c, key);
  if (!c || !part) return { status: "invalid", message: "That case part doesn't exist." };
  const json = JSON.stringify(input ?? {});
  if (json.length > MAX_INPUT_BYTES) return { status: "invalid", message: "That answer is too large to check." };
  const state = await caseState(userId, slug);
  const progress = parseProgress(state.parts);
  if (!unlocked(c, progress, key)) return { status: "invalid", message: "Finish the earlier parts first." };
  const grade = gradePart(part, input);
  if (!grade) return { status: "invalid", message: part.kind === "choice" ? "Pick one of the options." : "Enter a number, for example 1234.56 or 12.5%." };

  return db.$transaction(async (tx) => {
    const cur = progress[key] ?? blank();
    const draft = part.kind === "model" ? sanitize(part.model, input.cells ?? {}) as Record<string, string> : cur.draft;
    const next: PartProgress = { ...cur, attempts: cur.attempts + 1, best: Math.max(cur.best, grade.score), solved: cur.solved || grade.correct, ...(draft ? { draft } : {}) };
    const all = { ...progress, [key]: next };
    const completed = c.parts.every((p) => isDone(all[p.key]));
    await tx.caseSubmission.create({ data: { userId, slug, part: key, input: json, score: grade.score } });

    const award = await saveProgress(tx, userId, c, state, all);
    return {
      status: "graded" as const, grade, progress: next, completed,
      reveal: next.solved ? revealOf(part) : undefined,
      ...award,
    };
  });
}

/** Show a part's answer. That part then earns nothing toward the case's rating points, and the next part opens. */
export async function revealPart(userId: string, slug: string, key: string): Promise<PartReveal | null> {
  const c = getCase(slug);
  const part = c && getPart(c, key);
  if (!c || !part) return null;
  const state = await caseState(userId, slug);
  const progress = parseProgress(state.parts);
  if (!unlocked(c, progress, key)) return null;
  const cur = progress[key] ?? blank();
  if (!cur.revealed && !cur.solved) {
    const all = { ...progress, [key]: { ...cur, revealed: true } };
    await db.$transaction((tx) => saveProgress(tx, userId, c, state, all));
  }
  return revealOf(part);
}

export async function saveCaseDraft(userId: string, slug: string, key: string, cells: Record<string, unknown>): Promise<boolean> {
  const c = getCase(slug);
  const part = c && getPart(c, key);
  if (!c || !part || part.kind !== "model") return false;
  const draft = sanitize(part.model, cells) as Record<string, string>;
  if (JSON.stringify(draft).length > MAX_INPUT_BYTES) return false;
  const state = await caseState(userId, slug);
  const progress = parseProgress(state.parts);
  await db.caseState.update({ where: { id: state.id }, data: { parts: JSON.stringify({ ...progress, [key]: { ...(progress[key] ?? blank()), draft } }) } });
  return true;
}

/** Clear progress to work the case again. Rating points are never awarded twice. */
export async function restartCase(userId: string, slug: string) {
  const s = await caseState(userId, slug);
  await db.caseState.update({ where: { id: s.id }, data: { parts: "{}", completed: false } });
}
