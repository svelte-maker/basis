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
        // A 2% error must never be accepted (guards against tolerances that are too loose)
        if (Math.abs(inst.answer) * 0.02 > (inst.tolerance.abs ?? 0) * 1.01) expect(isCorrect(inst.answer * 1.02, inst), `${t.slug} seed ${k} too lenient`).toBe(false);
      }
    });
  }
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
