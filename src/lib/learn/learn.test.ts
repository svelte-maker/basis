import { describe, expect, it } from "vitest";
import { getCase, getPart, CASES } from "@/lib/cases";
import { getModelTask, MODEL_TASKS } from "@/lib/models";
import { getTemplate, TEMPLATES } from "@/lib/problems";
import { evaluateSheet, functionsIn, isError, parseFormula, SUPPORTED_FUNCTIONS } from "@/lib/sheets";
import { irr, npv, pmt, xirr, xnpv } from "@/lib/finance/tvm";
import { TOOLS } from "@/app/tools/registry";
import { mini } from "./lessons/accounting";
import { getLesson, glossary, LESSONS, lessonsIn, lessonText, MODULES, ORDERED, readingMinutes, type LessonBlock } from ".";

const sheets = LESSONS.flatMap((l) => l.sections.flatMap((s) => s.blocks.filter((b): b is Extract<LessonBlock, { kind: "sheet" }> => b.kind === "sheet").map((b) => ({ lesson: l.slug, b }))));
const run = (b: Extract<LessonBlock, { kind: "sheet" }>) => evaluateSheet({ ...b.inputs, ...b.formulas }, b.rows, b.cols).values;

describe("curriculum", () => {
  it("every module has lessons and every lesson sits in a module", () => {
    for (const m of MODULES) expect(lessonsIn(m.key).length, m.key).toBeGreaterThan(0);
    expect(ORDERED.length).toBe(LESSONS.length);
  });

  it("prerequisites exist and come earlier in the curriculum", () => {
    for (const l of ORDERED) {
      for (const p of l.prerequisites) {
        expect(getLesson(p), `${l.slug} → ${p}`).toBeDefined();
        expect(ORDERED.findIndex((x) => x.slug === p), `${l.slug} needs ${p} first`).toBeLessThan(ORDERED.findIndex((x) => x.slug === l.slug));
      }
    }
  });

  it("every lesson meets the depth bar", () => {
    for (const l of LESSONS) {
      expect(l.outcomes.length, l.slug).toBeGreaterThanOrEqual(3);
      expect(l.hook.length, l.slug).toBeGreaterThanOrEqual(1);
      expect(l.sections.length, l.slug).toBeGreaterThanOrEqual(3);
      expect(l.gap.length, l.slug).toBeGreaterThanOrEqual(2);
      expect(l.mistakes.length, l.slug).toBeGreaterThanOrEqual(3);
      expect(l.interview.length, l.slug).toBeGreaterThanOrEqual(1);
      expect(l.quiz.length, l.slug).toBeGreaterThanOrEqual(2);
      expect(l.glossary.length, l.slug).toBeGreaterThanOrEqual(3);
      expect(l.summary.length, l.slug).toBeLessThanOrEqual(300);
      expect(readingMinutes(l), l.slug).toBeGreaterThanOrEqual(5);
      expect(new Set(l.sections.map((s) => s.id)).size, `${l.slug} section ids`).toBe(l.sections.length);
    }
  });

  it("no number renders as NaN, Infinity or undefined", () => {
    for (const l of LESSONS) expect(lessonText(l), l.slug).not.toMatch(/NaN|Infinity|undefined|\[object/);
  });

  it("quiz answers point at an option", () => {
    for (const l of LESSONS) for (const q of l.quiz) {
      expect(q.options.length, q.q).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size, q.q).toBe(q.options.length);
      expect(q.answer, q.q).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.q).toBeLessThan(q.options.length);
    }
  });

  it("glossary terms are unique", () => {
    const terms = glossary().map((g) => g.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });
});

