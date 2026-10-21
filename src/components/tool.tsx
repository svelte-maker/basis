"use client";
import { useState } from "react";

/** Numeric inputs kept as strings so people can type freely; parsed on read. */
export function useInputs<T extends Record<string, string>>(initial: T) {
  const [vals, setVals] = useState<T>(initial);
  const n = (k: keyof T) => { const v = parseFloat(String(vals[k]).replace(/,/g, "")); return isFinite(v) ? v : NaN; };
  const p = (k: keyof T) => n(k) / 100;
  const set = (k: keyof T) => (v: string) => setVals((s) => ({ ...s, [k]: v }));
  return { vals, n, p, set, setVals };
}

export function Field({ id, label, value, onChange, suffix }: { id: string; label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <label htmlFor={id}>
      <span>{label}{suffix ? <span className="muted"> ({suffix})</span> : null}</span>
      <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="kpi"><span className="v">{value}</span><span className="l">{label}</span></div>;
}

export const f = {
  money: (x: number, dp = 0) => (isFinite(x) ? `${x < 0 ? "−" : ""}$${Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}` : "—"),
  num: (x: number, dp = 1) => (isFinite(x) ? `${x < 0 ? "−" : ""}${Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}` : "—"),
  pct: (x: number, dp = 2) => (isFinite(x) ? `${(x * 100).toFixed(dp)}%` : "—"),
  x: (x: number, dp = 2) => (isFinite(x) ? `${x.toFixed(dp)}x` : "—"),
};

export function Err({ msg }: { msg: string | null }) {
  return msg ? <div className="fb no">{msg}</div> : null;
}

/** Runs a calculation and turns thrown errors into a readable message. */
export function attempt<T>(fn: () => T): { value: T | null; error: string | null } {
  try {
    const v = fn();
    return { value: v, error: null };
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : "Check your inputs." };
  }
}
