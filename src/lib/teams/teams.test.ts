import { describe, expect, it } from "vitest";
import { CASES } from "@/lib/cases";
import { referenceCells } from "@/lib/models/grade";
import { answerAddr, caseTeamTask, cellAddr } from "./cases";
import { evaluateSheet } from "@/lib/sheets";
import { getModelTask, instantiateModel, MODEL_POINTS, MODEL_TASKS } from "@/lib/models";
import {
  authorShares, canClaim, scoreTask, gradeIntegrated, gradePart, ownerOf, partOfCell, scoreTeam, shouldFinalize, STALE_CLAIM_MS,
  TEAM_SPLITS, teamInstance, type TeamCell,
} from ".";

/** The reference model written by whoever owns each part. */
function refCells(slug: string, seed: string, owners: Record<string, string>): Record<string, TeamCell> {
  const parts = TEAM_SPLITS[slug];
  const inst = instantiateModel(slug, seed);
  const out: Record<string, TeamCell> = {};
  for (const [a, f] of Object.entries(inst.answer)) out[a] = { value: f, authorId: owners[partOfCell(parts, a)!.key] };
  return out;
}

describe.each(Object.keys(TEAM_SPLITS))("%s split", (slug) => {
  const parts = TEAM_SPLITS[slug];
  const task = getModelTask(slug)!;
  const owners = Object.fromEntries(parts.map((p, i) => [p.key, `u${i}`]));
  const members = parts.map((_, i) => ({ userId: `u${i}` }));

  it("is a real task, and every formula cell sits in exactly one part, which has something to check", () => {
    expect(task).toBeDefined();
    const inst = teamInstance(instantiateModel(slug, "s"), parts);
    for (const a of Object.keys(inst.answer)) {
      const owning = parts.filter((p) => partOfCell([p], a));
      expect(owning.length, a).toBe(1);
    }
    for (const p of parts) for (const g of p.extra ?? []) expect(inst.cells[g.cell]?.kind, g.cell).toBe("calc");
    for (const g of inst.graded) expect(partOfCell(parts, g.cell), g.cell).toBeDefined();
    for (const p of parts) expect(inst.graded.some((g) => partOfCell([p], g.cell)), p.key).toBe(true);
    expect(new Set(parts.map((p) => p.key)).size).toBe(parts.length);
  });

  it("a complete, correct team model splits the full pool plus the bonus", () => {
    for (const seed of ["a", "b", "c"]) {
      const inst = teamInstance(instantiateModel(slug, seed), parts);
      const cells = refCells(slug, seed, owners);
      expect(gradeIntegrated(inst, cells).score).toBe(1);
      const r = scoreTeam(inst, parts, cells, task.difficulty, members);
      expect(r.bonusEarned).toBe(true);
      for (const p of r.parts) expect(p.report.score, p.key).toBe(1);
      const raw = r.members.reduce((s, m) => s + m.raw, 0);
      expect(raw).toBeCloseTo(MODEL_POINTS[task.difficulty], 6);
      expect(r.members.reduce((s, m) => s + m.contribution, 0)).toBeCloseTo(1, 6);
    }
  });

  it("each part is graded on its own: an empty part costs nobody else anything", () => {
    const inst = teamInstance(instantiateModel(slug, "iso"), parts);
    const full = refCells(slug, "iso", owners);
    const [first, ...rest] = parts;
    const cells = Object.fromEntries(Object.entries(full).filter(([a]) => !partOfCell([first], a)));
    expect(gradePart(inst, first, cells).score).toBe(0);
    for (const p of rest) expect(gradePart(inst, p, cells).score, p.key).toBe(1);
    const r = scoreTeam(inst, parts, cells, task.difficulty, members);
    expect(r.bonusEarned).toBe(false);
    expect(r.members[0].points).toBe(0);
  });
});

