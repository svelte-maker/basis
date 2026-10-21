"use client";
import { useState } from "react";
import { bondPrice, bondYield, convexity, currentYield, macaulayDuration, modifiedDuration } from "@/lib/finance/fixedIncome";
import { useInputs, Field, Kpi, f, Err, attempt } from "@/components/tool";

export default function Bond() {
  const { vals, n, p, set } = useInputs({ face: "1000", coupon: "5", years: "10", ytm: "6", price: "950" });
  const [freq, setFreq] = useState(2);
  const [solve, setSolve] = useState<"price" | "yield">("price");
  const { value: r, error } = attempt(() => {
    const b = { face: n("face"), couponRate: p("coupon"), years: n("years"), freq };
    if (!(b.face > 0 && b.years > 0)) throw new Error("Face value and maturity must be positive.");
    const y = solve === "price" ? p("ytm") : bondYield(b, n("price"));
    const price = bondPrice(b, y);
    return { b, y, price, mac: macaulayDuration(b, y), mod: modifiedDuration(b, y), cx: convexity(b, y), cy: currentYield(b, price) };
  });
  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <label htmlFor="solve"><span>Solve for</span><select id="solve" value={solve} onChange={(e) => setSolve(e.target.value as "price" | "yield")}><option value="price">Price, from yield</option><option value="yield">Yield, from price</option></select></label>
        <div className="pair"><Field id="face" label="Face value" suffix="$" value={vals.face} onChange={set("face")} /><Field id="cpn" label="Coupon" suffix="%/yr" value={vals.coupon} onChange={set("coupon")} /></div>
        <div className="pair"><Field id="yrs" label="Maturity" suffix="years" value={vals.years} onChange={set("years")} />
          <label htmlFor="freq"><span>Coupons per year</span><select id="freq" value={freq} onChange={(e) => setFreq(+e.target.value)}><option value={1}>1</option><option value={2}>2</option><option value={4}>4</option><option value={12}>12</option></select></label></div>
        {solve === "price" ? <Field id="ytm" label="Yield to maturity" suffix="%" value={vals.ytm} onChange={set("ytm")} /> : <Field id="px" label="Price" suffix="$" value={vals.price} onChange={set("price")} />}
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <Err msg={error} />
        {r && <>
          <div className="kpis">
            <Kpi label="Price" value={f.money(r.price, 2)} />
            <Kpi label="Yield to maturity" value={f.pct(r.y, 3)} />
            <Kpi label="Current yield" value={f.pct(r.cy, 3)} />
            <Kpi label="Macaulay duration" value={`${r.mac.toFixed(3)} y`} />
            <Kpi label="Modified duration" value={r.mod.toFixed(3)} />
            <Kpi label="Convexity" value={r.cx.toFixed(2)} />
            <Kpi label="DV01 (per 1bp)" value={f.money(r.mod * r.price * 0.0001, 4)} />
          </div>
          <div className="panel table-box" style={{ padding: 12 }}>
            <table className="mini"><thead><tr><th>Yield shift</th><th>Yield</th><th>Exact price</th><th>Duration estimate</th><th>Duration + convexity</th></tr></thead><tbody>
              {[-200, -100, -50, 0, 50, 100, 200].map((bp) => { const dy = bp / 10000; const exact = bondPrice(r.b, r.y + dy); return (
                <tr key={bp}><td>{bp > 0 ? "+" : ""}{bp} bp</td><td>{f.pct(r.y + dy, 2)}</td><td>{f.money(exact, 2)}</td><td>{f.money(r.price * (1 - r.mod * dy), 2)}</td><td>{f.money(r.price * (1 - r.mod * dy + 0.5 * r.cx * dy * dy), 2)}</td></tr>); })}
            </tbody></table>
            <p className="small muted" style={{ marginTop: 8 }}>Duration alone understates prices for large moves either way; adding convexity closes most of the gap.</p>
          </div>
        </>}
      </div>
    </div>
  );
}
