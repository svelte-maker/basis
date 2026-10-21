// Evaluate a sheet of raw cell inputs ("=NPV(B2,C5:G5)", "12.5%", "Revenue") into values.
import { FUNCTIONS, LAZY } from "./functions";
import { FormulaError, functionsIn, parseFormula, refsIn, type Node } from "./parse";
import { addr, parseAddr } from "./refs";
import {
  compare, err, isError, isRange, parseNumberText, toBool, toNumber, toScalar, toText,
  type Scalar, type Value,
} from "./values";

export type Raw = Record<string, string>;

export type Parsed =
  | { kind: "empty" }
  | { kind: "value"; value: Scalar }
  | { kind: "formula"; node: Node }
  | { kind: "bad"; message: string };

/** What a typed entry means: a formula, a number ("1,250", "8%", "(40)"), TRUE/FALSE, or text. */
export function parseEntry(raw: string | undefined): Parsed {
  const s = (raw ?? "").trim();
  if (!s) return { kind: "empty" };
  if (s.startsWith("=")) {
    try { return { kind: "formula", node: parseFormula(s.slice(1)) }; }
    catch (e) { return { kind: "bad", message: e instanceof FormulaError ? e.message : "Couldn't read this formula" }; }
  }
  if (s.startsWith("'")) return { kind: "value", value: s.slice(1) };
  const n = parseNumberText(s);
  if (n !== null) return { kind: "value", value: n };
  if (/^(true|false)$/i.test(s)) return { kind: "value", value: s.toUpperCase() === "TRUE" };
  return { kind: "value", value: s };
}

export type Sheet = {
  rows: number;
  cols: number;
  /** Value of every non-empty cell, by address. */
  values: Record<string, Scalar>;
  /** Parse problems by address, for the formula bar. */
  problems: Record<string, string>;
  parsed: Record<string, Parsed>;
};

