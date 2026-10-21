"use client";
import { capm, releverBeta, unleverBeta, wacc } from "@/lib/finance/corporate";
import { useInputs, Field, Kpi, f, Err, attempt } from "@/components/tool";

export default function Wacc() {
  const { vals, n, p, set } = useInputs({ rf: "4.2", mrp: "5.5", compBeta: "1.2", compDE: "40", targetDE: "60", size: "0", rd: "6.5", tax: "25", });
  const { value: r, error } = attempt(() => {
    const bu = unleverBeta(n("compBeta"), p("compDE"), p("tax"));
    const bl = releverBeta(bu, p("targetDE"), p("tax"));
    const re = capm(p("rf"), bl, p("mrp")) + p("size");
    const de = p("targetDE");
    const w = wacc({ equityValue: 1, debtValue: de, costOfEquity: re, preTaxCostOfDebt: p("rd"), taxRate: p("tax") });
    return { bu, bl, re, w, wd: de / (1 + de), rdAfter: p("rd") * (1 - p("tax")) };
  });
  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <div className="pair"><Field id="rf" label="Risk-free rate" suffix="%" value={vals.rf} onChange={set("rf")} /><Field id="mrp" label="Equity risk premium" suffix="%" value={vals.mrp} onChange={set("mrp")} /></div>
        <div className="pair"><Field id="cb" label="Peer levered beta" value={vals.compBeta} onChange={set("compBeta")} /><Field id="cde" label="Peer D/E" suffix="%" value={vals.compDE} onChange={set("compDE")} /></div>
        <div className="pair"><Field id="tde" label="Target D/E" suffix="%" value={vals.targetDE} onChange={set("targetDE")} /><Field id="size" label="Size/country premium" suffix="%" value={vals.size} onChange={set("size")} /></div>
        <div className="pair"><Field id="rd" label="Pre-tax cost of debt" suffix="%" value={vals.rd} onChange={set("rd")} /><Field id="tax" label="Tax rate" suffix="%" value={vals.tax} onChange={set("tax")} /></div>
        <p className="small muted">Tip: use the median of several peers&apos; betas, unlevered, rather than a single company.</p>
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <Err msg={error} />
        {r && <>
          <div className="kpis">
            <Kpi label="WACC" value={f.pct(r.w)} />
            <Kpi label="Cost of equity" value={f.pct(r.re)} />
            <Kpi label="After-tax cost of debt" value={f.pct(r.rdAfter)} />
            <Kpi label="Unlevered beta" value={r.bu.toFixed(3)} />
            <Kpi label="Relevered beta" value={r.bl.toFixed(3)} />
            <Kpi label="Debt weight" value={f.pct(r.wd, 1)} />
          </div>
          <div className="panel card small">
            <p>βu = βpeer / (1 + (1 − t) × D/Epeer) = {r.bu.toFixed(4)}</p>
            <p>βL = βu × (1 + (1 − t) × D/Etarget) = {r.bl.toFixed(4)}</p>
            <p>Re = rf + βL × ERP + premium = {f.pct(r.re, 3)}</p>
            <p>WACC = E/V × Re + D/V × Rd × (1 − t) = {f.pct(r.w, 3)}</p>
          </div>
        </>}
      </div>
    </div>
  );
}
