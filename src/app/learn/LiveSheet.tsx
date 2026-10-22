"use client";
import { useMemo, useState } from "react";
import { evaluateSheet, isError, type Raw } from "@/lib/sheets";
import type { CellSpec } from "@/lib/models/types";
import type { LessonBlock } from "@/lib/learn";
import { Spreadsheet, type Mark } from "../models/Spreadsheet";
import { RichText } from "@/components/RichText";

type SheetBlock = Extract<LessonBlock, { kind: "sheet" }>;

const close = (a: unknown, b: unknown) =>
  typeof a === "number" && typeof b === "number" ? Math.abs(a - b) <= Math.max(1e-6, 1e-4 * Math.abs(b)) : a === b;

/**
 * An editable sheet inside a lesson. "Worked" shows the reference formulas; "Try it yourself" clears
 * them and marks each cell against what the reference gives on the reader's current inputs.
 */
export function LiveSheet({ block: b }: { block: SheetBlock }) {
  const [mode, setMode] = useState<"worked" | "try">("worked");
  const [entries, setEntries] = useState<Raw>(() => ({ ...b.inputs, ...b.formulas }));
  const [showFormulas, setShowFormulas] = useState(false);

  const cells = useMemo(() => {
    const c: Record<string, CellSpec> = {};
    for (const [a, v] of Object.entries(b.labels)) c[a] = { v, kind: b.heads?.includes(a) ? "head" : "label" };
    for (const a of Object.keys(b.inputs)) c[a] = { v: "", kind: "input", fmt: b.fmt?.[a] };
    for (const a of Object.keys(b.formulas)) c[a] = { v: "", kind: "calc", fmt: b.fmt?.[a] };
    return c;
  }, [b]);

  const marks = useMemo(() => {
    if (mode !== "try") return undefined;
    const inputsNow: Raw = {};
    for (const a of Object.keys(b.inputs)) inputsNow[a] = entries[a] ?? "";
    const ref = evaluateSheet({ ...inputsNow, ...b.formulas }, b.rows, b.cols).values;
    const mine = evaluateSheet(entries, b.rows, b.cols).values;
    const out: Record<string, Mark> = {};
    for (const a of Object.keys(b.formulas)) {
      const typed = (entries[a] ?? "").trim();
      if (!typed) continue;
      const ok = !isError(mine[a]) && close(mine[a], ref[a]) && typed.startsWith("=");
      out[a] = { ok, note: ok ? "Matches the reference." : typed.startsWith("=") ? "Doesn't match yet. Check your references." : "Use a formula, not a typed number." };
    }
    return out;
  }, [mode, entries, b]);

  const done = marks ? Object.values(marks).filter((m) => m.ok).length : 0;
  const total = Object.keys(b.formulas).length;

  function worked() { setMode("worked"); setEntries({ ...b.inputs, ...b.formulas }); }
  function tryIt() {
    setMode("try");
    const keep: Raw = {};
    for (const a of Object.keys(b.inputs)) keep[a] = entries[a] ?? b.inputs[a];
    setEntries(keep);
    setShowFormulas(false);
  }

  return (
    <figure className="live-sheet">
      <div className="bar">
        <strong>{b.title}</strong>
        <div className="row" style={{ gap: 8 }}>
          {mode === "worked" && <label className="check small"><input type="checkbox" checked={showFormulas} onChange={(e) => setShowFormulas(e.target.checked)} /> Show formulas</label>}
          <div className="seg" role="group" aria-label="Sheet mode">
            <button className={mode === "worked" ? "on" : ""} onClick={worked}>Worked</button>
            <button className={mode === "try" ? "on" : ""} onClick={tryIt}>Try it yourself</button>
          </div>
        </div>
      </div>
      <p className="small muted"><RichText text={mode === "worked" ? b.task : "The formulas are cleared. Rebuild each shaded cell with a formula; it turns green when it matches. Inputs stay editable."} /></p>
      <Spreadsheet rows={b.rows} cols={b.cols} widths={b.widths} cells={cells} entries={entries} onEntries={setEntries} marks={marks} showFormulas={showFormulas} editInputs />
      {mode === "try" && <div className="row between small"><span className="score">{done}/{total} cells correct</span>{done === total && <span style={{ color: "var(--good)" }}>All formulas rebuilt.</span>}<button className="btn quiet small" onClick={worked}>Show the worked version</button></div>}
    </figure>
  );
}
