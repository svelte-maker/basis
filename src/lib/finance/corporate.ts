// Cost of capital, capital structure and dividend models.

export function capm(riskFree: number, beta: number, marketPremium: number): number {
  return riskFree + beta * marketPremium;
}

export type WaccInput = { equityValue: number; debtValue: number; costOfEquity: number; preTaxCostOfDebt: number; taxRate: number; preferredValue?: number; costOfPreferred?: number };

export function wacc(i: WaccInput): number {
  const p = i.preferredValue ?? 0;
  const v = i.equityValue + i.debtValue + p;
  if (v <= 0) throw new RangeError("Total capital must be positive");
  return (i.equityValue / v) * i.costOfEquity
    + (i.debtValue / v) * i.preTaxCostOfDebt * (1 - i.taxRate)
    + (p / v) * (i.costOfPreferred ?? 0);
}

/** Hamada: remove financial leverage from an observed beta. */
export function unleverBeta(leveredBeta: number, debtToEquity: number, taxRate: number): number {
  return leveredBeta / (1 + (1 - taxRate) * debtToEquity);
}

export function releverBeta(unleveredBeta: number, debtToEquity: number, taxRate: number): number {
  return unleveredBeta * (1 + (1 - taxRate) * debtToEquity);
}

/** Gordon growth: price today from the dividend just paid (d0). */
export function gordonGrowth(d0: number, requiredReturn: number, growth: number): number {
  if (requiredReturn <= growth) throw new RangeError("Required return must exceed growth");
  return (d0 * (1 + growth)) / (requiredReturn - growth);
}

/** Two-stage DDM: high growth for `years`, then stable growth forever. */
export function twoStageDDM(d0: number, requiredReturn: number, highGrowth: number, years: number, stableGrowth: number): number {
  let price = 0, d = d0;
  for (let t = 1; t <= years; t++) {
    d *= 1 + highGrowth;
    price += d / Math.pow(1 + requiredReturn, t);
  }
  const terminal = (d * (1 + stableGrowth)) / (requiredReturn - stableGrowth);
  return price + terminal / Math.pow(1 + requiredReturn, years);
}

export function fcff(ebit: number, taxRate: number, da: number, capex: number, changeInNWC: number): number {
  return ebit * (1 - taxRate) + da - capex - changeInNWC;
}

export function fcfe(fcffValue: number, interest: number, taxRate: number, netBorrowing: number): number {
  return fcffValue - interest * (1 - taxRate) + netBorrowing;
}

export type EVBridge = { sharePrice: number; dilutedShares: number; debt: number; cash: number; preferred?: number; minorityInterest?: number; investments?: number };

export function enterpriseValue(b: EVBridge): number {
  return b.sharePrice * b.dilutedShares + b.debt - b.cash + (b.preferred ?? 0) + (b.minorityInterest ?? 0) - (b.investments ?? 0);
}

/** Treasury stock method: net new shares from in-the-money options. */
export function treasuryStockMethod(sharePrice: number, options: { count: number; strike: number }[]): number {
  return options.reduce((s, o) => (sharePrice > o.strike ? s + o.count - (o.count * o.strike) / sharePrice : s), 0);
}

/** Pro forma EPS accretion/(dilution) for a stock-and-cash acquisition. */
export function accretionDilution(i: {
  acquirerNetIncome: number; acquirerShares: number; targetNetIncome: number; purchasePrice: number;
  pctStock: number; acquirerSharePrice: number; costOfDebt: number; taxRate: number; synergies?: number;
}): { standaloneEPS: number; proFormaEPS: number; accretion: number; newShares: number } {
  const standaloneEPS = i.acquirerNetIncome / i.acquirerShares;
  const newShares = (i.purchasePrice * i.pctStock) / i.acquirerSharePrice;
  const debt = i.purchasePrice * (1 - i.pctStock);
  const afterTaxInterest = debt * i.costOfDebt * (1 - i.taxRate);
  const synergies = (i.synergies ?? 0) * (1 - i.taxRate);
  const proFormaNI = i.acquirerNetIncome + i.targetNetIncome - afterTaxInterest + synergies;
  const proFormaEPS = proFormaNI / (i.acquirerShares + newShares);
  return { standaloneEPS, proFormaEPS, accretion: proFormaEPS / standaloneEPS - 1, newShares };
}
