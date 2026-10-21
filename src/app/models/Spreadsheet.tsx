"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react";
import { addr, colName, evaluateSheet, formatValue, isError, parseAddr, shiftFormula, type Raw } from "@/lib/sheets";
import type { CellSpec } from "@/lib/models/types";

export type Mark = { ok: boolean; note: string };
type Pos = { r: number; c: number };
type Edit = { text: string; via: "cell" | "bar"; pointing?: { at: number; len: number; from: Pos } };

const ERROR_HELP: Record<string, string> = {
  "#DIV/0!": "Dividing by zero or by an empty cell.",
  "#VALUE!": "A value of the wrong type, such as text where a number is needed, or a multi-cell range where one cell is needed.",
  "#REF!": "A reference outside the sheet.",
  "#NAME?": "An unknown function or a formula that couldn't be read.",
  "#N/A": "A lookup didn't find a match.",
  "#NUM!": "No valid result, for example IRR on cash flows that never change sign.",
  "#CIRC!": "A circular reference: this cell depends on itself.",
};

export function Spreadsheet({
  rows, cols, widths, cells, entries, onEntries, marks, readOnly, showFormulas, focus,
}: {
  rows: number; cols: number; widths: number[]; cells: Record<string, CellSpec>;
  entries: Raw; onEntries: (next: Raw) => void;
  marks?: Record<string, Mark>; readOnly?: boolean; showFormulas?: boolean;
  /** Select this cell when it changes (from the checklist). */
  focus?: { cell: string; n: number };
}) {
  const [sel, setSel] = useState<Pos>({ r: 0, c: 1 });
  const [anchor, setAnchor] = useState<Pos>({ r: 0, c: 1 });
  const [edit, setEditState] = useState<Edit | null>(null);
  const editRef = useRef<Edit | null>(null);
  const setEdit = (e: Edit | null) => { editRef.current = e; setEditState(e); };
  const dragging = useRef(false);
  const clip = useRef<{ text: string; at: Pos; grid: string[][] } | null>(null);
  const undo = useRef<Raw[]>([]);
  const redo = useRef<Raw[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const cellInput = useRef<HTMLInputElement>(null);
  const barInput = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  const given = useMemo(() => {
    const g: Raw = {};
    for (const [a, s] of Object.entries(cells)) if (s.kind !== "calc" && s.v !== "") g[a] = s.v;
    return g;
  }, [cells]);
  const sheet = useMemo(() => evaluateSheet({ ...entries, ...given }, rows, cols), [entries, given, rows, cols]);

  useEffect(() => {
    if (!focus) return;
    const p = parseAddr(focus.cell);
    if (p) { setSel(p); setAnchor(p); root.current?.focus(); }
  }, [focus]);

  const a = addr(sel.r, sel.c);
  const editable = (p: Pos) => !readOnly && (!cells[addr(p.r, p.c)] || cells[addr(p.r, p.c)].kind === "calc");
  const rawAt = (p: Pos) => { const k = addr(p.r, p.c); return given[k] ?? entries[k] ?? ""; };
  const r1 = Math.min(sel.r, anchor.r), r2 = Math.max(sel.r, anchor.r), c1 = Math.min(sel.c, anchor.c), c2 = Math.max(sel.c, anchor.c);
  const inRange = (r: number, c: number) => r >= r1 && r <= r2 && c >= c1 && c <= c2;

  function commit(next: Raw) {
    undo.current.push(entries);
    if (undo.current.length > 200) undo.current.shift();
    redo.current = [];
    onEntries(next);
  }
  function setMany(changes: [string, string][]) {
    const next = { ...entries };
    let changed = false;
    for (const [k, v] of changes) {
      const p = parseAddr(k);
      if (!p || p.r >= rows || p.c >= cols || !editable(p)) continue;
      if (v.trim()) next[k] = v; else delete next[k];
      changed = true;
    }
    if (changed) commit(next);
  }

  function move(dr: number, dc: number, extend = false) {
    const p = { r: Math.max(0, Math.min(rows - 1, sel.r + dr)), c: Math.max(0, Math.min(cols - 1, sel.c + dc)) };
    setSel(p);
    if (!extend) setAnchor(p);
  }

  function startEdit(text: string, via: Edit["via"] = "cell") {
    if (!editable(sel)) return;
    setEdit({ text, via });
  }
  /** Save the edit in progress (once, even if a blur follows). */
  function closeEdit(save: boolean) {
    const e = editRef.current;
    if (!e) return;
    setEdit(null);
    if (save) setMany([[a, e.text]]);
  }
  function finishEdit(dr: number, dc: number) {
    if (!editRef.current) return;
    closeEdit(true);
    move(dr, dc);
    root.current?.focus();
  }

  function fill(direction: "right" | "down") {
    const changes: [string, string][] = [];
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      if (direction === "right" ? c === c1 : r === r1) continue;
      const src = direction === "right" ? { r, c: c1 } : { r: r1, c };
      changes.push([addr(r, c), shiftFormula(rawAt(src), r - src.r, c - src.c)]);
    }
    setMany(changes);
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (edit) return;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key;
    if (mod && (k === "z" || k === "Z") && !e.shiftKey) { e.preventDefault(); const prev = undo.current.pop(); if (prev) { redo.current.push(entries); onEntries(prev); } return; }
    if (mod && (k === "y" || ((k === "z" || k === "Z") && e.shiftKey))) { e.preventDefault(); const nx = redo.current.pop(); if (nx) { undo.current.push(entries); onEntries(nx); } return; }
    if (mod && (k === "r" || k === "R")) { e.preventDefault(); fill("right"); return; }
    if (mod && (k === "d" || k === "D")) { e.preventDefault(); fill("down"); return; }
    if (mod) return;
    switch (k) {
      case "ArrowUp": e.preventDefault(); move(-1, 0, e.shiftKey); return;
      case "ArrowDown": e.preventDefault(); move(1, 0, e.shiftKey); return;
      case "ArrowLeft": e.preventDefault(); move(0, -1, e.shiftKey); return;
      case "ArrowRight": e.preventDefault(); move(0, 1, e.shiftKey); return;
      case "Tab": e.preventDefault(); move(0, e.shiftKey ? -1 : 1); return;
      case "Enter": case "F2": e.preventDefault(); startEdit(rawAt(sel)); return;
      case "Delete": case "Backspace": {
        e.preventDefault();
        const changes: [string, string][] = [];
        for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) changes.push([addr(r, c), ""]);
        setMany(changes);
        return;
      }
    }
    if (k.length === 1 && !e.altKey) { e.preventDefault(); startEdit(k); }
  }

  function onCopy(e: ClipboardEvent<HTMLDivElement>) {
    if (edit) return;
    const grid: string[][] = [];
    for (let r = r1; r <= r2; r++) { const row: string[] = []; for (let c = c1; c <= c2; c++) row.push(rawAt({ r, c })); grid.push(row); }
    const text = grid.map((row) => row.join("\t")).join("\n");
    clip.current = { text, at: { r: r1, c: c1 }, grid };
    e.clipboardData.setData("text/plain", text);
    e.preventDefault();
  }

  function onPaste(e: ClipboardEvent<HTMLDivElement>) {
    if (edit) return;
    const text = e.clipboardData.getData("text/plain") || clip.current?.text || "";
    if (!text) return;
    e.preventDefault();
    const internal = clip.current && clip.current.text === text ? clip.current : null;
    const grid = internal ? internal.grid : text.replace(/\r/g, "").replace(/\n$/, "").split("\n").map((l) => l.split("\t"));
    const changes: [string, string][] = [];
    const single = grid.length === 1 && grid[0].length === 1;
    const h = single ? r2 - r1 + 1 : grid.length, w = single ? c2 - c1 + 1 : grid[0].length;
    for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
      const src = single ? grid[0][0] : grid[i][j];
      const r = r1 + i, c = c1 + j;
      if (r >= rows || c >= cols) continue;
      const from = internal ? { r: internal.at.r + (single ? 0 : i), c: internal.at.c + (single ? 0 : j) } : null;
      changes.push([addr(r, c), from ? shiftFormula(src, r - from.r, c - from.c) : src]);
    }
    setMany(changes);
  }

  /** While typing a formula, clicking a cell inserts its reference; dragging makes it a range. */
  function pointAt(p: Pos, extend: boolean) {
    if (!edit) return false;
    if (!edit.text.startsWith("=") || (p.r === sel.r && p.c === sel.c && !extend)) return false;
    const input = edit.via === "bar" ? barInput.current : cellInput.current;
    let { text } = edit;
    let at: number, len: number, from: Pos;
    if (extend && edit.pointing) {
      ({ at, len, from } = edit.pointing);
    } else {
      at = input?.selectionStart ?? text.length;
      len = (input?.selectionEnd ?? at) - at;
      from = p;
    }
    const ref = from.r === p.r && from.c === p.c ? addr(p.r, p.c)
      : `${addr(Math.min(from.r, p.r), Math.min(from.c, p.c))}:${addr(Math.max(from.r, p.r), Math.max(from.c, p.c))}`;
    text = text.slice(0, at) + ref + text.slice(at + len);
    setEdit({ ...edit, text, pointing: { at, len: ref.length, from } });
    caret.current = at + ref.length;
    return true;
  }

  // Put the caret after an inserted reference before the next keystroke arrives.
  useLayoutEffect(() => {
    if (caret.current === null || !edit) return;
    const input = edit.via === "bar" ? barInput.current : cellInput.current;
    input?.focus();
    input?.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [edit]);

  function editKeys(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); finishEdit(e.shiftKey ? -1 : 1, 0); }
    else if (e.key === "Tab") { e.preventDefault(); finishEdit(0, e.shiftKey ? -1 : 1); }
    else if (e.key === "Escape") { e.preventDefault(); closeEdit(false); root.current?.focus(); }
    else if (edit?.pointing) setEdit({ ...edit, pointing: undefined });
  }

  const v = sheet.values[a] ?? null;
  const problem = sheet.problems[a] ?? (isError(v) ? `${v.error} ${ERROR_HELP[v.error] ?? ""}` : "");
  const spec = cells[a];

  return (
    <div className="sheet-wrap">
      <div className="formula-bar">
        <span className="addr num">{r1 === r2 && c1 === c2 ? a : `${addr(r1, c1)}:${addr(r2, c2)}`}</span>
        <span className="fx">fx</span>
        <input
          ref={barInput}
          aria-label={`Contents of ${a}`}
          value={edit ? edit.text : rawAt(sel)}
          readOnly={!editable(sel)}
          onFocus={() => { if (!edit && editable(sel)) setEdit({ text: rawAt(sel), via: "bar" }); }}
          onChange={(e) => setEdit({ text: e.target.value, via: "bar" })}
          onKeyDown={editKeys}
          onBlur={() => { if (editRef.current?.via === "bar") closeEdit(true); }}
          spellCheck={false}
        />
      </div>
      <div className="sheet-status small">
        {problem ? <span className="bad">{problem}</span>
          : spec?.kind === "input" ? <span className="muted">Given input. The checker changes these to test that your model updates.</span>
          : spec && spec.kind !== "calc" ? <span className="muted">Locked.</span>
          : marks?.[a] ? <span className={marks[a].ok ? "good" : "bad"}>{marks[a].note}</span>
          : <span className="muted">{editable(sel) ? "Type a value or a formula starting with =. While typing a formula, click cells to reference them." : ""}</span>}
      </div>
      <div
        className="sheet-scroll"
        ref={root}
        tabIndex={0}
        role="grid"
        aria-label="Model spreadsheet"
        aria-rowcount={rows}
        aria-colcount={cols}
        onKeyDown={onKey}
        onCopy={onCopy}
        onPaste={onPaste}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
      >
        <table className="sheet">
          <colgroup><col style={{ width: 40 }} />{widths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
          <thead><tr><th />{Array.from({ length: cols }, (_, c) => <th key={c} className={c >= c1 && c <= c2 ? "hl" : ""}>{colName(c)}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <th className={r >= r1 && r <= r2 ? "hl" : ""}>{r + 1}</th>
                {Array.from({ length: cols }, (_, c) => {
                  const k = addr(r, c);
                  const s = cells[k];
                  const kind = s?.kind ?? "free";
                  const val = sheet.values[k] ?? null;
                  const raw = given[k] ?? entries[k] ?? "";
                  const isSel = r === sel.r && c === sel.c;
                  const editingHere = isSel && edit?.via === "cell";
                  const shown = showFormulas && raw.startsWith("=") ? raw : formatValue(val, s?.fmt);
                  const m = marks?.[k];
                  const cls = [`k-${kind}`, inRange(r, c) ? "in" : "", isSel ? "sel" : "", typeof val === "number" && !(showFormulas && raw.startsWith("=")) ? "n" : "", isError(val) ? "err" : "", m ? (m.ok ? "ok" : "bad") : ""].filter(Boolean).join(" ");
                  return (
                    <td
                      key={c}
                      className={cls}
                      role="gridcell"
                      aria-selected={isSel}
                      title={m?.note}
                      onMouseDown={(e) => {
                        if (pointAt({ r, c }, false)) { e.preventDefault(); dragging.current = true; return; }
                        closeEdit(true);
                        dragging.current = true;
                        const p = { r, c };
                        setSel(p);
                        if (!e.shiftKey) setAnchor(p);
                      }}
                      onMouseEnter={() => {
                        if (!dragging.current) return;
                        if (edit?.pointing) { pointAt({ r, c }, true); return; }
                        if (!edit) setSel({ r, c });
                      }}
                      onDoubleClick={() => startEdit(raw)}
                    >
                      {editingHere ? (
                        <input
                          ref={cellInput}
                          autoFocus
                          className="cell-input"
                          value={edit!.text}
                          onChange={(e) => setEdit({ text: e.target.value, via: "cell" })}
                          onKeyDown={editKeys}
                          onBlur={() => { if (editRef.current?.via === "cell") closeEdit(true); }}
                          spellCheck={false}
                          aria-label={`Edit ${k}`}
                        />
                      ) : shown}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
