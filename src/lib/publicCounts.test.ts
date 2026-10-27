import { describe, expect, it } from "vitest";
import { MEMBER_SOLVES, peopleDid } from "./publicCounts";

describe("public counts", () => {
  it("count only members' solves", () => {
    expect(MEMBER_SOLVES).toEqual({ everSolved: true, user: { role: "MEMBER" } });
  });

  it("pluralise people", () => {
    expect(peopleDid(0, "solved this")).toBe("0 people solved this");
    expect(peopleDid(1, "solved this")).toBe("1 person solved this");
    expect(peopleDid(2, "solved this")).toBe("2 people solved this");
  });
});
