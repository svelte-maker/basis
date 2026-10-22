// Builder for real-company cases. Every number a case prints goes through these formatters, so the
// citation test can prove that no number in the text was typed in by hand.
import type { Block } from "@/lib/problems/types";
import type { Assumption, CaseCheck, CasePart, CaseStudy, Exhibit, ExhibitCell, Figure, SourceDoc } from "./types";

/** Numbers that may appear in text without a source: small counts and years. */
export function exempt(token: string): boolean {
  if (!/^\d+$/.test(token)) return false;
  const v = Number(token);
  return v <= 12 || (token.length === 4 && v >= 1990 && v <= 2040);
}

/** Numeric tokens in a string, commas removed: "₹1,592.58 bn (16.5x)" → ["1592.58", "16.5"]. */
export function numberTokens(s: string): string[] {
  return (s.match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g) ?? []).map((t) => t.replace(/,/g, ""));
}

const grouped = (x: number, dp: number) => Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

export class Casebook {
  readonly figures: Record<string, Figure> = {};
  readonly assumptions: Record<string, Assumption> = {};
  readonly used = new Set<string>();
  readonly printed = new Set<string>();
  readonly checks: CaseCheck[] = [];
  private sourceIds: Set<string>;

  constructor(readonly sources: SourceDoc[]) {
    this.sourceIds = new Set(sources.map((s) => s.id));
  }

  private record(s: string): string {
    for (const t of numberTokens(s)) this.printed.add(t);
    return s;
  }

  /** Register a reported figure. Returns its value. */
  fig(id: string, f: Figure): number {
    if (this.figures[id] || this.assumptions[id]) throw new Error(`Duplicate figure ${id}`);
    if (!this.sourceIds.has(f.source)) throw new Error(`Figure ${id} cites unknown source ${f.source}`);
    this.figures[id] = f;
    return f.value;
  }

  /** Register a Basis assumption on top of the real data. Returns its value. */
  assume(id: string, a: Assumption): number {
    if (this.figures[id] || this.assumptions[id]) throw new Error(`Duplicate assumption ${id}`);
    this.assumptions[id] = a;
    return a.value;
  }

  /** Value of a figure or assumption, marked as used. */
  v(id: string): number {
    const x = this.figures[id] ?? this.assumptions[id];
    if (!x) throw new Error(`Unknown figure ${id}`);
    this.used.add(id);
    return x.value;
  }

  /** "1,234.56", with a proper minus sign. */
  n(x: number, dp = 2): string {
    return this.record((x < 0 ? "−" : "") + grouped(x, dp));
  }

  /** Fraction → "12.34%". */
  pct(x: number, dp = 2): string {
    return this.record(`${x < 0 ? "−" : ""}${grouped(x * 100, dp)}%`);
  }

  /** Multiple → "16.53x". */
  x(v: number, dp = 2): string {
    return this.record(`${grouped(v, dp)}x`);
  }

  /** Plain number for an Excel formula or a sheet cell: no separators, trailing zeros trimmed. */
  xl(x: number, dp = 6): string {
    return this.record(String(Number(x.toFixed(dp))));
  }

  /** A figure as reported, at the precision the document prints it. Units (%, ₹, x) are the caller's to add. */
  show(id: string, dp = 2): string {
    const f = this.figures[id] ?? this.assumptions[id];
    if (!f) throw new Error(`Unknown figure ${id}`);
    this.used.add(id);
    return this.n(f.value, dp);
  }

  /** An exhibit cell that shows a figure and carries its citation. */
  cell(id: string, dp = 2): ExhibitCell {
    return { text: this.show(id, dp), fig: id };
  }

  /** An exhibit cell with a derived value (not cited, computed from cited figures). */
  calcCell(x: number, dp = 2): ExhibitCell {
    return { text: this.n(x, dp) };
  }

  p(text: string): Block {
    return { kind: "p", text };
  }

  table(head: string[], rows: string[][]): Block {
    return { kind: "table", head, rows };
  }

  /** An identity the source data must satisfy. */
  check(label: string, got: number, want: number, tol = 0.011) {
    this.checks.push({ label, got, want, tol });
  }

  build(meta: Omit<CaseStudy, "sources" | "figures" | "assumptions" | "checks" | "printed" | "used" | "exhibits" | "parts"> & { exhibits: Exhibit[]; parts: CasePart[] }): CaseStudy {
    return {
      ...meta,
      sources: this.sources,
      figures: this.figures,
      assumptions: this.assumptions,
      checks: this.checks,
      printed: this.printed,
      used: this.used,
    };
  }
}
