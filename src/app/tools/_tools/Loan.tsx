"use client";
import { useState } from "react";
import { amortizationSchedule, pmt } from "@/lib/finance/tvm";
import { useInputs, Field, Kpi, f, Err } from "@/components/tool";

export default function Loan() {
  const { vals, n, p, set } = useInputs({ principal: "300000", rate: "6.5", years: "25", extra: "0" });
  const [view, setView] = useState<"annual" | "monthly">("annual");
  const ok = n("principal") > 0 && n("years") > 0 && n("years") <= 50 && p("rate") >= 0;
  if (!ok) return <div className="tool-grid"><Inputs vals={vals} set={set} /><Err msg="Enter a positive amount and a term of up to 50 years." /></div>;
  const rows = amortizationSchedule(n("principal"), p("rate"), n("years"), 12, Math.max(0, n("extra") || 0));
  const base = amortizationSchedule(n("principal"), p("rate"), n("years"), 12, 0);
  const interest = rows.reduce((s, r) => s + r.interest, 0);
  const baseInterest = base.reduce((s, r) => s + r.interest, 0);
  const annual = Array.from({ length: Math.ceil(rows.length / 12) }, (_, y) => {
    const ys = rows.slice(y * 12, y * 12 + 12);
    return { year: y + 1, interest: ys.reduce((s, r) => s + r.interest, 0), principal: ys.reduce((s, r) => s + r.principal, 0), balance: ys.at(-1)!.balance };
  });
  return (
    <div className="tool-grid">
      <Inputs vals={vals} set={set} />
      <div className="stack" style={{ minWidth: 0 }}>
        <div className="kpis">
          <Kpi label="Monthly payment" value={f.money(pmt(p("rate") / 12, n("years") * 12, n("principal")), 2)} />
          <Kpi label="Total interest" value={f.money(interest)} />
          <Kpi label="Paid off in" value={`${Math.floor(rows.length / 12)}y ${rows.length % 12}m`} />
          {n("extra") > 0 && <Kpi label="Interest saved by extra payments" value={f.money(baseInterest - interest)} />}
        </div>
        <div className="row"><button className={`chip ${view === "annual" ? "on" : ""}`} onClick={() => setView("annual")}>By year</button><button className={`chip ${view === "monthly" ? "on" : ""}`} onClick={() => setView("monthly")}>By month</button></div>
        <div className="panel table-box" style={{ padding: 12, maxHeight: 520, overflowY: "auto" }}>
          <table className="mini"><thead><tr><th>{view === "annual" ? "Year" : "Month"}</th><th>Interest</th><th>Principal</th><th>Balance</th></tr></thead><tbody>
            {(view === "annual" ? annual.map((a) => ({ k: a.year, ...a })) : rows.map((r) => ({ k: r.period, ...r }))).map((r) => <tr key={r.k}><td>{r.k}</td><td>{f.num(r.interest, 2)}</td><td>{f.num(r.principal, 2)}</td><td>{f.num(r.balance, 2)}</td></tr>)}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}

function Inputs({ vals, set }: { vals: Record<string, string>; set: (k: "principal" | "rate" | "years" | "extra") => (v: string) => void }) {
  return (
    <div className="panel inputs">
      <Field id="pr" label="Loan amount" suffix="$" value={vals.principal} onChange={set("principal")} />
      <div className="pair"><Field id="rt" label="Annual rate" suffix="%" value={vals.rate} onChange={set("rate")} /><Field id="yr" label="Term" suffix="years" value={vals.years} onChange={set("years")} /></div>
      <Field id="ex" label="Extra payment each month" suffix="$" value={vals.extra} onChange={set("extra")} />
    </div>
  );
}
