import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { getModelTask, MODEL_POINTS, publicView } from "@/lib/models";
import { teamModel } from "@/lib/services/teams";
import { teamSnapshot } from "@/lib/services/teamView";
import { ModelText } from "../../models/ModelText";
import { TeamWorkspace } from "./TeamWorkspace";
import "../../models/models.css";
import "../teams.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team build" };

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const snap = await teamSnapshot(id, user?.id ?? null);
  const t = snap && getModelTask(snap.slug);
  if (!snap || !t) notFound();
  const inst = teamModel(snap.slug, snap.id);
  const h = await headers();
  const inviteUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/teams/${snap.id}`;

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
