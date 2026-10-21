"use client";
import type React from "react";
import { useState } from "react";
import { irr, mirr, npv, paybackPeriod } from "@/lib/finance/tvm";
import { useInputs, Field, Kpi, f } from "@/components/tool";

export default function Tvm() {
  const [flows, setFlows] = useState(["-1000", "250", "300", "350", "400", "300"]);
  const { vals, p, set } = useInputs({ rate: "10", fin: "8", re: "10" });
  const cf = flows.map((x) => parseFloat(x)).map((x) => (isFinite(x) ? x : 0));
  const r = p("rate");
  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <Field id="rate" label="Discount rate" suffix="%" value={vals.rate} onChange={set("rate")} />
        <div className="pair"><Field id="fin" label="MIRR finance rate" suffix="%" value={vals.fin} onChange={set("fin")} /><Field id="re" label="MIRR reinvest rate" suffix="%" value={vals.re} onChange={set("re")} /></div>
        <strong className="small">Cash flows (year 0 first)</strong>
        {flows.map((v, i) => (
          <div key={i} className="row" style={{ flexWrap: "nowrap" }}>
            <span className="num small muted" style={{ width: 34 }}>Y{i}</span>
            <input aria-label={`Cash flow year ${i}`} value={v} onChange={(e) => setFlows(flows.map((x, j) => (j === i ? e.target.value : x)))} />
            {flows.length > 2 && <button className="btn quiet small" aria-label={`Remove year ${i}`} onClick={() => setFlows(flows.filter((_, j) => j !== i))}>✕</button>}
          </div>
        ))}
        <button className="btn ghost small" onClick={() => setFlows([...flows, "0"])}>Add year</button>
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <div className="kpis">
          <Kpi label={`NPV at ${f.pct(r, 2)}`} value={f.money(npv(r, cf), 2)} />
          <Kpi label="IRR" value={f.pct(irr(cf))} />
          <Kpi label="MIRR" value={f.pct(mirr(cf, p("fin"), p("re")))} />
          <Kpi label="Payback" value={isFinite(paybackPeriod(cf)) ? `${paybackPeriod(cf).toFixed(2)} y` : "never"} />
          <Kpi label="Discounted payback" value={isFinite(paybackPeriod(cf, r)) ? `${paybackPeriod(cf, r).toFixed(2)} y` : "never"} />
          <Kpi label="Profitability index" value={cf[0] < 0 ? (1 + npv(r, cf) / -cf[0]).toFixed(3) : "—"} />
        </div>
        <div className="panel table-box" style={{ padding: 12 }}>
          <table className="mini"><thead><tr><th>Year</th><th>Cash flow</th><th>Discount factor</th><th>PV</th><th>Cumulative PV</th></tr></thead><tbody>
            {cf.reduce<{ rows: React.ReactElement[]; cum: number }>((acc, c, t) => {
              const df = 1 / Math.pow(1 + r, t); acc.cum += c * df;
              acc.rows.push(<tr key={t}><td>{t}</td><td>{f.num(c, 2)}</td><td>{df.toFixed(4)}</td><td>{f.num(c * df, 2)}</td><td>{f.num(acc.cum, 2)}</td></tr>);
              return acc;
            }, { rows: [], cum: 0 }).rows}
          </tbody></table>
          {!isFinite(irr(cf)) && <p className="small muted" style={{ marginTop: 8 }}>No IRR: the cash flows need at least one negative and one positive value.</p>}
        </div>
      </div>
    </div>
  );
}
