import "server-only";
import { db } from "@/lib/db";
import { getTemplate, type Track } from "@/lib/problems";
import { GRADES, type Grade } from "@/lib/rating/grades";
import { ratingOf } from "./ratings";

export type CandidateFilter = { minGrade?: string; track?: string; q?: string; openOnly?: boolean; sort?: "rating" | "solved" | "recent" };

export async function searchCandidates(f: CandidateFilter) {
  const members = await db.user.findMany({
    where: { role: "MEMBER", ...(f.openOnly ? { openToWork: true } : {}) },
    include: { practice: { where: { everSolved: true }, select: { slug: true } }, entries: { where: { rank: { not: null } }, select: { rank: true, contestId: true } } },
  });
  const minRating = f.minGrade ? GRADES.find((g) => g.grade === f.minGrade)?.min ?? -Infinity : -Infinity;
  const q = f.q?.trim().toLowerCase();
  const rows = members.map((u) => {
    const r = ratingOf(u);
    const byTrack = new Map<Track, number>();
    u.practice.forEach((p) => { const t = getTemplate(p.slug); if (t) byTrack.set(t.track, (byTrack.get(t.track) ?? 0) + 1); });
    const tracks = [...byTrack.entries()].sort((a, b) => b[1] - a[1]);
    return { u, r, solved: u.practice.length, contests: u.ratedContests, topTrack: tracks[0]?.[0] ?? null, trackSolved: f.track ? byTrack.get(f.track as Track) ?? 0 : 0 };
  }).filter((x) =>
    (x.r.grade !== "NR" || !f.minGrade) && x.r.rating >= minRating &&
    (!f.track || x.trackSolved > 0) &&
    (!q || [x.u.name, x.u.headline, x.u.location, x.u.bio].join(" ").toLowerCase().includes(q)));
  rows.sort((a, b) =>
    f.sort === "solved" ? b.solved - a.solved :
    f.sort === "recent" ? b.u.createdAt.getTime() - a.u.createdAt.getTime() :
    f.track ? b.trackSolved - a.trackSolved || b.r.rating - a.r.rating : b.r.rating - a.r.rating);
  return rows;
}

export const GRADE_OPTIONS: Grade[] = ["AAA", "AA", "A", "BBB", "BB", "B"];
