export const TOOLS = [
  { slug: "dcf", title: "DCF model", blurb: "Five-year unlevered DCF with Gordon or exit-multiple terminal value, mid-year convention and a WACC × growth sensitivity table." },
  { slug: "lbo", title: "LBO returns", blurb: "Sources and uses, debt schedule with mandatory amortisation and cash sweep, IRR, MOIC and a value-creation bridge." },
  { slug: "wacc", title: "WACC and beta", blurb: "CAPM cost of equity, unlever and relever beta, after-tax cost of debt, and the weighted cost of capital." },
  { slug: "comps", title: "Trading comps", blurb: "Enter peers, get EV/Revenue, EV/EBITDA and P/E ranges, then implied share prices for your target." },
  { slug: "bond", title: "Bond calculator", blurb: "Price from yield or yield from price, Macaulay and modified duration, convexity and a price-yield table." },
  { slug: "options", title: "Options pricer", blurb: "Black-Scholes with Greeks, implied volatility, and a binomial tree for American options." },
  { slug: "tvm", title: "NPV and IRR", blurb: "Discount an irregular cash-flow series: NPV, IRR, MIRR, payback and discounted payback." },
  { slug: "loan", title: "Loan amortisation", blurb: "Payment, full schedule, total interest and the effect of extra payments." },
  { slug: "ratios", title: "Ratio analysis", blurb: "Profitability, liquidity, leverage, efficiency, cash flow and valuation ratios, DuPont and Altman Z." },
  { slug: "risk", title: "Portfolio risk", blurb: "Two-asset frontier, minimum-variance weight, parametric VaR and the Sharpe ratio." },
] as const;
