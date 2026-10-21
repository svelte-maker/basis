"use client";
import { computeRatios, dupont, type Statements } from "@/lib/finance/ratios";
import { useInputs, Field, f } from "@/components/tool";

const FIELDS: [keyof Statements, string][] = [
  ["revenue", "Revenue"], ["cogs", "Cost of goods sold"], ["opex", "Operating expenses (ex D&A)"], ["da", "D&A"], ["interestExpense", "Interest expense"], ["taxExpense", "Tax expense"], ["netIncome", "Net income"],
  ["cash", "Cash"], ["receivables", "Receivables"], ["inventory", "Inventory"], ["currentAssets", "Current assets"], ["totalAssets", "Total assets"],
  ["payables", "Payables"], ["currentLiabilities", "Current liabilities"], ["totalDebt", "Total debt"], ["totalEquity", "Shareholders' equity"], ["retainedEarnings", "Retained earnings"],
  ["cfo", "Cash from operations"], ["capex", "Capital expenditure"], ["sharePrice", "Share price"], ["sharesOutstanding", "Shares outstanding"],
];

export default function Ratios() {
  const { vals, n, set } = useInputs({
    revenue: "5000", cogs: "3000", opex: "1100", da: "200", interestExpense: "90", taxExpense: "150", netIncome: "460",
    cash: "400", receivables: "650", inventory: "520", currentAssets: "1800", totalAssets: "5200", payables: "380", currentLiabilities: "1000",
    totalDebt: "1500", totalEquity: "2600", retainedEarnings: "1700", cfo: "720", capex: "260", sharePrice: "45", sharesOutstanding: "150",
  });
  const s = Object.fromEntries(FIELDS.map(([k]) => [k, n(k)])) as Statements;
  const groups = computeRatios(s);
  const d = dupont(s);
  const show = (v: number, u: string) => (u === "%" ? f.pct(v, 1) : u === "x" ? f.x(v) : u === "days" ? `${f.num(v, 1)} d` : f.money(v, 0));
  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <span className="small muted">All in the same unit (e.g. $m); share price in $.</span>
        {FIELDS.map(([k, l]) => <Field key={k} id={k} label={l} value={vals[k]} onChange={set(k)} />)}
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <div className="panel card">
          <h3>DuPont: why ROE is what it is</h3>
          <p className="num">{f.pct(d.netMargin, 1)} margin × {f.x(d.assetTurnover)} turnover × {f.x(d.equityMultiplier)} leverage = <strong>{f.pct(d.roe, 1)} ROE</strong></p>
        </div>
        <div className="grid-auto">
          {groups.map((g) => (
            <div key={g.group} className="panel card">
              <h3>{g.group}</h3>
              <table className="mini"><tbody>{g.items.map((i) => <tr key={i.name} title={i.formula}><td>{i.name}</td><td>{show(i.value, i.unit)}</td></tr>)}</tbody></table>
            </div>
          ))}
        </div>
        <p className="small muted">Hover a ratio to see its formula.</p>
      </div>
    </div>
  );
}
