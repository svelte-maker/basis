import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";
import { bondPrice, bondYield, currentYield, forwardRate, macaulayDuration } from "@/lib/finance/fixedIncome";
import { blackScholes, putFromParity } from "@/lib/finance/options";
import { irr } from "@/lib/finance/tvm";
import { twoAsset } from "@/lib/finance/portfolio";

export const fixedIncome: Template[] = [
  {
    slug: "bond-price",
    title: "Price a coupon bond",
    track: "Fixed Income",
    difficulty: "Medium",
    concepts: ["Bond pricing", "Yield"],
    generate(rng) {
      const c = pick(rng, 0.02, 0.08, 0.005), y = pick(rng, 0.02, 0.09, 0.005), n = pick(rng, 2, 10, 1), freq = rng() < 0.5 ? 1 : 2;
      const ans = bondPrice({ face: 1000, couponRate: c, years: n, freq }, y);
      return {
        blocks: [{ kind: "p", text: `A bond has a **$1,000** face value, pays a **${pct(c)}** coupon **${freq === 1 ? "annually" : "semi-annually"}** and matures in **${n} years**. Its yield to maturity is **${pct(y)}** (${freq === 1 ? "annual" : "bond-equivalent, semi-annual"} compounding).` }],
        question: "What is the bond's price?",
        answer: ans, unit: "$", tolerance: { abs: 0.05 },
        solution: [
          `Coupon per period = ${money((1000 * c) / freq, 2)}, periods = ${n * freq}, periodic yield = ${pct(y / freq, 3)}.`,
          `Price = Σ coupon/(1+y)^k + 1,000/(1+y)^${n * freq} = **${money(ans, 2)}**.`,
          c < y ? "Coupon below yield, so it trades below par." : c > y ? "Coupon above yield, so it trades above par." : "Coupon equals yield, so it trades at par.",
        ],
      };
    },
  },
  {
    slug: "yield-to-maturity",
    title: "Solve for yield to maturity",
    track: "Fixed Income",
    difficulty: "Hard",
    concepts: ["Yield", "Root finding"],
    generate(rng) {
      const c = pick(rng, 0.02, 0.08, 0.005), n = pick(rng, 3, 10, 1), price = pick(rng, 880, 1120, 5);
      const ans = bondYield({ face: 1000, couponRate: c, years: n }, price) * 100;
      return {
        blocks: [{ kind: "p", text: `A **${n}-year** bond with a **$1,000** face value pays a **${pct(c)}** annual coupon and trades at **${money(price, 2)}**.` }],
        question: "What is its yield to maturity? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: ["Find y such that the PV of coupons and principal equals the price (Excel: =RATE or =YIELD).", `YTM = **${ans.toFixed(3)}%**.`],
      };
    },
  },
  {
    slug: "macaulay-duration",
    title: "Macaulay duration",
    track: "Fixed Income",
    difficulty: "Medium",
    concepts: ["Duration", "Interest rate risk"],
    generate(rng) {
      const c = pick(rng, 0.03, 0.1, 0.01), y = pick(rng, 0.03, 0.1, 0.005), n = pick(rng, 2, 4, 1);
      const b = { face: 1000, couponRate: c, years: n };
      const ans = macaulayDuration(b, y);
      return {
        blocks: [{ kind: "p", text: `A **${n}-year** bond pays a **${pct(c)}** annual coupon on **$1,000** face and yields **${pct(y)}**.` }],
        question: "What is its Macaulay duration in years? Three decimals.",
        answer: ans, unit: "years", tolerance: { abs: 0.002 },
        solution: ["Weight each payment time by the share of price that payment's PV represents.", `D = Σ t × PV(CFt) / Price = **${ans.toFixed(3)} years**.`],
      };
    },
  },
  {
    slug: "duration-convexity-estimate",
    title: "Price change from duration and convexity",
    track: "Fixed Income",
    difficulty: "Medium",
    concepts: ["Duration", "Convexity"],
    generate(rng) {
      const md = pick(rng, 2, 15, 0.1), cx = pick(rng, 10, 250, 5), bp = pick(rng, -150, 150, 25) || 50;
      const dy = bp / 10_000;
      const ans = (-md * dy + 0.5 * cx * dy * dy) * 100;
      return {
        blocks: [{ kind: "p", text: `A bond portfolio has modified duration **${md.toFixed(1)}** and convexity **${cx}**. Yields move by **${bp > 0 ? "+" : ""}${bp} basis points**.` }],
        question: "What is the estimated percentage price change? Two decimals, negative for a fall.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`ΔP/P ≈ −D × Δy + ½ × C × Δy² = −${md} × ${dy} + 0.5 × ${cx} × ${dy}² = **${ans.toFixed(3)}%**.`],
      };
    },
  },
  {
    slug: "implied-forward-rate",
    title: "Implied forward rate",
    track: "Fixed Income",
    difficulty: "Medium",
    concepts: ["Term structure", "Forward rates"],
    generate(rng) {
      const s1 = pick(rng, 0.01, 0.06, 0.0025), t2 = pick(rng, 2, 5, 1), s2 = s1 + pick(rng, -0.01, 0.02, 0.0025);
      const ans = forwardRate(s1, 1, s2, t2) * 100;
      return {
        blocks: [{ kind: "p", text: `The 1-year spot rate is **${pct(s1)}** and the ${t2}-year spot rate is **${pct(s2)}** (annual compounding).` }],
        question: `What is the implied ${t2 - 1}-year rate starting one year from now? Percentage to two decimals.`,
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`(1 + f)^${t2 - 1} = (1 + ${pct(s2)})^${t2} / (1 + ${pct(s1)}).`, `f = **${ans.toFixed(3)}%** a year.`],
      };
    },
  },
  {
    slug: "current-yield",
    title: "Current yield",
    track: "Fixed Income",
    difficulty: "Easy",
    concepts: ["Yield measures"],
    generate(rng) {
      const c = pick(rng, 0.02, 0.09, 0.0025), price = pick(rng, 850, 1150, 5);
      const ans = currentYield({ face: 1000, couponRate: c, years: 5 }, price) * 100;
      return {
        blocks: [{ kind: "p", text: `A bond with **$1,000** face and a **${pct(c)}** annual coupon trades at **${money(price)}**.` }],
        question: "What is its current yield? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`Current yield = annual coupon / price = ${money(1000 * c, 2)} / ${money(price)} = **${ans.toFixed(3)}%**.`],
      };
    },
  },
];

