import { describe, expect, it } from "vitest";
import { evaluateSheet, isError } from "@/lib/sheets";
import { gradeModel, referenceCells } from "@/lib/models/grade";
import type { Block } from "@/lib/problems/types";
import { exempt, numberTokens } from "./book";
import { gradePart, parseNumber } from "./grade";
import { CASES, getCase, getPart, publicCase } from "./index";
import type { CaseStudy, Solution } from "./types";

const MONTH = "(?:January|February|March|April|May|June|July|August|September|October|November|December)";

/** Text with citations-to-pages, dates and cell references taken out: those numbers are locators, not figures. */
function stripLocators(s: string): string {
  return s
    .replace(/US\$/g, "US ")
    .replace(new RegExp(`${MONTH} \\d{1,2}, \\d{4}`, "g"), " ")
    .replace(new RegExp(`${MONTH} (?:\\d{4}|\\d{1,2})\\b`, "g"), " ")
    .replace(/\bpages? \d+(?:(?:,| and| to|–|-) ?\d+)*/gi, " ")
    .replace(/\$?\b[A-Z]{1,2}\$?\d+\b/g, " ")
    .replace(/\d+\^\d+/g, " ");
}

function blockText(b: Block): string[] {
  return b.kind === "p" ? [b.text] : [...b.head, ...b.rows.flat()];
}

function solutionText(s: Solution): string[] {
  return [...s.idea, ...s.formulas.flatMap((f) => [f.expr, ...f.terms.flat()]), ...s.steps.flatMap(blockText), ...s.meaning, ...s.mistakes, ...s.excel];
}

/** Every piece of prose a member can read in a case. */
function allText(c: CaseStudy): string[] {
  const out = [c.title, c.summary, ...c.brief];
  for (const e of c.exhibits) out.push(e.title, e.note ?? "", ...e.head, ...e.rows.flatMap((r) => [r.label, ...r.cells.map((x) => x?.text ?? "")]));
  for (const p of c.parts) {
    out.push(p.title, ...p.prompt, ...solutionText(p.solution));
    if (p.kind === "choice") out.push(...p.options);
    if (p.kind === "model") {
      out.push(...p.model.brief, ...p.model.steps, ...p.model.solution, ...p.model.shocks.map((s) => s.label));
      for (const cell of Object.values(p.model.cells)) if (cell.kind !== "input") out.push(cell.v);
    }
  }
  return out;
}

describe.each(CASES.map((c) => [c.slug, c] as const))("case %s", (_slug, c) => {
  it("has well-formed parts with stable keys", () => {
    const keys = c.parts.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of c.parts) {
      expect(p.key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(p.points).toBeGreaterThan(0);
      expect(p.prompt.length).toBeGreaterThan(0);
      if (p.kind === "numeric") expect(Number.isFinite(p.answer)).toBe(true);
      if (p.kind === "choice") expect(p.correct).toBeLessThan(p.options.length);
    }
    expect(getCase(c.slug)).toBe(c);
    expect(getPart(c, keys[0])).toBe(c.parts[0]);
  });

  it("cites every figure to a document, a period, units and a locator", () => {
    const sources = new Map(c.sources.map((s) => [s.id, s]));
    for (const s of c.sources) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.dated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.locatorNote.length).toBeGreaterThan(10);
      if (s.publisher === "SEBI") expect(s.sha256).toMatch(/^[0-9a-f]{64}$/);
      if (s.publisher === "SEC EDGAR") expect(s.ref).toMatch(/^Accession \d{10}-\d{2}-\d{6}$/);
    }
    for (const [id, f] of Object.entries(c.figures)) {
      const where = `${c.slug}:${id}`;
      expect(sources.has(f.source), where).toBe(true);
      expect(f.label.trim(), where).not.toBe("");
      expect(f.period.trim(), where).not.toBe("");
      expect(f.section.trim(), where).not.toBe("");
      expect(Number.isFinite(f.value), where).toBe(true);
      const located = (Number.isInteger(f.page) && (f.page ?? 0) > 0) || /^[a-z-]+:[A-Za-z]+$/.test(f.xbrl ?? "");
      expect(located, `${where} needs a page or an XBRL element`).toBe(true);
    }
  });

  it("labels assumptions as hypothetical and keeps real cases free of them", () => {
    const n = Object.keys(c.assumptions).length;
    if (c.kind === "real") expect(n).toBe(0);
    else expect(n).toBeGreaterThan(0);
    for (const a of Object.values(c.assumptions)) expect(a.why.trim()).not.toBe("");
  });

  it("uses every figure and assumption it declares", () => {
    const unused = [...Object.keys(c.figures), ...Object.keys(c.assumptions)].filter((id) => !c.used.has(id));
    expect(unused).toEqual([]);
  });

  it("source data passes its own arithmetic checks", () => {
    expect(c.checks.length).toBeGreaterThanOrEqual(3);
    for (const k of c.checks) expect(Math.abs(k.got - k.want), k.label).toBeLessThanOrEqual(k.tol + 1e-9);
  });

  it("prints no number that didn't come from a cited figure or a calculation on one", () => {
    const stray: string[] = [];
    for (const s of allText(c)) {
      for (const t of numberTokens(stripLocators(s))) if (!c.printed.has(t) && !exempt(t)) stray.push(`${t} in "${s.slice(0, 80)}"`);
    }
    expect(stray).toEqual([]);
    expect(allText(c).filter((s) => /%%|xx\b|₹₹|\$\$/.test(s))).toEqual([]);
  });

  it("puts only printed numbers in model input cells", () => {
    for (const p of c.parts) {
      if (p.kind !== "model") continue;
      for (const [a, cell] of Object.entries(p.model.cells)) {
        if (cell.kind === "input" && !cell.v.startsWith("=")) expect(c.printed.has(cell.v), `${p.key}!${a}=${cell.v}`).toBe(true);
      }
    }
  });

  it("writes every solution to the six-section standard", () => {
    for (const p of c.parts) {
      const s = p.solution, where = `${c.slug}:${p.key}`;
      expect(s.idea.length, where).toBeGreaterThan(0);
      expect(s.formulas.length, where).toBeGreaterThan(0);
      for (const f of s.formulas) expect(f.terms.length, where).toBeGreaterThan(0);
      expect(s.steps.length, where).toBeGreaterThan(0);
      expect(s.meaning.length, where).toBeGreaterThan(0);
      expect(s.mistakes.length, where).toBeGreaterThanOrEqual(c.difficulty === "Easy" ? 1 : 2);
      expect(s.excel.length, where).toBeGreaterThan(0);
      if (p.kind === "numeric") expect(s.steps.flatMap(blockText).join(" "), where).toMatch(/\*\*[^*]+\*\*/);
    }
    if (c.difficulty === "Hard") expect(c.parts.some((p) => p.solution.steps.some((b) => b.kind === "table"))).toBe(true);
  });

  it("accepts the reference answer and rejects a blank or wrong one", () => {
    for (const p of c.parts) {
      if (p.kind === "numeric") {
        expect(gradePart(p, { value: p.answer.toFixed(2) })?.correct, p.key).toBe(true);
        expect(gradePart(p, { value: String(p.answer * 1.05 + 1) })?.correct, p.key).toBe(false);
        expect(gradePart(p, { value: "abc" })).toBeNull();
      } else if (p.kind === "choice") {
        expect(gradePart(p, { choice: p.correct })?.correct).toBe(true);
        expect(gradePart(p, { choice: (p.correct + 1) % p.options.length })?.correct).toBe(false);
      } else {
        const ref = referenceCells(p.model);
        const full = gradeModel(p.model, ref);
        expect(full.cells.filter((x) => x.status !== "ok"), p.key).toEqual([]);
        const values = evaluateSheet(ref, p.model.rows, p.model.cols).values;
        for (const g of p.model.graded) expect(isError(values[g.cell] ?? null), `${p.key}!${g.cell}`).toBe(false);
        expect(gradePart(p, { cells: {} })?.score).toBe(0);
      }
    }
  });

  it("never sends answers or solutions to the browser", () => {
    const json = JSON.stringify(publicCase(c));
    expect(json).not.toContain('"solution"');
    expect(json).not.toContain('"answer"');
    expect(json).not.toContain('"correct"');
  });
});

