// Excel functions used in finance work. Each one follows Excel's argument order, defaults and signs.
import { edate, eomonth, fromSerial, serial, yearfrac } from "./dates";
import {
  compare, err, flatten, isError, isRange, numbersOf, parseNumberText, toBool, toNumber, toScalar, toText,
  type RangeVal, type Scalar, type SheetError, type Value,
} from "./values";

export type Fn = (args: Value[]) => Value;

class Bail { constructor(public e: SheetError) {} }

/** Coerce or throw the error out of the function body (caught in `fn`). */
function num(v: Value | undefined, fallback?: number): number {
  if (v === undefined || (typeof v === "string" && v === "" && fallback !== undefined)) {
    if (fallback === undefined) throw new Bail(err("#VALUE!"));
    return fallback;
  }
  const n = toNumber(v);
  if (isError(n)) throw new Bail(n);
  return n;
}
function bool(v: Value | undefined, fallback: boolean): boolean {
  if (v === undefined || v === "") return fallback;
  const b = toBool(v);
  if (isError(b)) throw new Bail(b);
  return b;
}
function nums(args: Value[]): number[] {
  const r = numbersOf(args);
  if (isError(r)) throw new Bail(r);
  return r;
}
function asRange(v: Value): Scalar[][] {
  return isRange(v) ? v.range : [[v]];
}
function vector(v: Value): Scalar[] {
  const g = asRange(v);
  if (g.length === 1) return g[0];
  if (g.every((row) => row.length === 1)) return g.map((row) => row[0]);
  throw new Bail(err("#N/A"));
}
function fail(code: SheetError["error"]): never { throw new Bail(err(code)); }
function finite(x: number): number {
  if (!Number.isFinite(x)) fail("#NUM!");
  return x;
}

const fn = (f: (args: Value[]) => Value): Fn => (args) => {
  try { return f(args); } catch (e) { if (e instanceof Bail) return e.e; throw e; }
};

// ---------- Time value of money ----------

function fvOf(r: number, n: number, pmt: number, pv: number, type: number): number {
  if (r === 0) return -(pv + pmt * n);
  const g = Math.pow(1 + r, n);
  return -(pv * g + (pmt * (1 + r * type) * (g - 1)) / r);
}
function pmtOf(r: number, n: number, pv: number, fv: number, type: number): number {
  if (n === 0) fail("#NUM!");
  if (r === 0) return -(pv + fv) / n;
  const g = Math.pow(1 + r, n);
  return -(r * (pv * g + fv)) / ((1 + r * type) * (g - 1));
}
function ipmtOf(r: number, per: number, n: number, pv: number, fv: number, type: number): number {
  if (per < 1 || per > n) fail("#NUM!");
  if (type === 1 && per === 1) return 0;
  const pmt = pmtOf(r, n, pv, fv, type);
  const interest = fvOf(r, per - 1, pmt, pv, type) * r;
  return type === 1 ? interest / (1 + r) : interest;
}

/** Newton's method with a bisection fallback over (-0.9999, 10). */
function solveRate(f: (r: number) => number, guess: number): number {
  let r = guess;
  for (let i = 0; i < 100; i++) {
    const y = f(r);
    if (Math.abs(y) < 1e-10) return r;
    const h = 1e-7 * Math.max(1, Math.abs(r));
    const d = (f(r + h) - f(r - h)) / (2 * h);
    if (!Number.isFinite(d) || d === 0) break;
    const nr = r - y / d;
    if (!Number.isFinite(nr) || nr <= -1) break;
    if (Math.abs(nr - r) < 1e-12) return nr;
    r = nr;
  }
  let lo = -0.9999, hi = 10;
  let flo = f(lo);
  const fhi = f(hi);
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) fail("#NUM!");
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (Math.abs(fm) < 1e-10 || hi - lo < 1e-14) return mid;
    if (flo * fm < 0) hi = mid; else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

function cashflows(v: Value[]): number[] {
  const { values, fromRange } = flatten(v);
  const out: number[] = [];
  values.forEach((x, i) => {
    if (isError(x)) throw new Bail(x);
    if (typeof x === "number") out.push(x);
    else if (!fromRange[i] && x !== null) out.push(num(x));
  });
  return out;
}

