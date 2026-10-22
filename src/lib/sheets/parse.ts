// Formula parser: tokens, then precedence climbing into a small AST.
import { parseAddr } from "./refs";

export type Node =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "bool"; v: boolean }
  | { t: "ref"; r: number; c: number }
  | { t: "range"; r1: number; c1: number; r2: number; c2: number }
  | { t: "fn"; name: string; args: Node[] }
  | { t: "un"; op: "-" | "+"; x: Node }
  | { t: "pct"; x: Node }
  | { t: "bin"; op: string; a: Node; b: Node };

type Tok = { k: "num" | "str" | "ref" | "range" | "id" | "op" | "(" | ")" | ","; v: string };

export class FormulaError extends Error {}

const MAX_LEN = 1000;

function tokenize(src: string): Tok[] {
  if (src.length > MAX_LEN) throw new FormulaError("Formula is too long");
  const out: Tok[] = [];
  let i = 0;
  const ref = /^\$?[A-Za-z]{1,3}\$?\d{1,6}/;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    const rest = src.slice(i);
    if (ch === '"') {
      let j = i + 1, s = "";
      for (;;) {
        if (j >= src.length) throw new FormulaError("Missing closing quote");
        if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; }
        s += src[j++];
      }
      out.push({ k: "str", v: s });
      i = j + 1;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i.exec(rest);
    if (num) {
      out.push({ k: "num", v: num[0] });
      i += num[0].length;
      continue;
    }
    const r = ref.exec(rest);
    if (r && !/^[A-Za-z0-9_.(]/.test(rest.slice(r[0].length))) {
      const after = rest.slice(r[0].length);
      const r2 = after.startsWith(":") ? ref.exec(after.slice(1)) : null;
      if (r2) { out.push({ k: "range", v: `${r[0]}:${r2[0]}` }); i += r[0].length + 1 + r2[0].length; }
      else { out.push({ k: "ref", v: r[0] }); i += r[0].length; }
      continue;
    }
    const id = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest);
    if (id) { out.push({ k: "id", v: id[0].toUpperCase() }); i += id[0].length; continue; }
    const op = /^(<=|>=|<>|[-+*/^&=<>%])/.exec(rest);
    if (op) { out.push({ k: "op", v: op[0] }); i += op[0].length; continue; }
    if (ch === "(" || ch === ")" || ch === ",") { out.push({ k: ch, v: ch }); i++; continue; }
    throw new FormulaError(`Unexpected "${ch}"`);
  }
  return out;
}

const BINARY: Record<string, number> = { "=": 1, "<>": 1, "<": 1, ">": 1, "<=": 1, ">=": 1, "&": 2, "+": 3, "-": 3, "*": 4, "/": 4, "^": 5 };

/** Parse the text after the leading "=". */
export function parseFormula(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  let depth = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expect = (k: Tok["k"]) => {
    const t = next();
    if (!t || t.k !== k) throw new FormulaError(`Expected ${k === "," ? "a comma" : k}`);
  };

  function primary(): Node {
    const t = next();
    if (!t) throw new FormulaError("Formula ends too soon");
    if (++depth > 200) throw new FormulaError("Formula is nested too deeply");
    try {
      switch (t.k) {
        case "num": return { t: "num", v: parseFloat(t.v) };
        case "str": return { t: "str", v: t.v };
        case "ref": { const a = parseAddr(t.v)!; return { t: "ref", r: a.r, c: a.c }; }
        case "range": {
          const [x, y] = t.v.split(":").map((s) => parseAddr(s)!);
          return { t: "range", r1: Math.min(x.r, y.r), c1: Math.min(x.c, y.c), r2: Math.max(x.r, y.r), c2: Math.max(x.c, y.c) };
        }
        case "id": {
          if (peek()?.k === "(") {
            next();
            const args: Node[] = [];
            if (peek()?.k !== ")") {
              for (;;) {
                if (peek()?.k === "," || peek()?.k === ")") args.push({ t: "str", v: "" }); // skipped argument
                else args.push(expr(0));
                if (peek()?.k === ",") { next(); continue; }
                break;
              }
            }
            expect(")");
            return { t: "fn", name: t.v, args };
          }
          if (t.v === "TRUE" || t.v === "FALSE") return { t: "bool", v: t.v === "TRUE" };
          throw new FormulaError(`Unknown name ${t.v}`);
        }
        case "(": { const e = expr(0); expect(")"); return e; }
        case "op":
          if (t.v === "-" || t.v === "+") return postfix({ t: "un", op: t.v, x: primary() });
          break;
      }
      throw new FormulaError(`Unexpected "${t.v}"`);
    } finally { depth--; }
  }

  function postfix(n: Node): Node {
    while (peek()?.k === "op" && peek()!.v === "%") { next(); n = { t: "pct", x: n }; }
    return n;
  }

  function expr(min: number): Node {
    let left = postfix(primary());
    for (;;) {
      const t = peek();
      if (!t || t.k !== "op" || !(t.v in BINARY)) break;
      const prec = BINARY[t.v];
      if (prec < min) break;
      next();
      // ^ is left-associative in Excel, like the rest.
      const right = expr(prec + 1);
      left = { t: "bin", op: t.v, a: left, b: right };
    }
    return left;
  }

  const node = expr(0);
  if (p < toks.length) throw new FormulaError(`Unexpected "${toks[p].v}"`);
  return node;
}

/** Every function name a formula calls, upper case. */
export function functionsIn(n: Node, out = new Set<string>()): Set<string> {
  if (n.t === "fn") { out.add(n.name); n.args.forEach((a) => functionsIn(a, out)); }
  else if (n.t === "un" || n.t === "pct") functionsIn(n.x, out);
  else if (n.t === "bin") { functionsIn(n.a, out); functionsIn(n.b, out); }
  return out;
}

/** Cells a formula reads, as [r, c] pairs (ranges expanded, capped by the sheet size). */
export function refsIn(n: Node, rows: number, cols: number, out: [number, number][] = []): [number, number][] {
  if (n.t === "ref") out.push([n.r, n.c]);
  else if (n.t === "range") {
    for (let r = n.r1; r <= Math.min(n.r2, rows - 1); r++) for (let c = n.c1; c <= Math.min(n.c2, cols - 1); c++) out.push([r, c]);
  } else if (n.t === "fn") n.args.forEach((a) => refsIn(a, rows, cols, out));
  else if (n.t === "un" || n.t === "pct") refsIn(n.x, rows, cols, out);
  else if (n.t === "bin") { refsIn(n.a, rows, cols, out); refsIn(n.b, rows, cols, out); }
  return out;
}
