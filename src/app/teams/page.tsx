import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CASE_POINTS } from "@/lib/cases";
import { MODEL_POINTS } from "@/lib/models";
import { INTEGRATION_BONUS } from "@/lib/teams";
import { finalizeDueTeams, teamTaskInfo } from "@/lib/services/teams";
import "./teams.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Teams" };

export default async function TeamsPage() {
  await finalizeDueTeams();
  const user = await getCurrentUser();
  const [mine, open] = await Promise.all([
    user ? db.teamMember.findMany({ where: { userId: user.id }, include: { team: { include: { _count: { select: { members: true } } } } }, orderBy: { joinedAt: "desc" }, take: 30 }) : [],
    db.team.findMany({ where: { finalizedAt: null, ...(user ? { members: { none: { userId: user.id } } } : {}) }, include: { _count: { select: { members: true } } }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const openWithRoom = open.filter((t) => t._count.members < (teamTaskInfo(t.kind, t.slug)?.parts ?? 0));

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h1>Teams</h1>
          <p className="lede">Take on a big model or a real-company case together. Each teammate claims parts, such as the forecast, the debt schedule or a case question. Each part is checked on its own, and points go to whoever wrote it.</p>
        </div>
        <div className="row"><Link className="btn ghost" href="/models">Start from a model</Link><Link className="btn ghost" href="/cases">Start from a case</Link></div>
      </div>

      {user && (
        <section className="panel">
          <div className="panel-head"><h3>Your teams</h3></div>
          {mine.length ? (
            <ul className="plist">
              {mine.map((m) => {
                const t = teamTaskInfo(m.team.kind, m.team.slug);
                return (
                  <li key={m.teamId}><Link href={`/teams/${m.teamId}`}>
                    <span className={`tick ${m.team.finalizedAt ? "done" : ""}`}>{m.team.finalizedAt ? "✓" : ""}</span>
                    <span style={{ minWidth: 0 }}><span className="t">{t?.title ?? m.team.slug}</span><br />
                      <span className="small muted">{m.team.name} · {m.team._count.members} {m.team._count.members === 1 ? "person" : "people"} · {m.team.finalizedAt ? `you wrote ${Math.round(m.contribution * 100)}% · +${m.points}` : "in progress"}</span></span>
                    <span />
                  </Link></li>
                );
              })}
            </ul>
          ) : <div className="card small muted">You haven&apos;t joined a team yet. Open any model task or case study and choose &quot;Start a team&quot;, or join one below.</div>}
        </section>
      )}

      <section className="panel">
        <div className="panel-head"><h3>Teams looking for people</h3></div>
        {openWithRoom.length ? (
          <ul className="plist">
            {openWithRoom.map((team) => {
              const t = teamTaskInfo(team.kind, team.slug);
              const parts = t?.parts ?? 0;
              return (
                <li key={team.id}><Link href={`/teams/${team.id}`}>
                  <span className="tick" />
                  <span style={{ minWidth: 0 }}><span className="t">{t?.title ?? team.slug}</span><br />
                    <span className="small muted">{team.name} · {team._count.members} of {parts} places taken</span></span>
                  {t && <span className={`chip d-${t.difficulty}`}>{team.kind === "case" ? "Case" : "Model"} · {t.difficulty} · {(team.kind === "case" ? CASE_POINTS : MODEL_POINTS)[t.difficulty]} to share</span>}
                </Link></li>
              );
            })}
          </ul>
        ) : <div className="card small muted">No open teams right now. Start one from any model task or case study.</div>}
      </section>

      <section className="panel card">
        <h3>How points are shared</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          <li>The team shares the points one person would earn for solving the task alone. Each part is worth its share of the task&apos;s points.</li>
          <li>Number and multiple-choice answers in cases are marked once, when the team finishes, so nobody can guess their way through. Spreadsheet parts can be checked as you go.</li>
          <li>Each part is checked on its own. The checker fills every other part with the correct model, so a teammate&apos;s mistake never costs you.</li>
          <li>Only the person holding a part can edit its cells, so the sheet knows who wrote what. Your points are your parts&apos; value × how much of them is right × the share of their formulas you wrote.</li>
          <li>If the whole joined-up model or case passes every check, everyone&apos;s points grow by {Math.round(INTEGRATION_BONUS * 100)}%.</li>
          <li>A part with no edits for 24 hours can be taken over. Anyone who solved the task alone or opened its answer model first can help, but earns nothing. You earn team points on a task once.</li>
          <li>Team points count as practice points. Your contest rating stays your own.</li>
        </ul>
      </section>
    </div>
  );
}