function datedFlows(valuesArg: Value, datesArg: Value): { v: number[]; d: number[] } {
  const v = flatten([valuesArg]).values, d = flatten([datesArg]).values;
  if (v.length !== d.length) fail("#NUM!");
  const vs: number[] = [], ds: number[] = [];
  for (let i = 0; i < v.length; i++) {
    if (isError(v[i])) throw new Bail(v[i] as SheetError);
    if (isError(d[i])) throw new Bail(d[i] as SheetError);
    if (typeof v[i] !== "number" || typeof d[i] !== "number") fail("#VALUE!");
    vs.push(v[i] as number);
    ds.push(Math.floor(d[i] as number));
  }
  if (ds.some((x) => x < ds[0])) fail("#NUM!");
  return { v: vs, d: ds };
}

const xnpvOf = (r: number, v: number[], d: number[]) => v.reduce((s, x, i) => s + x / Math.pow(1 + r, (d[i] - d[0]) / 365), 0);

// ---------- Lookups ----------

function wildcard(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "~" && i + 1 < pattern.length) re += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    else if (ch === "*") re += ".*";
    else if (ch === "?") re += ".";
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "i");
}

function exactEq(x: Scalar, target: Scalar): boolean {
  if (typeof target === "string" && typeof x === "string") return /[*?~]/.test(target) ? wildcard(target).test(x) : x.toLowerCase() === target.toLowerCase();
  if (x === null || isError(x)) return false;
  return typeof x === typeof target && compare(x, target) === 0;
}

/** Position (0-based) in a vector: 0 exact, 1 largest <= (sorted ascending), -1 smallest >= (sorted descending). */
function matchIn(target: Scalar, vec: Scalar[], type: number): number {
  if (type === 0) return vec.findIndex((x) => exactEq(x, target));
  let best = -1;
  for (let i = 0; i < vec.length; i++) {
    const x = vec[i];
    if (x === null || isError(x) || typeof x !== typeof target) continue;
    const c = compare(x, target);
    if (type > 0) { if (c <= 0) best = i; else break; }
    else { if (c >= 0) best = i; else break; }
  }
  return best;
}

function slice(g: Scalar[][], r: number | null, c: number | null): Value {
  if (r !== null && c !== null) return g[r][c];
  if (r !== null) return { range: [g[r]] };
  if (c !== null) return { range: g.map((row) => [row[c]]) };
  return { range: g };
}

// ---------- Criteria (SUMIF, COUNTIF and friends) ----------

function criterion(cv: Value): (x: Scalar) => boolean {
  const c = toScalar(cv);
  if (isError(c)) throw new Bail(c);
  if (typeof c === "number" || typeof c === "boolean") return (x) => x !== null && !isError(x) && typeof x === typeof c && compare(x, c) === 0;
  const s = c ?? "";
  const m = /^(<=|>=|<>|<|>|=)?(.*)$/s.exec(s)!;
  const op = m[1] ?? "=", rhs = m[2];
  const n = parseNumberText(rhs);
  if (n !== null) {
    return (x) => {
      if (typeof x !== "number") return op === "<>";
      switch (op) { case "=": return x === n; case "<>": return x !== n; case "<": return x < n; case ">": return x > n; case "<=": return x <= n; default: return x >= n; }
    };
  }
  if (rhs === "" && op === "=") return (x) => x === null || x === "";
  if (rhs === "" && op === "<>") return (x) => x !== null && x !== "";
  if (op === "=" || op === "<>") {
    const re = wildcard(rhs);
    const hit = (x: Scalar) => typeof x === "string" && re.test(x);
    return op === "=" ? hit : (x) => !hit(x);
  }
  return (x) => {
    if (typeof x !== "string") return false;
    const k = compare(x, rhs);
    return op === "<" ? k < 0 : op === ">" ? k > 0 : op === "<=" ? k <= 0 : k >= 0;
  };
}

function sameShape(a: Scalar[][], b: Scalar[][]) {
  if (a.length !== b.length || a[0].length !== b[0].length) fail("#VALUE!");
}

