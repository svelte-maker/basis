import "server-only";
import { db } from "@/lib/db";
import { TEMPLATES, TRACKS, getTemplate, type Track } from "@/lib/problems";
import { ratingOf } from "./ratings";
import { DEFAULT_RATING } from "@/lib/rating/glicko2";

export async function allMemberRatings() {
  const members = await db.user.findMany({ where: { role: "MEMBER" }, select: { id: true, glickoRating: true, glickoRd: true, practicePoints: true, ratedContests: true } });
  return members.map((m) => ({ id: m.id, ...ratingOf(m), ratedContests: m.ratedContests }));
}

/** Share of rated members with a strictly lower rating, as "top X%". */
export function topPercent(rating: number, all: { rating: number; ratedContests: number }[]): number | null {
  const rated = all.filter((a) => a.ratedContests > 0);
  if (rated.length < 5) return null;
  const above = rated.filter((a) => a.rating > rating).length;
  return Math.max(1, Math.ceil(((above + 1) / rated.length) * 100));
}

export async function trackBreakdown(userId: string): Promise<{ track: Track; solved: number; total: number }[]> {
  const solved = await db.practiceState.findMany({ where: { userId, everSolved: true }, select: { slug: true } });
  const counts = new Map<string, number>();
  solved.forEach((s) => { const t = getTemplate(s.slug); if (t) counts.set(t.track, (counts.get(t.track) ?? 0) + 1); });
  return TRACKS.map((track) => ({ track, solved: counts.get(track) ?? 0, total: TEMPLATES.filter((t) => t.track === track).length }));
}

export async function ratingHistory(userId: string) {
  const events = await db.ratingEvent.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const start = events.length ? events[0].ratingAfter - events[0].delta : DEFAULT_RATING.rating;
  return [{ rating: start, label: "Joined" }, ...events.map((e) => ({ rating: e.ratingAfter, label: e.note }))];
}

export async function getProfile(handle: string) {
  const user = await db.user.findUnique({ where: { handle } });
  if (!user) return null;
  const [all, tracks, history, entries, posts, solvedCount, teams] = await Promise.all([
    allMemberRatings(),
    trackBreakdown(user.id),
    ratingHistory(user.id),
    db.contestEntry.findMany({ where: { userId: user.id, rank: { not: null } }, include: { contest: { include: { _count: { select: { entries: { where: { rank: { not: null } } } } } } } }, orderBy: { contest: { endsAt: "desc" } } }),
    db.post.findMany({ where: { authorId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { _count: { select: { comments: true } } } }),
    db.practiceState.count({ where: { userId: user.id, everSolved: true } }),
    db.teamMember.findMany({
      where: { userId: user.id, team: { finalizedAt: { not: null } } },
      include: { team: { select: { id: true, kind: true, slug: true, finalizedAt: true, teamScore: true, result: true, _count: { select: { members: true } } } } },
      orderBy: { team: { finalizedAt: "desc" } }, take: 20,
    }),
  ]);
  const r = ratingOf(user);
  const best = entries.reduce<(typeof entries)[number] | null>((b, e) => (!b || e.rank! / e.contest._count.entries < b.rank! / b.contest._count.entries ? e : b), null);
  return { user, r, top: topPercent(r.rating, all), tracks, history, entries, posts, solvedCount, best, teams };
}