export const derivatives: Template[] = [
  {
    slug: "put-call-parity",
    title: "Put-call parity",
    track: "Derivatives",
    difficulty: "Medium",
    concepts: ["Options", "No-arbitrage"],
    generate(rng) {
      const s = pick(rng, 40, 150, 1), k = Math.round(s * pick(rng, 0.85, 1.15, 0.05)), r = pick(rng, 0.02, 0.07, 0.005), t = pick(rng, 0.5, 2, 0.5);
      const minC = Math.max(0, s - k / Math.pow(1 + r, t));
      const c = Number((minC + pick(rng, 2, 12, 0.25)).toFixed(2));
      const ans = putFromParity(c, s, k, r, t);
      return {
        blocks: [{ kind: "p", text: `A **${t}-year** European call with strike **${money(k)}** costs **${money(c, 2)}**. The stock is at **${money(s)}** and pays no dividend. The rate is **${pct(r)}** (annual compounding).` }],
        question: "What must the matching European put cost?",
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: [`C + PV(K) = P + S, so P = C − S + K/(1+r)^t.`, `P = ${c} − ${s} + ${k}/${(1 + r).toFixed(3)}^${t} = **${money(ans, 2)}**.`],
      };
    },
  },
  {
    slug: "black-scholes-call",
    title: "Black-Scholes call value",
    track: "Derivatives",
    difficulty: "Hard",
    concepts: ["Black-Scholes", "Options pricing"],
    generate(rng) {
      const s = pick(rng, 50, 150, 1), k = Math.round(s * pick(rng, 0.9, 1.1, 0.05)), t = pick(rng, 0.25, 2, 0.25), r = pick(rng, 0.01, 0.06, 0.005), v = pick(rng, 0.15, 0.5, 0.01);
      const g = blackScholes({ spot: s, strike: k, t, rate: r, vol: v }, "call");
      return {
        blocks: [{ kind: "p", text: `Spot **${money(s)}**, strike **${money(k)}**, time to expiry **${t} years**, continuously compounded risk-free rate **${pct(r)}**, volatility **${pct(v)}**, no dividends.` }],
        question: "What is the Black-Scholes value of a European call?",
        answer: g.price, unit: "$", tolerance: { abs: 0.02 },
        solution: [
          "d1 = [ln(S/K) + (r + σ²/2)t] / (σ√t), d2 = d1 − σ√t.",
          `C = S·N(d1) − K·e^(−rt)·N(d2) = **${money(g.price, 2)}**. Delta = ${g.delta.toFixed(3)}.`,
        ],
      };
    },
  },
  {
    slug: "forward-price",
    title: "Forward price with no income",
    track: "Derivatives",
    difficulty: "Easy",
    concepts: ["Forwards", "Cost of carry"],
    generate(rng) {
      const s = pick(rng, 20, 500, 5), r = pick(rng, 0.01, 0.07, 0.005), t = pick(rng, 0.5, 3, 0.5);
      const ans = s * Math.pow(1 + r, t);
      return {
        blocks: [{ kind: "p", text: `A non-dividend-paying stock trades at **${money(s)}**. The risk-free rate is **${pct(r)}** (annual compounding).` }],
        question: `What is the no-arbitrage forward price for delivery in ${t} years?`,
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: [`F = S × (1 + r)^t = ${s} × ${(1 + r).toFixed(3)}^${t} = **${money(ans, 2)}**.`],
      };
    },
  },
  {
    slug: "straddle-payoff",
    title: "Long straddle profit",
    track: "Derivatives",
    difficulty: "Easy",
    concepts: ["Option strategies", "Payoffs"],
    generate(rng) {
      const k = pick(rng, 50, 200, 5), c = pick(rng, 2, 12, 0.5), p = pick(rng, 2, 12, 0.5), st = k + pick(rng, -40, 40, 1);
      const ans = Math.abs(st - k) - c - p;
      return {
        blocks: [{ kind: "p", text: `You buy a call for **${money(c, 2)}** and a put for **${money(p, 2)}**, both European with strike **${money(k)}** and the same expiry. At expiry the stock is **${money(st)}**.` }],
        question: "What is your profit or loss per share? Negative for a loss. Ignore the time value of the premiums.",
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: [`Payoff = |S − K| = ${Math.abs(st - k)}. Premiums paid = ${(c + p).toFixed(2)}.`, `P&L = **${money(ans, 2)}**. Break-evens are ${k} ± ${(c + p).toFixed(2)}.`],
      };
    },
  },
  {
    slug: "one-step-binomial",
    title: "One-step binomial call",
    track: "Derivatives",
    difficulty: "Hard",
    concepts: ["Binomial model", "Risk-neutral pricing"],
    generate(rng) {
      const s = pick(rng, 40, 120, 5), u = pick(rng, 1.1, 1.4, 0.05), d = Number((1 / u).toFixed(4)), r = pick(rng, 0.01, 0.06, 0.01);
      const k = Math.round(s * pick(rng, 0.9, 1.1, 0.05));
      const q = (1 + r - d) / (u - d);
      const cu = Math.max(0, s * u - k), cd = Math.max(0, s * d - k);
      const ans = (q * cu + (1 - q) * cd) / (1 + r);
      return {
        blocks: [{ kind: "p", text: `A stock at **${money(s)}** will move up by a factor of **${u.toFixed(2)}** or down by **${d.toFixed(4)}** over one period. The one-period risk-free rate is **${pct(r)}**.` }],
        question: `What is the value of a one-period European call with strike ${money(k)}?`,
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: [
          `Risk-neutral probability q = (1 + r − d)/(u − d) = ${q.toFixed(4)}.`,
          `Payoffs: up ${money(cu, 2)}, down ${money(cd, 2)}.`,
          `C = [q × ${cu.toFixed(2)} + (1 − q) × ${cd.toFixed(2)}] / ${(1 + r).toFixed(2)} = **${money(ans, 2)}**.`,
        ],
      };
    },
  },
];

