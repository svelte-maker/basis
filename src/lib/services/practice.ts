import "server-only";
import { db } from "@/lib/db";
import { getTemplate, instantiate, isCorrect, parseAnswer, practiceSeed, PRACTICE_POINTS } from "@/lib/problems";
import { basisRating, PRACTICE_BONUS_CAP } from "@/lib/rating/grades";

export async function practiceState(userId: string, slug: string) {
  return db.practiceState.upsert({ where: { userId_slug: { userId, slug } }, update: {}, create: { userId, slug } });
}

export type PracticeResult =
  | { status: "invalid"; message: string }
  | { status: "wrong"; attempts: number }
  | { status: "correct"; pointsAwarded: number; ratingBefore: number; ratingAfter: number; alreadySolved: boolean; reason?: string };

export async function submitPractice(userId: string, slug: string, raw: string): Promise<PracticeResult> {
  const t = getTemplate(slug);
  if (!t) return { status: "invalid", message: "That problem doesn't exist." };
  const value = parseAnswer(raw);
  if (value === null) return { status: "invalid", message: "Enter a number, for example 1234.56 or -21.04." };

  const state = await practiceState(userId, slug);
  const seed = practiceSeed(userId, slug, state.variant);
  const inst = instantiate(slug, seed);
  const correct = isCorrect(value, inst);

  return db.$transaction(async (tx) => {
    await tx.submission.create({ data: { userId, slug, seed, input: raw.slice(0, 64), correct } });
    if (!correct) {
      const s = await tx.practiceState.update({ where: { id: state.id }, data: { attempts: { increment: 1 } } });
      return { status: "wrong" as const, attempts: s.attempts };
    }
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const before = basisRating(user.glickoRating, user.practicePoints);
    let points = 0, reason: string | undefined;
    if (state.solved) reason = "You already solved this variant.";
    else if (state.everSolved) reason = "Rating points are only awarded for your first solve of each problem.";
    else if (state.revealed) reason = "No points because you viewed the solution first.";
    else points = PRACTICE_POINTS[t.difficulty];

    await tx.practiceState.update({ where: { id: state.id }, data: { solved: true, everSolved: true, solvedAt: state.solvedAt ?? new Date(), attempts: { increment: 1 } } });
    let after = before;
    if (points > 0) {
      const u2 = await tx.user.update({ where: { id: userId }, data: { practicePoints: { increment: points } } });
      after = basisRating(u2.glickoRating, u2.practicePoints);
      if (user.practicePoints >= PRACTICE_BONUS_CAP) reason = "Practice bonus is at its cap. Contests move your rating from here.";
      if (after !== before) {
        await tx.ratingEvent.create({ data: { userId, kind: "practice", delta: after - before, ratingAfter: after, note: `Solved ${t.title}` } });
      }
    }
    return { status: "correct" as const, pointsAwarded: after - before, ratingBefore: before, ratingAfter: after, alreadySolved: state.solved, reason };
  });
}

export async function revealSolution(userId: string, slug: string) {
  const s = await practiceState(userId, slug);
  if (!s.solved && !s.revealed) await db.practiceState.update({ where: { id: s.id }, data: { revealed: true } });
}

/** Fresh numbers for the same problem. Points are never re-awarded. */
export async function newVariant(userId: string, slug: string) {
  const s = await practiceState(userId, slug);
  await db.practiceState.update({ where: { id: s.id }, data: { variant: { increment: 1 }, solved: false, revealed: false, attempts: 0, solvedAt: null } });
}