describe("credit", () => {
  const slug = "five-year-dcf";
  const parts = TEAM_SPLITS[slug];
  const inst = teamInstance(instantiateModel(slug, "credit"), parts);
  const owners = { forecast: "ana", fcf: "ben", valuation: "cy" };
  const members = [{ userId: "ana" }, { userId: "ben" }, { userId: "cy" }];

  it("a wrong upstream part doesn't change a correct downstream part's grade", () => {
    const cells = refCells(slug, "credit", owners);
    cells.C16 = { value: "=B16*2", authorId: "ana" }; // revenue wrong, which flows into everything
    expect(gradePart(inst, parts[0], cells).score).toBeLessThan(1);
    expect(gradePart(inst, parts[1], cells).score).toBe(1);
    expect(gradePart(inst, parts[2], cells).score).toBe(1);
    expect(gradeIntegrated(inst, cells).score).toBeLessThan(1);
  });

  it("typed-in numbers still fail the live-model check inside a part", () => {
    const cells = refCells(slug, "credit", owners);
    const theirs = gradeIntegrated(inst, cells);
    expect(theirs.score).toBe(1);
    const v = evaluateSheet(referenceCells(inst), inst.rows, inst.cols).values.B31;
    cells.B31 = { value: String(v), authorId: "cy" };
    const r = gradePart(inst, parts[2], cells);
    expect(r.cells.find((c) => c.cell === "B31")?.status).toBe("hardcoded");
  });

  it("credit follows who wrote the cells, not who claimed the part", () => {
    const cells = refCells(slug, "credit", owners);
    // ben took over the valuation part and rewrote half its cells
    const valCells = Object.keys(cells).filter((a) => partOfCell([parts[2]], a));
    valCells.slice(0, Math.ceil(valCells.length / 2)).forEach((a) => { cells[a] = { ...cells[a], authorId: "ben" }; });
    const shares = authorShares(inst, parts[2], cells);
    expect(shares.ben + shares.cy).toBeCloseTo(1, 9);
    expect(shares.ben).toBeGreaterThanOrEqual(0.5);
    const r = scoreTeam(inst, parts, cells, "Hard", members);
    const ben = r.members.find((m) => m.userId === "ben")!, cy = r.members.find((m) => m.userId === "cy")!;
    expect(ben.points).toBeGreaterThan(cy.points);
  });

  it("a member who wrote nothing gets nothing, and ineligible members earn zero but keep their contribution", () => {
    const cells = refCells(slug, "credit", { forecast: "ana", fcf: "ana", valuation: "ben" });
    const r = scoreTeam(inst, parts, cells, "Hard", [{ userId: "ana" }, { userId: "ben", ineligible: "Solved alone first" }, { userId: "cy" }]);
    const by = Object.fromEntries(r.members.map((m) => [m.userId, m]));
    expect(by.cy.points).toBe(0);
    expect(by.cy.contribution).toBe(0);
    expect(by.ben.points).toBe(0);
    expect(by.ben.contribution).toBeGreaterThan(0);
    expect(by.ana.points).toBeGreaterThan(0);
  });

  it("splitting across more accounts never beats solving alone by more than the bonus", () => {
    const cells = refCells(slug, "credit", owners);
    const r = scoreTeam(inst, parts, cells, "Hard", members);
    const total = r.members.reduce((s, m) => s + m.points, 0);
    expect(total).toBeLessThanOrEqual(Math.ceil(MODEL_POINTS.Hard * 1.2) + members.length);
  });

  it("only the part's claimer owns its cells; locked and unowned cells belong to nobody", () => {
    const claims = { forecast: "ana", fcf: null, valuation: "cy" };
    expect(ownerOf(inst, parts, claims, "C17")).toBe("ana");
    expect(ownerOf(inst, parts, claims, "C23")).toBe(null);
    expect(ownerOf(inst, parts, claims, "B31")).toBe("cy");
    expect(ownerOf(inst, parts, claims, "B3")).toBe(null); // an input
    expect(ownerOf(inst, parts, claims, "B16")).toBe(null); // a given formula
    expect(ownerOf(inst, parts, claims, "A40")).toBe(null);
  });
});

describe("claims", () => {
  const now = new Date("2026-10-21T12:00:00Z");
  const fresh = new Date(now.getTime() - 60_000);
  const stale = new Date(now.getTime() - STALE_CLAIM_MS - 1);

  it("lets you claim a free part", () => {
    expect(canClaim("a", "x", [{ key: "x", claimedById: null, activeAt: null }, { key: "y", claimedById: null, activeAt: null }], 2, now)).toEqual({ ok: true, takeover: false });
  });

  it("leaves a part for each teammate", () => {
    const claims = [{ key: "x", claimedById: "a", activeAt: fresh }, { key: "y", claimedById: null, activeAt: null }, { key: "z", claimedById: null, activeAt: null }];
    expect(canClaim("a", "y", claims, 3, now).ok).toBe(false);
    expect(canClaim("a", "y", claims, 2, now).ok).toBe(true);
    expect(canClaim("a", "y", claims, 1, now).ok).toBe(true);
  });

  it("protects an active claim and frees a stale one", () => {
    expect(canClaim("b", "x", [{ key: "x", claimedById: "a", activeAt: fresh }], 2, now).ok).toBe(false);
    expect(canClaim("b", "x", [{ key: "x", claimedById: "a", activeAt: stale }], 2, now)).toEqual({ ok: true, takeover: true });
  });

  it("finalizes when everyone is ready or the deadline passes", () => {
    const t = { deadline: new Date(now.getTime() + 1000), finalizedAt: null };
    expect(shouldFinalize(t, [{ ready: true }, { ready: false }], now)).toBe(false);
    expect(shouldFinalize(t, [{ ready: true }, { ready: true }], now)).toBe(true);
    expect(shouldFinalize(t, [{ ready: true }], now)).toBe(false);
    expect(shouldFinalize({ ...t, deadline: now }, [{ ready: false }], now)).toBe(true);
    expect(shouldFinalize({ ...t, finalizedAt: now }, [{ ready: true }, { ready: true }], now)).toBe(false);
  });
});

