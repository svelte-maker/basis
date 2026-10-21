"use client";
import { runLbo } from "@/lib/finance/lbo";
import { useInputs, Field, Kpi, f, Err, attempt } from "@/components/tool";

export default function Lbo() {
  const { vals, n, p, set } = useInputs({
    ebitda: "100", entry: "10", lev: "5.5", fees: "2", years: "5", growth: "6", da: "15", capex: "12", nwc: "10",
    rate: "8.5", amort: "5", sweep: "75", tax: "25", exit: "10",
  });
  const { value: r, error } = attempt(() => runLbo({
    entryEbitda: n("ebitda"), entryMultiple: n("entry"), leverageMultiple: n("lev"), feesPct: p("fees"), years: Math.max(1, Math.min(10, Math.round(n("years")))),
    ebitdaGrowth: p("growth"), daPctEbitda: p("da"), capexPctEbitda: p("capex"), nwcPctEbitda: p("nwc"), interestRate: p("rate"),
    mandatoryAmortPct: p("amort"), cashSweepPct: p("sweep"), taxRate: p("tax"), exitMultiple: n("exit"),
  }));
  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <div className="pair"><Field id="ebitda" label="Entry EBITDA" suffix="$m" value={vals.ebitda} onChange={set("ebitda")} /><Field id="entry" label="Entry multiple" suffix="x" value={vals.entry} onChange={set("entry")} /></div>
        <div className="pair"><Field id="lev" label="Debt" suffix="x EBITDA" value={vals.lev} onChange={set("lev")} /><Field id="fees" label="Fees" suffix="% EV" value={vals.fees} onChange={set("fees")} /></div>
        <div className="pair"><Field id="years" label="Hold" suffix="years" value={vals.years} onChange={set("years")} /><Field id="growth" label="EBITDA growth" suffix="%" value={vals.growth} onChange={set("growth")} /></div>
        <div className="pair"><Field id="da" label="D&A" suffix="% EBITDA" value={vals.da} onChange={set("da")} /><Field id="capex" label="Capex" suffix="% EBITDA" value={vals.capex} onChange={set("capex")} /></div>
        <div className="pair"><Field id="nwc" label="NWC" suffix="% EBITDA" value={vals.nwc} onChange={set("nwc")} /><Field id="tax" label="Tax rate" suffix="%" value={vals.tax} onChange={set("tax")} /></div>
        <div className="pair"><Field id="rate" label="Interest rate" suffix="%" value={vals.rate} onChange={set("rate")} /><Field id="amort" label="Mandatory amort." suffix="%/yr" value={vals.amort} onChange={set("amort")} /></div>
        <div className="pair"><Field id="sweep" label="Cash sweep" suffix="% excess" value={vals.sweep} onChange={set("sweep")} /><Field id="exit" label="Exit multiple" suffix="x" value={vals.exit} onChange={set("exit")} /></div>
        <p className="small muted">Interest is charged on opening debt each year, so there is no circular reference.</p>
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <Err msg={error} />
        {r && <>
          <div className="kpis">
            <Kpi label="IRR" value={f.pct(r.irr, 1)} />
            <Kpi label="MOIC" value={f.x(r.moic)} />
            <Kpi label="Entry equity" value={f.money(r.entryEquity, 1) + "m"} />
            <Kpi label="Exit equity" value={f.money(r.exitEquity, 1) + "m"} />
            <Kpi label="Equity share at entry" value={f.pct(r.entryEquity / (r.entryEV + r.fees), 0)} />
            <Kpi label="Exit net leverage" value={f.x((r.exitDebt - r.exitCash) / r.schedule.at(-1)!.ebitda, 1)} />
          </div>
          <div className="panel table-box" style={{ padding: 12 }}>
            <table className="mini"><thead><tr><th>$m</th>{r.schedule.map((y) => <th key={y.year}>Y{y.year}</th>)}</tr></thead><tbody>
              {([["EBITDA", "ebitda"], ["Interest", "interest"], ["Tax", "tax"], ["Net income", "netIncome"], ["Free cash flow", "fcf"], ["Mandatory repayment", "mandatory"], ["Cash sweep", "sweep"], ["Debt, year end", "debtEnd"], ["Cash, year end", "cashEnd"]] as const).map(([l, k]) => (
                <tr key={k}><td>{l}</td>{r.schedule.map((y) => <td key={y.year}>{f.num(y[k], 1)}</td>)}</tr>
              ))}
            </tbody></table>
          </div>
          <div className="panel card">
            <h3>Where the return came from</h3>
            <table className="mini"><tbody>
              <tr><td>EBITDA growth</td><td>{f.money(r.attribution.ebitdaGrowth, 1)}m</td></tr>
              <tr><td>Multiple expansion</td><td>{f.money(r.attribution.multipleExpansion, 1)}m</td></tr>
              <tr><td>Debt paydown and cash build</td><td>{f.money(r.attribution.debtPaydownAndCash, 1)}m</td></tr>
              <tr><td>Fees</td><td>{f.money(r.attribution.fees, 1)}m</td></tr>
              <tr><th>Equity gain</th><th>{f.money(r.exitEquity - r.entryEquity, 1)}m</th></tr>
            </tbody></table>
          </div>
        </>}
      </div>
    </div>
  );
}