export function evaluateSheet(raw: Raw, rows: number, cols: number): Sheet {
  const parsed: Record<string, Parsed> = {};
  for (const [a, v] of Object.entries(raw)) {
    const p = parseAddr(a);
    if (!p || p.r >= rows || p.c >= cols) continue;
    const e = parseEntry(v);
    if (e.kind !== "empty") parsed[addr(p.r, p.c)] = e;
  }
  const values: Record<string, Scalar> = {};
  const problems: Record<string, string> = {};
  const state = new Map<string, "busy" | "done">();

  function cell(r: number, c: number): Scalar {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return err("#REF!");
    const a = addr(r, c);
    const st = state.get(a);
    if (st === "done") return values[a] ?? null;
    if (st === "busy") return err("#CIRC!");
    const p = parsed[a];
    if (!p) return null;
    state.set(a, "busy");
    let v: Scalar;
    if (p.kind === "value") v = p.value;
    else if (p.kind === "bad") { v = err("#NAME?"); problems[a] = p.message; }
    else if (p.kind === "empty") v = null;
    else {
      const out = toScalar(evalNode(p.node));
      v = typeof out === "number" && !Number.isFinite(out) ? err("#NUM!") : out;
    }
    state.set(a, "done");
    values[a] = v;
    return v;
  }

  function range(n: Extract<Node, { t: "range" }>): Value {
    if (n.r2 >= rows || n.c2 >= cols) return err("#REF!");
    const out: Scalar[][] = [];
    for (let r = n.r1; r <= n.r2; r++) {
      const row: Scalar[] = [];
      for (let c = n.c1; c <= n.c2; c++) row.push(cell(r, c));
      out.push(row);
    }
    return { range: out };
  }

  /** In function arguments a cell reference behaves like a one-cell range (SUM skips text in it). */
  function arg(n: Node): Value {
    if (n.t === "ref") return { range: [[cell(n.r, n.c)]] };
    return evalNode(n);
  }

  function scalarNum(n: Node): number | ReturnType<typeof err> {
    return toNumber(evalNode(n));
  }

  function evalNode(n: Node): Value {
    switch (n.t) {
      case "num": return n.v;
      case "str": return n.v;
      case "bool": return n.v;
      case "ref": return cell(n.r, n.c);
      case "range": return range(n);
      case "un": {
        const x = scalarNum(n.x);
        return isError(x) ? x : n.op === "-" ? -x : x;
      }
      case "pct": {
        const x = scalarNum(n.x);
        return isError(x) ? x : x / 100;
      }
      case "bin": return binary(n.op, n.a, n.b);
      case "fn": return call(n.name, n.args);
    }
  }

  function binary(op: string, an: Node, bn: Node): Value {
    if (op === "&") {
      const a = toText(evalNode(an)), b = toText(evalNode(bn));
      if (isError(a)) return a;
      if (isError(b)) return b;
      return a + b;
    }
    if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
      const a = toScalar(evalNode(an)), b = toScalar(evalNode(bn));
      if (isError(a)) return a;
      if (isError(b)) return b;
      const c = compare(a, b);
      switch (op) { case "=": return c === 0; case "<>": return c !== 0; case "<": return c < 0; case ">": return c > 0; case "<=": return c <= 0; default: return c >= 0; }
    }
    const a = scalarNum(an);
    if (isError(a)) return a;
    const b = scalarNum(bn);
    if (isError(b)) return b;
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? err("#DIV/0!") : a / b;
      case "^": { const v = Math.pow(a, b); return Number.isFinite(v) ? v : err("#NUM!"); }
    }
    return err("#VALUE!");
  }

  function call(name: string, args: Node[]): Value {
    if (LAZY.has(name)) return lazy(name, args);
    const f = FUNCTIONS[name];
    if (!f) return err("#NAME?");
    return f(args.map(arg));
  }

  function lazy(name: string, args: Node[]): Value {
    const cond = (n: Node) => {
      const v = evalNode(n);
      return isError(toScalar(v)) ? (toScalar(v) as ReturnType<typeof err>) : toBool(v);
    };
    switch (name) {
      case "IF": {
        if (args.length < 2 || args.length > 3) return err("#VALUE!");
        const c = cond(args[0]);
        if (isError(c)) return c;
        if (c) return evalNode(args[1]);
        return args[2] ? evalNode(args[2]) : false;
      }
      case "IFS": {
        if (args.length < 2 || args.length % 2) return err("#VALUE!");
        for (let i = 0; i < args.length; i += 2) {
          const c = cond(args[i]);
          if (isError(c)) return c;
          if (c) return evalNode(args[i + 1]);
        }
        return err("#N/A");
      }
      case "IFERROR":
      case "IFNA": {
        if (args.length !== 2) return err("#VALUE!");
        const v = toScalar(evalNode(args[0]));
        if (isError(v) && (name === "IFERROR" || v.error === "#N/A")) return evalNode(args[1]);
        return v;
      }
      case "CHOOSE": {
        if (args.length < 2) return err("#VALUE!");
        const i = scalarNum(args[0]);
        if (isError(i)) return i;
        const k = Math.trunc(i);
        if (k < 1 || k >= args.length) return err("#VALUE!");
        return evalNode(args[k]);
      }
    }
    return err("#NAME?");
  }

  for (const a of Object.keys(parsed)) { const p = parseAddr(a)!; cell(p.r, p.c); }
  return { rows, cols, values, problems, parsed };
}

/** Functions used by a cell or anything it depends on. */
export function functionsBehind(sheet: Sheet, start: string): Set<string> {
  const seen = new Set<string>(), out = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const a = stack.pop()!;
    if (seen.has(a)) continue;
    seen.add(a);
    const p = sheet.parsed[a];
    if (p?.kind !== "formula") continue;
    functionsIn(p.node, out);
    for (const [r, c] of refsIn(p.node, sheet.rows, sheet.cols)) stack.push(addr(r, c));
  }
  return out;
}

export function isFormula(sheet: Sheet, a: string): boolean {
  return sheet.parsed[a]?.kind === "formula";
}

export { isError, isRange };
