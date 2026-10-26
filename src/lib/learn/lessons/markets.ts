import { bondPrice, bootstrapZeros, convexity, currentYield, forwardRate, macaulayDuration, modifiedDuration, priceChangeApprox, type Bond } from "@/lib/finance/fixedIncome";
import { binomial, blackScholes, type BSInput } from "@/lib/finance/options";
import { jensensAlpha, minVarianceWeight, parametricVaR, twoAsset } from "@/lib/finance/portfolio";
import { amortizationSchedule, pmt } from "@/lib/finance/tvm";
import { money, num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Bonds ----------

const bond: Bond = { face: 1000, couponRate: 0.07, years: 10, freq: 2 };
const pPar = bondPrice(bond, 0.07), pUp = bondPrice(bond, 0.08), pDown = bondPrice(bond, 0.06);
const macD = macaulayDuration(bond, 0.08), modD = modifiedDuration(bond, 0.08), cvx = convexity(bond, 0.08);
const estUp = priceChangeApprox(modD, cvx, 0.01), estDown = priceChangeApprox(modD, cvx, -0.01);
const actUp = bondPrice(bond, 0.09) / pUp - 1, actDown = bondPrice(bond, 0.07) / pUp - 1;
const fwd = forwardRate(0.065, 1, 0.07, 2);
const zeros = bootstrapZeros([0.065, 0.068, 0.07]);

export const bonds: Lesson = {
  slug: "bonds-and-yields",
  title: "Bonds: pricing, yield, duration and the yield curve",
  summary: "How bonds are priced, what yield to maturity really means, why prices fall when rates rise, how duration and convexity measure that risk, and how the yield curve sets forward rates.",
  module: "fixed-income",
  level: "Core",
  prerequisites: ["time-value-of-money"],
  outcomes: [
    "Price a coupon bond from its yield and solve for yield from its price.",
    "Explain premium, par and discount bonds, and current yield versus yield to maturity.",
    "Estimate price changes with modified duration and convexity, and know when the estimate breaks.",
    "Read a yield curve, compute implied forward rates and bootstrap zero rates.",
  ],
  hook: [
    "In 2022, as central banks raised rates at the fastest pace in decades, some of the \"safest\" assets in the world, long-dated government bonds, lost a fifth or more of their value. In March 2023 Silicon Valley Bank failed partly because it held long bonds bought when yields were low. Nobody defaulted. The losses came entirely from interest rates.",
    "Bond maths explains exactly how that happens, and it is the foundation for anything involving interest rates: banking, insurance, pensions, treasury and every discount rate in valuation.",
  ],
  sections: [
    {
      id: "pricing",
      title: "Pricing a bond",
      blocks: [
        { kind: "p", text: "A bond is a promise: fixed coupons at regular intervals and the face value at maturity. Its price is the present value of those payments, discounted at the market's required yield." },
        { kind: "formula", expr: "Price = Σ (C / f) / (1 + y / f)^(k) + Face / (1 + y / f)^(n × f)", terms: [["C", "annual coupon = coupon rate × face"], ["f", "coupons per year (2 for semi-annual)"], ["y", "yield to maturity, annual"], ["n", "years to maturity"]] },
        { kind: "p", text: `A 10-year, 7% semi-annual bond with $1,000 face. At a 7% yield it prices at **${money(pPar, 2)}** (par). If market yields rise to 8%, its fixed coupons are less attractive and the price falls to **${money(pUp, 2)}** (a discount). If yields fall to 6%, it rises to **${money(pDown, 2)}** (a premium).` },
        { kind: "table", head: ["Coupon vs yield", "Price", "Name"], rows: [
          ["Coupon = yield", "= face", "Par bond"],
          ["Coupon > yield", "> face", "Premium bond"],
          ["Coupon < yield", "< face", "Discount bond"],
        ] },
        { kind: "callout", tone: "insight", title: "Price and yield move in opposite directions", text: [
          "This is not a rule to memorise but a consequence of discounting: the cash flows are fixed, so a higher discount rate means a lower present value. When people say \"bond yields jumped\", they mean bond prices fell.",
        ] },
      ],
    },
    {
      id: "yields",
      title: "Which yield?",
      blocks: [
        { kind: "list", items: [
          `**Current yield** = annual coupon ÷ price. At ${money(pUp, 2)}, ${money(70)} ÷ ${money(pUp, 2)} = ${pct(currentYield(bond, pUp), 2)}. It ignores the gain from the price pulling back to par at maturity.`,
          "**Yield to maturity (YTM)** is the single discount rate that makes the present value of all payments equal the price: the bond's IRR, if held to maturity and coupons are reinvested at the same yield.",
          "**Yield to call / yield to worst** for callable bonds: the issuer can repay early when rates fall, so investors look at the lowest yield across possible call dates.",
        ] },
        { kind: "callout", tone: "desk", title: "Clean and dirty prices", text: [
          "Bonds trade between coupon dates, so the buyer pays the seller the interest accrued since the last coupon. Screens quote the **clean** price (without accrued interest); you actually pay the **dirty** price (clean + accrued). In India, G-secs and corporate bonds are quoted the same way, with accrued interest settled on the NDS-OM and exchange platforms.",
        ] },
      ],
    },
    {
      id: "duration",
      title: "Duration and convexity: measuring rate risk",
      blocks: [
        { kind: "p", text: "**Macaulay duration** is the weighted-average time to receive the bond's cash flows, with weights equal to each payment's share of the price. **Modified duration** turns it into a sensitivity: the percentage price change for a 1-point change in yield." },
        { kind: "formula", expr: "Modified duration = Macaulay duration / (1 + y / f)", terms: [] },
        { kind: "formula", expr: "%ΔP ≈ −ModD × Δy + ½ × Convexity × (Δy)²", terms: [["Δy", "change in yield, as a decimal (0.01 = 100 basis points)"], ["Convexity", "the curvature of the price–yield relationship"]] },
        { kind: "p", text: `At an 8% yield, the bond's Macaulay duration is ${num(macD, 2)} years, modified duration ${num(modD, 2)} and convexity ${num(cvx, 1)}.` },
        { kind: "table", head: ["Yield change", "Duration + convexity estimate", "Actual (full repricing)"], rows: [
          ["+100 bp", pct(estUp, 2), pct(actUp, 2)],
          ["−100 bp", pct(estDown, 2), pct(actDown, 2)],
        ] },
        { kind: "p", text: "Notice the asymmetry: the price rises more when yields fall than it drops when they rise. That is **positive convexity**, and investors like it. Duration alone would predict symmetric moves; convexity corrects for the curve." },
        { kind: "callout", tone: "desk", title: "How the desk uses this", text: [
          "Traders talk in **DV01** (or PV01): the rupee or dollar change in value for a 1 basis point move, = ModD × price × 0.0001. A bank's treasury limits its total DV01; an insurer matches the duration of its bonds to the duration of its liabilities so rate moves hit both sides equally. SVB's problem was a large duration mismatch: long bonds funded by deposits that could leave overnight.",
        ] },
      ],
    },
    {
      id: "curve",
      title: "The yield curve and forward rates",
      blocks: [
        { kind: "p", text: "The yield curve plots yields against maturity. Normally it slopes upward (longer loans pay more). An **inverted** curve, where short rates exceed long rates, has preceded many US recessions, because it signals that markets expect rates to be cut." },
        { kind: "formula", expr: "(1 + s₂)² = (1 + s₁) × (1 + f₁,₂)", terms: [["s₁, s₂", "1- and 2-year spot (zero-coupon) rates"], ["f₁,₂", "the 1-year rate one year from now, locked in today"]] },
        { kind: "p", text: `With a 1-year spot rate of 6.5% and a 2-year spot of 7%, the implied 1-year rate starting in one year is **${pct(fwd, 2)}**. Investing for two years at 7% must equal investing for one year at 6.5% and rolling over at the forward rate, or there would be a free lunch.` },
        { kind: "p", text: `**Bootstrapping** turns par yields (what you see on screen for coupon bonds) into zero rates (what you need for discounting). Par yields of 6.5%, 6.8% and 7.0% for 1–3 years give zero rates of ${zeros.map((z) => pct(z, 3)).join(", ")}. Each zero rate is solved so that a par bond prices at exactly 100 using the earlier zeros.` },
      ],
    },
    {
      id: "credit",
      title: "Credit spreads",
      blocks: [
        { kind: "p", text: "A corporate bond yields more than a government bond of the same maturity. The difference, the **credit spread**, compensates for default risk, lower liquidity and taxes. Spreads widen in crises as investors demand more for risk, which is why corporate bond prices can fall even when government yields are falling." },
      ],
    },
  ],
  gap: [
    { theory: "One yield discounts every cash flow.", practice: "Desks discount each cash flow at its own zero rate from a curve, and value bonds as a spread over that curve." },
    { theory: "Bonds are safe.", practice: "Default-free bonds still carry large interest rate risk. The risk is managed through duration limits, hedging with swaps and futures, and asset–liability matching." },
    { theory: "Duration measures risk.", practice: "Duration assumes the whole curve moves in parallel. Desks also measure key-rate durations and curve risk (steepening, flattening), and convexity of callable bonds and mortgages can be negative." },
  ],
  mistakes: [
    "Using the annual yield with semi-annual periods without dividing by 2.",
    "Confusing current yield with yield to maturity.",
    "Thinking a higher coupon means a higher yield. Yield depends on the price paid.",
    "Forgetting that duration estimates are linear and understate price gains for large yield falls.",
  ],
  interview: [
    { q: "If interest rates rise, what happens to bond prices and why?", a: "They fall. The bond's coupons are fixed, so when new bonds pay more, existing bonds must fall in price until their yield matches the market. Mathematically, the same cash flows are discounted at a higher rate." },
    { q: "Which has higher duration: a 10-year zero-coupon bond or a 10-year 8% coupon bond?", a: "The zero. Its only cash flow is at year 10, so its Macaulay duration is 10 years. Coupons pull the average timing earlier, so the coupon bond's duration is lower." },
  ],
  quiz: [
    { q: "A bond's coupon is 6% and market yields are 7%. The bond trades:", options: ["At par", "At a premium", "At a discount", "Can't tell"], answer: 2, why: "Coupon below yield means the price must be below face to give buyers the 7% yield." },
    { q: "Modified duration 5, yields rise 50 bp. Approximate price change:", options: ["−0.5%", "−2.5%", "−5%", "+2.5%"], answer: 1, why: "−5 × 0.005 = −2.5%." },
    { q: "1-year spot 5%, 2-year spot 6%. The implied 1-year forward rate one year out is about:", options: ["5.5%", "6.0%", "7.0%", "11%"], answer: 2, why: "1.06² ÷ 1.05 − 1 = 7.01%." },
  ],
  apply: {
    problems: ["bond-price", "yield-to-maturity", "current-yield", "macaulay-duration", "duration-convexity-estimate", "implied-forward-rate"],
    models: [],
    cases: [],
    tools: ["bond"],
  },
  glossary: [
    { term: "Yield to maturity (YTM)", definition: "The discount rate that makes a bond's price equal the present value of its remaining payments." },
    { term: "Current yield", definition: "Annual coupon ÷ price." },
    { term: "Macaulay duration", definition: "The weighted-average time to receive a bond's cash flows, weighted by present value." },
    { term: "Modified duration", definition: "Approximate percentage price change for a 1-point change in yield." },
    { term: "Convexity", definition: "The curvature of the price–yield relationship; positive convexity means prices rise more than they fall for equal yield moves." },
    { term: "DV01", definition: "The change in value for a one-basis-point change in yield." },
    { term: "Yield curve", definition: "Yields of bonds of the same credit quality plotted against maturity." },
    { term: "Forward rate", definition: "An interest rate for a future period implied by today's spot rates." },
    { term: "Credit spread", definition: "The extra yield on a corporate bond over a government bond of the same maturity." },
  ],
};

// ---------- Options and forwards ----------

const opt: BSInput = { spot: 100, strike: 100, t: 0.5, rate: 0.07, vol: 0.25 };
const call = blackScholes(opt, "call");
const put = blackScholes(opt, "put");
const amPut = binomial(opt, "put", 200, true);
const parityRhs = call.price - opt.spot + opt.strike * Math.exp(-opt.rate * opt.t);
const fwdPrice = opt.spot * Math.exp(opt.rate * opt.t);
const call30 = blackScholes({ ...opt, vol: 0.3 }, "call");

export const optionsForwards: Lesson = {
  slug: "options-and-forwards",
  title: "Derivatives: forwards, futures and options",
  summary: "What derivatives are for, how forwards are priced by no-arbitrage, option payoffs and strategies, put-call parity, the binomial model, Black-Scholes and the Greeks.",
  module: "derivatives",
  level: "Advanced",
  prerequisites: ["time-value-of-money"],
  outcomes: [
    "Price a forward from spot, interest rates and carry, using a no-arbitrage argument.",
    "Draw and interpret payoffs for calls, puts, straddles and protective puts.",
    "Use put-call parity to price one option from another and spot arbitrage.",
    "Explain the binomial model and Black-Scholes intuitively, and use delta, gamma, vega and theta.",
  ],
  hook: [
    "An Indian IT company will receive $10 million in three months. If the rupee strengthens, it loses money before it has done anything wrong. An airline must buy jet fuel next year at whatever the price turns out to be. A fund manager wants to keep her shares but sleep through a crash.",
    "Each of them uses derivatives, and so do the speculators on the other side. India's equity options market is now one of the largest in the world by contracts traded, and SEBI's own studies found that most individual traders in it lose money. Understanding how these instruments are priced is the first defence.",
  ],
  sections: [
    {
      id: "forwards",
      title: "Forwards and futures",
      blocks: [
        { kind: "p", text: "A **forward** is an agreement today to buy or sell an asset at a fixed price on a future date. A **future** is the same thing standardised and traded on an exchange, with daily settlement of gains and losses (marking to market) through a clearing house, which removes counterparty risk." },
        { kind: "formula", expr: "F₀ = S₀ × e^(r × T)   (no income, continuous compounding)", terms: [["S₀", "spot price today"], ["r", "risk-free rate"], ["T", "time to delivery in years"]] },
        { kind: "p", text: `The price isn't a forecast. It is pinned down by **no-arbitrage**: you could buy the asset today with borrowed money and hold it, so the forward must equal spot plus the cost of carry. With spot 100, a 7% rate and six months: F = 100 × e^(0.07 × 0.5) = **${num(fwdPrice, 2)}**. Dividends, coupons or storage costs adjust it; for currencies the interest rate differential between the two countries does.` },
        { kind: "callout", tone: "desk", title: "How exporters actually hedge", text: [
          "Indian exporters typically sell forward dollars through their bank. The forward premium on the dollar reflects the interest rate gap between India and the US. Treasury teams hedge a policy-defined share of expected receivables on a rolling basis rather than trying to predict the rupee.",
        ] },
      ],
    },
    {
      id: "payoffs",
      title: "Options and payoffs",
      blocks: [
        { kind: "p", text: "A **call** gives the right, not the obligation, to buy at the strike price; a **put** gives the right to sell. The buyer pays a premium for that right. European options can only be exercised at expiry; American options any time before. Index options in India (Nifty, Bank Nifty) are European and cash-settled." },
        { kind: "table", head: ["Position", "Payoff at expiry", "Use"], rows: [
          ["Long call", "max(S − K, 0) − premium", "Bullish, with limited loss"],
          ["Long put", "max(K − S, 0) − premium", "Bearish, or insurance"],
          ["Protective put", "Own shares + long put", "Insure a portfolio against a crash"],
          ["Covered call", "Own shares + short call", "Earn premium, give up upside"],
          ["Long straddle", "Long call + long put, same strike", "Bet on a big move either way (results, elections)"],
        ] },
        { kind: "callout", tone: "warning", title: "Selling options is not free income", text: [
          "Writing options collects small premiums most of the time and occasionally suffers very large losses. A short straddle loses without limit on a big move. Many retail traders discover this the hard way on expiry days.",
        ] },
      ],
    },
    {
      id: "parity",
      title: "Put-call parity",
      blocks: [
        { kind: "formula", expr: "C + K × e^(−rT) = P + S₀", terms: [["C, P", "European call and put prices, same strike and expiry"], ["K × e^(−rT)", "present value of the strike"]] },
        { kind: "p", text: "Both sides pay max(S, K) at expiry: a call plus cash worth the strike, or a put plus the share. Same payoff, same price, or an arbitrageur steps in. Parity lets you price a put from a call, and it shows that a call is just a leveraged position in the share plus insurance." },
        { kind: "p", text: `For a 6-month at-the-money option (spot and strike 100, rate 7%, volatility 25%), Black-Scholes gives a call of ${money(call.price, 4)} and a put of ${money(put.price, 4)}. Parity: ${money(call.price, 4)} − 100 + 100 × e^(−0.035) = ${money(parityRhs, 4)}, the put price.` },
      ],
    },
    {
      id: "pricing",
      title: "Pricing options: binomial and Black-Scholes",
      blocks: [
        { kind: "p", text: "The key insight, which won a Nobel Prize, is that an option's payoff can be **replicated** with the underlying share and borrowing. In a one-step binomial model the share goes up or down; you can find a holding of shares (delta) and a loan that produce exactly the option's payoff in both states. The option must cost what that portfolio costs. No one's view of the probability of up or down enters the price." },
        { kind: "p", text: "Make the steps smaller and more numerous and the binomial price converges to the **Black-Scholes** formula:" },
        { kind: "formula", expr: "C = S₀ N(d₁) − K e^(−rT) N(d₂),   d₁ = [ln(S₀/K) + (r + σ²/2)T] / (σ√T),   d₂ = d₁ − σ√T", terms: [["N(·)", "the standard normal cumulative probability"], ["σ", "annual volatility of the share's returns: the only input you can't observe directly"]] },
        { kind: "p", text: `An American put can be exercised early, which can be worth something when the put is deep in the money and rates are positive. A 200-step binomial tree values the American version of the same put at ${money(amPut, 4)}, above the European ${money(put.price, 4)}.` },
        { kind: "h", text: "The Greeks" },
        { kind: "table", head: ["Greek", "Measures", "This call"], rows: [
          ["Delta", "Change in option value per $1 move in the share", num(call.delta, 3)],
          ["Gamma", "Change in delta per $1 move", num(call.gamma, 4)],
          ["Vega", "Change in value per 1-point rise in volatility", money(call.vega, 4)],
          ["Theta", "Change in value per day that passes", money(call.theta, 4)],
          ["Rho", "Change in value per 1-point rise in rates", money(call.rho, 4)],
        ] },
        { kind: "p", text: `Raise volatility from 25% to 30% and the call rises from ${money(call.price, 2)} to ${money(call30.price, 2)}, close to what vega predicts. Options are, above all, a bet on volatility.` },
        { kind: "callout", tone: "desk", title: "Volatility is the price", text: [
          "Traders quote options in implied volatility, not rupees: the volatility that makes Black-Scholes match the market price. India VIX is the implied volatility of Nifty options. Implied volatility differs by strike (the \"smile\" or \"skew\"), which tells you Black-Scholes' assumption of constant volatility is wrong, and the market prices in crash risk.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Volatility is constant and known.", practice: "It changes all the time and varies by strike and expiry. Desks price off a volatility surface calibrated to market prices." },
    { theory: "Continuous, costless hedging.", practice: "Hedging is discrete and costs money (spreads, slippage). Market makers manage gamma and vega across a whole book, not option by option." },
    { theory: "Options are for speculation.", practice: "Most corporate and institutional use is hedging: exporters, airlines, insurers and pension funds buy protection; banks sell it and hedge." },
  ],
  mistakes: [
    "Treating the forward price as the market's forecast of the future spot price.",
    "Mixing discrete and continuous compounding in parity or forward pricing.",
    "Forgetting the premium when computing option profit.",
    "Ignoring that time decay (theta) works against option buyers every day.",
  ],
  interview: [
    { q: "Why does an option's value increase with volatility?", a: "The payoff is asymmetric: losses for the buyer are capped at the premium, while gains grow with bigger moves. More volatility raises the chance of large favourable moves without increasing the maximum loss." },
    { q: "What is delta and how is it used?", a: "The sensitivity of the option's price to the underlying. A market maker who sells a call with delta 0.6 buys 0.6 shares per option to be delta-neutral, and rebalances as delta changes." },
  ],
  quiz: [
    { q: "Stock 50, strike 45, call premium 7. Profit at expiry if the stock is 55:", options: ["3", "5", "10", "−2"], answer: 0, why: "Payoff 55 − 45 = 10, less the 7 premium = 3." },
    { q: "Put-call parity links a call, a put, the share and:", options: ["The dividend yield only", "The present value of the strike", "Volatility", "The option's delta"], answer: 1, why: "C + PV(K) = P + S." },
    { q: "Which strategy profits from a big move in either direction?", options: ["Covered call", "Long straddle", "Short put", "Protective put"], answer: 1, why: "A long call plus a long put at the same strike gains if the share moves far either way." },
  ],
  apply: {
    problems: ["forward-price", "put-call-parity", "straddle-payoff", "one-step-binomial", "black-scholes-call", "index-futures-mispricing"],
    models: [],
    cases: [],
    tools: ["options"],
  },
  glossary: [
    { term: "Forward contract", definition: "An agreement to buy or sell an asset at a fixed price on a future date." },
    { term: "Futures contract", definition: "A standardised, exchange-traded forward, settled daily through a clearing house." },
    { term: "Call option", definition: "The right to buy an asset at the strike price." },
    { term: "Put option", definition: "The right to sell an asset at the strike price." },
    { term: "Put-call parity", definition: "C + PV(K) = P + S for European options with the same strike and expiry." },
    { term: "Implied volatility", definition: "The volatility that makes an option-pricing model match the market price." },
    { term: "Delta", definition: "The change in an option's value for a one-unit change in the underlying price." },
    { term: "Theta", definition: "The change in an option's value as one day passes." },
  ],
};

// ---------- Portfolio and risk ----------

const pf = twoAsset(0.6, 0.12, 0.20, 0.07, 0.08, 0.2);
const pfPerfect = twoAsset(0.6, 0.12, 0.20, 0.07, 0.08, 1);
const wMin = minVarianceWeight(0.20, 0.08, 0.2);
const pfMin = twoAsset(wMin, 0.12, 0.20, 0.07, 0.08, 0.2);
const var1 = parametricVaR(10_000_000, 0.18, 0.99, 1);
const var10 = parametricVaR(10_000_000, 0.18, 0.99, 10);
const alpha = jensensAlpha(0.15, 0.07, 1.2, 0.13);

export const portfolioRisk: Lesson = {
  slug: "portfolio-risk-and-return",
  title: "Portfolio risk and return: diversification, Sharpe and VaR",
  summary: "Expected return and volatility of portfolios, why diversification works, the efficient frontier, risk-adjusted performance (Sharpe, Treynor, alpha) and value at risk.",
  module: "risk",
  level: "Core",
  prerequisites: ["cost-of-capital-wacc"],
  outcomes: [
    "Compute a two-asset portfolio's expected return and volatility, and the minimum-variance mix.",
    "Explain why correlation drives diversification.",
    "Evaluate a fund with the Sharpe ratio, Treynor ratio and Jensen's alpha.",
    "Compute parametric value at risk and explain what it does and doesn't tell you.",
  ],
  hook: [
    "Put all your savings into one company's shares and you might double your money, or lose half of it when one product fails. Spread the same money across thirty companies and the expected return is about the same, but the chance of disaster falls dramatically. Diversification is often called the only free lunch in finance.",
    "This lesson shows why it works, how to measure whether a fund manager has really added value, and how banks put a single number on how much they could lose tomorrow.",
  ],
  sections: [
    {
      id: "two-asset",
      title: "Return and risk of a portfolio",
      blocks: [
        { kind: "formula", expr: "E[R_p] = w₁R₁ + w₂R₂", terms: [] },
        { kind: "formula", expr: "σ_p = √(w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂)", terms: [["σ", "volatility (standard deviation of returns)"], ["ρ", "correlation between the two assets' returns, from −1 to +1"]] },
        { kind: "p", text: `60% in equities (expected 12%, volatility 20%) and 40% in bonds (7%, 8%) with correlation 0.2: expected return **${pct(pf.ret, 2)}**, volatility **${pct(pf.vol, 2)}**. If the two were perfectly correlated, volatility would be the weighted average, ${pct(pfPerfect.vol, 2)}. Lower correlation cuts risk without cutting return.` },
        { kind: "p", text: `The minimum-variance portfolio puts ${pct(wMin, 1)} in equities, for a volatility of ${pct(pfMin.vol, 2)}: lower than bonds alone, because a little of a lowly correlated asset reduces total risk.` },
        { kind: "callout", tone: "insight", title: "Two kinds of risk", text: [
          "Adding stocks to a portfolio removes **idiosyncratic** risk (company-specific events) but not **systematic** risk (recessions, rate shocks) that hits everything. Markets only reward systematic risk, which is why CAPM uses beta, not total volatility, to set required returns.",
        ] },
      ],
    },
    {
      id: "performance",
      title: "Judging performance",
      blocks: [
        { kind: "table", head: ["Measure", "Formula", "Question it answers"], rows: [
          ["Sharpe ratio", "(R_p − R_f) / σ_p", "Excess return per unit of total risk; use for a whole portfolio"],
          ["Treynor ratio", "(R_p − R_f) / β_p", "Excess return per unit of market risk; use for a fund within a diversified portfolio"],
          ["Jensen's alpha", "R_p − [R_f + β_p(R_m − R_f)]", "Return above what CAPM says the fund's beta deserved"],
          ["Sortino ratio", "(R_p − target) / downside deviation", "Like Sharpe, but only penalises bad volatility"],
        ] },
        { kind: "p", text: `A fund returned 15% with a beta of 1.2 when the market returned 13% and the risk-free rate was 7%. CAPM expected 7% + 1.2 × 6% = 14.2%, so alpha is **${pct(alpha, 2)}**. Most of the fund's outperformance over the market came from taking more market risk, not from skill.` },
        { kind: "callout", tone: "desk", title: "What fund selectors really check", text: [
          "Consistency of alpha across periods, the right benchmark (a small-cap fund compared with the Nifty 50 will look brilliant in small-cap rallies), fees, and survivorship bias in the peer group. SPIVA reports, published for India and the US, have repeatedly found that most active large-cap funds underperform their benchmark index over long periods.",
        ] },
      ],
    },
    {
      id: "var",
      title: "Value at risk",
      blocks: [
        { kind: "formula", expr: "VaR = Value × z × σ_annual × √(days / 252)", terms: [["z", "standard normal quantile: 2.33 for 99%, 1.645 for 95%"], ["√(days/252)", "scales annual volatility to the horizon, assuming independent days"]] },
        { kind: "p", text: `A ₹1 crore portfolio with 18% annual volatility has a one-day 99% VaR of about **₹${num(var1, 0)}**: on 99 days out of 100, the loss should not exceed that. Over ten days, VaR scales by √10 to ₹${num(var10, 0)}.` },
        { kind: "callout", tone: "warning", title: "What VaR doesn't tell you", text: [
          "VaR says nothing about how bad the worst 1% of days are. Real returns have fat tails, so losses beyond VaR are larger and more frequent than the normal distribution predicts, and correlations jump toward 1 in a crisis. Regulators now favour **expected shortfall** (the average loss beyond VaR) and stress tests built on historical crises.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Correlations are stable.", practice: "Correlations rise sharply in crises, exactly when diversification is needed most." },
    { theory: "Returns are normally distributed.", practice: "Returns have fat tails and skew. Risk teams use historical simulation, Monte Carlo and stress scenarios alongside parametric VaR." },
    { theory: "Optimise the efficient frontier.", practice: "Mean-variance optimisation is extremely sensitive to expected-return inputs. Practitioners constrain weights, use Black-Litterman or risk parity, or simply set strategic allocations." },
  ],
  mistakes: [
    "Averaging volatilities instead of using the portfolio formula with correlation.",
    "Scaling VaR by the number of days instead of its square root.",
    "Comparing Sharpe ratios computed over different periods or frequencies.",
    "Using total volatility to judge one fund inside a diversified portfolio (use beta-based measures).",
  ],
  interview: [
    { q: "Can adding a risky asset reduce a portfolio's risk?", a: "Yes, if its correlation with the portfolio is low enough. Its own volatility can be high, but the diversification benefit can outweigh it." },
    { q: "What's wrong with VaR?", a: "It ignores the size of losses beyond the threshold, it usually assumes normality and stable correlations, and it can encourage strategies that look safe most days but have rare catastrophic losses. Expected shortfall and stress tests address some of this." },
  ],
  quiz: [
    { q: "Two assets with volatility 10% each, 50/50, correlation 0. Portfolio volatility is about:", options: ["5%", "7.1%", "10%", "14.1%"], answer: 1, why: "√(0.25 × 0.01 + 0.25 × 0.01) = √0.005 ≈ 7.07%." },
    { q: "Return 12%, risk-free 6%, volatility 15%. Sharpe ratio:", options: ["0.4", "0.8", "1.25", "2.0"], answer: 0, why: "(12 − 6) ÷ 15 = 0.4." },
  ],
  apply: {
    problems: ["portfolio-expected-return", "two-asset-volatility", "sharpe-ratio", "jensens-alpha", "parametric-var", "expected-shortfall"],
    models: [],
    cases: [],
    tools: ["risk"],
  },
  glossary: [
    { term: "Diversification", definition: "Reducing risk by combining assets whose returns are not perfectly correlated." },
    { term: "Correlation", definition: "A measure from −1 to +1 of how two assets' returns move together." },
    { term: "Sharpe ratio", definition: "Excess return over the risk-free rate divided by volatility." },
    { term: "Jensen's alpha", definition: "Return above what CAPM predicts for the portfolio's beta." },
    { term: "Value at risk (VaR)", definition: "The loss not expected to be exceeded at a given confidence over a given horizon." },
    { term: "Expected shortfall", definition: "The average loss in the cases where losses exceed VaR." },
    { term: "Systematic risk", definition: "Market-wide risk that cannot be diversified away." },
  ],
};

// ---------- Credit and banking ----------

const loanAmt = 5_000_000, loanRate = 0.10, loanYears = 5;
const schedule = amortizationSchedule(loanAmt, loanRate, loanYears, 1);
const annualPmt = pmt(loanRate, loanYears, loanAmt);
const cfads = 1_750_000;
const dscr = cfads / annualPmt;
const ead = 2_000_000, pd = 0.03, lgd = 0.45;
const ecl = ead * pd * lgd;

export const creditAnalysis: Lesson = {
  slug: "credit-analysis-and-lending",
  title: "Credit analysis: how lenders decide, price and provision",
  summary: "The lender's view of a company: the five Cs, leverage and coverage ratios, DSCR, loan amortisation, covenants, expected credit loss (PD × LGD × EAD) and how banks earn their margin.",
  module: "credit",
  level: "Core",
  prerequisites: ["ratio-analysis", "time-value-of-money"],
  outcomes: [
    "Assess a borrower with leverage, coverage and debt service ratios.",
    "Build a loan amortisation schedule and compute DSCR.",
    "Compute expected credit loss from PD, LGD and EAD, and explain staging under IFRS 9 / Ind AS 109.",
    "Explain how a bank makes money (net interest margin) and how NPAs are classified.",
  ],
  hook: [
    "An equity investor asks \"how much could this be worth?\". A lender asks a narrower and harsher question: \"will I get my money back, on time, even if things go wrong?\" A lender's upside is capped at the interest; its downside is the whole loan.",
    "Credit analysis is the largest employer in finance that students rarely hear about: corporate banking, credit rating agencies, private credit funds, NBFCs and bond investors all do it every day.",
  ],
  sections: [
    {
      id: "five-cs",
      title: "The lender's framework",
      blocks: [
        { kind: "list", items: [
          "**Character:** the borrower's track record, governance and willingness to repay.",
          "**Capacity:** cash flow available to service the debt. The most important C.",
          "**Capital:** how much of their own money owners have at risk.",
          "**Collateral:** assets the lender can claim if the loan defaults.",
          "**Conditions:** the industry, the economy and the purpose of the loan.",
        ] },
        { kind: "table", head: ["Ratio", "Formula", "Typical comfort zone (varies by sector)"], rows: [
          ["Net debt / EBITDA", "(Debt − Cash) / EBITDA", "Below 3x for investment-grade industrials"],
          ["Interest coverage", "EBIT (or EBITDA) / Interest", "Above 3–4x"],
          ["DSCR", "Cash flow available for debt service / (Interest + Principal)", "Above 1.2–1.3x for project and term loans"],
          ["Debt / Equity", "Total debt / Equity", "Depends heavily on industry"],
          ["Current ratio", "Current assets / Current liabilities", "Above 1.2x for working capital lenders"],
        ] },
      ],
    },
    {
      id: "loan",
      title: "Loan schedules and DSCR",
      blocks: [
        { kind: "p", text: `A ₹${num(loanAmt / 100_000, 0)} lakh term loan at 10% repaid in five equal annual instalments of ₹${num(annualPmt, 0)}:` },
        { kind: "table", head: ["Year", "Instalment", "Interest", "Principal", "Closing balance"], rows: schedule.map((r) => [String(r.period), num(r.payment, 0), num(r.interest, 0), num(r.principal, 0), num(r.balance, 0)]) },
        { kind: "p", text: `If the borrower generates ₹${num(cfads, 0)} a year of cash flow available for debt service (operating cash flow after tax and maintenance capex), the DSCR is ${num(cfads, 0)} ÷ ${num(annualPmt, 0)} = **${num(dscr, 2)}x**: a cushion of about ${pct(dscr - 1, 0)} before the borrower can't pay from operations.` },
        { kind: "callout", tone: "desk", title: "Covenants", text: [
          "Loan agreements include **financial covenants** (net debt/EBITDA below 3.5x, DSCR above 1.2x, tested quarterly) and **negative covenants** (no new debt or asset sales without consent). A covenant breach lets lenders renegotiate, raise pricing or demand repayment long before an actual default, which is their real protection.",
        ] },
      ],
    },
    {
      id: "ecl",
      title: "Expected credit loss",
      blocks: [
        { kind: "formula", expr: "ECL = PD × LGD × EAD", terms: [["PD", "probability of default over the horizon"], ["LGD", "loss given default: the share of exposure lost after recoveries"], ["EAD", "exposure at default: what is owed when default happens"]] },
        { kind: "p", text: `A ₹${num(ead / 100_000, 0)} lakh exposure with a 3% one-year PD and 45% LGD has an expected loss of **₹${num(ecl, 0)}**. That is a cost of lending: it must be covered by the loan's interest margin, and it is what banks provision for.` },
        { kind: "table", head: ["IFRS 9 / Ind AS 109 stage", "When", "Provision"], rows: [
          ["Stage 1", "Performing, no significant increase in credit risk", "12-month ECL"],
          ["Stage 2", "Significant increase in credit risk (e.g. 30+ days past due)", "Lifetime ECL"],
          ["Stage 3", "Credit-impaired (e.g. 90+ days past due)", "Lifetime ECL; interest on net amount"],
        ] },
        { kind: "p", text: "Indian NBFCs already report under Ind AS 109's expected-loss model, and the RBI is moving banks from the older incurred-loss approach to expected credit loss provisioning. Separately, RBI rules classify a loan as a **non-performing asset (NPA)** when interest or principal is overdue for more than 90 days." },
      ],
    },
    {
      id: "banks",
      title: "How banks make money",
      blocks: [
        { kind: "formula", expr: "NIM = (Interest income − Interest expense) / Average earning assets", terms: [] },
        { kind: "p", text: "A bank borrows short (deposits) and lends long (loans). Its **net interest margin** is the spread it earns, before operating costs and credit losses. Low-cost current and savings deposits (the CASA ratio) are a bank's biggest competitive advantage, because they fund lending cheaply." },
        { kind: "list", items: [
          "**Pre-provision operating profit** = net interest income + fees − operating costs.",
          "**Credit cost** = provisions ÷ average loans: what bad loans cost each year.",
          "**Return on assets** of around 1% is typical for a healthy bank; leverage of 10x turns it into a 10–15%+ ROE.",
          "**Capital adequacy** (CRAR, CET1 under Basel III) limits how much a bank can lend relative to its capital.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "Lend against strong ratios.", practice: "Lenders spend as much time on structure (security, covenants, guarantees, cash flow waterfalls) as on ratios, because structure decides recovery when ratios fail." },
    { theory: "PD and LGD are known.", practice: "They are estimated from internal models, rating agency data and recovery history, calibrated through the cycle and challenged by auditors and regulators." },
    { theory: "Collateral makes a loan safe.", practice: "Recoveries in India through IBC resolution have historically averaged well below the amounts owed and taken years. Lenders prize cash flow far above collateral." },
  ],
  mistakes: [
    "Using EBITDA for DSCR without deducting tax and maintenance capex.",
    "Confusing expected loss (a cost to price in) with unexpected loss (what capital is held against).",
    "Ignoring off-balance-sheet exposures such as guarantees and undrawn credit lines in EAD.",
    "Reading high NIM as good without checking credit costs.",
  ],
  interview: [
    { q: "How is credit analysis different from equity analysis?", a: "Credit focuses on the downside: will cash flow cover debt service in a bad scenario, and what is recovered if not. Equity focuses on the upside and the value of growth. A lender's return is capped at the interest; its loss can be the whole principal." },
    { q: "What is DSCR and why do lenders care?", a: "Cash flow available for debt service divided by interest plus principal due. Below 1x the borrower can't service debt from operations; lenders typically want 1.2–1.5x as a cushion." },
  ],
  quiz: [
    { q: "PD 2%, LGD 40%, EAD ₹50 lakh. Expected loss is:", options: ["₹40,000", "₹1,00,000", "₹4,00,000", "₹20,00,000"], answer: 0, why: "0.02 × 0.40 × 50,00,000 = ₹40,000." },
    { q: "Cash flow for debt service ₹12 crore, interest ₹4 crore, principal ₹6 crore. DSCR:", options: ["1.2x", "2.0x", "3.0x", "0.83x"], answer: 0, why: "12 ÷ (4 + 6) = 1.2x." },
    { q: "Under RBI rules a loan becomes an NPA when it is overdue for more than:", options: ["30 days", "60 days", "90 days", "180 days"], answer: 2, why: "The 90-day overdue rule." },
  ],
  apply: {
    problems: ["debt-service-coverage", "expected-credit-loss", "net-interest-margin", "leverage-and-coverage", "loan-payment", "cet1-ratio", "cre-loan-sizing"],
    models: ["term-loan-amortisation"],
    cases: [],
    tools: ["loan", "ratios"],
  },
  glossary: [
    { term: "DSCR", definition: "Debt service coverage ratio: cash flow available for debt service ÷ (interest + principal due)." },
    { term: "Probability of default (PD)", definition: "The likelihood a borrower defaults within a given horizon." },
    { term: "Loss given default (LGD)", definition: "The share of an exposure lost if the borrower defaults, after recoveries." },
    { term: "Exposure at default (EAD)", definition: "The amount owed at the time of default." },
    { term: "Expected credit loss (ECL)", definition: "PD × LGD × EAD: the average loss a lender expects on an exposure." },
    { term: "NPA", definition: "Non-performing asset: in India, a loan with interest or principal overdue for more than 90 days." },
    { term: "Net interest margin (NIM)", definition: "Net interest income ÷ average earning assets." },
    { term: "Covenant", definition: "A condition in a loan agreement, such as a maximum leverage ratio, whose breach gives lenders rights." },
    { term: "CASA ratio", definition: "Current and savings account deposits as a share of total deposits: a bank's low-cost funding." },
  ],
};
