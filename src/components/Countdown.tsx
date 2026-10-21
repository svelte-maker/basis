"use client";
import { useEffect, useState } from "react";

function fmt(ms: number) {
  if (ms <= 0) return "0:00";
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(h > 0 ? 2 : 1, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Counts down to `to`, then reloads once so the page shows the next phase. */
export function Countdown({ to, label }: { to: string; label: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= target) { clearInterval(id); setTimeout(() => location.reload(), 1500); }
    }, 1000);
    return () => clearInterval(id);
  }, [target]);
  return <span>{label} <span className="num">{now === null ? "…" : fmt(target - now)}</span></span>;
}
