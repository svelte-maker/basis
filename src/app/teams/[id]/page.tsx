import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getCase, CASE_POINTS, publicCase } from "@/lib/cases";
import { getModelTask, MODEL_POINTS, publicView } from "@/lib/models";
import { teamModel } from "@/lib/services/teams";
import { teamSnapshot } from "@/lib/services/teamView";
import { ModelText } from "../../models/ModelText";
import { CaseHeader, ExhibitView } from "../../cases/Exhibit";
import { TeamWorkspace } from "./TeamWorkspace";
import "../../models/models.css";
import "../../cases/cases.css";
import "../teams.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const snap = await teamSnapshot(id, user?.id ?? null);
  if (!snap) notFound();
  const h = await headers();
  const inviteUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/teams/${snap.id}`;

  if (snap.kind === "case") {
    const c = getCase(snap.slug);
    if (!c) notFound();
    return (
      <div className="stack">
        <div className="row small"><Link href="/teams">← Teams</Link><Link href={`/cases/${c.slug}`}>Solo version</Link></div>
        <div className="row"><span className="chip">Team case</span><span className="chip">{snap.parts.length} parts</span><span className="small muted">{snap.name}. {CASE_POINTS[c.difficulty]} points to share. Each part is marked on its own against the reported figures.</span></div>
        <CaseHeader c={c} />
        <div className="exhibits">{c.exhibits.map((e) => <ExhibitView key={e.key} c={c} e={e} />)}</div>
        <TeamWorkspace initial={snap} caseView={publicCase(c)} loggedIn={!!user} inviteUrl={inviteUrl} />
      </div>
    );
  }

  const t = getModelTask(snap.slug);
  if (!t) notFound();
  const inst = teamModel(snap.slug, snap.id);
  return (
    <div className="stack">
      <div className="row small"><Link href="/teams">← Teams</Link><Link href={`/models/${t.slug}`}>Solo version</Link></div>
      <article className="panel card" style={{ padding: 24, gap: 16 }}>
        <div className="row">
          <span className="chip">Team build</span>
          <span className="chip">{t.track}</span>
          <span className={`chip d-${t.difficulty}`}>{t.difficulty} · {MODEL_POINTS[t.difficulty]} points to share</span>
          <span className="chip">{snap.parts.length} parts</span>
        </div>
        <h1>{t.title}</h1>
        <p className="small muted">{snap.name}. Everyone on the team works on the same numbers, and each part is checked on its own.</p>
        <div className="statement">
          {inst.brief.map((p, i) => <p key={i}><ModelText text={p} /></p>)}
          <ol className="steps">{inst.steps.map((s, i) => <li key={i}><ModelText text={s} /></li>)}</ol>
        </div>
        <TeamWorkspace initial={snap} inst={publicView(inst)} loggedIn={!!user} inviteUrl={inviteUrl} />
      </article>
    </div>
  );
}
