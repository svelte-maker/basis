"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Raw } from "@/lib/sheets";
import type { PublicInstance } from "@/lib/models";
import type { CellResult } from "@/lib/models/grade";
import { newModelVariantAction, revealModelAction, saveDraftAction, submitModelAction, type ModelResponse, type ModelReveal } from "../../actions/models";
import { Spreadsheet, type Mark } from "../Spreadsheet";
import { ModelText } from "../ModelText";

function note(c: CellResult): string {
  switch (c.status) {
    case "ok": return "Correct, and it updates when the inputs change.";
    case "empty": return "Still empty.";
    case "error": return "Shows an error. Select the cell to see why.";
    case "wrong": return "Doesn't match the expected value. Check the formula and the cells it uses.";
    case "hardcoded": return `Right number now, but wrong when the ${c.shock}. Reference the input cells instead of typing numbers.`;
    case "missing-function": return `Right number, but this cell should use ${c.missing?.join(", ")}.`;
  }
}

export function ModelWorkspace({
  slug, inst, loggedIn, initialDraft, initiallySolved, initialReveal,
}: {
  slug: string; inst: PublicInstance; loggedIn: boolean; initialDraft: Raw; initiallySolved: boolean; initialReveal: ModelReveal | null;
}) {
  const [entries, setEntries] = useState<Raw>(initialDraft);
  const [result, setResult] = useState<ModelResponse | null>(null);
  const [reveal, setReveal] = useState<ModelReveal | null>(initialReveal);
  const [view, setView] = useState<"mine" | "answer">("mine");
  const [formulas, setFormulas] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [focus, setFocus] = useState<{ cell: string; n: number }>();
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [busy, start] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (!loggedIn) return;
    if (first.current) { first.current = false; return; }
    setSaved("saving");
    const t = setTimeout(() => { saveDraftAction(slug, entries).then((ok) => setSaved(ok ? "saved" : "idle")); }, 1200);
    return () => clearTimeout(t);
  }, [entries, loggedIn, slug]);

  const report = result?.status === "graded" ? result.report : null;
  const solved = initiallySolved || (result?.status === "graded" && result.solved);
  const marks = useMemo(() => {
    if (!report) return undefined;
    const m: Record<string, Mark> = {};
    for (const c of report.cells) m[c.cell] = { ok: c.status === "ok", note: note(c) };
    return m;
  }, [report]);
  const totalPoints = inst.graded.reduce((s, g) => s + g.points, 0);
  const showingAnswer = view === "answer" && reveal;

  return (
    <div className="stack">
      <div className="row between">
        <div className="row">
          {reveal && (
            <span className="seg" role="group" aria-label="Which model to show">
              <button type="button" className={view === "mine" ? "on" : ""} onClick={() => setView("mine")}>My model</button>
              <button type="button" className={view === "answer" ? "on" : ""} onClick={() => setView("answer")}>Answer model</button>
            </span>
          )}
          <label className="check small"><input type="checkbox" checked={formulas} onChange={(e) => setFormulas(e.target.checked)} /> Show formulas</label>
        </div>
        <span className="small muted">
          {loggedIn ? (saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : "Your work saves as you go") : "Sample numbers. Log in to save and check your work."}
        </span>
      </div>

      <Spreadsheet
        rows={inst.rows} cols={inst.cols} widths={inst.widths} cells={inst.cells}
        entries={showingAnswer ? reveal.answer : entries}
        onEntries={setEntries}
        readOnly={!!showingAnswer}
        marks={showingAnswer ? undefined : marks}
        showFormulas={formulas}
        focus={focus}
      />
      <p className="small muted">Keys: Enter or F2 edits, Tab and arrows move, Shift+arrows select, Ctrl+C / Ctrl+V copy with references shifting like Excel, Ctrl+R fills right, Ctrl+D fills down, Ctrl+Z undoes.</p>

      <div className="split">
        <section className="panel">
          <div className="panel-head"><h3>What gets checked</h3><span className="small muted num">{report ? `${report.earned}/${report.total}` : totalPoints} points</span></div>
          <ul className="checks">
            {inst.graded.map((g) => {
              const c = report?.cells.find((x) => x.cell === g.cell);
              return (
                <li key={g.cell}>
                  <button type="button" onClick={() => { setView("mine"); setFocus({ cell: g.cell, n: Date.now() }); }}>
                    <span className={`tick ${c?.status === "ok" ? "done" : c ? "miss" : ""}`}>{c?.status === "ok" ? "✓" : c ? "✕" : ""}</span>
                    <span><span className="num">{g.cell}</span> {g.label}{g.requires?.length ? <span className="muted small"> · use {g.requires.map((x) => x.join(" or ")).join(", ")}</span> : null}
                      {c && c.status !== "ok" && <><br /><span className="small bad">{note(c)}</span></>}
                    </span>
                    <span className="small muted num">{g.points}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="card small muted" style={{ borderTop: "1px solid var(--line)" }}>
            Each cell is checked three ways: its value, whether it still matches when the checker changes the inputs ({inst.shocks.join("; ")}), and any function the task asks for.
          </div>
        </section>

        <div className="stack-sm">
          {loggedIn ? (
            <div className="row">
              <button type="button" className="btn" disabled={busy || !!showingAnswer} onClick={() => start(async () => {
                const r = await submitModelAction(slug, entries);
                setResult(r);
                if (r.reveal) setReveal(r.reveal);
              })}>{busy ? "Checking…" : "Check my model"}</button>
              {!reveal && !solved && !confirming && <button type="button" className="btn quiet" onClick={() => setConfirming(true)}>Show answer model</button>}
              {(solved || reveal) && <button type="button" className="btn ghost" disabled={busy} onClick={() => start(async () => { await newModelVariantAction(slug); location.reload(); })}>Try new numbers</button>}
            </div>
          ) : (
            <div className="fb info"><Link href={`/login?next=/models/${slug}`}>Log in</Link> or <Link href={`/signup?next=/models/${slug}`}>join</Link> to get your own numbers, save your work and earn rating.</div>
          )}
          {confirming && !reveal && (
            <div className="fb info row">
              <span>Seeing the answer model first means this version won&apos;t add to your rating.</span>
              <button type="button" className="btn ghost small" disabled={busy} onClick={() => start(async () => { const r = await revealModelAction(slug); if (r) { setReveal(r); setView("answer"); } setConfirming(false); })}>Show it anyway</button>
              <button type="button" className="btn quiet small" onClick={() => setConfirming(false)}>Keep building</button>
            </div>
          )}
          {result?.status === "invalid" && <div className="fb no">{result.message}</div>}
          {result?.status === "login" && <div className="fb no">Your session expired. <Link href="/login">Log in again</Link>.</div>}
          {report && result?.status === "graded" && (
            report.score === 1 ? (
              <div className="fb ok">
                Every checked cell is right and your model holds up when the inputs change.{" "}
                {result.pointsAwarded > 0 ? <>Rating <span className="num">{result.ratingBefore}</span> → <strong className="num">{result.ratingAfter}</strong> (+{result.pointsAwarded}).</> : result.reason}
              </div>
            ) : (
              <div className="fb no">
                <span className="num">{report.earned}/{report.total}</span> points ({Math.round(report.score * 100)}%). The cells marked ✕ need work. Checking again is free in practice.
              </div>
            )
          )}
          {initiallySolved && !result && <div className="fb ok">You&apos;ve solved this version.</div>}
          {reveal && (
            <div className="solution">
              <span className="eyebrow">How the model works</span>
              {reveal.solution.map((line, i) => <p key={i}><ModelText text={line} /></p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