/** Cells (flat indexes) that pass every (range, criterion) pair. */
function ifsMask(pairs: Value[]): boolean[] {
  if (pairs.length < 2 || pairs.length % 2) fail("#VALUE!");
  const first = asRange(pairs[0]);
  let mask = new Array(first.length * first[0].length).fill(true);
  for (let i = 0; i < pairs.length; i += 2) {
    const g = asRange(pairs[i]);
    sameShape(g, first);
    const test = criterion(pairs[i + 1]);
    mask = mask.map((ok, k) => ok && test(g[Math.floor(k / first[0].length)][k % first[0].length]));
  }
  return mask;
}

function sumMasked(range: Value, mask: boolean[]) {
  const g = asRange(range).flat();
  let s = 0, n = 0;
  g.forEach((x, k) => {
    if (!mask[k]) return;
    if (isError(x)) throw new Bail(x);
    if (typeof x === "number") { s += x; n++; }
  });
  return { s, n };
}

// ---------- Rounding ----------

function roundTo(x: number, d: number, mode: "half" | "up" | "down"): number {
  const f = Math.pow(10, Math.trunc(d));
  const a = Math.abs(x) * f;
  const clean = Number(a.toPrecision(15));
  const r = mode === "half" ? Math.round(clean) : mode === "up" ? Math.ceil(clean) : Math.floor(clean);
  return (Math.sign(x) * r) / f;
}

// ---------- Registry ----------

