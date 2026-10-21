"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { PublicCase, PublicPart } from "@/lib/cases";
import type { CellResult } from "@/lib/models/grade";
import type { PartProgress, PartReveal, Progress } from "@/lib/services/cases";
import type { Raw } from "@/lib/sheets";
import { restartCaseAction, revealCasePartAction, saveCaseDraftAction, submitCasePartAction, type CaseResponse } from "../../actions/cases";
import { ModelText } from "../../models/ModelText";
import { Spreadsheet, type Mark } from "../../models/Spreadsheet";
import { SolutionView } from "../SolutionView";

const done = (p?: PartProgress) => !!p && (p.solved || p.revealed);

function cellNote(c: CellResult): string {
  switch (c.status) {
    case "ok": return "Correct, and it updates when the inputs change.";
    case "empty": return "Still empty.";
    case "error": return "Shows an error.";
    case "wrong": return "Doesn't match the expected value.";
    case "hardcoded": return `Right now, but wrong when the ${c.shock}. Reference the inputs.`;
    case "missing-function": return `Should use ${c.missing?.join(", ")}.`;
  }
}

function fmtAnswer(r: Extract<PartReveal, { kind: "numeric" }>): string {
  const dp = Math.abs(r.answer) >= 1000 ? 2 : 4;
  const n = Number(r.answer.toFixed(dp)).toLocaleString("en-US", { maximumFractionDigits: dp });
  return `${n} ${r.unit}`;
}

function PartCard({
  slug, part, index, progress, reveal, open, loggedIn, onResult, onReveal,
}: {
  slug: string; part: PublicPart; index: number; progress?: PartProgress; reveal?: PartReveal; open: boolean; loggedIn: boolean;
  onResult: (key: string, r: CaseResponse) => void; onReveal: (key: string, r: PartReveal) => void;
}) {
  const [value, setValue] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [cells, setCells] = useState<Raw>(progress?.draft ?? {});
  const [last, setLast] = useState<CaseResponse | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [view, setView] = useState<"mine" | "answer">("mine");
  const [busy, start] = useTransition();
  const first = useRef(true);
  const isDone = done(progress);

  useEffect(() => {
    if (part.kind !== "model" || !loggedIn || isDone) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => { saveCaseDraftAction(slug, part.key, cells); }, 1200);
    return () => clearTimeout(t);
  }, [cells, loggedIn, slug, part, isDone]);

  const report = last?.status === "graded" ? last.grade.report : undefined;
  const marks = useMemo(() => {
    if (!report) return undefined;
    const m: Record<string, Mark> = {};
    for (const c of report.cells) m[c.cell] = { ok: c.status === "ok", note: cellNote(c) };
    return m;
  }, [report]);

  const submit = () => start(async () => {
    const input = part.kind === "numeric" ? { value } : part.kind === "choice" ? { choice: choice ?? -1 } : { cells };
    const r = await submitCasePartAction(slug, part.key, input);
    setLast(r);
    onResult(part.key, r);
  });

  if (!open) {
    return (
      <li className="part locked">
        <div className="part-head"><span className="part-n">{index + 1}</span><span className="t">{part.title}</span><span className="small muted num">{part.points} pts</span></div>
      </li>
    );
  }

  const modelAnswer = reveal?.kind === "model" && view === "answer";
  return (
    <li className={`part ${isDone ? "done" : "open"}`}>
      <div className="part-head">
        <span className={`part-n ${progress?.solved ? "ok" : progress?.revealed ? "rev" : ""}`}>{progress?.solved ? "✓" : index + 1}</span>
        <span className="t">{part.title}</span>
        <span className="small muted">{part.skills.join(", ")}</span>
        <span className="small muted num">{part.points} pts</span>
      </div>
      <div className="part-body">
        {part.prompt.map((p, i) => <p key={i}><ModelText text={p} /></p>)}

        {part.kind === "choice" && (
          <div className="options" role="radiogroup" aria-label={part.title}>
            {part.options.map((o, i) => {
              const right = reveal?.kind === "choice" && reveal.correct === i;
              return (
                <label key={i} className={`option ${right ? "right" : ""}`}>
                  <input type="radio" name={`opt-${part.key}`} disabled={isDone || !loggedIn} checked={choice === i} onChange={() => setChoice(i)} />
                  <span>{o}</span>
                </label>
              );
            })}
          </div>
        )}

        {part.kind === "model" && (
          <div className="stack-sm">
            {part.model.brief.map((p, i) => <p key={i} className="small"><ModelText text={p} /></p>)}
            <ol className="steps small">{part.model.steps.map((s, i) => <li key={i}><ModelText text={s} /></li>)}</ol>
            {reveal?.kind === "model" && (
              <span className="seg" role="group" aria-label="Which model to show">
                <button type="button" className={view === "mine" ? "on" : ""} onClick={() => setView("mine")}>My model</button>
                <button type="button" className={view === "answer" ? "on" : ""} onClick={() => setView("answer")}>Answer model</button>
              </span>
            )}
            <Spreadsheet
              rows={part.model.rows} cols={part.model.cols} widths={part.model.widths} cells={part.model.cells}
              entries={modelAnswer ? reveal.answer : cells} onEntries={setCells}
              readOnly={modelAnswer || !loggedIn} marks={modelAnswer ? undefined : marks}
            />
            <p className="small muted">The checker marks {part.model.graded.length} cells, then re-runs your formulas when the {part.model.shocks.join("; ")}.</p>
            {report && report.score < 1 && (
              <ul className="small cell-notes">
                {report.cells.filter((c) => c.status !== "ok").map((c) => <li key={c.cell}><span className="num">{c.cell}</span> {c.label}: <span className="bad">{cellNote(c)}</span></li>)}
              </ul>
            )}
          </div>
        )}

        {!isDone && loggedIn && (
          <div className="row">
            {part.kind === "numeric" && (
              <form className="answer-row" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" autoComplete="off" placeholder="Your answer" aria-label={`Answer to ${part.title}`} required />
                <span className="muted small">{part.unit}</span>
                <button className="btn" disabled={busy}>{busy ? "Checking…" : "Check"}</button>
              </form>
            )}
            {part.kind !== "numeric" && <button type="button" className="btn" disabled={busy || (part.kind === "choice" && choice === null)} onClick={submit}>{busy ? "Checking…" : part.kind === "model" ? "Check my model" : "Check"}</button>}
            {!confirming && <button type="button" className="btn quiet" onClick={() => setConfirming(true)}>Show answer</button>}
          </div>
        )}
        {confirming && !isDone && (
          <div className="fb info row">
            <span>This part will then earn nothing toward the case&apos;s rating points, and the next part opens.</span>
            <button type="button" className="btn ghost small" disabled={busy} onClick={() => start(async () => { const r = await revealCasePartAction(slug, part.key); if (r) onReveal(part.key, r); setConfirming(false); })}>Show it</button>
            <button type="button" className="btn quiet small" onClick={() => setConfirming(false)}>Keep working</button>
          </div>
        )}

        {last?.status === "invalid" && <div className="fb no">{last.message}</div>}
        {last?.status === "login" && <div className="fb no">Your session expired. <Link href="/login">Log in again</Link>.</div>}
        {last?.status === "graded" && !last.grade.correct && (
          <div className="fb no">
            {part.kind === "model" ? `${Math.round(last.grade.score * 100)}% of the checked cells are right.` : "Not quite."} Try again: checking is free in practice. Attempts: {last.progress.attempts}.
          </div>
        )}
        {progress?.solved && <div className="fb ok">Correct{progress.attempts > 1 ? ` after ${progress.attempts} attempts` : ""}.</div>}
        {progress?.revealed && !progress.solved && <div className="fb info">Answer shown. The next part is open.</div>}

        {reveal && (
          <>
            {reveal.kind === "numeric" && <p className="answer-line">Answer: <strong className="num">{fmtAnswer(reveal)}</strong></p>}
            {reveal.kind === "model" && <div className="solution">{reveal.notes.map((t, i) => <p key={i}><ModelText text={t} /></p>)}</div>}
            <SolutionView s={reveal.solution} />
          </>
        )}
      </div>
    </li>
  );
}

