"use client";
import { useState } from "react";
import { multiples, summarize, impliedPerShare, type Comp } from "@/lib/finance/comps";
import { useInputs, Field, f, Err, attempt } from "@/components/tool";

const START: Comp[] = [
  { name: "Peer A", ev: 12400, marketCap: 10100, revenue: 5200, ebitda: 1150, netIncome: 610 },
  { name: "Peer B", ev: 8800, marketCap: 7600, revenue: 4100, ebitda: 820, netIncome: 450 },
  { name: "Peer C", ev: 21500, marketCap: 18900, revenue: 7900, ebitda: 1900, netIncome: 1020 },
  { name: "Peer D", ev: 5300, marketCap: 4100, revenue: 2600, ebitda: 470, netIncome: 190 },
  { name: "Peer E", ev: 9900, marketCap: 8200, revenue: 3800, ebitda: 900, netIncome: -40 },
];
const COLS: (keyof Comp)[] = ["name", "ev", "marketCap", "revenue", "ebitda", "netIncome"];
const LABELS: Record<keyof Comp, string> = { name: "Company", ev: "EV", marketCap: "Market cap", revenue: "Revenue", ebitda: "EBITDA", netIncome: "Net income" };

export default function Comps() {
  const [rows, setRows] = useState(START.map((c) => Object.fromEntries(COLS.map((k) => [k, String(c[k])]))));
  const { vals, n, set } = useInputs({ revenue: "3000", ebitda: "620", ni: "300", netDebt: "900", shares: "120" });
  const comps: Comp[] = rows.map((r) => ({ name: r.name, ev: +r.ev, marketCap: +r.marketCap, revenue: +r.revenue, ebitda: +r.ebitda, netIncome: +r.netIncome }));
  const { value: st, error } = attempt(() => { const s = summarize(comps.filter((c) => c.name)); if (!isFinite(s.evEbitda.median)) throw new Error("Enter at least one comparable with positive EBITDA."); return s; });
  const imp = st ? impliedPerShare({ revenue: n("revenue"), ebitda: n("ebitda"), netIncome: n("ni"), netDebt: n("netDebt"), shares: n("shares") }, st) : null;
  const ML: [keyof ReturnType<typeof multiples>, string][] = [["evRevenue", "EV / Revenue"], ["evEbitda", "EV / EBITDA"], ["pe", "P / E"]];
  return (
    <div className="stack">
      <div className="panel table-box" style={{ padding: 12 }}>
        <table className="mini"><thead><tr>{COLS.map((k) => <th key={k}>{LABELS[k]}{k !== "name" && " ($m)"}</th>)}{ML.map(([, l]) => <th key={l}>{l}</th>)}<th></th></tr></thead><tbody>
          {rows.map((r, i) => { const m = multiples(comps[i]); return (
            <tr key={i}>{COLS.map((k) => <td key={k}><input aria-label={`${LABELS[k]} row ${i + 1}`} value={r[k]} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} style={{ width: k === "name" ? 110 : 80, padding: "4px 6px", textAlign: k === "name" ? "left" : "right" }} /></td>)}
              {ML.map(([k]) => <td key={k}>{f.x(m[k], 1)}</td>)}
              <td><button className="btn quiet small" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove row ${i + 1}`}>✕</button></td></tr>); })}
        </tbody></table>
        <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => setRows([...rows, { name: `Peer ${String.fromCharCode(65 + rows.length)}`, ev: "", marketCap: "", revenue: "", ebitda: "", netIncome: "" }])}>Add comparable</button>
        <p className="small muted" style={{ marginTop: 6 }}>Multiples are skipped when the denominator is zero or negative, which is why loss-makers drop out of P/E.</p>
      </div>
      <Err msg={error} />
      <div className="tool-grid">
        <div className="panel inputs">
          <strong>Your target ($m)</strong>
          <div className="pair"><Field id="tr" label="Revenue" value={vals.revenue} onChange={set("revenue")} /><Field id="te" label="EBITDA" value={vals.ebitda} onChange={set("ebitda")} /></div>
          <div className="pair"><Field id="tn" label="Net income" value={vals.ni} onChange={set("ni")} /><Field id="td" label="Net debt" value={vals.netDebt} onChange={set("netDebt")} /></div>
          <Field id="ts" label="Diluted shares" suffix="m" value={vals.shares} onChange={set("shares")} />
        </div>
        {st && imp && (
          <div className="panel table-box" style={{ padding: 12 }}>
            <table className="mini"><thead><tr><th>Multiple</th><th>Low</th><th>25th</th><th>Median</th><th>Mean</th><th>75th</th><th>High</th><th>Implied price (25th–75th)</th></tr></thead><tbody>
              {ML.map(([k, l]) => <tr key={k}><td>{l}</td>{(["low", "q1", "median", "mean", "q3", "high"] as const).map((s) => <td key={s}>{f.x(st[k][s], 1)}</td>)}<td><strong>{f.money(imp[k][0], 2)} – {f.money(imp[k][2], 2)}</strong> (mid {f.money(imp[k][1], 2)})</td></tr>)}
            </tbody></table>
            <p className="small muted" style={{ marginTop: 8 }}>EV multiples: (multiple × metric − net debt) / shares. P/E: multiple × net income / shares. This range is the bar on a football-field chart.</p>
          </div>
        )}
      </div>
    </div>
  );
}
