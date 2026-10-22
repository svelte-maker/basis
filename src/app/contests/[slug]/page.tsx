import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { phaseOf } from "@/lib/contestScoring";
import { computeStandings, contestProblems, finalizeIfEnded, pointsFor } from "@/lib/services/contests";
import { contestSeed, getTemplate, instantiate } from "@/lib/problems";
import { Statement } from "@/components/Statement";
import { Countdown } from "@/components/Countdown";
import { LocalTime } from "@/components/LocalTime";
import { Grade } from "@/components/Grade";
import { ratingOf } from "@/lib/services/ratings";
import { toggleRegistration } from "../../actions/contests";
import { ContestAnswer } from "./ContestAnswer";
import { canonical } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = await db.contest.findUnique({ where: { slug: (await params).slug } });
  return c ? { title: c.title, ...canonical(`/contests/${c.slug}`) } : { title: "Contest" };
}

export default async function ContestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let c = await db.contest.findUnique({ where: { slug } });
  if (!c) notFound();
  await finalizeIfEnded(c.id);
  c = (await db.contest.findUnique({ where: { slug } }))!;
  const phase = phaseOf(c);
  const user = await getCurrentUser();
  const entry = user ? await db.contestEntry.findUnique({ where: { contestId_userId: { contestId: c.id, userId: user.id } } }) : null;
  const registered = await db.contestEntry.count({ where: { contestId: c.id } });
  const problems = contestProblems(c);
  const mySubs = user ? await db.submission.findMany({ where: { contestId: c.id, userId: user.id } }) : [];

  let board: { rank: number; userId: string; score: number; solved: number; lastSolveMin: number; ratingBefore?: number | null; ratingAfter?: number | null }[] = [];
  if (c.finalizedAt) {
    const entries = await db.contestEntry.findMany({ where: { contestId: c.id, rank: { not: null } }, orderBy: { rank: "asc" }, take: 100 });
    board = entries.map((e) => ({ rank: e.rank!, userId: e.userId, score: e.score, solved: e.solvedCount, lastSolveMin: e.lastSolveMin, ratingBefore: e.ratingBefore, ratingAfter: e.ratingAfter }));
  } else if (phase === "live") {
    board = (await computeStandings(c)).slice(0, 100);
  }
  const users = await db.user.findMany({ where: { id: { in: board.map((b) => b.userId) } } });
  const uById = new Map(users.map((u) => [u.id, u]));
  const mins = Math.round((c.endsAt.getTime() - c.startsAt.getTime()) / 60000);
  const toggle = toggleRegistration.bind(null, c.id, c.slug);

  return (
    <div className="stack">
      <div className="row small"><Link href="/contests">← All contests</Link></div>
      <div className="head">
        <div>
          <span className="eyebrow">{phase === "live" ? "Live now" : phase === "upcoming" ? "Upcoming" : "Finished"} · {c.rated ? "Rated" : "Unrated"}</span>
          <h1 style={{ marginTop: 4 }}>{c.title}</h1>
          {c.description && <p className="lede">{c.description}</p>}
          <p className="small muted" style={{ marginTop: 6 }}>Starts <LocalTime iso={c.startsAt.toISOString()} /> · {mins} minutes · {problems.length} problems · {registered} registered</p>
        </div>
        <div className="stack-sm" style={{ justifyItems: "end" }}>
          {phase === "upcoming" && <Countdown to={c.startsAt.toISOString()} label="Starts in" />}
          {phase === "live" && <Countdown to={c.endsAt.toISOString()} label="Ends in" />}
          {phase !== "ended" && (user
            ? <form action={toggle}><button className={`btn ${entry ? "ghost" : ""}`}>{entry ? (mySubs.length ? "Registered ✓" : "Unregister") : "Register"}</button></form>
            : <Link className="btn" href={`/login?next=/contests/${c.slug}`} style={{ color: "var(--accent-ink)" }}>Log in to register</Link>)}
        </div>
      </div>

      <section className="panel card">
        <h3>Scoring</h3>
        <p className="small muted">Easy 300, Medium 500, Hard 800 points. A problem loses 2 points per minute after the start and 50 per wrong attempt, but never drops below 30% of its value. Ties break on the time of your last correct answer. Everyone who submits at least once is rated against everyone else.</p>
      </section>

      {phase === "live" && entry && (
        <section className="stack">
          <h2>Problems</h2>
          {problems.map((p, i) => {
            const t = getTemplate(p)!;
            const inst = instantiate(p, contestSeed(c!.id, user!.id, p));
            const subs = mySubs.filter((s) => s.slug === p);
            return (
              <article key={p} className="panel card" style={{ padding: 22 }}>
                <div className="row"><span className="num muted">{String.fromCharCode(65 + i)}</span><h3>{t.title}</h3><span className={`chip d-${t.difficulty}`}>{t.difficulty} · {pointsFor(p)} pts</span><span className="chip">{t.track}</span></div>
                <Statement blocks={inst.blocks} question={inst.question} />
                <ContestAnswer contestId={c!.id} slug={p} unit={inst.unit} solved={subs.some((s) => s.correct)} wrong={subs.filter((s) => !s.correct).length} />
              </article>
            );
          })}
        </section>
      )}
      {phase === "live" && !entry && user && <div className="fb info">Register to see the problems. You can still join while the contest is running.</div>}
      {phase === "upcoming" && <div className="fb info">Problems appear here when the contest starts. Each participant gets the same problems with different numbers.</div>}
      {phase === "ended" && (
        <section className="stack-sm">
          <h2>Problems in this round</h2>
          <div className="row">{problems.map((p) => <Link key={p} className="chip" href={`/problems/${p}`}>{getTemplate(p)?.title}</Link>)}</div>
          <p className="small muted">Practise them with fresh numbers from the problem set.</p>
        </section>
      )}

      {board.length > 0 && (
        <section className="stack-sm">
          <h2>{phase === "live" ? "Live standings" : "Final standings"}</h2>
          <div className="panel table-box"><table className="data"><thead><tr><th className="r">Rank</th><th>Member</th><th className="r">Solved</th><th className="r">Score</th>{c.finalizedAt && <th className="r">Rating</th>}</tr></thead><tbody>
            {board.map((b) => { const u = uById.get(b.userId); if (!u) return null; const r = ratingOf(u); const d = b.ratingAfter != null && b.ratingBefore != null ? b.ratingAfter - b.ratingBefore : null; return (
              <tr key={b.userId} style={user?.id === b.userId ? { background: "var(--accent-soft)" } : undefined}>
                <td className="r num">{b.rank}</td>
                <td><Link href={`/u/${u.handle}`}>{u.name}</Link> <Grade grade={r.grade} /></td>
                <td className="r num">{b.solved}/{problems.length}</td>
                <td className="r num">{b.score}</td>
                {c!.finalizedAt && <td className="r num">{d == null ? "—" : <>{b.ratingAfter} <span style={{ color: d >= 0 ? "var(--good)" : "var(--bad)" }}>({d >= 0 ? "+" : ""}{d})</span></>}</td>}
              </tr>); })}
          </tbody></table></div>
        </section>
      )}
    </div>
  );
}
