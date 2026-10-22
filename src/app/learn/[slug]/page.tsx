import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLesson, LESSONS, moduleOf, neighbours, readingMinutes, termId } from "@/lib/learn";
import { getTemplate } from "@/lib/problems";
import { getModelTask } from "@/lib/models";
import { getCase, getPart } from "@/lib/cases";
import { TOOLS } from "../../tools/registry";
import { RichText } from "@/components/RichText";
import { LessonBlocks } from "../LessonBlocks";
import { Quiz } from "../Quiz";
import "../../models/models.css";
import "../learn.css";

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const l = getLesson((await params).slug);
  if (!l) return { title: "Lesson" };
  return {
    title: l.title,
    description: l.summary,
    openGraph: { title: l.title, description: l.summary, type: "article" },
  };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getLesson(slug);
  if (!l) notFound();
  const mod = moduleOf(l.module);
  const { prev, next } = neighbours(slug);
  const minutes = readingMinutes(l);

  const user = await getCurrentUser();
  const caseSlugs = l.apply.cases.map((c) => c.slug);
  const [solvedP, solvedM, doneC] = user ? await Promise.all([
    db.practiceState.findMany({ where: { userId: user.id, slug: { in: l.apply.problems }, everSolved: true }, select: { slug: true } }),
    db.modelState.findMany({ where: { userId: user.id, slug: { in: l.apply.models }, everSolved: true }, select: { slug: true } }),
    db.caseState.findMany({ where: { userId: user.id, slug: { in: caseSlugs }, everCompleted: true }, select: { slug: true } }),
  ]) : [[], [], []];
  const solved = new Set([...solvedP, ...solvedM, ...doneC].map((s) => s.slug));

  const problems = l.apply.problems.map((p) => getTemplate(p)!);
  const models = l.apply.models.map((m) => getModelTask(m)!);
  const cases = l.apply.cases.map((c) => ({ c: getCase(c.slug)!, parts: c.parts.map((k) => getPart(getCase(c.slug)!, k)!) }));
  const tools = l.apply.tools.map((t) => TOOLS.find((x) => x.slug === t)!);
  const practiceCount = problems.length + models.length + cases.length;

  const toc = [
    { id: "why", title: "Why it matters" },
    ...l.sections.map((s) => ({ id: s.id, title: s.title })),
    { id: "gap", title: "Textbook vs the desk" },
    { id: "mistakes", title: "Common mistakes" },
    { id: "interview", title: "Interview questions" },
    { id: "check", title: "Check yourself" },
    ...(practiceCount + tools.length > 0 ? [{ id: "apply", title: "Now apply it" }] : []),
    { id: "terms", title: "Key terms" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: l.title,
    description: l.summary,
    learningResourceType: "Lesson",
    educationalLevel: l.level,
    timeRequired: `PT${minutes}M`,
    teaches: l.outcomes,
    isAccessibleForFree: true,
    inLanguage: "en",
    publisher: { "@type": "Organization", name: "Basis" },
  };

  return (
    <div className="stack">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="row small"><Link href="/learn">← Learn</Link><span className="muted">/</span><Link href={`/learn#${mod.key}`}>{mod.title}</Link></div>
      <div className="lesson-grid">
        <article className="lesson">
          <header className="lesson-head">
            <div className="row">
              <span className="chip">{mod.title}</span>
              <span className={`chip lvl-${l.level}`}>{l.level}</span>
              <span className="chip">About {minutes} min</span>
              {practiceCount > 0 && <span className="chip">{practiceCount} practice links</span>}
            </div>
            <h1>{l.title}</h1>
            <p className="lede">{l.summary}</p>
            {l.prerequisites.length > 0 && (
              <p className="small muted">Read first: {l.prerequisites.map((p, i) => <span key={p}>{i > 0 && ", "}<Link href={`/learn/${p}`}>{getLesson(p)!.title}</Link></span>)}</p>
            )}
          </header>

          <section className="outcomes">
            <span className="eyebrow">After this lesson you can</span>
            <ul>{l.outcomes.map((o, i) => <li key={i}><RichText text={o} /></li>)}</ul>
          </section>

          <section className="prose hook" id="why">
            <h2>Why it matters</h2>
            {l.hook.map((h, i) => <p key={i}><RichText text={h} /></p>)}
          </section>

          {l.sections.map((s) => (
            <section key={s.id} className="prose" id={s.id}>
              <h2>{s.title}</h2>
              <LessonBlocks blocks={s.blocks} />
            </section>
          ))}

          <section className="prose" id="gap">
            <h2>Textbook vs the desk</h2>
            <p className="muted">Where the classroom version and real practice part ways. This is the gap Basis exists to close.</p>
            <div className="panel table-box">
              <table className="gap-table">
                <thead><tr><th>The textbook says</th><th>On the desk</th></tr></thead>
                <tbody>{l.gap.map((g, i) => <tr key={i}><td><RichText text={g.theory} /></td><td><RichText text={g.practice} /></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="prose" id="mistakes">
            <h2>Common mistakes</h2>
            <ul>{l.mistakes.map((m, i) => <li key={i}><RichText text={m} /></li>)}</ul>
          </section>

          <section className="prose" id="interview">
            <h2>Interview questions</h2>
            <p className="muted">Asked in finance interviews. Answer out loud first, then open the model answer.</p>
            <div className="panel interview">
              {l.interview.map((q, i) => <details key={i}><summary><RichText text={q.q} /></summary><p><RichText text={q.a} /></p></details>)}
            </div>
          </section>

          <section className="prose" id="check">
            <h2>Check yourself</h2>
            <Quiz slug={l.slug} questions={l.quiz} />
          </section>

          {practiceCount + tools.length > 0 && (
            <section className="stack-sm" id="apply" style={{ scrollMarginTop: 80 }}>
              <h2>Now apply it</h2>
              <p className="muted" style={{ maxWidth: "70ch" }}>Theory sticks when you use it. Each of these is graded on Basis, with your own numbers{user ? "" : " (log in to save progress and earn rating points)"}.</p>
              <div className="apply-grid">
                {problems.length > 0 && (
                  <div className="panel card"><span className="eyebrow">Problems</span><ul>
                    {problems.map((p) => <li key={p.slug}><Link href={`/problems/${p.slug}`}><span className="t">{solved.has(p.slug) ? "✓ " : ""}{p.title}</span><span className="small muted">{p.track} · <span className={`d-${p.difficulty}`}>{p.difficulty}</span></span></Link></li>)}
                  </ul></div>
                )}
                {models.length > 0 && (
                  <div className="panel card"><span className="eyebrow">Model tasks</span><ul>
                    {models.map((m) => <li key={m.slug}><Link href={`/models/${m.slug}`}><span className="t">{solved.has(m.slug) ? "✓ " : ""}{m.title}</span><span className="small muted">Build it in a live spreadsheet · about {m.minutes} min</span></Link></li>)}
                  </ul></div>
                )}
                {cases.length > 0 && (
                  <div className="panel card"><span className="eyebrow">Real case studies</span><ul>
                    {cases.map(({ c, parts }) => <li key={c.slug}><Link href={`/cases/${c.slug}`}><span className="t">{solved.has(c.slug) ? "✓ " : ""}{c.title}</span><span className="small muted">Parts that use this lesson: {parts.map((p) => p.title).join(", ")}</span></Link></li>)}
                  </ul></div>
                )}
                {tools.length > 0 && (
                  <div className="panel card"><span className="eyebrow">Tools</span><ul>
                    {tools.map((t) => <li key={t.slug}><Link href={`/tools/${t.slug}`}><span className="t">{t.title}</span><span className="small muted">{t.blurb}</span></Link></li>)}
                  </ul></div>
                )}
              </div>
            </section>
          )}

          <section className="prose" id="terms">
            <h2>Key terms</h2>
            <div className="panel glossary"><dl>{l.glossary.map((g) => <div key={g.term}><dt><Link href={`/learn/glossary#${termId(g.term)}`} style={{ color: "inherit" }}>{g.term}</Link></dt><dd>{g.definition}</dd></div>)}</dl></div>
          </section>

          <nav className="row between small" aria-label="Lessons">
            {prev ? <Link href={`/learn/${prev.slug}`}>← {prev.title}</Link> : <span />}
            {next ? <Link href={`/learn/${next.slug}`}>Next: {next.title} →</Link> : <Link href="/learn">Back to all lessons →</Link>}
          </nav>
        </article>

        <aside className="lesson-toc" aria-label="On this page">
          <span className="eyebrow">On this page</span>
          <ol>{toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.title}</a></li>)}</ol>
        </aside>
      </div>
    </div>
  );
}
