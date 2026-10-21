"use client";
import { useState } from "react";
import { runDcf, dcfSensitivity, type DcfInput } from "@/lib/finance/dcf";
import { useInputs, Field, Kpi, f, Err, attempt } from "@/components/tool";

const YEARS = [1, 2, 3, 4, 5];

export default function Dcf() {
  const { vals, n, p, set } = useInputs({
    base: "1000", tax: "25", da: "4", capex: "5", nwc: "10", wacc: "9", tg: "2.5", exit: "10", netDebt: "200", shares: "50", price: "40",
  });
  const [growth, setGrowth] = useState(["10", "9", "8", "6", "5"]);
  const [margin, setMargin] = useState(["20", "20.5", "21", "21.5", "22"]);
  const [method, setMethod] = useState<"gordon" | "exit">("gordon");
  const [midYear, setMidYear] = useState(false);

  const input: DcfInput = {
    baseRevenue: n("base"), revenueGrowth: growth.map((g) => parseFloat(g) / 100), ebitMargin: margin.map((m) => parseFloat(m) / 100),
    taxRate: p("tax"), daPctRevenue: p("da"), capexPctRevenue: p("capex"), nwcPctRevenue: p("nwc"), wacc: p("wacc"),
    terminal: method === "gordon" ? { method, growth: p("tg") } : { method, evEbitda: n("exit") }, midYear, netDebt: n("netDebt"), dilutedShares: n("shares"),
  };
  const { value: r, error } = attempt(() => runDcf(input));
  const w = p("wacc"), t = method === "gordon" ? p("tg") : n("exit");
  const waccs = [-0.01, -0.005, 0, 0.005, 0.01].map((d) => w + d);
  const terms = method === "gordon" ? [-0.01, -0.005, 0, 0.005, 0.01].map((d) => t + d) : [-2, -1, 0, 1, 2].map((d) => t + d);
  const grid = r ? dcfSensitivity(input, waccs, terms) : [];
  const price = n("price");

  const editRow = (arr: string[], setArr: (a: string[]) => void, label: string) => (
    <tr><td>{label}</td>{arr.map((v, i) => <td key={i}><input aria-label={`${label} year ${i + 1}`} value={v} onChange={(e) => setArr(arr.map((x, j) => (j === i ? e.target.value : x)))} style={{ width: 64, padding: "4px 6px", textAlign: "right" }} /></td>)}</tr>
  );

  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <Field id="base" label="Last-year revenue" suffix="$m" value={vals.base} onChange={set("base")} />
        <div className="pair"><Field id="tax" label="Tax rate" suffix="%" value={vals.tax} onChange={set("tax")} /><Field id="wacc" label="WACC" suffix="%" value={vals.wacc} onChange={set("wacc")} /></div>
        <div className="pair"><Field id="da" label="D&A" suffix="% rev" value={vals.da} onChange={set("da")} /><Field id="capex" label="Capex" suffix="% rev" value={vals.capex} onChange={set("capex")} /></div>
        <Field id="nwc" label="Net working capital" suffix="% rev" value={vals.nwc} onChange={set("nwc")} />
        <label htmlFor="method"><span>Terminal value</span>
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value as "gordon" | "exit")}><option value="gordon">Perpetuity growth</option><option value="exit">Exit EV/EBITDA multiple</option></select></label>
        {method === "gordon" ? <Field id="tg" label="Terminal growth" suffix="%" value={vals.tg} onChange={set("tg")} /> : <Field id="exit" label="Exit multiple" suffix="x" value={vals.exit} onChange={set("exit")} />}
        <label className="check" style={{ display: "flex" }}><input type="checkbox" checked={midYear} onChange={(e) => setMidYear(e.target.checked)} /> Mid-year convention</label>
        <div className="pair"><Field id="nd" label="Net debt" suffix="$m" value={vals.netDebt} onChange={set("netDebt")} /><Field id="sh" label="Diluted shares" suffix="m" value={vals.shares} onChange={set("shares")} /></div>
        <Field id="px" label="Current share price" suffix="$" value={vals.price} onChange={set("price")} />
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <div className="panel table-box" style={{ padding: 12 }}>
          <table className="mini"><thead><tr><th>Forecast (%)</th>{YEARS.map((y) => <th key={y}>Y{y}</th>)}</tr></thead>
            <tbody>{editRow(growth, setGrowth, "Revenue growth")}{editRow(margin, setMargin, "EBIT margin")}</tbody></table>
        </div>
        <Err msg={error} />
        {r && <>
          <div className="kpis">
            <Kpi label="Enterprise value" value={f.money(r.enterpriseValue, 0) + "m"} />
            <Kpi label="Equity value" value={f.money(r.equityValue, 0) + "m"} />
            <Kpi label="Value per share" value={f.money(r.perShare, 2)} />
            <Kpi label="Upside vs price" value={isFinite(price) && price > 0 ? f.pct(r.perShare / price - 1, 1) : "—"} />
            <Kpi label="Terminal value share of EV" value={f.pct(r.terminalShare, 0)} />
            <Kpi label={method === "gordon" ? "Implied exit EV/EBITDA" : "Implied perpetual growth"} value={method === "gordon" ? f.x(r.impliedExitMultiple, 1) : f.pct(r.impliedPerpetualGrowth)} />
          </div>
          <div className="panel table-box" style={{ padding: 12 }}>
            <table className="mini"><thead><tr><th>$m</th>{r.years.map((y) => <th key={y.year}>Y{y.year}</th>)}</tr></thead><tbody>
              {([["Revenue", "revenue"], ["EBIT", "ebit"], ["NOPAT", "nopat"], ["+ D&A", "da"], ["− Capex", "capex"], ["− Δ NWC", "changeNwc"], ["Free cash flow", "fcf"], ["Discount factor", "discountFactor"], ["PV of FCF", "pv"]] as const).map(([l, k]) => (
                <tr key={k}><td>{l}</td>{r.years.map((y) => <td key={y.year}>{k === "discountFactor" ? y[k].toFixed(4) : f.num(y[k], 1)}</td>)}</tr>
              ))}
            </tbody></table>
            <p className="small muted" style={{ marginTop: 8 }}>PV of forecast FCF {f.money(r.sumPv, 1)}m + PV of terminal value {f.money(r.pvTerminal, 1)}m (terminal value {f.money(r.terminalValue, 1)}m) − net debt = equity.</p>
          </div>
          <div className="panel table-box" style={{ padding: 12 }}>
            <p className="small" style={{ marginBottom: 8 }}><strong>Value per share</strong>: WACC down, {method === "gordon" ? "terminal growth" : "exit multiple"} across</p>
            <table className="mini heat"><thead><tr><th>WACC</th>{terms.map((tt, j) => <th key={j}>{method === "gordon" ? f.pct(tt, 1) : f.x(tt, 1)}</th>)}</tr></thead><tbody>
              {grid.map((row, i) => <tr key={i}><td>{f.pct(waccs[i], 1)}</td>{row.map((v, j) => <td key={j} className={i === 2 && j === 2 ? "hl" : ""}>{f.money(v, 2)}</td>)}</tr>)}
            </tbody></table>
          </div>
        </>}
      </div>
    </div>
  );
}