export const privateEquity: Template[] = [
  {
    slug: "irr-from-moic",
    title: "IRR from a multiple of money",
    track: "Private Equity",
    difficulty: "Medium",
    concepts: ["IRR", "MOIC", "Returns"],
    generate(rng) {
      const eq = pick(rng, 100, 800, 25), moic = pick(rng, 1.5, 4, 0.1), n = pick(rng, 3, 7, 1);
      const ans = (Math.pow(moic, 1 / n) - 1) * 100;
      return {
        blocks: [{ kind: "p", text: `A sponsor invests **${money(eq)}m** of equity and exits after **${n} years** with **${money(eq * moic, 1)}m**. There are no interim distributions.` }],
        question: "What is the IRR? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.02 },
        solution: [`MOIC = ${moic.toFixed(1)}x.`, `IRR = ${moic.toFixed(1)}^(1/${n}) − 1 = **${ans.toFixed(2)}%**.`, "Rules of thumb: 2x in 5 years ≈ 15%, 3x in 5 years ≈ 25%."],
      };
    },
  },
  {
    slug: "lbo-sources-and-uses",
    title: "LBO sources and uses",
    track: "Private Equity",
    difficulty: "Easy",
    concepts: ["LBO", "Sources and uses"],
    generate(rng) {
      const ebitda = pick(rng, 50, 300, 5), m = pick(rng, 7, 13, 0.5), lev = pick(rng, 3, 6.5, 0.5), feePct = pick(rng, 0.01, 0.03, 0.005), cash = pick(rng, 0, 40, 5);
      const ev = ebitda * m, fees = ev * feePct, debt = ebitda * lev;
      const ans = ev + fees + cash - debt;
      return {
        blocks: [{ kind: "p", text: `A sponsor buys a company with **${money(ebitda)}m** of EBITDA at **${m.toFixed(1)}x** EV/EBITDA, on a cash-free, debt-free basis. Transaction fees are **${pct(feePct)}** of EV, and the business needs **${money(cash)}m** of minimum cash on the balance sheet at close. Lenders provide **${lev.toFixed(1)}x** EBITDA of debt.` }],
        question: "How much equity must the sponsor contribute, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.05 },
        solution: [`Uses = EV ${money(ev, 1)} + fees ${money(fees, 2)} + cash ${money(cash)} = ${money(ev + fees + cash, 2)}m.`, `Sources: debt ${money(debt, 1)}m, so equity = **${money(ans, 2)}m**.`],
      };
    },
  },
  {
    slug: "lbo-exit-returns",
    title: "LBO exit returns",
    track: "Private Equity",
    difficulty: "Hard",
    concepts: ["LBO", "Value creation"],
    generate(rng) {
      const e0 = pick(rng, 50, 200, 5), m0 = pick(rng, 8, 12, 0.5), lev = pick(rng, 4, 6, 0.5), g = pick(rng, 0.03, 0.12, 0.01), n = 5;
      const exitM = m0 + pick(rng, -1.5, 1.5, 0.5), paydownPct = pick(rng, 0.2, 0.6, 0.05);
      const debt0 = e0 * lev, eq0 = e0 * m0 - debt0;
      const e5 = e0 * Math.pow(1 + g, n), debt5 = debt0 * (1 - paydownPct);
      const eq5 = e5 * exitM - debt5;
      const ans = irr([-eq0, 0, 0, 0, 0, eq5]) * 100;
      return {
        blocks: [{ kind: "p", text: `A sponsor buys a business with **${money(e0)}m** EBITDA at **${m0.toFixed(1)}x**, funded with **${lev.toFixed(1)}x** debt and the rest equity (ignore fees). EBITDA grows **${pct(g)}** a year. Over **5 years** the company repays **${pct(paydownPct, 0)}** of the opening debt and holds no excess cash. It exits at **${exitM.toFixed(1)}x**.` }],
        question: "What is the sponsor's IRR? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.03 },
        solution: [
          `Entry equity = ${money(e0 * m0, 1)} − ${money(debt0, 1)} = ${money(eq0, 1)}m.`,
          `Year-5 EBITDA = ${money(e5, 2)}m. Exit EV = ${money(e5 * exitM, 2)}m. Remaining debt = ${money(debt5, 2)}m.`,
          `Exit equity = ${money(eq5, 2)}m, MOIC = ${(eq5 / eq0).toFixed(2)}x, IRR = **${ans.toFixed(2)}%**.`,
        ],
      };
    },
  },
];

