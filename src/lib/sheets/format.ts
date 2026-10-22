// Display formats for sheet cells.
import { fromSerial } from "./dates";
import { isError, type Scalar } from "./values";

export type Fmt = "general" | "n0" | "n1" | "n2" | "pct1" | "pct2" | "x1" | "x2" | "date" | "text";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fixed(x: number, dp: number): string {
  const s = Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  return x < 0 && Number(s.replace(/,/g, "")) !== 0 ? `(${s})` : s;
}

export function formatValue(v: Scalar, fmt: Fmt = "general"): string {
  if (v === null) return "";
  if (isError(v)) return v.error;
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "string") return v;
  switch (fmt) {
    case "n0": return fixed(v, 0);
    case "n1": return fixed(v, 1);
    case "n2": return fixed(v, 2);
    case "pct1": return `${fixed(v * 100, 1)}%`;
    case "pct2": return `${fixed(v * 100, 2)}%`;
    case "x1": return `${fixed(v, 1)}x`;
    case "x2": return `${fixed(v, 2)}x`;
    case "date": { const d = fromSerial(v); return `${String(d.d).padStart(2, "0")}-${MONTHS[d.m - 1]}-${d.y}`; }
    case "text": return String(v);
    default: {
      if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
      const a = Math.abs(v);
      if (a !== 0 && (a < 1e-4 || a >= 1e12)) return v.toExponential(4);
      return String(Number(v.toPrecision(10)));
    }
  }
}
