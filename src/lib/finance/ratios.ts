// Financial statement ratios. All inputs in the same currency unit.

export type Statements = {
  revenue: number; cogs: number; opex: number; da: number; interestExpense: number; taxExpense: number; netIncome: number;
  cash: number; receivables: number; inventory: number; currentAssets: number; totalAssets: number;
  payables: number; currentLiabilities: number; totalDebt: number; totalEquity: number; retainedEarnings: number;
  cfo: number; capex: number; sharePrice?: number; sharesOutstanding?: number;
};

export type RatioGroup = { group: string; items: { name: string; value: number; unit: "x" | "%" | "days" | "$"; formula: string }[] };

const safe = (a: number, b: number) => (b === 0 ? NaN : a / b);

export function computeRatios(s: Statements): RatioGroup[] {
  const grossProfit = s.revenue - s.cogs;
  const ebitda = grossProfit - s.opex;
  const ebit = ebitda - s.da;
  const totalLiabilities = s.totalAssets - s.totalEquity;
  const marketCap = s.sharePrice && s.sharesOutstanding ? s.sharePrice * s.sharesOutstanding : NaN;
  const ev = marketCap + s.totalDebt - s.cash;
  const fcf = s.cfo - s.capex;
  const groups: RatioGroup[] = [
    { group: "Profitability", items: [
      { name: "Gross margin", value: safe(grossProfit, s.revenue), unit: "%", formula: "(Revenue − COGS) / Revenue" },
      { name: "EBITDA margin", value: safe(ebitda, s.revenue), unit: "%", formula: "EBITDA / Revenue" },
      { name: "EBIT margin", value: safe(ebit, s.revenue), unit: "%", formula: "EBIT / Revenue" },
      { name: "Net margin", value: safe(s.netIncome, s.revenue), unit: "%", formula: "Net income / Revenue" },
      { name: "Return on assets", value: safe(s.netIncome, s.totalAssets), unit: "%", formula: "Net income / Total assets" },
      { name: "Return on equity", value: safe(s.netIncome, s.totalEquity), unit: "%", formula: "Net income / Equity" },
      { name: "ROIC (pre-cash)", value: safe(ebit * (1 - safe(s.taxExpense, s.netIncome + s.taxExpense)), s.totalDebt + s.totalEquity), unit: "%", formula: "EBIT × (1 − effective tax) / (Debt + Equity)" },
    ]},
    { group: "Liquidity", items: [
      { name: "Current ratio", value: safe(s.currentAssets, s.currentLiabilities), unit: "x", formula: "Current assets / Current liabilities" },
      { name: "Quick ratio", value: safe(s.currentAssets - s.inventory, s.currentLiabilities), unit: "x", formula: "(Current assets − Inventory) / Current liabilities" },
      { name: "Cash ratio", value: safe(s.cash, s.currentLiabilities), unit: "x", formula: "Cash / Current liabilities" },
    ]},
    { group: "Leverage and coverage", items: [
      { name: "Debt / Equity", value: safe(s.totalDebt, s.totalEquity), unit: "x", formula: "Total debt / Equity" },
      { name: "Net debt / EBITDA", value: safe(s.totalDebt - s.cash, ebitda), unit: "x", formula: "(Debt − Cash) / EBITDA" },
      { name: "Interest coverage", value: safe(ebit, s.interestExpense), unit: "x", formula: "EBIT / Interest expense" },
      { name: "Equity multiplier", value: safe(s.totalAssets, s.totalEquity), unit: "x", formula: "Total assets / Equity" },
    ]},
    { group: "Efficiency", items: [
      { name: "Asset turnover", value: safe(s.revenue, s.totalAssets), unit: "x", formula: "Revenue / Total assets" },
      { name: "Days sales outstanding", value: safe(s.receivables, s.revenue) * 365, unit: "days", formula: "Receivables / Revenue × 365" },
      { name: "Days inventory outstanding", value: safe(s.inventory, s.cogs) * 365, unit: "days", formula: "Inventory / COGS × 365" },
      { name: "Days payables outstanding", value: safe(s.payables, s.cogs) * 365, unit: "days", formula: "Payables / COGS × 365" },
      { name: "Cash conversion cycle", value: (safe(s.receivables, s.revenue) + safe(s.inventory, s.cogs) - safe(s.payables, s.cogs)) * 365, unit: "days", formula: "DSO + DIO − DPO" },
    ]},
    { group: "Cash flow", items: [
      { name: "Free cash flow", value: fcf, unit: "$", formula: "CFO − Capex" },
      { name: "FCF conversion", value: safe(fcf, s.netIncome), unit: "%", formula: "FCF / Net income" },
      { name: "Capex / Revenue", value: safe(s.capex, s.revenue), unit: "%", formula: "Capex / Revenue" },
    ]},
  ];
  if (isFinite(marketCap)) {
    groups.push({ group: "Valuation", items: [
      { name: "P/E", value: safe(marketCap, s.netIncome), unit: "x", formula: "Market cap / Net income" },
      { name: "EV / EBITDA", value: safe(ev, ebitda), unit: "x", formula: "(Market cap + Debt − Cash) / EBITDA" },
      { name: "EV / Revenue", value: safe(ev, s.revenue), unit: "x", formula: "EV / Revenue" },
      { name: "P / Book", value: safe(marketCap, s.totalEquity), unit: "x", formula: "Market cap / Equity" },
      { name: "FCF yield", value: safe(fcf, marketCap), unit: "%", formula: "FCF / Market cap" },
    ]});
    groups.push({ group: "Distress", items: [
      { name: "Altman Z-score", value: altmanZ(s, marketCap, ebit, totalLiabilities), unit: "x", formula: "1.2·WC/TA + 1.4·RE/TA + 3.3·EBIT/TA + 0.6·MVE/TL + 1.0·Sales/TA (above 2.99 safe, below 1.81 distress)" },
    ]});
  }
  return groups;
}

export function dupont(s: Statements): { netMargin: number; assetTurnover: number; equityMultiplier: number; roe: number } {
  const netMargin = safe(s.netIncome, s.revenue);
  const assetTurnover = safe(s.revenue, s.totalAssets);
  const equityMultiplier = safe(s.totalAssets, s.totalEquity);
  return { netMargin, assetTurnover, equityMultiplier, roe: netMargin * assetTurnover * equityMultiplier };
}

function altmanZ(s: Statements, marketCap: number, ebit: number, totalLiabilities: number): number {
  const ta = s.totalAssets;
  return 1.2 * safe(s.currentAssets - s.currentLiabilities, ta) + 1.4 * safe(s.retainedEarnings, ta)
    + 3.3 * safe(ebit, ta) + 0.6 * safe(marketCap, totalLiabilities) + 1.0 * safe(s.revenue, ta);
}