it("every model task can be played as a team", () => {
  for (const t of MODEL_TASKS) expect(TEAM_SPLITS[t.slug], t.slug).toBeDefined();
});

describe("case teams", () => {
  for (const c of CASES) {
    const task = caseTeamTask(c);
    const answers = (owner: (k: string) => string): Record<string, TeamCell> => {
      const out: Record<string, TeamCell> = {};
      for (const p of c.parts) {
        if (p.kind === "numeric") out[answerAddr(p.key)] = { value: String(p.answer), authorId: owner(p.key) };
        else if (p.kind === "choice") out[answerAddr(p.key)] = { value: String(p.correct), authorId: owner(p.key) };
        else for (const [a, f] of Object.entries(p.model.answer)) out[cellAddr(p.key, a)] = { value: f, authorId: owner(p.key) };
      }
      return out;
    };

    it(`${c.slug}: every part is a claimable part worth its points, addressed only by its own key`, () => {
      expect(task.parts.map((p) => p.key)).toEqual(c.parts.map((p) => p.key));
      for (const p of c.parts) {
        if (p.kind === "model") {
          const calc = Object.keys(p.model.answer)[0];
          expect(task.partOf(cellAddr(p.key, calc))).toBe(p.key);
          expect(task.partOf(answerAddr(p.key))).toBeUndefined();
          expect(task.checkable(p.key)).toBe(true);
        } else {
          expect(task.partOf(answerAddr(p.key))).toBe(p.key);
          expect(task.partOf(cellAddr(p.key, "A1"))).toBeUndefined();
          expect(task.checkable(p.key)).toBe(false);
        }
      }
      expect(task.partOf("nope:ans")).toBeUndefined();
    });

    it(`${c.slug}: the reference answers split the pool exactly, with the bonus`, () => {
      const owners = c.parts.map((_, i) => `u${i % 3}`);
      const cells = answers((k) => owners[c.parts.findIndex((p) => p.key === k)]);
      const r = scoreTask(task, cells, [{ userId: "u0" }, { userId: "u1" }, { userId: "u2" }]);
      expect(r.bonusEarned).toBe(true);
      for (const p of r.parts) expect(p.report.score, p.key).toBe(1);
      expect(r.members.reduce((s, m) => s + m.raw, 0)).toBeCloseTo(task.pool, 6);
    });

    it(`${c.slug}: a wrong answer costs only its own part`, () => {
      const cells = answers(() => "u0");
      const first = c.parts.find((p) => p.kind !== "model")!;
      cells[answerAddr(first.key)] = { value: first.kind === "choice" ? String((first.correct + 1) % first.options.length) : "123456789", authorId: "u1" };
      const r = scoreTask(task, cells, [{ userId: "u0" }, { userId: "u1" }]);
      expect(r.parts.find((p) => p.key === first.key)!.report.score).toBe(0);
      expect(r.parts.filter((p) => p.key !== first.key).every((p) => p.report.score === 1)).toBe(true);
      expect(r.members.find((m) => m.userId === "u1")!.points).toBe(0);
      expect(r.bonusEarned).toBe(false);
    });

    it(`${c.slug}: answers must have the right shape`, () => {
      const ch = c.parts.find((p) => p.kind === "choice");
      if (ch && ch.kind === "choice") {
        expect(task.accepts(answerAddr(ch.key), "0")).toBe(true);
        expect(task.accepts(answerAddr(ch.key), String(ch.options.length))).toBe(false);
        expect(task.accepts(answerAddr(ch.key), "x")).toBe(false);
      }
    });
  }
});
