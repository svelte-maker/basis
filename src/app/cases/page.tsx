import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CASE_POINTS, CASES } from "@/lib/cases";
import { isDone, parseProgress } from "@/lib/services/cases";
import "./cases.css";

export const metadata = { title: "Case studies" };

export default async function CasesPage() {
  const user = await getCurrentUser();
  const states = user ? await db.caseState.findMany({ where: { userId: user.id } }) : [];
  const bySlug = new Map(states.map((s) => [s.slug, s]));
  const counts = await db.caseState.groupBy({ by: ["slug"], where: { everCompleted: true }, _count: true });
  const countBy = new Map(counts.map((r) => [r.slug, r._count]));

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h1>Case studies</h1>
          <p className="lede">Work through real deals and real filings, part by part: size an IPO from its prospectus, rebuild EBITDA from the statements, value a company from its 10-K. Every number links to the page it came from, shown the way the company reports it.</p>
        </div>
        {user && <div className="small muted">Completed <span className="num">{states.filter((s) => s.everCompleted).length}/{CASES.length}</span></div>}
      </div>
      <div className="panel">
        <ul className="plist">
          {CASES.map((c) => {
            const s = bySlug.get(c.slug);
            const progress = s ? parseProgress(s.parts) : {};
            const doneN = c.parts.filter((p) => isDone(progress[p.key])).length;
            return (
              <li key={c.slug}><Link href={`/cases/${c.slug}`}>
                <span className={`tick ${s?.everCompleted ? "done" : ""}`}>{s?.everCompleted ? "✓" : ""}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="t">{c.title}</span><br />
                  <span className="small muted">{c.summary}</span><br />
                  <span className="small muted">{c.kind === "real" ? "Real case" : "Real data, hypothetical assumptions"} · {c.track} · {c.parts.length} parts · about {c.minutes} min · {countBy.get(c.slug) ?? 0} completed{doneN > 0 && !s?.everCompleted ? ` · you're on part ${doneN + 1}` : ""}</span>
                </span>
                <span className="row" style={{ gap: 6 }}><span className={`chip d-${c.difficulty}`}>{c.difficulty} · +{CASE_POINTS[c.difficulty]}</span></span>
              </Link></li>
            );
          })}
        </ul>
      </div>
      <section className="panel card">
        <h3>How the numbers are sourced</h3>
        <p className="small muted">Every reported figure is stored with its document, page or XBRL element, period and units, and a build test fails if any number in a case isn&apos;t traced to one. Real cases use only reported figures. Real-data hypotheticals keep the history as reported and label every Basis assumption.</p>
      </section>
    </div>
  );
}
