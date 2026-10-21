import { GRADES } from "@/lib/rating/grades";

/** Rating history line, drawn server-side as SVG. Grade thresholds are dashed lines. */
export function RatingChart({ points }: { points: { rating: number; label: string }[] }) {
  if (points.length < 2) {
    return <p className="muted small">Your rating history appears here after your first rated contest or a few solved problems.</p>;
  }
  const W = 600, H = 200, pl = 42, pr = 14, pt = 14, pb = 22;
  const vals = points.map((p) => p.rating);
  const lo = Math.floor((Math.min(...vals) - 30) / 100) * 100;
  const hi = Math.ceil((Math.max(...vals) + 30) / 100) * 100;
  const x = (i: number) => pl + ((W - pl - pr) * i) / (points.length - 1);
  const y = (v: number) => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo));
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.rating).toFixed(1)}`).join(" ");
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += 100) ticks.push(v);
  const bands = GRADES.filter((g) => g.min > lo && g.min < hi);
  const last = points.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Rating history" style={{ width: "100%", height: "auto", display: "block" }}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pl - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted)" fontFamily="var(--mono)">{v}</text>
        </g>
      ))}
      {bands.map((g) => (
        <g key={g.grade}>
          <line x1={pl} x2={W - pr} y1={y(g.min)} y2={y(g.min)} stroke="var(--gold)" strokeDasharray="4 4" />
          <text x={W - pr} y={y(g.min) - 4} textAnchor="end" fontSize="10" fill="var(--gold)" fontFamily="var(--mono)">{g.grade}</text>
        </g>
      ))}
      <polygon points={`${pl},${H - pb} ${line} ${x(last)},${H - pb}`} fill="var(--accent)" fillOpacity="0.1" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.rating)} r={i === last ? 4 : 2} fill="var(--accent)"><title>{`${p.label}: ${p.rating}`}</title></circle>)}
    </svg>
  );
}
