import "server-only";
import type { Contest } from "@prisma/client";
import { db } from "@/lib/db";
import { CONTEST_POINTS, contestSeed, getTemplate, instantiate, isCorrect, parseAnswer } from "@/lib/problems";
import { phaseOf, rankStandings, standingFromAttempts } from "@/lib/contestScoring";
import { rateContest } from "@/lib/rating/glicko2";
import { basisRating } from "@/lib/rating/grades";

export function contestProblems(c: Pick<Contest, "problemSlugs">): string[] {
  try { return JSON.parse(c.problemSlugs) as string[]; } catch { return []; }
}

export const pointsFor = (slug: string) => CONTEST_POINTS[getTemplate(slug)?.difficulty ?? "Easy"];

export async function computeStandings(c: Contest) {
  const subs = await db.submission.findMany({ where: { contestId: c.id }, select: { userId: true, slug: true, correct: true, createdAt: true } });
  const byUser = new Map<string, { slug: string; correct: boolean; at: Date }[]>();
  for (const s of subs) {
    const arr = byUser.get(s.userId) ?? [];
    arr.push({ slug: s.slug, correct: s.correct, at: s.createdAt });
    byUser.set(s.userId, arr);
  }
  const rows = [...byUser.entries()].map(([userId, attempts]) => ({ userId, ...standingFromAttempts(attempts, c.startsAt, pointsFor) }));
  return rankStandings(rows);
}

export type ContestSubmitResult = { status: "invalid" | "closed" | "not-registered" | "already-solved"; message: string } | { status: "wrong"; wrong: number } | { status: "correct"; points: number };

export async function submitContestAnswer(userId: string, contestId: string, slug: string, raw: string): Promise<ContestSubmitResult> {
  const c = await db.contest.findUnique({ where: { id: contestId } });
  if (!c) return { status: "invalid", message: "Contest not found." };
  if (phaseOf(c) !== "live") return { status: "closed", message: "This contest isn't running right now." };
  if (!contestProblems(c).includes(slug)) return { status: "invalid", message: "That problem isn't in this contest." };
  const entry = await db.contestEntry.findUnique({ where: { contestId_userId: { contestId, userId } } });
  if (!entry) return { status: "not-registered", message: "Register for the contest first." };
  const value = parseAnswer(raw);
  if (value === null) return { status: "invalid", message: "Enter a number, for example 1234.56 or -21.04." };
  const prior = await db.submission.findMany({ where: { contestId, userId, slug }, orderBy: { createdAt: "asc" } });
  if (prior.some((p) => p.correct)) return { status: "already-solved", message: "You've already solved this one." };
  const seed = contestSeed(contestId, userId, slug);
  const correct = isCorrect(value, instantiate(slug, seed));
  const sub = await db.submission.create({ data: { userId, slug, seed, input: raw.slice(0, 64), correct, contestId } });
  if (!correct) return { status: "wrong", wrong: prior.length + 1 };
  const st = standingFromAttempts([...prior.map((p) => ({ slug, correct: p.correct, at: p.createdAt })), { slug, correct: true, at: sub.createdAt }], c.startsAt, pointsFor);
  return { status: "correct", points: st.perProblem[slug].points };
}

/**
 * Close out an ended contest: store ranks and, for rated contests with two or more participants,
 * update everyone's Glicko-2 rating. Safe to call repeatedly; only the first call does the work.
 */
export async function finalizeIfEnded(contestId: string): Promise<void> {
  const c = await db.contest.findUnique({ where: { id: contestId } });
  if (!c || c.finalizedAt || phaseOf(c) !== "ended") return;
  const standings = await computeStandings(c);
  await db.$transaction(async (tx) => {
    const claimed = await tx.contest.updateMany({ where: { id: c.id, finalizedAt: null }, data: { finalizedAt: new Date() } });
    if (claimed.count === 0) return;
    const users = await tx.user.findMany({ where: { id: { in: standings.map((s) => s.userId) } } });
    const byId = new Map(users.map((u) => [u.id, u]));
    const shouldRate = c.rated && standings.length >= 2;
    const newRatings = shouldRate
      ? rateContest(standings.map((s) => { const u = byId.get(s.userId)!; return { id: s.userId, rank: s.rank, before: { rating: u.glickoRating, rd: u.glickoRd, vol: u.glickoVol } }; }))
      : new Map();
    for (const s of standings) {
      const u = byId.get(s.userId)!;
      const before = basisRating(u.glickoRating, u.practicePoints);
      const nr = newRatings.get(s.userId);
      let after = before;
      if (nr) {
        await tx.user.update({ where: { id: u.id }, data: { glickoRating: nr.rating, glickoRd: nr.rd, glickoVol: nr.vol, ratedContests: { increment: 1 } } });
        after = basisRating(nr.rating, u.practicePoints);
        await tx.ratingEvent.create({ data: { userId: u.id, kind: "contest", delta: after - before, ratingAfter: after, note: `${c.title}: rank ${s.rank} of ${standings.length}`, contestId: c.id, createdAt: c.endsAt } });
      }
      await tx.contestEntry.upsert({
        where: { contestId_userId: { contestId: c.id, userId: u.id } },
        update: { score: s.score, solvedCount: s.solved, lastSolveMin: s.lastSolveMin, rank: s.rank, ratingBefore: before, ratingAfter: nr ? after : null },
        create: { contestId: c.id, userId: u.id, score: s.score, solvedCount: s.solved, lastSolveMin: s.lastSolveMin, rank: s.rank, ratingBefore: before, ratingAfter: nr ? after : null },
      });
    }
  });
}

/** Finalize every contest that has ended. Called from pages that show ratings. */
export async function finalizeEndedContests(): Promise<void> {
  const pending = await db.contest.findMany({ where: { finalizedAt: null, endsAt: { lte: new Date() } }, select: { id: true } });
  for (const p of pending) await finalizeIfEnded(p.id);
}
