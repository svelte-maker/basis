"use client";
import { useState } from "react";
import { binomial, blackScholes, impliedVol } from "@/lib/finance/options";
import { useInputs, Field, Kpi, f, Err, attempt } from "@/components/tool";

export default function Options() {
  const { vals, n, p, set } = useInputs({ s: "100", k: "100", t: "1", r: "5", v: "20", q: "0", mkt: "" });
  const [type, setType] = useState<"call" | "put">("call");
  const { value: r, error } = attempt(() => {
    const i = { spot: n("s"), strike: n("k"), t: n("t"), rate: p("r"), vol: p("v"), dividendYield: p("q") };
    if (!(i.spot > 0 && i.strike > 0 && i.t >= 0 && i.vol >= 0)) throw new Error("Spot and strike must be positive; time and volatility can't be negative.");
    const g = blackScholes(i, type);
    const amer = binomial(i, type, 300, true);
    const mkt = n("mkt");
    const iv = isFinite(mkt) && mkt > 0 ? impliedVol(i, type, mkt) : NaN;
    return { g, amer, iv, intrinsic: type === "call" ? Math.max(0, i.spot - i.strike) : Math.max(0, i.strike - i.spot) };
  });
  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <label htmlFor="type"><span>Option</span><select id="type" value={type} onChange={(e) => setType(e.target.value as "call" | "put")}><option value="call">Call</option><option value="put">Put</option></select></label>
        <div className="pair"><Field id="s" label="Spot" suffix="$" value={vals.s} onChange={set("s")} /><Field id="k" label="Strike" suffix="$" value={vals.k} onChange={set("k")} /></div>
        <div className="pair"><Field id="t" label="Time to expiry" suffix="years" value={vals.t} onChange={set("t")} /><Field id="v" label="Volatility" suffix="%" value={vals.v} onChange={set("v")} /></div>
        <div className="pair"><Field id="r" label="Risk-free rate" suffix="% cont." value={vals.r} onChange={set("r")} /><Field id="q" label="Dividend yield" suffix="%" value={vals.q} onChange={set("q")} /></div>
        <Field id="mkt" label="Market price, for implied vol" suffix="$, optional" value={vals.mkt} onChange={set("mkt")} />
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <Err msg={error} />
        {r && <>
          <div className="kpis">
            <Kpi label="Black-Scholes (European)" value={f.money(r.g.price, 4)} />
            <Kpi label="Binomial, American (300 steps)" value={f.money(r.amer, 4)} />
            <Kpi label="Early-exercise premium" value={f.money(r.amer - r.g.price, 4)} />
            <Kpi label="Intrinsic value" value={f.money(r.intrinsic, 2)} />
            <Kpi label="Time value" value={f.money(r.g.price - r.intrinsic, 4)} />
            {isFinite(r.iv) && <Kpi label="Implied volatility" value={f.pct(r.iv, 2)} />}
          </div>
          <div className="panel table-box" style={{ padding: 12 }}>
            <table className="mini"><thead><tr><th>Greek</th><th>Value</th><th>Meaning</th></tr></thead><tbody>
              <tr><td>Delta</td><td>{r.g.delta.toFixed(4)}</td><td>Price change per $1 move in the stock</td></tr>
              <tr><td>Gamma</td><td>{r.g.gamma.toFixed(5)}</td><td>Change in delta per $1 move</td></tr>
              <tr><td>Vega</td><td>{r.g.vega.toFixed(4)}</td><td>Price change per 1 point of volatility</td></tr>
              <tr><td>Theta</td><td>{r.g.theta.toFixed(4)}</td><td>Price change per calendar day</td></tr>
              <tr><td>Rho</td><td>{r.g.rho.toFixed(4)}</td><td>Price change per 1 point of interest rate</td></tr>
            </tbody></table>
          </div>
        </>}
      </div>
    </div>
  );
}
