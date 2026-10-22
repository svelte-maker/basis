import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTemplate, instantiate, practiceSeed, PRACTICE_POINTS, TEMPLATES } from "@/lib/problems";
import { practiceState } from "@/lib/services/practice";
import { Statement } from "@/components/Statement";
import { PracticePanel } from "./PracticePanel";
import { LearnLink } from "@/components/LearnLink";
import { lessonsForProblem } from "@/lib/learn";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const t = getTemplate((await params).slug);
  return { title: t?.title ?? "Problem" };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTemplate(slug);
  if (!t) notFound();
  const user = await getCurrentUser();
  const state = user ? await practiceState(user.id, slug) : null;
  const seed = user && state ? practiceSeed(user.id, slug, state.variant) : `guest:${slug}`;
  const inst = instantiate(slug, seed);
  const showSolution = !!state && (state.solved || state.revealed);
  const solvers = await db.practiceState.count({ where: { slug, everSolved: true } });
  const idx = TEMPLATES.findIndex((x) => x.slug === slug);
  const nextT = TEMPLATES[(idx + 1) % TEMPLATES.length];

  return (
    <div className="stack">
      <div className="row small"><Link href="/problems">← All problems</Link></div>
      <article className="panel card" style={{ padding: 24, gap: 16 }}>
        <div className="row">
          <span className="chip">{t.track}</span>
          <span className={`chip d-${t.difficulty}`}>{t.difficulty} · +{PRACTICE_POINTS[t.difficulty]} rating</span>
          {t.concepts.map((c) => <span key={c} className="chip">{c}</span>)}
          <span className="small muted">{solvers} people solved this</span>
        </div>
        <h1>{t.title}</h1>
        {state && state.variant > 0 && <p className="small muted">Variant {state.variant + 1}: fresh numbers for practice.</p>}
        <Statement blocks={inst.blocks} question={inst.question} />
        <PracticePanel slug={slug} unit={inst.unit} loggedIn={!!user} initiallySolved={!!state?.solved} initialSolution={showSolution ? inst.solution : null} />
      </article>
      <LearnLink lessons={lessonsForProblem(slug)} />
      <div className="row between small">
        <span className="muted">Answers are accepted within a small tolerance, so normal rounding is fine.</span>
        <Link href={`/problems/${nextT.slug}`}>Next: {nextT.title} →</Link>
      </div>
    </div>
  );
}
