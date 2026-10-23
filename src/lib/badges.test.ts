import { describe, expect, it } from "vitest";
import { contestBadges, type CompletedContest } from "./badges";

const day = (n: number) => new Date(Date.UTC(2026, 9, 25 + n, 12, 45));
const contests = (n: number, first = "Weekly Contest #1 · Founding Round"): CompletedContest[] =>
  Array.from({ length: n }, (_, i) => ({ slug: `c${i + 1}`, title: i === 0 ? first : `Weekly Contest #${i + 1}`, endsAt: day(i * 7) }));

describe("contest badges", () => {
  it("gives a Founding Round finisher both the Founding Round and first-contest badges", () => {
    const s = contestBadges("MEMBER", contests(1));
    expect(s.badges.map((b) => b.key)).toEqual(["founding-round", "contests-1"]);
    expect(s.badges[0].contestSlug).toBe("c1");
    expect(s.next).toEqual({ count: 5, remaining: 4 });
  });

  it("awards each milestone at the contest that reached it", () => {
    const s = contestBadges("MEMBER", contests(12));
    expect(s.badges.map((b) => b.key)).toEqual(["founding-round", "contests-1", "contests-5", "contests-10"]);
    expect(s.badges.find((b) => b.key === "contests-10")!.contestSlug).toBe("c10");
    expect(s.next).toEqual({ count: 25, remaining: 13 });
  });

  it("orders by end date, not by the order given", () => {
    const s = contestBadges("MEMBER", contests(5).reverse());
    expect(s.badges.find((b) => b.key === "contests-1")!.contestSlug).toBe("c1");
    expect(s.badges.find((b) => b.key === "contests-5")!.contestSlug).toBe("c5");
  });

  it("gives no Founding Round badge to members who started later", () => {
    const s = contestBadges("MEMBER", contests(3, "Weekly Contest #1"));
    expect(s.badges.map((b) => b.key)).toEqual(["contests-1"]);
  });

  it("has nothing to show before any contest, and stops after the last milestone", () => {
    expect(contestBadges("MEMBER", [])).toEqual({ badges: [], completed: 0, next: { count: 1, remaining: 1 } });
    const s = contestBadges("MEMBER", contests(120));
    expect(s.badges).toHaveLength(7);
    expect(s.next).toBeNull();
  });

  it("never awards staff or recruiter accounts", () => {
    expect(contestBadges("ADMIN", contests(10)).badges).toEqual([]);
    expect(contestBadges("RECRUITER", contests(10)).badges).toEqual([]);
  });
});
