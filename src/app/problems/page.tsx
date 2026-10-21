import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { TEMPLATES, TRACKS, PRACTICE_POINTS } from "@/lib/problems";

export const metadata = { title: "Problems" };

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<{ track?: string; difficulty?: string; status?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const states = user ? await db.practiceState.findMany({ where: { userId: user.id } }) : [];
  const solved = new Set(states.filter((s) => s.everSolved).map((s) => s.slug));
  const solveCounts = await db.practiceState.groupBy({ by: ["slug"], where: { everSolved: true }, _count: true });
  const countBy = new Map(solveCounts.map((r) => [r.slug, r._count]));

  const list = TEMPLATES.filter((t) =>
    (!sp.track || t.track === sp.track) && (!sp.difficulty || t.difficulty === sp.difficulty) &&
    (!sp.status || (sp.status === "solved" ? solved.has(t.slug) : !solved.has(t.slug))));

  const href = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/problems${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h1>Problem set</h1>
          <p className="lede">Every problem generates its own numbers for you, so answers can&apos;t be copied. Your first correct solve of each problem adds to your rating: Easy +{PRACTICE_POINTS.Easy}, Medium +{PRACTICE_POINTS.Medium}, Hard +{PRACTICE_POINTS.Hard}.</p>
        </div>
        {user && <div className="small muted">Solved <span className="num">{solved.size}/{TEMPLATES.length}</span></div>}
      </div>
      <div className="stack-sm">
        <div className="row"><span className="small muted">Track</span>
          <Link className={`chip ${!sp.track ? "on" : ""}`} href={href({ track: undefined })}>All</Link>
          {TRACKS.map((t) => <Link key={t} className={`chip ${sp.track === t ? "on" : ""}`} href={href({ track: t })}>{t}</Link>)}
        </div>
        <div className="row"><span className="small muted">Difficulty</span>
          <Link className={`chip ${!sp.difficulty ? "on" : ""}`} href={href({ difficulty: undefined })}>All</Link>
          {["Easy", "Medium", "Hard"].map((d) => <Link key={d} className={`chip ${sp.difficulty === d ? "on" : ""}`} href={href({ difficulty: d })}>{d}</Link>)}
          {user && <>
            <span className="small muted" style={{ marginLeft: 12 }}>Status</span>
            <Link className={`chip ${!sp.status ? "on" : ""}`} href={href({ status: undefined })}>All</Link>
            <Link className={`chip ${sp.status === "unsolved" ? "on" : ""}`} href={href({ status: "unsolved" })}>To do</Link>
            <Link className={`chip ${sp.status === "solved" ? "on" : ""}`} href={href({ status: "solved" })}>Solved</Link>
          </>}
        </div>
      </div>
      <div className="panel">
        {list.length === 0 ? <p className="card muted">No problems match these filters.</p> : (
          <ul className="plist">
            {list.map((t) => (
              <li key={t.slug}><Link href={`/problems/${t.slug}`}>
                <span className={`tick ${solved.has(t.slug) ? "done" : ""}`}>{solved.has(t.slug) ? "✓" : ""}</span>
                <span style={{ minWidth: 0 }}><span className="t">{t.title}</span><br /><span className="small muted">{t.track} · {t.concepts.join(", ")} · {countBy.get(t.slug) ?? 0} solved</span></span>
                <span className={`chip d-${t.difficulty}`}>{t.difficulty}</span>
              </Link></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
