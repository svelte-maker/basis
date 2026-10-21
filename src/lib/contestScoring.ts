// Pure contest scoring, kept free of database code so it can be tested.

export type ContestPhase = "upcoming" | "live" | "ended";

export function phaseOf(c: { startsAt: Date; endsAt: Date }, now = new Date()): ContestPhase {
  if (now < c.startsAt) return "upcoming";
  if (now < c.endsAt) return "live";
  return "ended";
}

/**
 * Points for one solved problem. Value decays by 2 points a minute and 50 per wrong attempt,
 * but never below 30% of the problem's full value.
 */
export function problemScore(fullPoints: number, minutesFromStart: number, wrongAttempts: number): number {
  return Math.max(Math.round(fullPoints * 0.3), Math.round(fullPoints - 2 * minutesFromStart - 50 * wrongAttempts));
}

export type Standing = { userId: string; score: number; lastSolveMin: number; solved: number };

/** Rank by score (desc), then earliest final solve. Equal on both = same rank. */
export function rankStandings<T extends Standing>(rows: T[]): (T & { rank: number })[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.lastSolveMin - b.lastSolveMin);
  let rank = 0;
  return sorted.map((r, i) => {
    const prev = sorted[i - 1];
    if (!prev || prev.score !== r.score || prev.lastSolveMin !== r.lastSolveMin) rank = i + 1;
    return { ...r, rank };
  });
}

export type Attempt = { slug: string; correct: boolean; at: Date };

/** Build a participant's standing from their attempts. Attempts after a problem is solved are ignored. */
export function standingFromAttempts(
  attempts: Attempt[], startsAt: Date, pointsFor: (slug: string) => number,
): { score: number; solved: number; lastSolveMin: number; perProblem: Record<string, { solved: boolean; wrong: number; points: number; minute?: number }> } {
  const perProblem: Record<string, { solved: boolean; wrong: number; points: number; minute?: number }> = {};
  const sorted = [...attempts].sort((a, b) => a.at.getTime() - b.at.getTime());
  for (const a of sorted) {
    const p = (perProblem[a.slug] ??= { solved: false, wrong: 0, points: 0 });
    if (p.solved) continue;
    if (a.correct) {
      const minute = Math.floor((a.at.getTime() - startsAt.getTime()) / 60000);
      p.solved = true;
      p.minute = minute;
      p.points = problemScore(pointsFor(a.slug), minute, p.wrong);
    } else p.wrong++;
  }
  const solvedRows = Object.values(perProblem).filter((p) => p.solved);
  return {
    score: solvedRows.reduce((s, p) => s + p.points, 0),
    solved: solvedRows.length,
    lastSolveMin: solvedRows.reduce((m, p) => Math.max(m, p.minute ?? 0), 0),
    perProblem,
  };
}
