"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Raw } from "@/lib/sheets";
import type { PublicInstance } from "@/lib/models";
import type { PublicCase, PublicPart } from "@/lib/cases";
import type { CellResult, GradeReport } from "@/lib/models/grade";
import type { TeamSnapshot } from "@/lib/services/teamView";
import { CopyButton } from "@/components/CopyButton";
import { LocalTime } from "@/components/LocalTime";
import {
  checkPartAction, claimPartAction, joinTeamAction, leaveTeamAction, releasePartAction, saveTeamCellsAction, setReadyAction, teamSnapshotAction,
} from "../../actions/teams";
import { Spreadsheet, type Mark } from "../../models/Spreadsheet";
import { ModelText } from "../../models/ModelText";
import { SolutionView } from "../../cases/SolutionView";

const POLL_MS = 5000;

function note(c: CellResult): string {
  switch (c.status) {
    case "ok": return "Correct, and it updates when the inputs change.";
    case "empty": return "Still empty.";
    case "error": return "Shows an error.";
    case "wrong": return "Doesn't match the expected value.";
    case "hardcoded": return `Right number now, but wrong when the ${c.shock}. Reference the input cells.`;
    case "missing-function": return `Should use ${c.missing?.join(", ")}.`;
  }
}

const rowOf = (a: string) => Number(/\d+$/.exec(a)?.[0] ?? 0);
const inRows = (rows: [number, number][], a: string) => { const r = rowOf(a); return rows.some(([f, t]) => r >= f && r <= t); };
/** Case addresses carry their part: "q2:ans" or "q5!B7". */
const caseKeyOf = (a: string) => /^([a-z0-9-]+)(?::ans$|!)/.exec(a)?.[1];
const valuesOf = (cells: TeamSnapshot["cells"]): Raw => Object.fromEntries(Object.entries(cells).map(([a, c]) => [a, c.value]));
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function TeamWorkspace({ initial, inst, caseView, loggedIn, inviteUrl }: {
  initial: TeamSnapshot; inst?: PublicInstance; caseView?: PublicCase; loggedIn: boolean; inviteUrl: string;
}) {
  const [snap, setSnap] = useState(initial);
  const [entries, setEntries] = useState<Raw>(valuesOf(initial.cells));
  const pending = useRef<Record<string, string>>({});
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, GradeReport>>({});
  const [formulas, setFormulas] = useState(false);
  const [view, setView] = useState<"team" | "answer">("team");
  const [busy, start] = useTransition();
  const me = snap.me.userId;
  const live = snap.me.member && !snap.finalized;

  const apply = useCallback((s: TeamSnapshot | null | undefined) => {
    if (!s) return;
    setSnap(s);
    // Teammates' cells come from the server; my unsaved edits stay on top
    const next = valuesOf(s.cells);
    for (const [a, v] of Object.entries(pending.current)) { if (v.trim()) next[a] = v; else delete next[a]; }
    setEntries(next);
  }, []);

  const mine = useCallback((a: string) => {
    if (!live) return false;
    const key = snap.kind === "case" ? caseKeyOf(a) : snap.parts.find((p) => inRows(p.rows, a))?.key;
    return snap.parts.some((p) => p.key === key && p.claimedById === me);
  }, [live, snap.parts, snap.kind, me]);

  function onEntries(next: Raw) {
    for (const a of new Set([...Object.keys(next), ...Object.keys(entries)])) {
      if ((next[a] ?? "") !== (entries[a] ?? "") && mine(a)) pending.current[a] = next[a] ?? "";
    }
    setEntries(next);
    setSaved("saving");
  }

  // Save my edits a moment after I stop typing
  useEffect(() => {
    if (saved !== "saving") return;
    const t = setTimeout(async () => {
      const batch = pending.current;
      if (!Object.keys(batch).length) { setSaved("idle"); return; }
      pending.current = {};
      const r = await saveTeamCellsAction(snap.id, batch);
      if (!r.ok) { setError(r.message); pending.current = { ...batch, ...pending.current }; setSaved("idle"); return; }
      setError(r.rejected?.length ? `Couldn't save ${r.rejected.join(", ")}: those cells belong to another part.` : null);
      apply(r.snapshot);
      setSaved("saved");
    }, 900);
    return () => clearTimeout(t);
  }, [entries, saved, snap.id, apply]);

  // Pick up teammates' work
  useEffect(() => {
    if (snap.finalized) return;
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible" || Object.keys(pending.current).length) return;
      apply(await teamSnapshotAction(snap.id));
    }, POLL_MS);
    return () => clearInterval(t);
  }, [snap.id, snap.finalized, apply]);

  const run = (fn: () => Promise<{ ok: boolean; message?: string; snapshot?: TeamSnapshot } | void>) => start(async () => {
    const r = await fn();
    if (r && "ok" in r) { setError(r.ok ? null : r.message ?? null); apply(r.snapshot); }
  });

  const owners = useMemo(() => {
    const o: Record<string, { color: string; name: string }> = {};
    for (const [a, s] of Object.entries(inst?.cells ?? {})) {
      if (s.kind !== "calc") continue;
      const p = snap.parts.find((x) => inRows(x.rows, a));
      if (p) o[a] = { color: p.color, name: `${p.title}: ${p.claimedById === me ? "your part" : p.claimedByName ? `${p.claimedByName}'s part` : "unclaimed"}` };
    }
    return o;
  }, [inst?.cells, snap.parts, me]);

  const marks = useMemo(() => {
    const m: Record<string, Mark> = {};
    for (const r of Object.values(checks)) for (const c of r.cells) m[c.cell] = { ok: c.status === "ok", note: note(c) };
    return m;
  }, [checks]);

  const myClaims = snap.parts.filter((p) => p.claimedById === me).length;
  const meRow = snap.members.find((m) => m.userId === me);
  const full = snap.members.length >= snap.parts.length;
  const showingAnswer = view === "answer" && snap.reveal;
  const result = snap.result;

  return (
    <div className="stack">
      {error && <div className="fb no">{error}</div>}

      {!snap.me.member && !snap.finalized && (
        <div className="fb info row">
          {!loggedIn ? <span><Link href={`/login?next=/teams/${snap.id}`}>Log in</Link> or <Link href={`/signup?next=/teams/${snap.id}`}>join Basis</Link> to team up.</span>
            : full ? <span>This team is full: one person per part.</span>
            : <><span>{snap.members.length} of {snap.parts.length} places taken. Join, then claim a part.</span>
              <button type="button" className="btn small" disabled={busy} onClick={() => run(() => joinTeamAction(snap.id).then(async (r) => (r.ok ? { ...r, snapshot: (await teamSnapshotAction(snap.id)) ?? undefined } : r)))}>Join this team</button></>}
        </div>
      )}

      {result && (
        <section className="panel">
          <div className="panel-head"><h3>Result</h3><span className="small muted">Whole {snap.kind === "case" ? "case" : "model"} {pct(result.integrated.score)} {result.bonusEarned ? "· joined-up bonus earned" : ""}</span></div>
          <div className="table-box"><table className="data">
            <thead><tr><th>Part</th><th>Written by</th><th className="r">Score</th><th className="r">Worth</th></tr></thead>
            <tbody>
              {result.parts.map((p) => (
                <tr key={p.key}>
                  <td>{p.title}</td>
                  <td className="small">{Object.entries(p.shares).map(([u, s]) => `${snap.members.find((m) => m.userId === u)?.name ?? "A former teammate"} ${pct(s)}`).join(", ") || "Nobody"}</td>
                  <td className="r num">{p.earned}/{p.total}</td>
                  <td className="r num">{p.value.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="table-box"><table className="data">
            <thead><tr><th>Teammate</th><th className="r">Share of the model</th><th className="r">Points</th></tr></thead>
            <tbody>
              {result.members.map((m) => {
                const who = snap.members.find((x) => x.userId === m.userId);
                return (
                  <tr key={m.userId}>
                    <td>{who ? <Link href={`/u/${who.handle}`}>{who.name}</Link> : "A former teammate"}{m.reason && <><br /><span className="small muted">{m.reason}</span></>}</td>
                    <td className="r num">{pct(m.contribution)}</td>
                    <td className="r num">+{m.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
          <div className="card small muted" style={{ borderTop: "1px solid var(--line)" }}>
            The task is worth {result.pool} points, split by part. Each part was checked on its own, with the correct model filling in everyone else&apos;s cells. Points go to whoever wrote the part&apos;s formulas{result.bonusEarned ? ", plus 20% because the whole model passed every check together" : ""}.
          </div>
        </section>
      )}

      <div className="split team-top">
        <section className="panel">
          <div className="panel-head"><h3>Parts</h3><span className="small muted">Claim a part, build it, check it</span></div>
          <ul className="tparts">
            {snap.parts.map((p) => {
              const r = checks[p.key];
              const isMine = p.claimedById === me;
              return (
                <li key={p.key}>
                  <span className="swatch" style={{ background: p.color }} />
                  <div style={{ minWidth: 0 }}>
                    <strong>{p.title}</strong> <span className="small muted">· {isMine ? "you" : p.claimedByName ?? "unclaimed"}{p.score != null ? ` · ${pct(p.score)}` : ""}</span>
                    <div className="small muted">{p.blurb}</div>
                    {r && <div className={`small ${r.score === 1 ? "good" : "bad"}`}>{r.earned}/{r.total} checks pass{r.score === 1 ? ". Done." : ". Cells marked red need work."}</div>}
                  </div>
                  {live && (
                    <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                      {isMine
                        ? <button type="button" className="btn quiet small" disabled={busy} onClick={() => run(() => releasePartAction(snap.id, p.key))}>Release</button>
                        : p.claim.ok
                          ? <button type="button" className="btn small" disabled={busy} onClick={() => run(() => claimPartAction(snap.id, p.key))}>{p.claim.takeover ? "Take over" : "Claim"}</button>
                          : !p.claimedById && <span className="small muted" title={p.claim.reason}>{myClaims ? "Left for a teammate" : ""}</span>}
                      {p.checkable && <button type="button" className="btn ghost small" disabled={busy} onClick={() => start(async () => { const r = await checkPartAction(snap.id, p.key); if (r) setChecks((c) => ({ ...c, [p.key]: r })); })}>Check</button>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Team</h3><span className="small muted">{snap.members.length}/{snap.parts.length}</span></div>
          <ul className="tparts">
            {snap.members.map((m) => (
              <li key={m.userId}>
                <span className={`tick ${m.ready || snap.finalized ? "done" : ""}`}>{m.ready || snap.finalized ? "✓" : ""}</span>
                <div><Link href={`/u/${m.handle}`}>{m.name}</Link>{m.userId === me ? <span className="small muted"> (you)</span> : null}
                  <div className="small muted">{snap.parts.filter((p) => p.claimedById === m.userId).map((p) => p.title).join(", ") || "No part yet"}</div></div>
                <span />
              </li>
            ))}
          </ul>
          {live && (
            <div className="card stack-sm" style={{ borderTop: "1px solid var(--line)" }}>
              <div className="row">
                <button type="button" className={`btn ${meRow?.ready ? "ghost" : ""}`} disabled={busy} onClick={() => run(() => setReadyAction(snap.id, !meRow?.ready))}>
                  {meRow?.ready ? "Not done yet" : "I'm done"}
                </button>
                <CopyButton text={inviteUrl} label="Copy invite link" />
              </div>
              <p className="small muted">The team is scored when everyone has marked done, or automatically at <LocalTime iso={snap.deadline} />. Editing your cells takes back your &quot;done&quot;.</p>
              {myClaims === 0 && <button type="button" className="btn quiet small" disabled={busy} onClick={() => run(() => leaveTeamAction(snap.id))}>Leave team</button>}
            </div>
          )}
        </section>
      </div>

      {caseView ? (
        <CaseParts
          c={caseView} snap={snap} entries={entries} onEntries={onEntries} mine={mine} checks={checks} live={live}
          status={live ? (saved === "saving" ? "Saving…" : saved === "saved" ? "Saved. Teammates see it within seconds." : myClaims ? "You can answer the parts you hold." : "Claim a part to start.") : snap.finalized ? "This team has finished." : ""}
        />
      ) : inst && (
        <>
          <div className="row between">
            <div className="row">
              {snap.reveal && (
                <span className="seg" role="group" aria-label="Which model to show">
                  <button type="button" className={view === "team" ? "on" : ""} onClick={() => setView("team")}>Team model</button>
                  <button type="button" className={view === "answer" ? "on" : ""} onClick={() => setView("answer")}>Answer model</button>
                </span>
              )}
              <label className="check small"><input type="checkbox" checked={formulas} onChange={(e) => setFormulas(e.target.checked)} /> Show formulas</label>
            </div>
            <span className="small muted">
              {live ? (saved === "saving" ? "Saving…" : saved === "saved" ? "Saved. Teammates see it within seconds." : myClaims ? "You can edit the cells of your parts." : "Claim a part to start editing.") : snap.finalized ? "This team has finished." : ""}
            </span>
          </div>

          <Spreadsheet
            rows={inst.rows} cols={inst.cols} widths={inst.widths} cells={inst.cells}
            entries={showingAnswer ? snap.reveal!.answer : entries}
            onEntries={onEntries}
            readOnly={!live || !!showingAnswer}
            canEdit={mine}
            owners={showingAnswer ? undefined : owners}
            marks={showingAnswer ? undefined : marks}
            showFormulas={formulas}
          />

          {snap.reveal && (
            <div className="solution">
              <span className="eyebrow">How the model works</span>
              {snap.reveal.solution.map((line, i) => <p key={i}><ModelText text={line} /></p>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A case worked as a team: each part answered by whoever holds it, with answers and solutions once the team finishes. */
function CaseParts({ c, snap, entries, onEntries, mine, checks, live, status }: {
  c: PublicCase; snap: TeamSnapshot; entries: Raw; onEntries: (next: Raw) => void; mine: (a: string) => boolean;
  checks: Record<string, GradeReport>; live: boolean; status: string;
}) {
  const set = (a: string, v: string) => { const next = { ...entries }; if (v.trim()) next[a] = v; else delete next[a]; onEntries(next); };
  return (
    <section className="panel case-parts">
      <div className="panel-head"><h3>Answers</h3><span className="small muted">{status}</span></div>
      <ol className="parts">
        {c.parts.map((p, i) => <CasePartView key={p.key} p={p} n={i + 1} snap={snap} entries={entries} onEntries={onEntries} set={set} mine={mine} check={checks[p.key]} live={live} />)}
      </ol>
      <div className="card small muted" style={{ borderTop: "1px solid var(--line)" }}>
        Number and multiple-choice answers are marked once, when the team finishes, so nobody can guess their way through. Model parts can be checked as you go.
      </div>
    </section>
  );
}

function CasePartView({ p, n, snap, entries, onEntries, set, mine, check, live }: {
  p: PublicPart; n: number; snap: TeamSnapshot; entries: Raw; onEntries: (next: Raw) => void; set: (a: string, v: string) => void;
  mine: (a: string) => boolean; check?: GradeReport; live: boolean;
}) {
  const sp = snap.parts.find((x) => x.key === p.key)!;
  const res = snap.result?.parts.find((x) => x.key === p.key);
  const reveal = snap.caseReveals?.[p.key];
  const ans = `${p.key}:ans`;
  const editable = live && mine(p.kind === "model" ? `${p.key}!A1` : ans);
  const owner = sp.claimedById === snap.me.userId ? "you" : sp.claimedByName ?? "unclaimed";
  const prefix = `${p.key}!`;
  const sub = useMemo(() => Object.fromEntries(Object.entries(entries).filter(([a]) => a.startsWith(prefix)).map(([a, v]) => [a.slice(prefix.length), v])), [entries, prefix]);
  const marks = useMemo(() => {
    if (!check) return undefined;
    const m: Record<string, Mark> = {};
    for (const x of check.cells) m[x.cell] = { ok: x.status === "ok", note: note(x) };
    return m;
  }, [check]);

  return (
    <li className="part" style={{ boxShadow: `inset 3px 0 0 ${sp.color}` }}>
      <div className="part-head">
        <span className={`part-n ${res ? (res.score === 1 ? "ok" : "") : ""}`}>{n}</span>
        <span className="t">{p.title}</span>
        <span className="small muted">{owner}{res ? ` · ${pct(res.score)}` : ""}</span>
        <span className="small muted num">{p.points} pts</span>
      </div>
      <div className="part-body">
        {p.prompt.map((t, i) => <p key={i}><ModelText text={t} /></p>)}
        {p.kind === "numeric" && (
          <div className="row">
            <input value={entries[ans] ?? ""} onChange={(e) => set(ans, e.target.value)} disabled={!editable} inputMode="decimal" autoComplete="off" placeholder={editable ? "Your answer" : "Held by a teammate"} aria-label={`Answer to ${p.title}`} />
            <span className="small muted">{p.unit}</span>
          </div>
        )}
        {p.kind === "choice" && (
          <div className="options" role="radiogroup" aria-label={p.title}>
            {p.options.map((o, i) => (
              <label key={i} className={`option ${reveal?.kind === "choice" && reveal.correct === i ? "right" : ""}`}>
                <input type="radio" name={`team-opt-${p.key}`} disabled={!editable} checked={entries[ans] === String(i)} onChange={() => set(ans, String(i))} />
                <span><ModelText text={o} /></span>
              </label>
            ))}
          </div>
        )}
        {p.kind === "model" && (
          <>
            <Spreadsheet
              rows={p.model.rows} cols={p.model.cols} widths={p.model.widths} cells={p.model.cells}
              entries={reveal?.kind === "model" ? reveal.answer : sub}
              onEntries={(next) => {
                const all = Object.fromEntries(Object.entries(entries).filter(([a]) => !a.startsWith(prefix)));
                for (const [a, v] of Object.entries(next)) all[prefix + a] = v;
                onEntries(all);
              }}
              readOnly={!editable || !!reveal}
              canEdit={(a) => mine(prefix + a)}
              marks={reveal ? undefined : marks}
            />
            {check && <p className={`small ${check.score === 1 ? "good" : "bad"}`}>{check.earned}/{check.total} checks pass{check.score === 1 ? "." : ". Cells marked red need work."}</p>}
            {reveal?.kind === "model" && <p className="small muted">Showing the answer model.</p>}
          </>
        )}
        {reveal && (
          <div className="solution">
            {reveal.kind === "numeric" && <p className="answer-line">Answer: <strong className="num">{reveal.answer.toLocaleString("en-US", { maximumFractionDigits: 4 })}</strong> {reveal.unit}</p>}
            {reveal.kind === "model" && reveal.notes.map((t, i) => <p key={i}><ModelText text={t} /></p>)}
            <SolutionView s={reveal.solution} />
          </div>
        )}
      </div>
    </li>
  );
}