export const FUNCTIONS: Record<string, Fn> = {
  // Time value of money
  PV: fn(([r, n, pmt, fv, type]) => {
    const R = num(r), N = num(n), P = num(pmt), F = num(fv, 0), T = num(type, 0) ? 1 : 0;
    if (R === 0) return -(F + P * N);
    const g = Math.pow(1 + R, N);
    return finite(-(F + (P * (1 + R * T) * (g - 1)) / R) / g);
  }),
  FV: fn(([r, n, pmt, pv, type]) => finite(fvOf(num(r), num(n), num(pmt, 0), num(pv, 0), num(type, 0) ? 1 : 0))),
  PMT: fn(([r, n, pv, fv, type]) => finite(pmtOf(num(r), num(n), num(pv), num(fv, 0), num(type, 0) ? 1 : 0))),
  NPER: fn(([r, pmt, pv, fv, type]) => {
    const R = num(r), P = num(pmt), V = num(pv), F = num(fv, 0), T = num(type, 0) ? 1 : 0;
    if (R === 0) { if (P === 0) fail("#NUM!"); return -(V + F) / P; }
    const a = P * (1 + R * T) - F * R, b = P * (1 + R * T) + V * R;
    if (a / b <= 0) fail("#NUM!");
    return finite(Math.log(a / b) / Math.log(1 + R));
  }),
  RATE: fn(([n, pmt, pv, fv, type, guess]) => {
    const N = num(n), P = num(pmt), V = num(pv), F = num(fv, 0), T = num(type, 0) ? 1 : 0;
    const f = (r: number) => (Math.abs(r) < 1e-12 ? V + P * N + F : V * Math.pow(1 + r, N) + (P * (1 + r * T) * (Math.pow(1 + r, N) - 1)) / r + F);
    return solveRate(f, num(guess, 0.1));
  }),
  IPMT: fn(([r, per, n, pv, fv, type]) => finite(ipmtOf(num(r), num(per), num(n), num(pv), num(fv, 0), num(type, 0) ? 1 : 0))),
  PPMT: fn(([r, per, n, pv, fv, type]) => {
    const R = num(r), N = num(n), V = num(pv), F = num(fv, 0), T = num(type, 0) ? 1 : 0;
    return finite(pmtOf(R, N, V, F, T) - ipmtOf(R, num(per), N, V, F, T));
  }),
  CUMIPMT: fn(([r, n, pv, s, e, type]) => {
    const R = num(r), N = num(n), V = num(pv), S = Math.ceil(num(s)), E = Math.floor(num(e)), T = num(type);
    if (R <= 0 || N <= 0 || V <= 0 || S < 1 || E < S || E > N || (T !== 0 && T !== 1)) fail("#NUM!");
    let total = 0;
    for (let k = S; k <= E; k++) total += ipmtOf(R, k, N, V, 0, T);
    return total;
  }),
  CUMPRINC: fn(([r, n, pv, s, e, type]) => {
    const R = num(r), N = num(n), V = num(pv), S = Math.ceil(num(s)), E = Math.floor(num(e)), T = num(type);
    if (R <= 0 || N <= 0 || V <= 0 || S < 1 || E < S || E > N || (T !== 0 && T !== 1)) fail("#NUM!");
    const pmt = pmtOf(R, N, V, 0, T);
    let total = 0;
    for (let k = S; k <= E; k++) total += pmt - ipmtOf(R, k, N, V, 0, T);
    return total;
  }),

  // Discounting and returns
  NPV: fn(([r, ...rest]) => {
    const R = num(r);
    if (R === -1) fail("#DIV/0!");
    return cashflows(rest).reduce((s, x, i) => s + x / Math.pow(1 + R, i + 1), 0);
  }),
  IRR: fn(([values, guess]) => {
    const cf = cashflows([values]);
    if (!cf.some((x) => x > 0) || !cf.some((x) => x < 0)) fail("#NUM!");
    return solveRate((r) => cf.reduce((s, x, i) => s + x / Math.pow(1 + r, i), 0), num(guess, 0.1));
  }),
  XNPV: fn(([r, values, dates]) => {
    const { v, d } = datedFlows(values, dates);
    return finite(xnpvOf(num(r), v, d));
  }),
  XIRR: fn(([values, dates, guess]) => {
    const { v, d } = datedFlows(values, dates);
    if (!v.some((x) => x > 0) || !v.some((x) => x < 0)) fail("#NUM!");
    return solveRate((r) => xnpvOf(r, v, d), num(guess, 0.1));
  }),
  MIRR: fn(([values, fin, re]) => {
    const cf = cashflows([values]), f = num(fin), rr = num(re), n = cf.length;
    const pvNeg = cf.reduce((s, x, i) => (x < 0 ? s + x / Math.pow(1 + f, i) : s), 0);
    const fvPos = cf.reduce((s, x, i) => (x > 0 ? s + x * Math.pow(1 + rr, n - 1 - i) : s), 0);
    if (pvNeg === 0 || fvPos === 0) fail("#DIV/0!");
    return Math.pow(fvPos / -pvNeg, 1 / (n - 1)) - 1;
  }),

  // Lookups and references
  INDEX: fn(([range, row, col]) => {
    const g = asRange(range);
    let r = num(row, 0), c = num(col, 0);
    if (col === undefined && g.length === 1 && g[0].length > 1) { c = r; r = 0; }
    r = Math.trunc(r); c = Math.trunc(c);
    if (r < 0 || c < 0 || r > g.length || c > g[0].length) fail("#REF!");
    if (g.length === 1 && r === 0 && c > 0) return g[0][c - 1];
    if (g[0].length === 1 && c === 0 && r > 0) return g[r - 1][0];
    return slice(g, r ? r - 1 : null, c ? c - 1 : null);
  }),
  MATCH: fn(([v, range, type]) => {
    const t = toScalar(v);
    if (isError(t)) return t;
    const i = matchIn(t, vector(range), Math.sign(num(type, 1)));
    return i < 0 ? err("#N/A") : i + 1;
  }),
  XLOOKUP: fn(([v, look, ret, notFound, mode, search]) => {
    const t = toScalar(v);
    if (isError(t)) return t;
    const lv = vector(look), rg = asRange(ret);
    const m = num(mode, 0), s = num(search, 1);
    const vertical = asRange(look).length > 1;
    const idx = [...lv.keys()];
    if (s < 0) idx.reverse();
    let hit = idx.find((i) => exactEq(lv[i], t));
    if (hit === undefined && (m === -1 || m === 1)) {
      let best: number | undefined;
      for (const i of idx) {
        const x = lv[i];
        if (x === null || isError(x) || typeof x !== typeof t) continue;
        const c = compare(x, t);
        if (m === -1 && c < 0 && (best === undefined || compare(x, lv[best]) > 0)) best = i;
        if (m === 1 && c > 0 && (best === undefined || compare(x, lv[best]) < 0)) best = i;
      }
      hit = best;
    }
    if (hit === undefined) return notFound !== undefined && notFound !== "" ? notFound : err("#N/A");
    if (vertical) { if (hit >= rg.length) fail("#VALUE!"); return rg[0].length === 1 ? rg[hit][0] : { range: [rg[hit]] }; }
    if (hit >= rg[0].length) fail("#VALUE!");
    return rg.length === 1 ? rg[0][hit] : { range: rg.map((row) => [row[hit!]]) };
  }),
  VLOOKUP: fn(([v, table, col, approx]) => {
    const t = toScalar(v);
    if (isError(t)) return t;
    const g = asRange(table), c = Math.trunc(num(col));
    if (c < 1 || c > g[0].length) fail("#REF!");
    const i = matchIn(t, g.map((row) => row[0]), bool(approx, true) ? 1 : 0);
    return i < 0 ? err("#N/A") : g[i][c - 1];
  }),
  HLOOKUP: fn(([v, table, row, approx]) => {
    const t = toScalar(v);
    if (isError(t)) return t;
    const g = asRange(table), r = Math.trunc(num(row));
    if (r < 1 || r > g.length) fail("#REF!");
    const i = matchIn(t, g[0], bool(approx, true) ? 1 : 0);
    return i < 0 ? err("#N/A") : g[r - 1][i];
  }),

  // Logic
  AND: fn((args) => {
    const { values } = flatten(args);
    let any = false, all = true;
    for (const x of values) { if (isError(x)) return x; if (typeof x === "string" || x === null) continue; any = true; if (!toBool(x)) all = false; }
    return any ? all : err("#VALUE!");
  }),
  OR: fn((args) => {
    const { values } = flatten(args);
    let any = false, one = false;
    for (const x of values) { if (isError(x)) return x; if (typeof x === "string" || x === null) continue; any = true; if (toBool(x)) one = true; }
    return any ? one : err("#VALUE!");
  }),
  NOT: fn(([x]) => !bool(x, false)),
  ISNUMBER: fn(([x]) => typeof toScalar(x) === "number"),
  ISTEXT: fn(([x]) => typeof toScalar(x) === "string"),
  ISBLANK: fn(([x]) => toScalar(x) === null),
  ISERROR: fn(([x]) => isError(toScalar(x))),

  // Aggregation
  SUM: fn((args) => nums(args).reduce((s, x) => s + x, 0)),
  PRODUCT: fn((args) => nums(args).reduce((s, x) => s * x, 1)),
  AVERAGE: fn((args) => { const v = nums(args); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : err("#DIV/0!"); }),
  MIN: fn((args) => { const v = nums(args); return v.length ? Math.min(...v) : 0; }),
  MAX: fn((args) => { const v = nums(args); return v.length ? Math.max(...v) : 0; }),
  MEDIAN: fn((args) => {
    const v = nums(args).sort((a, b) => a - b);
    if (!v.length) fail("#NUM!");
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  }),
  LARGE: fn(([range, k]) => { const v = nums([range]).sort((a, b) => b - a), K = Math.ceil(num(k)); return K >= 1 && K <= v.length ? v[K - 1] : err("#NUM!"); }),
  SMALL: fn(([range, k]) => { const v = nums([range]).sort((a, b) => a - b), K = Math.ceil(num(k)); return K >= 1 && K <= v.length ? v[K - 1] : err("#NUM!"); }),
  COUNT: fn((args) => {
    const { values, fromRange } = flatten(args);
    return values.filter((x, i) => typeof x === "number" || (!fromRange[i] && x !== null && !isError(x) && !isError(toNumber(x)))).length;
  }),
  COUNTA: fn((args) => flatten(args).values.filter((x) => x !== null).length),
  SUMPRODUCT: fn((args) => {
    const gs = args.map(asRange);
    gs.forEach((g) => sameShape(g, gs[0]));
    let s = 0;
    const flat = gs.map((g) => g.flat());
    for (let k = 0; k < flat[0].length; k++) {
      let p = 1;
      for (const f of flat) { const x = f[k]; if (isError(x)) return x; p *= typeof x === "number" ? x : 0; }
      s += p;
    }
    return s;
  }),
  SUMIF: fn(([range, crit, sumRange]) => {
    const g = asRange(range), test = criterion(crit);
    const mask = g.flat().map(test);
    const target = sumRange !== undefined ? sumRange : range;
    return sumMasked(target, mask).s;
  }),
  SUMIFS: fn(([sumRange, ...pairs]) => {
    const mask = ifsMask(pairs);
    sameShape(asRange(sumRange), asRange(pairs[0]));
    return sumMasked(sumRange, mask).s;
  }),
  COUNTIF: fn(([range, crit]) => asRange(range).flat().filter(criterion(crit)).length),
  COUNTIFS: fn((pairs) => ifsMask(pairs).filter(Boolean).length),
  AVERAGEIF: fn(([range, crit, avgRange]) => {
    const mask = asRange(range).flat().map(criterion(crit));
    const { s, n } = sumMasked(avgRange !== undefined ? avgRange : range, mask);
    return n ? s / n : err("#DIV/0!");
  }),
  AVERAGEIFS: fn(([avgRange, ...pairs]) => {
    const { s, n } = sumMasked(avgRange, ifsMask(pairs));
    return n ? s / n : err("#DIV/0!");
  }),

  // Maths
  ROUND: fn(([x, d]) => roundTo(num(x), num(d, 0), "half")),
  ROUNDUP: fn(([x, d]) => roundTo(num(x), num(d, 0), "up")),
  ROUNDDOWN: fn(([x, d]) => roundTo(num(x), num(d, 0), "down")),
  TRUNC: fn(([x, d]) => roundTo(num(x), num(d, 0), "down")),
  INT: fn(([x]) => Math.floor(num(x))),
  ABS: fn(([x]) => Math.abs(num(x))),
  SIGN: fn(([x]) => Math.sign(num(x))),
  SQRT: fn(([x]) => { const v = num(x); return v < 0 ? err("#NUM!") : Math.sqrt(v); }),
  POWER: fn(([x, y]) => finite(Math.pow(num(x), num(y)))),
  EXP: fn(([x]) => finite(Math.exp(num(x)))),
  LN: fn(([x]) => { const v = num(x); return v <= 0 ? err("#NUM!") : Math.log(v); }),
  LOG: fn(([x, b]) => { const v = num(x), B = num(b, 10); return v <= 0 || B <= 0 || B === 1 ? err("#NUM!") : Math.log(v) / Math.log(B); }),
  LOG10: fn(([x]) => { const v = num(x); return v <= 0 ? err("#NUM!") : Math.log10(v); }),
  MOD: fn(([x, y]) => { const a = num(x), b = num(y); if (b === 0) fail("#DIV/0!"); return a - b * Math.floor(a / b); }),
  PI: fn(() => Math.PI),

  // Dates
  DATE: fn(([y, m, d]) => {
    let Y = Math.trunc(num(y));
    if (Y < 1900) Y += 1900;
    const s = serial(Y, Math.trunc(num(m)), Math.trunc(num(d)));
    return s < 1 ? err("#NUM!") : s;
  }),
  YEAR: fn(([x]) => fromSerial(num(x)).y),
  MONTH: fn(([x]) => fromSerial(num(x)).m),
  DAY: fn(([x]) => fromSerial(num(x)).d),
  EOMONTH: fn(([s, m]) => eomonth(num(s), num(m))),
  EDATE: fn(([s, m]) => edate(num(s), num(m))),
  DAYS: fn(([e, s]) => Math.floor(num(e)) - Math.floor(num(s))),
  YEARFRAC: fn(([s, e, basis]) => yearfrac(Math.floor(num(s)), Math.floor(num(e)), Math.trunc(num(basis, 0))) ?? err("#NUM!")),

  // Text
  CONCAT: fn((args) => {
    let out = "";
    for (const x of flatten(args).values) { const t = toText(x); if (isError(t)) return t; out += t; }
    return out;
  }),
};

/** Functions that evaluate their own arguments, so the branch not taken can hold an error. */
export const LAZY = new Set(["IF", "IFS", "IFERROR", "IFNA", "CHOOSE"]);

export const SUPPORTED_FUNCTIONS = [...Object.keys(FUNCTIONS), ...LAZY].sort();

export type { RangeVal };