describe("theory links to practice", () => {
  it("every linked problem, model, case part and tool exists", () => {
    const tools = new Set(TOOLS.map((t) => t.slug as string));
    for (const l of LESSONS) {
      for (const p of l.apply.problems) expect(getTemplate(p), `${l.slug}: problem ${p}`).toBeDefined();
      for (const m of l.apply.models) expect(getModelTask(m), `${l.slug}: model ${m}`).toBeDefined();
      for (const t of l.apply.tools) expect(tools.has(t), `${l.slug}: tool ${t}`).toBe(true);
      for (const c of l.apply.cases) {
        const cs = getCase(c.slug);
        expect(cs, `${l.slug}: case ${c.slug}`).toBeDefined();
        for (const k of c.parts) expect(getPart(cs!, k), `${l.slug}: ${c.slug}#${k}`).toBeDefined();
      }
    }
  });

  it("every problem, model task and case part is taught by at least one lesson", () => {
    const problems = new Set(LESSONS.flatMap((l) => l.apply.problems));
    for (const t of TEMPLATES) expect(problems.has(t.slug), `no lesson teaches problem ${t.slug}`).toBe(true);
    const models = new Set(LESSONS.flatMap((l) => l.apply.models));
    for (const m of MODEL_TASKS) expect(models.has(m.slug), `no lesson teaches model ${m.slug}`).toBe(true);
    const parts = new Set(LESSONS.flatMap((l) => l.apply.cases.flatMap((c) => c.parts.map((p) => `${c.slug}#${p}`))));
    for (const c of CASES) for (const p of c.parts) expect(parts.has(`${c.slug}#${p.key}`), `no lesson teaches ${c.slug}#${p.key}`).toBe(true);
  });
});

describe("worked examples", () => {
  it("the three-statement example ties", () => {
    expect(mini.assets(mini.open)).toBeCloseTo(mini.liabEq(mini.open), 9);
    expect(mini.assets(mini.close)).toBeCloseTo(mini.liabEq(mini.close), 9);
    expect(mini.close.cash - mini.open.cash).toBeCloseTo(mini.cfo + mini.cfi + mini.cff, 9);
  });

  it("the multiple-IRR example really has two IRRs", () => {
    expect(npv(0.1, [-100, 230, -132])).toBeCloseTo(0, 9);
    expect(npv(0.2, [-100, 230, -132])).toBeCloseTo(0, 9);
  });
});

describe("live sheets", () => {
  it("there are live sheets to practise on", () => {
    expect(sheets.length).toBeGreaterThanOrEqual(4);
  });

  it("every reference formula parses, uses supported functions and evaluates without errors", () => {
    for (const { lesson, b } of sheets) {
      const values = run(b);
      for (const [cell, f] of Object.entries(b.formulas)) {
        const node = parseFormula(f.slice(1));
        for (const fn of functionsIn(node)) expect(SUPPORTED_FUNCTIONS, `${lesson} ${cell} uses ${fn}`).toContain(fn);
        expect(isError(values[cell]), `${lesson} ${cell} = ${JSON.stringify(values[cell])}`).toBe(false);
      }
      for (const cell of Object.keys(b.labels)) {
        expect(b.inputs[cell], `${lesson} ${cell} is both a label and an input`).toBeUndefined();
        expect(b.formulas[cell], `${lesson} ${cell} is both a label and a formula`).toBeUndefined();
      }
    }
  });

  it("sheet results agree with the finance library", () => {
    const loan = sheets.find((s) => s.b.formulas.B5?.startsWith("=PMT"))!;
    const lv = run(loan.b);
    expect(lv.B5 as number).toBeCloseTo(pmt(0.09 / 12, 240, 200_000), 6);
    expect((lv.B6 as number) + (lv.B7 as number)).toBeCloseTo(lv.B5 as number, 6);

    const fund = sheets.find((s) => s.b.formulas.B11?.startsWith("=XNPV"))!;
    const fv = run(fund.b);
    const d = (y: number, m: number, dd: number) => new Date(Date.UTC(y, m - 1, dd));
    const dates = [d(2025, 1, 1), d(2025, 9, 30), d(2026, 6, 30), d(2027, 3, 31), d(2027, 12, 31)];
    const flows = [-1000, 150, 250, 300, 600];
    expect(fv.B10 as number).toBeCloseTo(npv(0.1, flows), 6);
    expect(fv.B11 as number).toBeCloseTo(xnpv(0.1, flows, dates), 4);
    expect(fv.B12 as number).toBeCloseTo(irr(flows), 6);
    expect(fv.C12 as number).toBeCloseTo(xirr(flows, dates), 5);
  });
});
