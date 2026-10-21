"use client";
import { minVarianceWeight, parametricVaR, twoAsset } from "@/lib/finance/portfolio";
import { useInputs, Field, Kpi, f } from "@/components/tool";

export default function Risk() {
  const { vals, n, p, set } = useInputs({ r1: "9", s1: "18", r2: "4.5", s2: "7", rho: "0.2", w: "60", rf: "3.5", value: "1000000", conf: "99", days: "10" });
  const rho = Math.max(-1, Math.min(1, n("rho")));
  const port = twoAsset(p("w"), p("r1"), p("s1"), p("r2"), p("s2"), rho);
  const wMin = minVarianceWeight(p("s1"), p("s2"), rho);
  const minP = twoAsset(wMin, p("r1"), p("s1"), p("r2"), p("s2"), rho);
  const curve = Array.from({ length: 21 }, (_, i) => ({ w: i / 20, ...twoAsset(i / 20, p("r1"), p("s1"), p("r2"), p("s2"), rho) }));
  const W = 520, H = 240, pad = 40;
  const maxV = Math.max(...curve.map((c) => c.vol)) * 1.1 || 1, maxR = Math.max(...curve.map((c) => c.ret)) * 1.15 || 1, minR = Math.min(0, ...curve.map((c) => c.ret));
  const X = (v: number) => pad + (v / maxV) * (W - pad - 10), Y = (r: number) => H - pad + 10 - ((r - minR) / (maxR - minR)) * (H - pad - 10);
  const conf = n("conf") / 100;
  return (
    <div className="tool-grid">
      <div className="panel inputs">
        <strong className="small">Asset A</strong>
        <div className="pair"><Field id="r1" label="Expected return" suffix="%" value={vals.r1} onChange={set("r1")} /><Field id="s1" label="Volatility" suffix="%" value={vals.s1} onChange={set("s1")} /></div>
        <strong className="small">Asset B</strong>
        <div className="pair"><Field id="r2" label="Expected return" suffix="%" value={vals.r2} onChange={set("r2")} /><Field id="s2" label="Volatility" suffix="%" value={vals.s2} onChange={set("s2")} /></div>
        <div className="pair"><Field id="rho" label="Correlation" suffix="−1 to 1" value={vals.rho} onChange={set("rho")} /><Field id="w" label="Weight in A" suffix="%" value={vals.w} onChange={set("w")} /></div>
        <Field id="rf" label="Risk-free rate" suffix="%" value={vals.rf} onChange={set("rf")} />
        <strong className="small">Value at risk</strong>
        <Field id="val" label="Portfolio value" suffix="$" value={vals.value} onChange={set("value")} />
        <div className="pair"><Field id="conf" label="Confidence" suffix="%" value={vals.conf} onChange={set("conf")} /><Field id="days" label="Horizon" suffix="trading days" value={vals.days} onChange={set("days")} /></div>
      </div>
      <div className="stack" style={{ minWidth: 0 }}>
        <div className="kpis">
          <Kpi label="Portfolio return" value={f.pct(port.ret)} />
          <Kpi label="Portfolio volatility" value={f.pct(port.vol)} />
          <Kpi label="Sharpe ratio" value={((port.ret - p("rf")) / port.vol).toFixed(3)} />
          <Kpi label="Min-variance weight in A" value={f.pct(wMin, 1)} />
          <Kpi label={`${f.pct(conf, 0)} ${n("days")}-day VaR`} value={conf > 0.5 && conf < 1 ? f.money(parametricVaR(n("value"), port.vol, conf, n("days"))) : "—"} />
        </div>
        <div className="panel card">
          <h3>Risk and return as the weight in A goes from 0% to 100%</h3>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label="Two-asset frontier">
            <line x1={pad} y1={H - pad + 10} x2={W - 10} y2={H - pad + 10} stroke="var(--line)" /><line x1={pad} y1={10} x2={pad} y2={H - pad + 10} stroke="var(--line)" />
            <text x={W - 10} y={H - 8} textAnchor="end" fontSize="11" fill="var(--muted)">Volatility</text>
            <text x={pad + 4} y={20} fontSize="11" fill="var(--muted)">Return</text>
            <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={curve.map((c) => `${X(c.vol)},${Y(c.ret)}`).join(" ")} />
            <circle cx={X(port.vol)} cy={Y(port.ret)} r="5" fill="var(--accent)"><title>Your portfolio</title></circle>
            <circle cx={X(minP.vol)} cy={Y(minP.ret)} r="4" fill="var(--gold)"><title>Minimum variance</title></circle>
            <text x={X(port.vol) + 8} y={Y(port.ret) - 6} fontSize="11" fill="var(--ink)">You</text>
            <text x={X(minP.vol) + 8} y={Y(minP.ret) + 14} fontSize="11" fill="var(--gold)">Min variance</text>
          </svg>
          <p className="small muted">VaR assumes normally distributed returns with zero mean, scaled by the square root of time over 252 trading days.</p>
        </div>
      </div>
    </div>
  );
}