export const portfolioRisk: Template[] = [
  {
    slug: "portfolio-expected-return",
    title: "Portfolio expected return",
    track: "Portfolio & Risk",
    difficulty: "Easy",
    concepts: ["Portfolio theory"],
    generate(rng) {
      const w1 = pick(rng, 0.1, 0.6, 0.05), w2 = pick(rng, 0.1, 0.9 - w1, 0.05), w3 = Number((1 - w1 - w2).toFixed(2));
      const r = [pick(rng, 0.02, 0.06, 0.005), pick(rng, 0.05, 0.1, 0.005), pick(rng, 0.08, 0.15, 0.005)];
      const ans = (w1 * r[0] + w2 * r[1] + w3 * r[2]) * 100;
      return {
        blocks: [{ kind: "table", head: ["Asset", "Weight", "Expected return"], rows: [["Bonds", pct(w1, 0), pct(r[0])], ["Large caps", pct(w2, 0), pct(r[1])], ["Small caps", pct(w3, 0), pct(r[2])]] }],
        question: "What is the portfolio's expected return? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`Weighted average: **${ans.toFixed(3)}%**.`],
      };
    },
  },
  {
    slug: "two-asset-volatility",
    title: "Two-asset portfolio volatility",
    track: "Portfolio & Risk",
    difficulty: "Medium",
    concepts: ["Diversification", "Correlation"],
    generate(rng) {
      const w = pick(rng, 0.2, 0.8, 0.05), s1 = pick(rng, 0.1, 0.35, 0.01), s2 = pick(rng, 0.05, 0.25, 0.01), rho = pick(rng, -0.5, 0.9, 0.1);
      const ans = twoAsset(w, 0, s1, 0, s2, rho).vol * 100;
      return {
        blocks: [{ kind: "p", text: `You hold **${pct(w, 0)}** in asset A (volatility **${pct(s1, 0)}**) and the rest in asset B (volatility **${pct(s2, 0)}**). Their correlation is **${rho.toFixed(1)}**.` }],
        question: "What is the portfolio's volatility? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`σp² = w²σA² + (1−w)²σB² + 2w(1−w)ρσAσB.`, `σp = **${ans.toFixed(3)}%**.`],
      };
    },
  },
  {
    slug: "sharpe-ratio",
    title: "Sharpe ratio",
    track: "Portfolio & Risk",
    difficulty: "Easy",
    concepts: ["Risk-adjusted return"],
    generate(rng) {
      const r = pick(rng, 0.04, 0.18, 0.005), rf = pick(rng, 0.01, 0.05, 0.005), s = pick(rng, 0.06, 0.3, 0.01);
      const ans = (r - rf) / s;
      return {
        blocks: [{ kind: "p", text: `A fund returned **${pct(r)}** a year with volatility **${pct(s)}**. The risk-free rate was **${pct(rf)}**.` }],
        question: "What is its Sharpe ratio? Three decimals.",
        answer: ans, unit: "", tolerance: { abs: 0.002 },
        solution: [`(${pct(r)} − ${pct(rf)}) / ${pct(s)} = **${ans.toFixed(3)}**.`],
      };
    },
  },
  {
    slug: "parametric-var",
    title: "One-day value at risk",
    track: "Portfolio & Risk",
    difficulty: "Medium",
    concepts: ["VaR", "Market risk"],
    generate(rng) {
      const v = pick(rng, 1, 50, 1) * 1_000_000, s = pick(rng, 0.1, 0.4, 0.01);
      const [conf, z] = rng() < 0.5 ? [95, 1.645] : [99, 2.326];
      const ans = (v * z * s) / Math.sqrt(252);
      return {
        blocks: [{ kind: "p", text: `A **${money(v)}** equity position has annual volatility of **${pct(s)}**. Assume normal returns, zero mean daily return and 252 trading days. Use z = **${z}** for ${conf}% confidence.` }],
        question: `What is the 1-day ${conf}% VaR, in dollars?`,
        answer: ans, unit: "$", tolerance: { rel: 0.001 },
        solution: [`Daily σ = ${pct(s)} / √252 = ${pct(s / Math.sqrt(252), 4)}.`, `VaR = ${money(v)} × ${z} × daily σ = **${money(ans)}**.`],
      };
    },
  },
  {
    slug: "jensens-alpha",
    title: "Jensen's alpha",
    track: "Portfolio & Risk",
    difficulty: "Medium",
    concepts: ["CAPM", "Performance attribution"],
    generate(rng) {
      const rp = pick(rng, 0.04, 0.2, 0.005), rf = pick(rng, 0.01, 0.05, 0.005), rm = pick(rng, 0.04, 0.15, 0.005), b = pick(rng, 0.6, 1.6, 0.05);
      const ans = (rp - (rf + b * (rm - rf))) * 100;
      return {
        blocks: [{ kind: "p", text: `A manager returned **${pct(rp)}** with a beta of **${b.toFixed(2)}**. The market returned **${pct(rm)}** and the risk-free rate was **${pct(rf)}**.` }],
        question: "What is Jensen's alpha? Percentage to two decimals, negative if the manager underperformed.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`Required = ${pct(rf)} + ${b.toFixed(2)} × (${pct(rm)} − ${pct(rf)}) = ${pct(rf + b * (rm - rf), 3)}.`, `α = ${pct(rp)} − required = **${ans.toFixed(3)}%**.`],
      };
    },
  },
];

