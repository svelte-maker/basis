import { describe, expect, it } from "vitest";
import { update, rateContest, DEFAULT_RATING } from "./glicko2";
import { basisRating, gradeFor } from "./grades";

describe("Glicko-2", () => {
  it("reproduces Glickman's worked example", () => {
    const r = update({ rating: 1500, rd: 200, vol: 0.06 }, [
      { opponent: { rating: 1400, rd: 30, vol: 0.06 }, score: 1 },
      { opponent: { rating: 1550, rd: 100, vol: 0.06 }, score: 0 },
      { opponent: { rating: 1700, rd: 300, vol: 0.06 }, score: 0 },
    ]);
    expect(r.rating).toBeCloseTo(1464.06, 1);
    expect(r.rd).toBeCloseTo(151.52, 1);
    expect(r.vol).toBeCloseTo(0.05999, 4);
  });
  it("inactivity widens deviation only", () => {
    const r = update({ rating: 1500, rd: 50, vol: 0.06 }, []);
    expect(r.rating).toBe(1500);
    expect(r.rd).toBeGreaterThan(50);
  });
  it("contest winner gains, loser loses, ratings roughly conserved", () => {
    const players = [1, 2, 3, 4].map((rank) => ({ id: `p${rank}`, rank, before: { ...DEFAULT_RATING } }));
    const out = rateContest(players);
    expect(out.get("p1")!.rating).toBeGreaterThan(1200);
    expect(out.get("p4")!.rating).toBeLessThan(1200);
    const total = [...out.values()].reduce((s, r) => s + r.rating, 0);
    expect(total).toBeCloseTo(4800, 0);
  });
  it("upset moves ratings more than an expected result", () => {
    const strong = { rating: 1800, rd: 60, vol: 0.06 }, weak = { rating: 1200, rd: 60, vol: 0.06 };
    const upset = update(weak, [{ opponent: strong, score: 1 }]).rating - 1200;
    const expected = update(strong, [{ opponent: weak, score: 1 }]).rating - 1800;
    expect(upset).toBeGreaterThan(expected * 5);
  });
});

describe("grades", () => {
  it("unrated until first contest", () => expect(gradeFor(1500, 0)).toBe("NR"));
  it("maps bands", () => {
    expect(gradeFor(1399, 1)).toBe("BBB");
    expect(gradeFor(1400, 1)).toBe("A");
    expect(gradeFor(1850, 3)).toBe("AAA");
    expect(gradeFor(900, 3)).toBe("B");
  });
  it("practice bonus is capped", () => expect(basisRating(1300, 900)).toBe(1450));
});