export function CaseWorkspace({
  slug, c, total, loggedIn, initialProgress, initialReveals, everCompleted,
}: {
  slug: string; c: PublicCase; total: number; loggedIn: boolean;
  initialProgress: Progress; initialReveals: Record<string, PartReveal>; everCompleted: boolean;
}) {
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [reveals, setReveals] = useState(initialReveals);
  const [award, setAward] = useState<{ points: number; before: number; after: number; reason?: string } | null>(null);
  const [busy, start] = useTransition();

  const onResult = (key: string, r: CaseResponse) => {
    if (r.status !== "graded") return;
    setProgress((p) => ({ ...p, [key]: r.progress }));
    if (r.reveal) setReveals((x) => ({ ...x, [key]: r.reveal! }));
    if (r.completed) setAward({ points: r.pointsAwarded, before: r.ratingBefore, after: r.ratingAfter, reason: r.reason });
  };
  const onReveal = (key: string, r: PartReveal) => {
    setProgress((p) => ({ ...p, [key]: { ...(p[key] ?? { attempts: 0, solved: false, best: 0 }), revealed: true } }));
    setReveals((x) => ({ ...x, [key]: r }));
  };

  const firstOpen = c.parts.findIndex((p) => !done(progress[p.key]));
  const doneCount = c.parts.filter((p) => done(progress[p.key])).length;
  const earned = c.parts.reduce((s, p) => s + (progress[p.key]?.revealed ? 0 : (progress[p.key]?.best ?? 0) * p.points), 0);

  return (
    <section className="panel case-parts">
      <div className="panel-head">
        <h2>Work the case</h2>
        <span className="small muted num">{doneCount}/{c.parts.length} parts · {Math.round(earned)}/{total} points</span>
      </div>
      {!loggedIn && <div className="card"><div className="fb info"><Link href={`/login?next=/cases/${slug}`}>Log in</Link> or <Link href={`/signup?next=/cases/${slug}`}>join</Link> to answer, save your progress and earn rating. You can read the case and its sources without an account.</div></div>}
      <ol className="parts">
        {c.parts.map((p, i) => (
          <PartCard
            key={p.key} slug={slug} part={p} index={i} progress={progress[p.key]} reveal={reveals[p.key]}
            open={!loggedIn ? i === 0 : firstOpen === -1 || i <= firstOpen} loggedIn={loggedIn}
            onResult={onResult} onReveal={onReveal}
          />
        ))}
      </ol>
      {(firstOpen === -1 || award) && (
        <div className="card">
          {award ? (
            award.points > 0
              ? <div className="fb ok">Case complete. Rating <span className="num">{award.before}</span> → <strong className="num">{award.after}</strong> (+{award.points}).</div>
              : <div className="fb ok">Case complete. {award.reason}</div>
          ) : <div className="fb ok">You&apos;ve completed this case.{everCompleted ? " Rating points for it are already counted." : ""}</div>}
          <div className="row">
            <button type="button" className="btn ghost" disabled={busy} onClick={() => start(async () => { await restartCaseAction(slug); location.reload(); })}>Work it again</button>
            <span className="small muted">Starting over clears your answers. Rating points are only awarded once per case.</span>
          </div>
        </div>
      )}
    </section>
  );
}
