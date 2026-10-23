// Contest badges. Nothing is stored: badges are worked out from finished contest entries each time a
// profile loads, so they appear as soon as a contest is finalized and can't drift out of sync.
//
// A contest counts as completed when the contest has ended and the member submitted at least one
// answer, right or wrong (finalizeIfEnded gives exactly those entries a rank). Registering without
// submitting doesn't count. Only MEMBER accounts earn badges; staff and recruiters never do.

export const MILESTONES = [1, 5, 10, 25, 50, 100] as const;

/** Matches "Weekly Contest #1 · Founding Round" from the /admin preset, and any rewording that keeps the name. */
export const FOUNDING_ROUND = /founding round/i;

export type CompletedContest = { slug: string; title: string; endsAt: Date };

export type Badge = {
  key: string;
  label: string;
  detail: string;
  kind: "founding" | "milestone";
  earnedAt: Date;
  contestSlug: string;
};

export type BadgeSummary = {
  badges: Badge[];
  completed: number;
  next: { count: number; remaining: number } | null;
};

function milestoneLabel(n: number) {
  return n === 1 ? "First contest" : `${n} contests`;
}

export function contestBadges(role: string, completed: CompletedContest[]): BadgeSummary {
  if (role !== "MEMBER") return { badges: [], completed: 0, next: null };
  const done = [...completed].sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  const badges: Badge[] = [];
  const founding = done.find((c) => FOUNDING_ROUND.test(c.title));
  if (founding) {
    badges.push({ key: "founding-round", label: "Founding Round", detail: `Took part in ${founding.title}, the first Basis contest`, kind: "founding", earnedAt: founding.endsAt, contestSlug: founding.slug });
  }
  for (const n of MILESTONES) {
    if (done.length < n) break;
    const c = done[n - 1];
    badges.push({ key: `contests-${n}`, label: milestoneLabel(n), detail: `Completed ${n === 1 ? "a first contest" : `${n} contests`}, reached at ${c.title}`, kind: "milestone", earnedAt: c.endsAt, contestSlug: c.slug });
  }
  const nextCount = MILESTONES.find((n) => n > done.length);
  return { badges, completed: done.length, next: nextCount ? { count: nextCount, remaining: nextCount - done.length } : null };
}
