import Link from "next/link";
import { db } from "@/lib/db";
import { ratingOf } from "@/lib/services/ratings";
import { finalizeEndedContests } from "@/lib/services/contests";
import { Grade } from "@/components/Grade";
import { TRACKS, getTemplate } from "@/lib/problems";
import { canonical } from "@/lib/seo";

export const metadata = { title: "Leaderboard", ...canonical("/leaderboard") };
export const dynamic = "force-dynamic";

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  await finalizeEndedContests();
  const { track } = await searchParams;
  const members = await db.user.findMany({ where: { role: "MEMBER" } });
  let rows: { u: (typeof members)[number]; r: ReturnType<typeof ratingOf>; solved?: number }[];
  if (track) {
    const states = await db.practiceState.findMany({ where: { everSolved: true }, select: { userId: true, slug: true } });
    const counts = new Map<string, number>();
    states.forEach((s) => { if (getTemplate(s.slug)?.track === track) counts.set(s.userId, (counts.get(s.userId) ?? 0) + 1); });
    rows = members.map((u) => ({ u, r: ratingOf(u), solved: counts.get(u.id) ?? 0 })).filter((x) => x.solved! > 0).sort((a, b) => b.solved! - a.solved! || b.r.rating - a.r.rating);
  } else {
    rows = members.filter((u) => u.ratedContests > 0).map((u) => ({ u, r: ratingOf(u) })).sort((a, b) => b.r.rating - a.r.rating);
  }
  rows = rows.slice(0, 200);
  return (
    <div className="stack">
      <div className="head"><div><h1>Leaderboard</h1><p className="lede">{track ? `Most problems solved in ${track}.` : "Members with at least one rated contest, ranked by Basis rating."}</p></div></div>
      <div className="row">
        <Link className={`chip ${!track ? "on" : ""}`} href="/leaderboard">Overall rating</Link>
        {TRACKS.map((t) => <Link key={t} className={`chip ${track === t ? "on" : ""}`} href={`/leaderboard?track=${encodeURIComponent(t)}`}>{t}</Link>)}
      </div>
      <div className="panel table-box"><table className="data"><thead><tr><th className="r">#</th><th>Member</th><th>Location</th><th>Grade</th><th className="r">Rating</th>{track && <th className="r">Solved</th>}</tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={6} className="muted">Nobody here yet.</td></tr>}
        {rows.map((x, i) => (
          <tr key={x.u.id}><td className="r num">{i + 1}</td><td><Link href={`/u/${x.u.handle}`}>{x.u.name}</Link><br /><span className="small muted">{x.u.headline}</span></td><td className="small">{x.u.location}</td><td><Grade grade={x.r.grade} /></td><td className="r num">{x.r.rating}</td>{track && <td className="r num">{x.solved}</td>}</tr>
        ))}
      </tbody></table></div>
    </div>
  );
}
