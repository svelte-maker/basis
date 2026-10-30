// Private equity fund economics. Amounts are in any one currency unit; rates are decimals.

export type WaterfallInput = {
  /** Capital the LPs paid in, all at t = 0. */
  contributed: number;
  /** Total proceeds distributed, all at the end of the hold. */
  proceeds: number;
  years: number;
  /** Preferred return (hurdle), compounded annually. */
  hurdle: number;
  /** GP carried interest share, e.g. 0.2. */
  carry: number;
};

export type WaterfallResult = {
  /** Tier 1: return of capital to LPs. */
  returnOfCapital: number;
  /** Tier 2: preferred return to LPs. */
  preferred: number;
  /** Tier 3: 100% GP catch-up. */
  catchUp: number;
  /** Tier 4: what is left, split (1 − carry) to LPs and carry to the GP. */
  residual: number;
  lp: number;
  gp: number;
};

/**
 * Whole-fund ("European") waterfall with a compounding hurdle and a 100% GP catch-up, for a single
 * contribution and a single distribution. The catch-up runs until the GP holds `carry` of all profit
 * paid out so far, i.e. catch-up = carry / (1 − carry) × preferred return.
 * Tier order and catch-up definition follow Metrick & Yasuda, "The Economics of Private Equity Funds"
 * (Review of Financial Studies, 2010), section 1.
 */
export function europeanWaterfall(i: WaterfallInput): WaterfallResult {
  if (i.contributed <= 0 || i.proceeds < 0 || i.carry <= 0 || i.carry >= 1) throw new RangeError("Invalid waterfall input");
  let left = i.proceeds;
  const returnOfCapital = Math.min(left, i.contributed);
  left -= returnOfCapital;
  const preferred = Math.min(left, i.contributed * (Math.pow(1 + i.hurdle, i.years) - 1));
  left -= preferred;
  const catchUp = Math.min(left, (i.carry / (1 - i.carry)) * preferred);
  left -= catchUp;
  const residual = left;
  const gp = catchUp + i.carry * residual;
  return { returnOfCapital, preferred, catchUp, residual, lp: i.proceeds - gp, gp };
}

export type FundMultiples = {
  /** Distributions to paid-in: the realised part of the return. */
  dpi: number;
  /** Residual value to paid-in: the unrealised part, at the fund's own NAV marks. */
  rvpi: number;
  /** Total value to paid-in = DPI + RVPI. */
  tvpi: number;
};

/**
 * Fund-level multiples on paid-in (called) capital, not commitments. Definitions follow the ILPA
 * reporting guidance and the CFA Institute curriculum (Private Equity Investments): DPI = cumulative
 * distributions / paid-in, RVPI = NAV / paid-in, TVPI = DPI + RVPI.
 */
export function fundMultiples(paidIn: number, distributions: number, nav: number): FundMultiples {
  if (paidIn <= 0 || distributions < 0 || nav < 0) throw new RangeError("Invalid fund multiples input");
  const dpi = distributions / paidIn, rvpi = nav / paidIn;
  return { dpi, rvpi, tvpi: dpi + rvpi };
}
