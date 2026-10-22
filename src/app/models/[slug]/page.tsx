import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModelTask, instantiateModel, MODEL_POINTS, MODEL_TASKS, publicView } from "@/lib/models";
import { currentInstance, parseDraft } from "@/lib/services/models";
import { ModelText } from "../ModelText";
import { ModelWorkspace } from "./ModelWorkspace";
import { TeamPanel } from "../../teams/TeamPanel";
import { LearnLink } from "@/components/LearnLink";
import { lessonsForModel } from "@/lib/learn";
import "../models.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const t = getModelTask((await params).slug);
  return { title: t?.title ?? "Model task" };
}

export default async function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getModelTask(slug);
  if (!t) notFound();
  const user = await getCurrentUser();
  const cur = user ? await currentInstance(user.id, slug) : null;
  const inst = cur ? cur.inst : instantiateModel(slug, `guest:${slug}`);
  const state = cur?.state;
  const showAnswer = !!state && (state.solved || state.revealed);
  const solvers = await db.modelState.count({ where: { slug, everSolved: true } });
  const idx = MODEL_TASKS.findIndex((x) => x.slug === slug);
  const nextT = MODEL_TASKS[(idx + 1) % MODEL_TASKS.length];

  return (
    <div className="stack">
      <div className="row small"><Link href="/models">← All model tasks</Link></div>
      <article className="panel card" style={{ padding: 24, gap: 16 }}>
        <div className="row">
          <span className="chip">{t.track}</span>
          <span className={`chip d-${t.difficulty}`}>{t.difficulty} · +{MODEL_POINTS[t.difficulty]} rating</span>
          <span className="chip">About {t.minutes} min</span>
          {t.functions.map((f) => <span key={f} className="chip fn">{f}</span>)}
          <span className="small muted">{solvers} people built this</span>
        </div>
        <h1>{t.title}</h1>
        {state && state.variant > 0 && <p className="small muted">Version {state.variant + 1}: fresh numbers for practice.</p>}
        <div className="statement">
          {inst.brief.map((p, i) => <p key={i}><ModelText text={p} /></p>)}
          <ol className="steps">{inst.steps.map((s, i) => <li key={i}><ModelText text={s} /></li>)}</ol>
        </div>
        <ModelWorkspace
          key={state?.variant ?? -1}
          slug={slug}
          inst={publicView(inst)}
          loggedIn={!!user}
          initialDraft={state ? parseDraft(state.draft) : {}}
          initiallySolved={!!state?.solved}
          initialReveal={showAnswer ? { answer: inst.answer, solution: inst.solution } : null}
        />
      </article>
      <LearnLink lessons={lessonsForModel(slug)} />
      <TeamPanel kind="model" slug={slug} userId={user?.id ?? null} />
      <div className="row between small">
        <span className="muted">Values are accepted within 0.05%, so normal rounding is fine. Formulas are checked, not just numbers.</span>
        <Link href={`/models/${nextT.slug}`}>Next: {nextT.title} →</Link>
      </div>
    </div>
  );
}