export const bankingCredit: Template[] = [
  {
    slug: "debt-service-coverage",
    title: "Debt service coverage ratio",
    track: "Banking & Credit",
    difficulty: "Easy",
    concepts: ["Credit analysis", "DSCR"],
    generate(rng) {
      const noi = pick(rng, 200, 2000, 10) * 1000, interest = pick(rng, 50, 600, 10) * 1000, principal = pick(rng, 30, 400, 10) * 1000;
      const ans = noi / (interest + principal);
      return {
        blocks: [{ kind: "p", text: `A commercial property earns net operating income of **${money(noi)}** a year. Annual loan interest is **${money(interest)}** and scheduled principal repayment is **${money(principal)}**.` }],
        question: "What is the debt service coverage ratio? Two decimals.",
        answer: ans, unit: "x", tolerance: { abs: 0.006 },
        solution: [`DSCR = NOI / (interest + principal) = ${num(noi)} / ${num(interest + principal)} = **${ans.toFixed(2)}x**.`, "Lenders typically want at least 1.20–1.35x."],
      };
    },
  },
  {
    slug: "expected-credit-loss",
    title: "Expected credit loss",
    track: "Banking & Credit",
    difficulty: "Easy",
    concepts: ["Credit risk", "PD", "LGD"],
    generate(rng) {
      const pd = pick(rng, 0.005, 0.08, 0.005), recovery = pick(rng, 0.2, 0.7, 0.05), ead = pick(rng, 1, 100, 1) * 1_000_000;
      const ans = pd * (1 - recovery) * ead;
      return {
        blocks: [{ kind: "p", text: `A loan has exposure at default of **${money(ead)}**, a one-year probability of default of **${pct(pd)}** and an expected recovery rate of **${pct(recovery, 0)}**.` }],
        question: "What is the one-year expected loss, in dollars?",
        answer: ans, unit: "$", tolerance: { abs: 1 },
        solution: [`LGD = 1 − recovery = ${pct(1 - recovery, 0)}.`, `EL = PD × LGD × EAD = **${money(ans)}**.`],
      };
    },
  },
  {
    slug: "net-interest-margin",
    title: "Net interest margin",
    track: "Banking & Credit",
    difficulty: "Medium",
    concepts: ["Bank profitability"],
    generate(rng) {
      const a0 = pick(rng, 5, 50, 1) * 1000, a1 = a0 * pick(rng, 0.95, 1.15, 0.01), ii = ((a0 + a1) / 2) * pick(rng, 0.04, 0.07, 0.0025), ie = ii * pick(rng, 0.3, 0.6, 0.05);
      const ans = ((ii - ie) / ((a0 + a1) / 2)) * 100;
      return {
        blocks: [{ kind: "table", head: ["Item", "$m"], rows: [["Earning assets, start of year", num(a0)], ["Earning assets, end of year", num(a1, 1)], ["Interest income", num(ii, 1)], ["Interest expense", num(ie, 1)]] }],
        question: "What is the bank's net interest margin on average earning assets? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: [`Average earning assets = ${num((a0 + a1) / 2, 1)}.`, `NIM = (${num(ii, 1)} − ${num(ie, 1)}) / ${num((a0 + a1) / 2, 1)} = **${ans.toFixed(3)}%**.`],
      };
    },
  },
  {
    slug: "leverage-and-coverage",
    title: "Leverage and interest coverage",
    track: "Banking & Credit",
    difficulty: "Easy",
    concepts: ["Credit metrics"],
    generate(rng) {
      const ebitda = pick(rng, 50, 500, 5), da = ebitda * pick(rng, 0.1, 0.3, 0.05), debt = ebitda * pick(rng, 1, 6, 0.25), rate = pick(rng, 0.05, 0.1, 0.005);
      const interest = debt * rate;
      const ans = (ebitda - da) / interest;
      return {
        blocks: [{ kind: "p", text: `A borrower has EBITDA of **${money(ebitda)}m**, D&A of **${money(da, 1)}m** and **${money(debt, 1)}m** of debt at an average rate of **${pct(rate)}**.` }],
        question: "What is its EBIT interest coverage? Two decimals.",
        answer: ans, unit: "x", tolerance: { abs: 0.006 },
        solution: [`EBIT = ${num(ebitda)} − ${num(da, 1)} = ${num(ebitda - da, 1)}. Interest = ${num(interest, 2)}.`, `Coverage = **${ans.toFixed(2)}x**. Leverage is ${(debt / ebitda).toFixed(2)}x EBITDA.`],
      };
    },
  },
];
