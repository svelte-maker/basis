import { describe, expect, it } from "vitest";
import { phaseOf, problemScore, rankStandings, standingFromAttempts } from "./contestScoring";

describe("contest scoring", () => {
  it("decays with time and wrong attempts, floored at 30%", () => {
    expect(problemScore(500, 10, 1)).toBe(430);
    expect(problemScore(500, 1000, 5)).toBe(150);
  });
  it("ties share a rank", () => {
    const r = rankStandings([
      { userId: "a", score: 900, lastSolveMin: 30, solved: 2 },
      { userId: "b", score: 900, lastSolveMin: 30, solved: 2 },
      { userId: "c", score: 1200, lastSolveMin: 50, solved: 3 },
      { userId: "d", score: 900, lastSolveMin: 20, solved: 2 },
    ]);
    expect(r.map((x) => [x.userId, x.rank])).toEqual([["c", 1], ["d", 2], ["a", 3], ["b", 3]]);
  });
  it("ignores attempts after a solve and counts earlier wrong ones", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const at = (m: number) => new Date(start.getTime() + m * 60000);
    const s = standingFromAttempts([
      { slug: "x", correct: false, at: at(3) },
      { slug: "x", correct: true, at: at(10) },
      { slug: "x", correct: false, at: at(12) },
      { slug: "y", correct: false, at: at(15) },
    ], start, () => 500);
    expect(s.solved).toBe(1);
    expect(s.score).toBe(500 - 20 - 50);
    expect(s.perProblem.y.wrong).toBe(1);
  });
  it("phases", () => {
    const c = { startsAt: new Date(1000), endsAt: new Date(2000) };
    expect(phaseOf(c, new Date(500))).toBe("upcoming");
    expect(phaseOf(c, new Date(1500))).toBe("live");
    expect(phaseOf(c, new Date(2000))).toBe("ended");
  });
});
