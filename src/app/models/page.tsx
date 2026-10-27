import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { MODEL_POINTS, MODEL_TASKS } from "@/lib/models";
import { SUPPORTED_FUNCTIONS } from "@/lib/sheets";
import "./models.css";
import { MEMBER_SOLVES } from "@/lib/publicCounts";

export const metadata = { title: "Model tasks" };

export default async function ModelsPage() {
  const user = await getCurrentUser();
  const states = user ? await db.modelState.findMany({ where: { userId: user.id } }) : [];
  const solved = new Set(states.filter((s) => s.everSolved).map((s) => s.slug));
  const best = new Map(states.map((s) => [s.slug, s.bestScore]));
  const counts = await db.modelState.groupBy({ by: ["slug"], where: MEMBER_SOLVES, _count: true });
  const countBy = new Map(counts.map((r) => [r.slug, r._count]));

  return (
    <div className="stack">
      <div className="head">
        <div>
          <h1>Model tasks</h1>
          <p className="lede">Build real finance models in a spreadsheet, with the Excel functions analysts use every day. Your numbers are your own. The checker marks every output cell, then changes the inputs to make sure your model updates. Typed-in answers don&apos;t pass.</p>
        </div>
        {user && <div className="small muted">Built <span className="num">{solved.size}/{MODEL_TASKS.length}</span></div>}
      </div>
      <div className="panel">
        <ul className="plist">
          {MODEL_TASKS.map((t) => {
            const b = best.get(t.slug) ?? 0;
            return (
              <li key={t.slug}><Link href={`/models/${t.slug}`}>
                <span className={`tick ${solved.has(t.slug) ? "done" : ""}`}>{solved.has(t.slug) ? "✓" : ""}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="t">{t.title}</span><br />
                  <span className="small muted">{t.track} · {t.skills.join(", ")} · about {t.minutes} min · {countBy.get(t.slug) ?? 0} built{!solved.has(t.slug) && b > 0 ? ` · your best ${Math.round(b * 100)}%` : ""}</span>
                </span>
                <span className="row" style={{ gap: 6 }}><span className={`chip d-${t.difficulty}`}>{t.difficulty} · +{MODEL_POINTS[t.difficulty]}</span></span>
              </Link></li>
            );
          })}
        </ul>
      </div>
      <section className="panel card">
        <h3>Functions you can use</h3>
        <p className="small muted">The sheet runs Basis&apos;s own formula engine, which follows Excel&apos;s arguments, defaults and sign conventions. Data tables, goal seek and the statistics and bond functions are coming next.</p>
        <div className="row" style={{ gap: 6 }}>{SUPPORTED_FUNCTIONS.map((f) => <span key={f} className="chip fn">{f}</span>)}</div>
      </section>
    </div>
  );
}
