// Spreadsheet values and Excel-style coercion.

export type ErrorCode = "#DIV/0!" | "#VALUE!" | "#REF!" | "#NAME?" | "#N/A" | "#NUM!" | "#CIRC!";
export type SheetError = { error: ErrorCode };
/** null is an empty cell. */
export type Scalar = number | string | boolean | null | SheetError;
export type RangeVal = { range: Scalar[][] };
export type Value = Scalar | RangeVal;

export const err = (code: ErrorCode): SheetError => ({ error: code });
export const isError = (v: unknown): v is SheetError => typeof v === "object" && v !== null && "error" in v;
export const isRange = (v: unknown): v is RangeVal => typeof v === "object" && v !== null && "range" in v;

/** A range used where one value is expected: only a single cell is allowed. */
export function toScalar(v: Value): Scalar {
  if (!isRange(v)) return v;
  if (v.range.length === 1 && v.range[0].length === 1) return v.range[0][0];
  return err("#VALUE!");
}

export function parseNumberText(s: string): number | null {
  let t = s.trim().replace(/,/g, "");
  if (!t) return null;
  let neg = false;
  if (/^\(.*\)$/.test(t)) { neg = true; t = t.slice(1, -1); }
  let scale = 1;
  if (t.endsWith("%")) { scale = 0.01; t = t.slice(0, -1); }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
  const v = parseFloat(t) * scale;
  return neg ? -v : v;
}

export function toNumber(v: Value): number | SheetError {
  const s = toScalar(v);
  if (s === null) return 0;
  if (typeof s === "number") return s;
  if (typeof s === "boolean") return s ? 1 : 0;
  if (typeof s === "string") return parseNumberText(s) ?? err("#VALUE!");
  return s;
}

export function toBool(v: Value): boolean | SheetError {
  const s = toScalar(v);
  if (s === null) return false;
  if (typeof s === "boolean") return s;
  if (typeof s === "number") return s !== 0;
  if (typeof s === "string") {
    const u = s.toUpperCase();
    if (u === "TRUE") return true;
    if (u === "FALSE") return false;
    return err("#VALUE!");
  }
  return s;
}

export function toText(v: Value): string | SheetError {
  const s = toScalar(v);
  if (s === null) return "";
  if (typeof s === "string") return s;
  if (typeof s === "boolean") return s ? "TRUE" : "FALSE";
  if (typeof s === "number") return String(Number(s.toPrecision(15)));
  return s;
}

/** Excel ordering: numbers < text < booleans; text compares case-insensitively. Empty acts as 0 or "". */
export function compare(a: Scalar, b: Scalar): number {
  if (a === null) a = typeof b === "string" ? "" : typeof b === "boolean" ? false : 0;
  if (b === null) b = typeof a === "string" ? "" : typeof a === "boolean" ? false : 0;
  const rank = (x: Scalar) => (typeof x === "number" ? 0 : typeof x === "string" ? 1 : 2);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (typeof a === "string" && typeof b === "string") {
    const x = a.toLowerCase(), y = b.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  const x = Number(a), y = Number(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Flatten function arguments the way SUM, AVERAGE, NPV and friends read them. */
export function flatten(args: Value[]): { values: Scalar[]; fromRange: boolean[] } {
  const values: Scalar[] = [], fromRange: boolean[] = [];
  for (const a of args) {
    if (isRange(a)) for (const row of a.range) for (const x of row) { values.push(x); fromRange.push(true); }
    else { values.push(a); fromRange.push(false); }
  }
  return { values, fromRange };
}

/**
 * Numbers for aggregate functions. Values typed directly as arguments are coerced;
 * text, booleans and blanks inside ranges are skipped, as in Excel.
 */
export function numbersOf(args: Value[]): number[] | SheetError {
  const { values, fromRange } = flatten(args);
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (isError(v)) return v;
    if (fromRange[i]) { if (typeof v === "number") out.push(v); continue; }
    if (v === null) continue;
    const n = toNumber(v);
    if (isError(n)) return n;
    out.push(n);
  }
  return out;
}
