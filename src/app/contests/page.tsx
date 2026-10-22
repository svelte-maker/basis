import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { phaseOf } from "@/lib/contestScoring";
import { contestProblems, finalizeEndedContests } from "@/lib/services/contests";
import { LocalTime } from "@/components/LocalTime";
import { canonical } from "@/lib/seo";

export const metadata = { title: "Contests", ...canonical("/contests") };
export const dynamic = "force-dynamic";

export default async function ContestsPage() {
  await finalizeEndedContests();
  const user = await getCurrentUser();
  const contests = await db.contest.findMany({ orderBy: { startsAt: "desc" }, include: { _count: { select: { entries: true } } } });
  const mine = user ? new Set((await db.contestEntry.findMany({ where: { userId: user.id }, select: { contestId: true } })).map((e) => e.contestId)) : new Set<string>();
  const groups = { live: [] as typeof contests, upcoming: [] as typeof contests, ended: [] as typeof contests };
  contests.forEach((c) => groups[phaseOf(c)].push(c));
  groups.upcoming.reverse();
  const myEntries = user ? await db.contestEntry.findMany({ where: { userId: user.id, rank: { not: null } }, include: { contest: true }, orderBy: { contest: { endsAt: "desc" } }, take: 10 }) : [];

  const card = (c: (typeof contests)[number]) => {
    const phase = phaseOf(c);
    const mins = Math.round((c.endsAt.getTime() - c.startsAt.getTime()) / 60000);
    return (
      <Link key={c.id} href={`/contests/${c.slug}`} className="panel card" style={{ color: "inherit", textDecoration: "none" }}>
        <div className="row between">
          <span className={`chip ${phase === "live" ? "on" : ""}`}>{phase === "live" ? "Live now" : c.rated ? "Rated" : "Unrated"}</span>
          <span className="small muted num">{c._count.entries} registered</span>
        </div>
        <h3>{c.title}</h3>
        <div className="small muted"><LocalTime iso={c.startsAt.toISOString()} /> · {mins >= 1440 ? `${Math.round(mins / 60)} h` : `${mins} min`} · {contestProblems(c).length} problems</div>
        {mine.has(c.id) && <span className="small" style={{ color: "var(--good)" }}>✓ You&apos;re registered</span>}
      </Link>
    );
  };

  return (
    <div className="stack">
      <div className="head"><div>
        <h1>Contests</h1>
        <p className="lede">Timed rounds where everyone gets the same problems with their own numbers. Rated contests set your Glicko-2 rating: finishing above stronger people moves you more than finishing above weaker ones.</p>
      </div></div>
      {groups.live.length > 0 && <section className="stack-sm"><h2>Live now</h2><div className="grid-auto">{groups.live.map(card)}</div></section>}
      <section className="stack-sm"><h2>Upcoming</h2>{groups.upcoming.length ? <div className="grid-auto">{groups.upcoming.map(card)}</div> : <p className="muted">No contests scheduled yet. Check back soon.</p>}</section>
      {myEntries.length > 0 && (
        <section className="stack-sm"><h2>Your results</h2>
          <div className="panel table-box"><table className="data"><thead><tr><th>Contest</th><th className="r">Rank</th><th className="r">Score</th><th className="r">Rating change</th></tr></thead><tbody>
            {myEntries.map((e) => { const d = e.ratingAfter != null && e.ratingBefore != null ? e.ratingAfter - e.ratingBefore : null; return (
              <tr key={e.id}><td><Link href={`/contests/${e.contest.slug}`}>{e.contest.title}</Link></td><td className="r num">{e.rank}</td><td className="r num">{e.score}</td>
                <td className="r num" style={{ color: d == null ? undefined : d >= 0 ? "var(--good)" : "var(--bad)" }}>{d == null ? "unrated" : `${d >= 0 ? "+" : ""}${d}`}</td></tr>); })}
          </tbody></table></div>
        </section>
      )}
      <section className="stack-sm"><h2>Past contests</h2>{groups.ended.length ? <div className="grid-auto">{groups.ended.map(card)}</div> : <p className="muted">None yet.</p>}</section>
    </div>
  );
}
