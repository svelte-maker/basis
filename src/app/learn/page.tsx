import Link from "next/link";
import { glossary, LESSONS, lessonsIn, MODULES, ORDERED, readingMinutes } from "@/lib/learn";
import { DoneCount, LessonTick } from "./LessonTick";
import "./learn.css";
import { canonical } from "@/lib/seo";

export const metadata = {
  title: "Learn finance",
  description: "In-depth lessons on valuation, financial modelling, Excel, IPOs and FPOs, accounting, M&A, LBOs, bonds, derivatives, risk and credit. Every lesson ends in graded practice.",
  ...canonical("/learn"),
};

export default function LearnPage() {
  const practice = new Set(LESSONS.flatMap((l) => [...l.apply.problems, ...l.apply.models, ...l.apply.cases.map((c) => c.slug)]));
  const hours = Math.round(LESSONS.reduce((s, l) => s + readingMinutes(l), 0) / 60);
  const start = ORDERED[0];

  return (
    <div className="stack" style={{ gap: 32 }}>
      <section className="hero" style={{ paddingBlock: "8px 0" }}>
        <span className="eyebrow">Learn</span>
        <h1 style={{ maxWidth: "22ch" }}>Finance as it is practised, not just as it is taught.</h1>
        <p className="lede" style={{ fontSize: 17, maxWidth: "70ch" }}>Each lesson teaches a concept in depth, shows where the textbook and the real job part ways, and then sends you straight to graded problems, live spreadsheet models and real company cases that use it. Theory first, then the practice that makes it stick.</p>
        <div className="row">
          <Link className="btn" href={`/learn/${start.slug}`} style={{ color: "var(--accent-ink)" }}>Start with {start.title.split(":")[0].toLowerCase()}</Link>
          <Link className="btn ghost" href="/learn/glossary">Glossary</Link>
          <DoneCount slugs={LESSONS.map((l) => l.slug)} />
        </div>
        <div className="row small muted"><span className="num">{LESSONS.length}</span> lessons · <span className="num">{MODULES.length}</span> modules · about <span className="num">{hours}</span> hours · <span className="num">{practice.size}</span> linked problems, models and cases · <span className="num">{glossary().length}</span> key terms</div>
      </section>

      <section className="bridge" aria-label="How a lesson works">
        <div className="panel"><span className="step-n">1 · Understand</span><strong>The idea before the formula</strong><span className="small muted">Intuition, every formula explained term by term, and a worked example computed by the same code that grades Basis problems.</span></div>
        <div className="panel"><span className="step-n">2 · See the gap</span><strong>Textbook vs the desk</strong><span className="small muted">How analysts, bankers, lenders and fund managers actually do it, and where the classroom version breaks.</span></div>
        <div className="panel"><span className="step-n">3 · Try it</span><strong>Live sheets and a quick check</strong><span className="small muted">Edit spreadsheets in the lesson, rebuild the formulas yourself, and test your understanding with instant feedback.</span></div>
        <div className="panel"><span className="step-n">4 · Apply it</span><strong>Graded practice</strong><span className="small muted">Problems with your own numbers, model tasks and real filings like the Hyundai IPO and Apple&apos;s 10-K.</span></div>
      </section>

      {MODULES.map((m, i) => {
        const ls = lessonsIn(m.key);
        return (
          <section key={m.key} id={m.key} className="panel module" style={{ scrollMarginTop: 80 }}>
            <div className="module-head">
              <span className="n">Module {i + 1}</span>
              <h2>{m.title}</h2>
              <span className="small muted">{m.blurb}</span>
            </div>
            {ls.map((l) => (
              <Link key={l.slug} href={`/learn/${l.slug}`} className="lesson-row">
                <LessonTick slug={l.slug} />
                <span style={{ minWidth: 0 }}>
                  <span className="t">{l.title}</span><br />
                  <span className="small muted">{l.summary}</span>
                </span>
                <span className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                  <span className={`chip lvl-${l.level}`}>{l.level}</span>
                  <span className="chip">{readingMinutes(l)} min</span>
                </span>
              </Link>
            ))}
          </section>
        );
      })}

      <section className="panel card">
        <h3>How lessons are checked</h3>
        <p className="small muted">Every number in a worked example is computed by the tested finance library that grades Basis problems, so the lesson and the answer key can never disagree. Every live spreadsheet runs on the same engine as the model tasks, and a build test fails if any lesson links to a problem, model or case part that doesn&apos;t exist, or if any problem on Basis isn&apos;t taught by a lesson.</p>
      </section>
    </div>
  );
}
