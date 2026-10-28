import { describe, expect, it } from "vitest";
import { TEMPLATES, instantiate, isCorrect, parseAnswer, practiceSeed } from "./index";
import { seeded } from "./rng";

describe("every template", () => {
  for (const t of TEMPLATES) {
    it(`${t.slug} generates valid, self-consistent instances`, () => {
      for (let k = 0; k < 150; k++) {
        const inst = instantiate(t.slug, `test:${k}`);
        expect(Number.isFinite(inst.answer), `answer finite (seed ${k})`).toBe(true);
        expect(isCorrect(inst.answer, inst)).toBe(true);
        const text = JSON.stringify(inst);
        expect(text, `no NaN/undefined in text (seed ${k})`).not.toMatch(/NaN|undefined|Infinity/);
        expect(text, `no negative zero percentages (seed ${k})`).not.toMatch(/[−-]0\.0+%/);
        // A 2% error must never be accepted (guards against tolerances that are too loose)
        if (Math.abs(inst.answer) * 0.02 > (inst.tolerance.abs ?? 0) * 1.01) expect(isCorrect(inst.answer * 1.02, inst), `${t.slug} seed ${k} too lenient`).toBe(false);
      }
    });
  }
  for (const t of TEMPLATES) {
    it(`${t.slug} has a worked solution that teaches`, () => {
      const depth = { Easy: 1, Medium: 2, Hard: 3 }[t.difficulty];
      for (let k = 0; k < 150; k++) {
        const s = instantiate(t.slug, `test:${k}`).solution;
        expect(s.idea.length, "idea").toBeGreaterThanOrEqual(t.difficulty === "Hard" ? 2 : 1);
        expect(s.formulas.length, "formulas").toBeGreaterThanOrEqual(1);
        expect(s.formulas.flatMap((f) => f.terms).length, "every formula's symbols explained").toBeGreaterThanOrEqual(2);
        // A table counts as one step per row: an iteration log or schedule is several steps shown at once
        const units = s.steps.reduce((n, b) => n + (b.kind === "p" ? 1 : b.rows.length), 0);
        expect(units, "steps").toBeGreaterThanOrEqual(depth + 1);
        expect(s.steps.some((b) => (b.kind === "p" ? b.text : JSON.stringify(b.rows)).includes("**")), "answer highlighted in steps").toBe(true);
        expect(s.meaning.length, "meaning").toBeGreaterThanOrEqual(1);
        expect(s.mistakes.length, "mistakes").toBeGreaterThanOrEqual(depth >= 2 ? 2 : 1);
        expect(s.excel.length, "excel").toBeGreaterThanOrEqual(1);
        expect(s.excel.join(" "), "excel formula").toMatch(/`=/);
        if (t.difficulty === "Hard") expect(s.steps.some((b) => b.kind === "table"), "hard problems show a worked table").toBe(true);
      }
    });
  }
  it("implied share prices are never negative (limited liability)", () => {
    for (let k = 0; k < 5000; k++) expect(instantiate("implied-price-from-multiple", `sweep1026:${k}`).answer, `seed ${k}`).toBeGreaterThan(0);
  });
  it("same seed gives same numbers, different users differ", () => {
    const a = instantiate("project-npv", practiceSeed("u1", "project-npv", 0));
    const b = instantiate("project-npv", practiceSeed("u1", "project-npv", 0));
    const c = instantiate("project-npv", practiceSeed("u2", "project-npv", 0));
    expect(a.answer).toBe(b.answer);
    expect(a.answer).not.toBe(c.answer);
  });
  it("covers every track with at least 3 problems", () => {
    const counts: Record<string, number> = {};
    TEMPLATES.forEach((t) => (counts[t.track] = (counts[t.track] ?? 0) + 1));
    Object.values(counts).forEach((n) => expect(n).toBeGreaterThanOrEqual(3));
    expect(Object.keys(counts)).toHaveLength(8);
  });
});

describe("answer parsing", () => {
  it.each([
    ["1,234.50", 1234.5], ["$1,234", 1234], ["12.5%", 12.5], ["(21.04)", -21.04], ["−21.04", -21.04], ["1.91x", 1.91], [".5", 0.5], ["1e3", 1000],
  ])("%s → %d", (raw, v) => expect(parseAnswer(raw)).toBeCloseTo(v, 10));
  it.each(["", "abc", "1.2.3", "12-3"])("rejects %s", (raw) => expect(parseAnswer(raw)).toBeNull());
});

describe("rng", () => {
  it("is uniform enough", () => {
    const r = seeded("x");
    let s = 0;
    for (let i = 0; i < 10000; i++) s += r();
    expect(s / 10000).toBeGreaterThan(0.48);
    expect(s / 10000).toBeLessThan(0.52);
  });
});
