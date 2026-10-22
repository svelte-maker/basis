import "server-only";
import { db } from "@/lib/db";
import { getModelTask, instantiateModel, modelSeed, MODEL_POINTS } from "@/lib/models";
import { gradeModel, sanitize, type GradeReport } from "@/lib/models/grade";
import { basisRating, PRACTICE_BONUS_CAP } from "@/lib/rating/grades";

const MAX_DRAFT_BYTES = 60_000;

export async function modelState(userId: string, slug: string) {
  return db.modelState.upsert({ where: { userId_slug: { userId, slug } }, update: {}, create: { userId, slug } });
}

export async function currentInstance(userId: string, slug: string) {
  const s = await modelState(userId, slug);
  return { state: s, seed: modelSeed(userId, slug, s.variant), inst: instantiateModel(slug, modelSeed(userId, slug, s.variant)) };
}

export function parseDraft(json: string): Record<string, string> {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : {};
  } catch { return {}; }
}

export async function saveDraft(userId: string, slug: string, cells: Record<string, unknown>): Promise<boolean> {
  if (!getModelTask(slug)) return false;
  const { state, inst } = await currentInstance(userId, slug);
  const json = JSON.stringify(sanitize(inst, cells));
  if (json.length > MAX_DRAFT_BYTES) return false;
  await db.modelState.update({ where: { id: state.id }, data: { draft: json } });
  return true;
}

export type ModelResult =
  | { status: "invalid"; message: string }
  | { status: "graded"; report: GradeReport; attempts: number; solved: boolean; pointsAwarded: number; ratingBefore: number; ratingAfter: number; reason?: string };

export async function submitModel(userId: string, slug: string, cells: Record<string, unknown>): Promise<ModelResult> {
  const t = getModelTask(slug);
  if (!t) return { status: "invalid", message: "That model task doesn't exist." };
  const { state, seed, inst } = await currentInstance(userId, slug);
  const clean = sanitize(inst, cells);
  const json = JSON.stringify(clean);
  if (json.length > MAX_DRAFT_BYTES) return { status: "invalid", message: "That sheet is too large to check." };
  const report = gradeModel(inst, clean);
  const full = report.score === 1;

  return db.$transaction(async (tx) => {
    await tx.modelSubmission.create({ data: { userId, slug, seed, cells: json, score: report.score, report: JSON.stringify(report) } });
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const before = basisRating(user.glickoRating, user.practicePoints);
    let points = 0, reason: string | undefined;
    if (full) {
      if (state.solved) reason = "You already solved this version.";
      else if (state.everSolved) reason = "Rating points are only awarded for your first full solve of each model.";
      else if (state.revealed) reason = "No points because you viewed the answer model first.";
      else if (await tx.teamMember.count({ where: { userId, team: { slug, finalizedAt: { not: null } } } })) reason = "No points because you built this task with a team.";
      else points = MODEL_POINTS[t.difficulty];
    }
    const s = await tx.modelState.update({
      where: { id: state.id },
      data: {
        draft: json,
        attempts: { increment: 1 },
        bestScore: Math.max(state.bestScore, report.score),
        ...(full ? { solved: true, everSolved: true, solvedAt: state.solvedAt ?? new Date() } : {}),
      },
    });
    let after = before;
    if (points > 0) {
      const u2 = await tx.user.update({ where: { id: userId }, data: { practicePoints: { increment: points } } });
      after = basisRating(u2.glickoRating, u2.practicePoints);
      if (user.practicePoints >= PRACTICE_BONUS_CAP) reason = "Practice bonus is at its cap. Contests move your rating from here.";
      if (after !== before) {
        await tx.ratingEvent.create({ data: { userId, kind: "practice", delta: after - before, ratingAfter: after, note: `Built ${t.title}` } });
      }
    }
    return { status: "graded" as const, report, attempts: s.attempts, solved: s.solved, pointsAwarded: after - before, ratingBefore: before, ratingAfter: after, reason };
  });
}

export async function revealModel(userId: string, slug: string) {
  const s = await modelState(userId, slug);
  if (!s.solved && !s.revealed) await db.modelState.update({ where: { id: s.id }, data: { revealed: true } });
}

/** Fresh numbers for the same task. Clears the work in progress. Points are never re-awarded. */
export async function newModelVariant(userId: string, slug: string) {
  const s = await modelState(userId, slug);
  await db.modelState.update({ where: { id: s.id }, data: { variant: { increment: 1 }, solved: false, revealed: false, attempts: 0, bestScore: 0, draft: "{}", solvedAt: null } });
}