describe("case answers match the source documents", () => {
  const hy = getCase("hyundai-motor-india-ipo-2024")!;
  const ap = getCase("apple-dcf-fy2025")!;
  const ans = (c: CaseStudy, key: string) => { const p = getPart(c, key); if (p?.kind !== "numeric") throw new Error(key); return p.answer; };

  it("Hyundai Motor India", () => {
    expect(ans(hy, "offer-size")).toBeCloseTo(278556.83, 1);
    expect(ans(hy, "net-to-promoter")).toBeCloseTo(272315.63, 1);
    expect(ans(hy, "promoter-stake")).toBeCloseTo(82.5, 4);
    expect(ans(hy, "mcap-floor")).toBeCloseTo(1515389.15, 1);
    expect(ans(hy, "pe-premium")).toBeCloseTo(12.05, 2);
    expect(ans(hy, "ebitda-rebuild")).toBeCloseTo(91326.16, 2);
    expect(ans(hy, "ev-ebitda")).toBeCloseTo(16.54, 2);
    expect(ans(hy, "ronw-average")).toBeCloseTo(39.45, 2);
  });

  it("Apple", () => {
    expect(ans(ap, "op-margin")).toBeCloseTo(31.97, 2);
    expect(ans(ap, "ufcf-fy2025")).toBeCloseTo(86264, 0);
    expect(ans(ap, "net-cash")).toBe(33763);
  });
});

describe("parseNumber", () => {
  it("reads the ways people type finance numbers", () => {
    expect(parseNumber("278,556.83")).toBe(278556.83);
    expect(parseNumber("₹ 1,515,389.15")).toBe(1515389.15);
    expect(parseNumber("12.05%")).toBe(12.05);
    expect(parseNumber("(43,960)")).toBe(-43960);
    expect(parseNumber("−3.5")).toBe(-3.5);
    expect(parseNumber("16.54x")).toBe(16.54);
    expect(parseNumber("12..5")).toBeNull();
    expect(parseNumber("")).toBeNull();
  });
});

describe("citation guard", () => {
  it("finds every number in a sentence, including thousands and Excel argument lists", () => {
    expect(numberTokens("₹1,592.58 bn at 16.54x")).toEqual(["1592.58", "16.54"]);
    expect(numberTokens("=SUM(35934,18763)")).toEqual(["35934", "18763"]);
    expect(exempt("2024")).toBe(true);
    expect(exempt("12")).toBe(true);
    expect(exempt("13")).toBe(false);
    expect(exempt("1.5")).toBe(false);
  });

  it("ignores page numbers, dates and cell references, which are locators", () => {
    expect(numberTokens(stripLocators("see pages 118 to 120, March 31, 2024, cell B19 and US$157.78"))).toEqual(["157.78"]);
  });
});
