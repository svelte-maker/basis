import { describe, expect, it } from "vitest";
import { bootstrapZeros, forwardRate } from "./fixedIncome";
import { annuityFactor, discountFactors, fraSettlement, parSwapRate, swapDv01, swapValueToPayer } from "./swaps";

const par = [0.05, 0.055, 0.06];
const dfs = discountFactors(bootstrapZeros(par));

describe("swaps", () => {
  it("the par swap rate on a par curve equals the par bond yield", () => {
    par.forEach((y, i) => expect(parSwapRate(dfs.slice(0, i + 1))).toBeCloseTo(y, 12));
  });

  it("a swap at the par rate is worth zero, and payer value is the fixed bond's discount to par", () => {
    const n = 10_000_000;
    expect(swapValueToPayer(n, parSwapRate(dfs), dfs)).toBeCloseTo(0, 6);
    // Paying 5% when the market is 6%: worth the gap between par and a 5% bond priced off the curve.
    const fixedBond = 0.05 * annuityFactor(dfs) + dfs[2];
    expect(swapValueToPayer(n, 0.05, dfs)).toBeCloseTo(n * (1 - fixedBond), 6);
  });

  it("DV01 matches a 1bp bump in the fixed rate", () => {
    const n = 10_000_000;
    expect(swapDv01(n, dfs)).toBeCloseTo(swapValueToPayer(n, 0.05, dfs) - swapValueToPayer(n, 0.0501, dfs), 6);
  });

  it("FRAs settle on the rate gap, discounted, and are fair at the forward rate", () => {
    expect(fraSettlement(10_000_000, 0.06, 0.065, 0.25)).toBeCloseTo((10_000_000 * 0.005 * 0.25) / (1 + 0.065 * 0.25), 8);
    expect(fraSettlement(10_000_000, 0.065, 0.06, 0.25)).toBeLessThan(0);
    const z = bootstrapZeros(par);
    const f = forwardRate(z[0], 1, z[1], 2);
    // Locking in the forward rate costs nothing: PV of the expected settlement at the forward is zero.
    expect(fraSettlement(1, f, f, 1)).toBe(0);
    expect((1 + z[0]) * (1 + f)).toBeCloseTo(Math.pow(1 + z[1], 2), 12);
  });
});
