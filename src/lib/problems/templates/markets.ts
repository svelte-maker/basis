import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";
import { bondPrice, bondYield, currentYield, forwardRate, fraSettlement, macaulayDuration } from "@/lib/finance/fixedIncome";
import { blackScholes, normCdf, putFromParity } from "@/lib/finance/options";
import { irr } from "@/lib/finance/tvm";
import { europeanWaterfall, fundMultiples } from "@/lib/finance/funds";
import { capitalRatio, creditRwa } from "@/lib/finance/banking";
import { twoAsset } from "@/lib/finance/portfolio";
import { interpolationLine, irrTrialTable, irrTrials, n, p, secantTrials, table } from "../explain";

export const fixedIncome: Template[] = [
  {
    slug: "bond-price",
    title: "Price a coupon bond",
    track: "Fixed Income",
    difficulty: "Medium",
    concepts: ["Bond pricing", "Yield"],
    generate(rng) {
      const c = pick(rng, 0.02, 0.08, 0.005), y = pick(rng, 0.02, 0.09, 0.005), yrs = pick(rng, 2, 10, 1), freq = rng() < 0.5 ? 1 : 2;
      const ans = bondPrice({ face: 1000, couponRate: c, years: yrs, freq }, y);
      const cpn = (1000 * c) / freq, N = yrs * freq, yp = y / freq;
      const af = (1 - Math.pow(1 + yp, -N)) / yp, pvC = cpn * af, pvF = 1000 / Math.pow(1 + yp, N);
      const rows = Array.from({ length: N }, (_, k) => {
        const cf = cpn + (k === N - 1 ? 1000 : 0), df = 1 / Math.pow(1 + yp, k + 1);
        return [String(k + 1), money(cf, 2), df.toFixed(4), money(cf * df, 2)];
      });
      rows.push(["Total", "", "", `**${money(ans, 2)}**`]);
      const period = freq === 1 ? "year" : "half-year";
      return {
        blocks: [{ kind: "p", text: `A bond has a **$1,000** face value, pays a **${pct(c)}** coupon **${freq === 1 ? "annually" : "semi-annually"}** and matures in **${yrs} years**. Its yield to maturity is **${pct(y)}** (${freq === 1 ? "annual" : "bond-equivalent, semi-annual"} compounding).` }],
        question: "What is the bond's price?",
        answer: ans, unit: "$", tolerance: { abs: 0.05 },
        solution: {
          idea: [
            "A bond is a bundle of promised cash flows: a coupon every period and the face value at maturity. Its price is what those promises are worth today, discounted at the yield the market currently demands.",
            "The coupon rate is fixed when the bond is issued; the market yield moves every day. If the market wants more than the coupon pays, the only way to give buyers that return is a lower price, so the bond trades below face value. If it wants less, the bond trades above.",
          ],
          formulas: [
            { expr: "Price = C × [1 − (1 + y)⁻ᴺ] / y + F / (1 + y)ᴺ", terms: [
              ["C", `Coupon per period = face × coupon rate ÷ ${freq}`],
              ["y", `Yield per period = YTM ÷ ${freq}`],
              ["N", `Number of periods = years × ${freq}`],
              ["F", "Face value repaid at maturity"],
              ["[1 − (1 + y)⁻ᴺ] / y", "Annuity factor: PV of $1 paid every period for N periods"],
            ] },
          ],
          steps: [
            p(`Coupon per ${period} = $1,000 × ${pct(c)} / ${freq} = ${money(cpn, 2)}. Periods N = ${yrs} × ${freq} = ${N}. Yield per period = ${pct(y)} / ${freq} = ${pct(yp, 3)}.`),
            p(`PV of coupons = ${money(cpn, 2)} × [1 − (1 + ${n(yp, 5)})^−${N}] / ${n(yp, 5)} = ${money(cpn, 2)} × ${af.toFixed(4)} = ${money(pvC, 2)}.`),
            p(`PV of face value = 1,000 / (1 + ${n(yp, 5)})^${N} = ${money(pvF, 2)}.`),
            p(`Price = ${money(pvC, 2)} + ${money(pvF, 2)} = **${money(ans, 2)}**. Period by period:`),
            table(["Period", "Cash flow", "Discount factor", "Present value"], rows),
          ],
          meaning: [
            c < y ? `The coupon (${pct(c)}) is below the yield (${pct(y)}), so the bond trades at a **discount** to par. A buyer gets part of their return from the price rising to $1,000 at maturity.`
              : c > y ? `The coupon (${pct(c)}) is above the yield (${pct(y)}), so the bond trades at a **premium** to par. The extra coupon income is offset by the price falling to $1,000 at maturity.`
                : "The coupon equals the yield, so the bond trades at **par**.",
            "Price and yield move in opposite directions. As maturity approaches, the price is pulled towards face value whatever happens to yields.",
          ],
          mistakes: [
            freq === 2 ? `Using annual periods for a semi-annual bond: ${money(bondPrice({ face: 1000, couponRate: c, years: yrs, freq: 1 }, y), 2)}.` : "Splitting an annual coupon into halves. Match the period to how often the bond actually pays.",
            "Discounting at the coupon rate. That always gives $1,000; the yield, not the coupon, is the discount rate.",
            "Forgetting the face value in the final period.",
          ],
          excel: [`\`=PV(${n(yp, 6)},${N},-${n(cpn, 4)},-1000)\``],
        },
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
      const c = pick(rng, 0.02, 0.08, 0.005), yrs = pick(rng, 3, 10, 1), price = pick(rng, 880, 1120, 5);
      const b = { face: 1000, couponRate: c, years: yrs };
      const y = bondYield(b, price);
      const ans = y * 100;
      const cpn = 1000 * c;
      const approx = (cpn + (1000 - price) / yrs) / ((1000 + price) / 2);
      const trials = secantTrials((x) => bondPrice(b, x) - price, c, approx, { tol: 0.005, exact: y });
      const pr = (x: number) => pct(x, 4);
      return {
        blocks: [{ kind: "p", text: `A **${yrs}-year** bond with a **$1,000** face value pays a **${pct(c)}** annual coupon and trades at **${money(price, 2)}**.` }],
        question: "What is its yield to maturity? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "Yield to maturity is the single discount rate that makes the present value of all the bond's cash flows equal to its market price. It is the bond's IRR: the annual return you earn if you buy at this price, hold to maturity, and every payment arrives as promised.",
            "There is no way to rearrange the price formula to solve for the yield directly, so you search for it. Two facts guide the search: a higher yield gives a lower price, and a bond priced at par yields exactly its coupon.",
          ],
          formulas: [
            { expr: "Price = Σ C / (1 + y)ᵗ + F / (1 + y)ᴺ", terms: [["C", `Annual coupon, here ${money(cpn, 2)}`], ["F", "Face value, $1,000"], ["N", `Years to maturity, here ${yrs}`], ["y", "The yield to maturity we are solving for"]] },
            { expr: "y ≈ [C + (F − P) / N] / [(F + P) / 2]", terms: [
              ["C + (F − P) / N", "Annual income: the coupon plus the discount (or less the premium) spread evenly over the life"],
              ["(F + P) / 2", "The average amount invested over the life"],
              ["Use", "A quick first guess, not the answer"],
            ] },
          ],
          steps: [
            p(`**1. Which side of the coupon?** The bond trades ${price < 1000 ? `below par, so its yield is **above** the ${pct(c)} coupon` : price > 1000 ? `above par, so its yield is **below** the ${pct(c)} coupon` : `at par, so its yield equals the ${pct(c)} coupon`}.`),
            p(`**2. First guess from the approximation:** [${num(cpn, 2)} + (1,000 − ${num(price, 2)}) / ${yrs}] / [(1,000 + ${num(price, 2)}) / 2] = ${pct(approx, 4)}.`),
            p(`**3. Trial and error.** Price the bond at each guess and compare with ${money(price, 2)}.${Math.abs(trials[1].fx - trials[0].fx) > 1e-9 ? ` ${interpolationLine(trials[0], trials[1], pr, 4)}` : ""}`),
            table(["Trial", "Yield", "Price at this yield", "Minus market price", "What it tells you"], trials.map((t, i) => [
              String(i + 1), pr(t.x), money(t.fx + price, 4), num(t.fx, 4),
              Math.abs(t.fx) < 0.005 ? "Matches: this is the YTM" : t.fx > 0 ? "Price too high: yield too low" : "Price too low: yield too high",
            ])),
            p(`YTM = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            `A buyer at ${money(price, 2)} earns **${ans.toFixed(2)}%** a year if they hold to maturity. ${price < 1000 ? "That is more than the coupon because they also gain the discount as the price rises to par." : price > 1000 ? "That is less than the coupon because they lose the premium as the price falls to par." : ""}`,
            "YTM assumes every coupon is reinvested at the YTM itself and the issuer does not default. If reinvestment rates differ, the realised return will too.",
          ],
          mistakes: [
            `Giving the current yield, coupon ÷ price = ${pct(cpn / price, 3)}. That ignores the gain or loss to par.`,
            `Stopping at the approximation formula (${pct(approx, 3)}). It is close but rarely within two decimals.`,
            "Moving the yield guess the wrong way. If your trial price is above the market price, the yield must go up.",
          ],
          excel: [`\`=RATE(${yrs},${n(cpn, 2)},-${price},1000)\``, `Or with dates: \`=YIELD(DATE(2026,1,1),DATE(${2026 + yrs},1,1),${n(c)},${n(price / 10, 4)},100,1)\`, which quotes price per 100 of face.`],
        },
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
      const c = pick(rng, 0.03, 0.1, 0.01), y = pick(rng, 0.03, 0.1, 0.005), yrs = pick(rng, 2, 4, 1);
      const b = { face: 1000, couponRate: c, years: yrs };
      const ans = macaulayDuration(b, y);
      const price = bondPrice(b, y);
      const cfs = Array.from({ length: yrs }, (_, k) => 1000 * c + (k === yrs - 1 ? 1000 : 0));
      const pvs = cfs.map((cf, k) => cf / Math.pow(1 + y, k + 1));
      const rows = cfs.map((cf, k) => [String(k + 1), money(cf, 2), (1 / Math.pow(1 + y, k + 1)).toFixed(4), money(pvs[k], 2), (pvs[k] / price).toFixed(4), ((k + 1) * pvs[k] / price).toFixed(4)]);
      rows.push(["Total", "", "", money(price, 2), "1.0000", `**${ans.toFixed(4)}**`]);
      const undiscounted = cfs.reduce((s, cf, k) => s + (k + 1) * cf, 0) / cfs.reduce((a, b2) => a + b2, 0);
      return {
        blocks: [{ kind: "p", text: `A **${yrs}-year** bond pays a **${pct(c)}** annual coupon on **$1,000** face and yields **${pct(y)}**.` }],
        question: "What is its Macaulay duration in years? Three decimals.",
        answer: ans, unit: "years", tolerance: { abs: 0.002 },
        solution: {
          idea: [
            "A coupon bond pays you back gradually, not all at maturity. Macaulay duration asks: on average, how many years do you wait to receive your money, weighting each payment by how much of today's price it represents?",
            "Picture the cash flows as weights on a seesaw along a timeline. Duration is the balance point. A zero-coupon bond has all its weight at maturity, so its duration equals its maturity. Coupons pull the balance point earlier.",
          ],
          formulas: [
            { expr: "D = Σ t × [PV(CFₜ) / Price]", terms: [
              ["t", "Time of each payment, in years"],
              ["PV(CFₜ)", "Present value of the payment at time t, discounted at the yield"],
              ["PV(CFₜ) / Price", "The weight: that payment's share of the bond's value. The weights sum to 1"],
            ] },
            { expr: "Modified duration = D / (1 + y)", terms: [["Use", "Approximate % price change for a 1-point change in yield"]] },
          ],
          steps: [
            p(`Discount each cash flow at ${pct(y)}, find its share of the price, and multiply by its time:`),
            table(["Year t", "Cash flow", "Discount factor", "PV", "Weight", "t × weight"], rows),
            p(`D = ${rows.slice(0, -1).map((r) => r[5]).join(" + ")} = **${ans.toFixed(3)} years**.`),
          ],
          meaning: [
            `On average you get your money back after ${ans.toFixed(3)} years, earlier than the ${yrs}-year maturity because of the coupons.`,
            `Modified duration is ${ans.toFixed(3)} / ${(1 + y).toFixed(3)} = ${(ans / (1 + y)).toFixed(3)}, so a 1 percentage point rise in yield cuts the price by about ${(ans / (1 + y)).toFixed(2)}%. Longer duration means more interest rate risk.`,
            "Higher coupons and higher yields both shorten duration, because they shift value towards the early payments.",
          ],
          mistakes: [
            `Weighting by undiscounted cash flows: ${undiscounted.toFixed(3)} years.`,
            `Answering the maturity (${yrs} years). Only a zero-coupon bond has duration equal to maturity.`,
          ],
          excel: [
            "With years in A2:A" + (yrs + 1) + " and PVs in D2:D" + (yrs + 1) + ": `=SUMPRODUCT(A2:A" + (yrs + 1) + ",D2:D" + (yrs + 1) + ")/SUM(D2:D" + (yrs + 1) + ")`.",
            `Or with dates: \`=DURATION(DATE(2026,1,1),DATE(${2026 + yrs},1,1),${n(c)},${n(y)},1)\`.`,
          ],
        },
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
      const durTerm = -md * dy, cxTerm = 0.5 * cx * dy * dy;
      const ans = (durTerm + cxTerm) * 100;
      const opposite = (md * dy + cxTerm) * 100;
      return {
        blocks: [{ kind: "p", text: `A bond portfolio has modified duration **${md.toFixed(1)}** and convexity **${cx}**. Yields move by **${bp > 0 ? "+" : ""}${bp} basis points**.` }],
        question: "What is the estimated percentage price change? Two decimals, negative for a fall.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "Bond prices fall when yields rise. Modified duration gives the first-order effect: the percentage price change for a small yield change, a straight-line approximation.",
            "But the price-yield curve is not a straight line; it bows outward (it is convex). Duration alone overstates losses when yields rise and understates gains when they fall. Convexity is the correction for that curvature, and it is always positive for an ordinary bond.",
          ],
          formulas: [
            { expr: "ΔP / P ≈ −D_mod × Δy + ½ × C × (Δy)²", terms: [
              ["D_mod", "Modified duration"],
              ["Δy", "Change in yield as a decimal (1 basis point = 0.0001)"],
              ["C", "Convexity, here in years²"],
              ["(Δy)²", "Always positive, so the convexity term always adds to the price change"],
            ] },
          ],
          steps: [
            p(`Δy = ${bp} bp = ${dy}.`),
            p(`Duration effect = −${md.toFixed(1)} × ${dy} = ${pct(durTerm, 4)}.`),
            p(`Convexity effect = ½ × ${cx} × (${dy})² = ${pct(cxTerm, 4)}.`),
            p(`Total ≈ ${pct(durTerm, 4)} + ${pct(cxTerm, 4)} = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            `The portfolio ${ans < 0 ? "loses" : "gains"} about ${Math.abs(ans).toFixed(2)}% of its value. On a $100m portfolio that is ${money(Math.abs(ans) * 1e6)}.`,
            `Convexity works in the holder's favour both ways. The same ${Math.abs(bp)} bp move in the other direction gives ${opposite.toFixed(3)}%: gains are larger than losses for equal yield moves.`,
            "The estimate is good for modest moves. For very large moves, reprice the bonds fully.",
          ],
          mistakes: [
            `Leaving out convexity: ${pct(durTerm, 3)}.`,
            "Converting basis points wrongly: 100 bp = 0.01, not 0.1 or 1.",
            `Forgetting the ½: ${pct(durTerm + 2 * cxTerm, 3)}.`,
            "Giving convexity a negative sign when yields fall. (Δy)² is positive either way.",
          ],
          excel: [`\`=(-${md}*${dy}+0.5*${cx}*${dy}^2)*100\``],
        },
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
      const g2 = Math.pow(1 + s2, t2), g1 = 1 + s1, m = t2 - 1;
      const naive = (s2 * t2 - s1) / m;
      return {
        blocks: [{ kind: "p", text: `The 1-year spot rate is **${pct(s1)}** and the ${t2}-year spot rate is **${pct(s2)}** (annual compounding).` }],
        question: `What is the implied ${t2 - 1}-year rate starting one year from now? Percentage to two decimals.`,
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            `An investor with a ${t2}-year horizon has two choices: lock in the ${t2}-year rate today, or invest for 1 year and then reinvest for the remaining ${m} years. If both routes are available, their returns must match, or everyone would pick the better one.`,
            "The forward rate is the future rate that makes the two routes equal. It is the rate the market is locking in today for borrowing or lending later.",
          ],
          formulas: [
            { expr: `(1 + s₂)^${t2} = (1 + s₁) × (1 + f)^${m}`, terms: [
              ["s₁", "1-year spot rate"],
              ["s₂", `${t2}-year spot rate`],
              ["f", `${m}-year rate starting in one year`],
            ] },
            { expr: `f = [(1 + s₂)^${t2} / (1 + s₁)]^(1/${m}) − 1`, terms: [] },
          ],
          steps: [
            p(`Long route: $1 grows to (1 + ${pct(s2)})^${t2} = ${g2.toFixed(6)}.`),
            p(`First leg of the short route: $1 grows to ${g1.toFixed(6)} after one year.`),
            p(`The remaining ${m} years must grow ${g1.toFixed(6)} into ${g2.toFixed(6)}: a factor of ${(g2 / g1).toFixed(6)}.`),
            p(m > 1 ? `Annualise: f = ${(g2 / g1).toFixed(6)}^(1/${m}) − 1 = **${ans.toFixed(3)}%** a year.` : `So f = ${(g2 / g1).toFixed(6)} − 1 = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            s2 > s1 ? `The curve slopes upward, so the forward rate (${ans.toFixed(2)}%) is above both spot rates. Under the expectations theory, the market expects rates to rise.`
              : s2 < s1 ? `The curve slopes downward, so the forward rate (${ans.toFixed(2)}%) is below both spot rates. Under the expectations theory, the market expects rates to fall.`
                : "The curve is flat, so the forward rate equals the spot rate.",
            "Forward rates also contain a term premium, so they tend to overstate the rates that actually materialise.",
          ],
          mistakes: [
            `The arithmetic shortcut (${t2} × ${pct(s2)} − ${pct(s1)}) / ${m} = ${pct(naive, 3)}. Close, but it ignores compounding.`,
            m > 1 ? `Forgetting to take the ${m}th root: ${pct(g2 / g1 - 1, 3)} is the total over ${m} years, not an annual rate.` : `Dividing the other way round: (1 + s₁) / (1 + s₂)^${t2} − 1 = ${pct(g1 / g2 - 1, 3)}. The longer investment goes on top.`,
          ],
          excel: [`\`=((1+${n(s2)})^${t2}/(1+${n(s1)}))^(1/${m})-1\``],
        },
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
        solution: {
          idea: [
            "Current yield is the simplest yield measure: the cash income you get each year as a percentage of what you pay for the bond today. It is like a dividend yield for bonds.",
            "It deliberately ignores the gain or loss you make as the price moves back to $1,000 at maturity.",
          ],
          formulas: [{ expr: "Current yield = Annual coupon / Price", terms: [["Annual coupon", "Face × coupon rate"], ["Price", "The market price today, not face value"]] }],
          steps: [
            p(`Annual coupon = $1,000 × ${pct(c)} = ${money(1000 * c, 2)}.`),
            p(`Current yield = ${money(1000 * c, 2)} / ${money(price)} = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            price < 1000 ? `The bond trades below par, so current yield (${ans.toFixed(2)}%) is above the coupon rate. Yield to maturity would be higher still, because it also counts the gain to par.`
              : price > 1000 ? `The bond trades above par, so current yield (${ans.toFixed(2)}%) is below the coupon rate. Yield to maturity would be lower still, because it also counts the loss to par.`
                : "At par, current yield, coupon rate and yield to maturity are all equal.",
          ],
          mistakes: [
            `Dividing by face value instead of price, which just gives the coupon rate (${pct(c)}).`,
            "Treating current yield as the total return. It leaves out the pull to par.",
          ],
          excel: [`\`=1000*${n(c)}/${price}\``],
        },
      };
    },
  },
  {
    slug: "fra-settlement",
    title: "FRA settlement payment",
    track: "Fixed Income",
    difficulty: "Medium",
    concepts: ["Forward rate agreements", "Hedging", "Money market"],
    generate(rng) {
      const nm = pick(rng, 10, 100, 5), k = pick(rng, 0.02, 0.06, 0.0005), gap = pick(rng, 0.0005, 0.0075, 0.0005), up = pick(rng, 0, 1, 1), start = pick(rng, 1, 6, 1), days = pick(rng, 90, 180, 90);
      const l = Number((up ? k + gap : k - gap).toFixed(6)), tau = days / 360, len = days === 90 ? 3 : 6, name = `${start}×${start + len}`;
      const N = nm * 1e6, diff = N * (l - k) * tau, ans = fraSettlement(N, k, l, days);
      const recv = ans > 0;
      return {
        blocks: [
          { kind: "p", text: `A company buys a **${name}** forward rate agreement on a notional of **${money(nm)}m** at a contract rate of **${pct(k)}**. The FRA covers a **${days}-day** period starting in ${start} month${start > 1 ? "s" : ""}, uses an actual/360 day count, and settles in cash at the start of that period.` },
          { kind: "p", text: `On the fixing date the reference rate for the period is **${pct(l)}**.` },
        ],
        question: "What is the settlement amount to the buyer, in $? Positive if the buyer receives, negative if it pays.",
        answer: ans, unit: "$", tolerance: { abs: 2 },
        solution: {
          idea: [
            "An FRA locks in a borrowing or lending rate for a future period. The buyer is the would-be borrower: it pays the fixed contract rate and receives the floating reference rate on a notional that never changes hands.",
            "Only the interest difference is paid. It relates to interest that would be due at the end of the period, but the FRA settles at the start, so the difference is discounted back for one period at the reference rate.",
          ],
          formulas: [
            { expr: "Settlement = N × (L − K) × τ / (1 + L × τ)", terms: [
              ["N", "Notional principal"],
              ["L", "Reference rate fixed for the period"],
              ["K", "FRA contract rate"],
              ["τ", "Days in the period / 360"],
            ] },
          ],
          steps: [
            p(`Year fraction: τ = ${days} / 360 = ${tau}.`),
            p(`Interest difference due at the end of the period: ${money(nm)}m × (${pct(l)} − ${pct(k)}) × ${tau} = ${money(diff, 2)}.`),
            p(`Discount factor for the period: 1 + ${n(l)} × ${tau} = ${(1 + l * tau).toFixed(6)}.`),
            p(`Settlement at the start of the period = ${money(diff, 2)} / ${(1 + l * tau).toFixed(6)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            recv
              ? `The reference rate came in above the contract rate, so the buyer receives ${money(ans, 2)}. A company borrowing ${money(nm)}m at ${pct(l)} for the period pays more interest, and the FRA payment (worth ${money(diff, 2)} by the end of the period) offsets that, so its net cost stays at ${pct(k)}.`
              : `The reference rate came in below the contract rate, so the buyer pays ${money(-ans, 2)}. A company borrowing ${money(nm)}m at ${pct(l)} for the period saves on interest, but gives that saving up through the FRA, so its net cost stays at ${pct(k)}.`,
            `"${name}" names the period: it starts in month ${start} and ends in month ${start + len}. The start date only matters for when the rate is fixed; the payment depends on the ${days}-day period itself.`,
          ],
          mistakes: [
            `Forgetting to discount: ${money(diff, 2)} is what the difference is worth at the end of the period, not at settlement.`,
            `Discounting at the contract rate instead of the reference rate: ${money(diff / (1 + k * tau), 2)}.`,
            `Using a 365-day year: ${money(fraSettlement(N, k, l, days, 365), 2)}. USD money-market rates quote on actual/360.`,
          ],
          excel: [`\`=${N}*(${n(l)}-${n(k)})*(${days}/360)/(1+${n(l)}*${days}/360)\``],
        },
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
      const pvk = k / Math.pow(1 + r, t);
      return {
        blocks: [{ kind: "p", text: `A **${t}-year** European call with strike **${money(k)}** costs **${money(c, 2)}**. The stock is at **${money(s)}** and pays no dividend. The rate is **${pct(r)}** (annual compounding).` }],
        question: "What must the matching European put cost?",
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "Build two portfolios. **A**: buy the call and put aside enough cash to pay the strike at expiry (a zero-coupon bond worth K then). **B**: buy the put and buy the stock.",
            "At expiry they are worth exactly the same in every scenario. If the stock ends above the strike, A exercises the call and owns the stock; B lets the put lapse and owns the stock. If it ends below, A lets the call lapse and holds K in cash; B exercises the put and sells the stock for K.",
            "Two portfolios with identical payoffs must cost the same today, or you could buy the cheap one, sell the dear one and pocket a risk-free profit. That gives the parity equation.",
          ],
          formulas: [
            { expr: "C + PV(K) = P + S", terms: [
              ["C, P", "European call and put prices, same strike and expiry"],
              ["PV(K)", "Present value of the strike = K / (1 + r)ᵗ with annual compounding"],
              ["S", "Stock price today"],
            ] },
            { expr: "P = C − S + K / (1 + r)ᵗ", terms: [] },
          ],
          steps: [
            table(["At expiry", `Stock below ${money(k)}`, `Stock above ${money(k)}`], [
              ["A: call + bond paying K", `0 + ${money(k)} = ${money(k)}`, "(S − K) + K = S"],
              ["B: put + stock", `(K − S) + S = ${money(k)}`, "0 + S = S"],
            ]),
            p(`PV(K) = ${money(k)} / (1 + ${pct(r)})^${t} = ${money(pvk, 4)}.`),
            p(`P = ${money(c, 2)} − ${money(s)} + ${money(pvk, 4)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `The put must cost ${money(ans, 2)}. If it traded higher, sell the put, short the stock, buy the call and invest PV(K): you collect the difference today and owe nothing at expiry. If lower, do the reverse.`,
            "Parity holds for European options on non-dividend stocks regardless of volatility or any pricing model. It is pure no-arbitrage.",
          ],
          mistakes: [
            `Not discounting the strike: ${money(c - s + k, 2)}.`,
            `Using continuous compounding when the question says annual: ${money(c - s + k * Math.exp(-r * t), 2)}.`,
            `Rearranging with the wrong sign, for example P = C + S − PV(K) = ${money(c + s - pvk, 2)}.`,
          ],
          excel: [`\`=${c}-${s}+${k}/(1+${n(r)})^${t}\``],
        },
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
      const sq = Math.sqrt(t), ln = Math.log(s / k), vt = v * sq, drift = (r + (v * v) / 2) * t;
      const d1 = (ln + drift) / vt, d2 = d1 - vt, n1 = normCdf(d1), n2 = normCdf(d2), pvk = k * Math.exp(-r * t);
      const intrinsic = Math.max(0, s - pvk);
      return {
        blocks: [{ kind: "p", text: `Spot **${money(s)}**, strike **${money(k)}**, time to expiry **${t} years**, continuously compounded risk-free rate **${pct(r)}**, volatility **${pct(v)}**, no dividends.` }],
        question: "What is the Black-Scholes value of a European call?",
        answer: g.price, unit: "$", tolerance: { abs: 0.02 },
        solution: {
          idea: [
            "A call pays S − K at expiry if the stock finishes above the strike, and nothing otherwise. Its value today is the expected payoff in a risk-neutral world, discounted at the risk-free rate.",
            "Read the formula as two pieces. **S × N(d1)** is the present value of the stock you receive if the option is exercised. **K × e^(−rt) × N(d2)** is the present value of the strike you pay if it is exercised. The call is worth the difference.",
            "N(d2) is the risk-neutral probability the call ends in the money. N(d1) is slightly larger because, in the scenarios where you exercise, the stock tends to be well above the strike. N(d1) is also the option's delta: how many shares you would hold to hedge it.",
            "Volatility matters because the payoff is one-sided: big up-moves pay more, big down-moves cannot cost more than the premium. More volatility, more value.",
          ],
          formulas: [
            { expr: "C = S × N(d1) − K × e^(−rt) × N(d2)", terms: [
              ["S", "Spot price"], ["K", "Strike"], ["t", "Time to expiry in years"],
              ["r", "Continuously compounded risk-free rate"],
              ["N(·)", "Standard normal cumulative probability"],
            ] },
            { expr: "d1 = [ln(S/K) + (r + σ²/2) × t] / (σ√t)", terms: [
              ["ln(S/K)", "How far in or out of the money the option is, in log terms"],
              ["σ", "Annual volatility of the stock's returns"],
              ["σ√t", "Volatility over the option's whole life"],
            ] },
            { expr: "d2 = d1 − σ√t", terms: [] },
          ],
          steps: [
            p(`**1.** ln(S/K) = ln(${s}/${k}) = ${ln.toFixed(5)}.`),
            p(`**2.** σ√t = ${v} × √${t} = ${v} × ${sq.toFixed(5)} = ${vt.toFixed(5)}.`),
            p(`**3.** (r + σ²/2) × t = (${r} + ${v}²/2) × ${t} = (${r} + ${((v * v) / 2).toFixed(5)}) × ${t} = ${drift.toFixed(5)}.`),
            p(`**4.** d1 = (${ln.toFixed(5)} + ${drift.toFixed(5)}) / ${vt.toFixed(5)} = **${d1.toFixed(4)}**.`),
            p(`**5.** d2 = ${d1.toFixed(4)} − ${vt.toFixed(5)} = **${d2.toFixed(4)}**.`),
            p(`**6.** N(d1) = ${n1.toFixed(4)}, N(d2) = ${n2.toFixed(4)} (from a normal table or NORM.S.DIST).`),
            p(`**7.** PV(K) = ${k} × e^(−${r} × ${t}) = ${money(pvk, 4)}.`),
            table(["Piece", "Calculation", "Value"], [
              ["Stock leg", `${s} × ${n1.toFixed(4)}`, money(s * n1, 4)],
              ["Strike leg", `${n(pvk, 4)} × ${n2.toFixed(4)}`, money(pvk * n2, 4)],
              ["Call value", "Stock leg − strike leg", `**${money(g.price, 2)}**`],
            ]),
          ],
          meaning: [
            `The call is worth **${money(g.price, 2)}**. Its lower bound is S − PV(K) = ${money(intrinsic, 2)}; the extra ${money(g.price - intrinsic, 2)} is time value, the price of the chance the stock moves further.`,
            `Delta is N(d1) = ${g.delta.toFixed(3)}: the option moves about ${g.delta.toFixed(2)} dollars for each $1 move in the stock. The market assigns about a ${pct(n2, 0)} risk-neutral chance of finishing in the money.`,
          ],
          mistakes: [
            "Using σ² or σ alone where σ√t belongs, or entering time in months instead of years.",
            `Discounting the strike with annual compounding: ${money(s * n1 - (k / Math.pow(1 + r, t)) * n2, 2)}. Black-Scholes uses e^(−rt).`,
            "Reading N(d) from a table with too few decimals. Small rounding in N(d1) is multiplied by the stock price.",
            "Swapping N(d1) and N(d2) between the two legs.",
          ],
          excel: [
            `d1: \`=(LN(${s}/${k})+(${r}+${v}^2/2)*${t})/(${v}*SQRT(${t}))\` in B1, d2: \`=B1-${v}*SQRT(${t})\` in B2.`,
            `Call: \`=${s}*NORM.S.DIST(B1,TRUE)-${k}*EXP(-${r}*${t})*NORM.S.DIST(B2,TRUE)\`.`,
          ],
        },
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
        solution: {
          idea: [
            "There are two ways to own the stock in the future: agree a price today in a forward contract and pay at delivery, or borrow the money, buy the stock now and hold it (cash and carry).",
            "Holding the stock costs you the interest on the borrowed money, and this stock pays nothing to offset it. So the forward price must equal today's price grown at the risk-free rate. Any other price lets someone lock in a free profit.",
          ],
          formulas: [{ expr: "F = S × (1 + r)ᵗ", terms: [["S", "Spot price today"], ["r", "Risk-free rate, annual compounding"], ["t", "Years to delivery"]] }],
          steps: [
            p(`Growth factor = (1 + ${pct(r)})^${t} = ${Math.pow(1 + r, t).toFixed(6)}.`),
            p(`F = ${money(s)} × ${Math.pow(1 + r, t).toFixed(6)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `If the forward traded above ${money(ans, 2)}: borrow ${money(s)}, buy the stock, sell the forward. At delivery hand over the stock, receive the forward price, repay ${money(ans, 2)}, keep the difference. Below it, do the reverse (short the stock, invest the cash, buy the forward).`,
            "The forward price is not a forecast of the future stock price. It is set purely by the cost of carrying the stock.",
          ],
          mistakes: [
            `Using simple interest: ${money(s * (1 + r * t), 2)}.`,
            `Using continuous compounding when the rate is annual: ${money(s * Math.exp(r * t), 2)}.`,
          ],
          excel: [`\`=${s}*(1+${n(r)})^${t}\``],
        },
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
      const k = pick(rng, 50, 200, 5), c = pick(rng, 2, 12, 0.5), pp = pick(rng, 2, 12, 0.5), st = k + pick(rng, -40, 40, 1);
      const ans = Math.abs(st - k) - c - pp;
      const callPay = Math.max(0, st - k), putPay = Math.max(0, k - st);
      return {
        blocks: [{ kind: "p", text: `You buy a call for **${money(c, 2)}** and a put for **${money(pp, 2)}**, both European with strike **${money(k)}** and the same expiry. At expiry the stock is **${money(st)}**.` }],
        question: "What is your profit or loss per share? Negative for a loss. Ignore the time value of the premiums.",
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "A long straddle is a bet on a big move in either direction. The call pays if the stock rises above the strike, the put pays if it falls below. Only one of them can pay at expiry.",
            "You pay both premiums up front, so you need the stock to move far enough from the strike to cover them. If it ends near the strike, you lose.",
          ],
          formulas: [
            { expr: "Profit = max(S − K, 0) + max(K − S, 0) − (C + P) = |S − K| − (C + P)", terms: [["S", "Stock price at expiry"], ["K", "Strike"], ["C + P", "Total premium paid"]] },
            { expr: "Break-evens = K ± (C + P)", terms: [] },
          ],
          steps: [
            table(["Leg", "Payoff at expiry", "Premium", "Net"], [
              ["Call", `max(${st} − ${k}, 0) = ${num(callPay)}`, num(-c, 2), num(callPay - c, 2)],
              ["Put", `max(${k} − ${st}, 0) = ${num(putPay)}`, num(-pp, 2), num(putPay - pp, 2)],
              ["Straddle", num(callPay + putPay), num(-(c + pp), 2), `**${num(ans, 2)}**`],
            ]),
            p(`Profit = |${st} − ${k}| − ${(c + pp).toFixed(2)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `Break-evens are ${money(k - c - pp, 2)} and ${money(k + c + pp, 2)}. ${ans >= 0 ? "The stock moved outside that range, so the bet paid." : "The stock ended inside that range, so the move was not big enough to cover the premiums."}`,
            `The most you can lose is the ${money(c + pp, 2)} of premium, if the stock ends exactly at the strike. Upside is unlimited. A straddle is a long-volatility trade, often placed before earnings or other events.`,
          ],
          mistakes: [
            `Counting only one premium: ${money(Math.abs(st - k) - (st >= k ? c : pp), 2)}.`,
            "Adding the payoffs of both options as if both pay. At any expiry price only one is in the money.",
          ],
          excel: [`\`=MAX(${st}-${k},0)+MAX(${k}-${st},0)-${c}-${pp}\``],
        },
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
      const su = s * u, sd = s * d;
      const delta = (cu - cd) / (su - sd);
      const bond = (cu - delta * su) / (1 + r);
      return {
        blocks: [{ kind: "p", text: `A stock at **${money(s)}** will move up by a factor of **${u.toFixed(2)}** or down by **${d.toFixed(4)}** over one period. The one-period risk-free rate is **${pct(r)}**.` }],
        question: `What is the value of a one-period European call with strike ${money(k)}?`,
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "In a one-step world the stock can only go to two prices. With just two outcomes, you can build a portfolio of stock and borrowing that pays exactly what the call pays in both. That portfolio and the call must cost the same, otherwise there is an arbitrage.",
            "Doing the algebra gives a shortcut: price the call as if investors were indifferent to risk. Find the probability q that makes the stock earn exactly the risk-free rate, take the expected payoff under q, and discount at the risk-free rate.",
            "q is not anyone's real forecast of an up-move. It is a pricing device that falls out of the no-arbitrage argument. The real probability does not appear in the answer at all.",
          ],
          formulas: [
            { expr: "q = (1 + r − d) / (u − d)", terms: [["u, d", "Up and down factors"], ["r", "Risk-free rate for the period"], ["q", "Risk-neutral probability of the up-move"]] },
            { expr: "C = [q × C_u + (1 − q) × C_d] / (1 + r)", terms: [["C_u, C_d", "Call payoffs after an up and a down move: max(S × u − K, 0), max(S × d − K, 0)"]] },
            { expr: "Δ = (C_u − C_d) / (S_u − S_d), C = Δ × S + B", terms: [["Δ", "Shares in the replicating portfolio (the hedge ratio)"], ["B", "Amount borrowed (negative) or lent today"]] },
          ],
          steps: [
            p(`**1. Tree and payoffs.** Grow the stock by each factor and work out what the call pays at strike ${money(k)}:`),
            table(["State", "Stock price", "Call payoff"], [
              ["Today", money(s, 2), "?"],
              ["Up", `${money(s)} × ${u.toFixed(2)} = ${money(su, 2)}`, `C_u = max(${su.toFixed(2)} − ${k}, 0) = ${money(cu, 2)}`],
              ["Down", `${money(s)} × ${d.toFixed(4)} = ${money(sd, 2)}`, `C_d = max(${sd.toFixed(2)} − ${k}, 0) = ${money(cd, 2)}`],
            ]),
            p(`**2. Risk-neutral probability.** q = (1 + ${r} − ${d}) / (${u.toFixed(2)} − ${d}) = ${(1 + r - d).toFixed(4)} / ${(u - d).toFixed(4)} = ${q.toFixed(4)}.`),
            p(`**3. Value.** C = [${q.toFixed(4)} × ${cu.toFixed(2)} + ${(1 - q).toFixed(4)} × ${cd.toFixed(2)}] / ${(1 + r).toFixed(2)} = **${money(ans, 2)}**.`),
            p(`**4. Check by replication.** Δ = (${cu.toFixed(2)} − ${cd.toFixed(2)}) / (${su.toFixed(2)} − ${sd.toFixed(2)}) = ${delta.toFixed(4)} shares. Bond B = (C_u − Δ × S_u) / (1 + r) = ${num(bond, 4)}. Cost = ${delta.toFixed(4)} × ${s} + (${num(bond, 4)}) = ${money(delta * s + bond, 2)}, the same answer.`),
          ],
          meaning: [
            `The call is worth ${money(ans, 2)}. To hedge one written call, hold ${delta.toFixed(3)} shares${bond < 0 ? ` and borrow ${money(-bond, 2)}` : ""}; the position is riskless over the period.`,
            "Stack many such steps and let them shrink, and the binomial value converges to Black-Scholes.",
          ],
          mistakes: [
            `Using a 50/50 probability: ${money((0.5 * cu + 0.5 * cd) / (1 + r), 2)}.`,
            `Forgetting to discount: ${money(q * cu + (1 - q) * cd, 2)}.`,
            "Computing q with d = u − 1 or some other guess. Use the down factor given.",
          ],
          excel: [`\`=((1+${r}-${d})/(${u}-${d})*MAX(${s}*${u}-${k},0)+(1-(1+${r}-${d})/(${u}-${d}))*MAX(${s}*${d}-${k},0))/(1+${r})\``],
        },
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
      const eq = pick(rng, 100, 800, 25), moic = pick(rng, 1.5, 4, 0.1), yrs = pick(rng, 3, 7, 1);
      const ans = (Math.pow(moic, 1 / yrs) - 1) * 100;
      const g = Math.pow(moic, 1 / yrs);
      const rows = Array.from({ length: yrs + 1 }, (_, t) => [String(t), money(eq * Math.pow(g, t), 1) + "m"]);
      return {
        blocks: [{ kind: "p", text: `A sponsor invests **${money(eq)}m** of equity and exits after **${yrs} years** with **${money(eq * moic, 1)}m**. There are no interim distributions.` }],
        question: "What is the IRR? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.02 },
        solution: {
          idea: [
            "MOIC (multiple on invested capital) says how many times the money grew; it ignores how long that took. IRR is the annual compound growth rate that turns the entry cheque into the exit proceeds.",
            "With one cash flow in and one out, the IRR has a closed form: it is the constant rate that, compounded for N years, gives the multiple.",
          ],
          formulas: [
            { expr: "(1 + IRR)ᴺ = MOIC, so IRR = MOIC^(1/N) − 1", terms: [["MOIC", "Exit proceeds ÷ equity invested"], ["N", "Years held"]] },
          ],
          steps: [
            p(`MOIC = ${money(eq * moic, 1)}m / ${money(eq)}m = ${moic.toFixed(1)}x.`),
            p(`Take the ${yrs}th root: ${moic.toFixed(1)}^(1/${yrs}) = e^(ln ${moic.toFixed(1)} / ${yrs}) = e^(${Math.log(moic).toFixed(5)} / ${yrs}) = ${g.toFixed(6)}.`),
            p(`IRR = ${g.toFixed(6)} − 1 = **${ans.toFixed(2)}%**.`),
            p(`Check: compounding ${money(eq)}m at ${ans.toFixed(2)}% for ${yrs} years lands on the exit value.`),
            table(["Year", "Value at the IRR"], rows),
          ],
          meaning: [
            `A ${moic.toFixed(1)}x return over ${yrs} years is ${ans.toFixed(2)}% a year. The same multiple in ${yrs - 1} years would be ${pct(Math.pow(moic, 1 / (yrs - 1)) - 1)}; in ${yrs + 1} years only ${pct(Math.pow(moic, 1 / (yrs + 1)) - 1)}. Time is the enemy of IRR.`,
            "That is why sponsors care about both: IRR rewards speed, MOIC rewards the absolute amount of money made. A quick 1.5x can show a high IRR but return little cash.",
            "Rules of thumb: 2x in 5 years ≈ 15%, 3x in 5 years ≈ 25%, 2x in 3 years ≈ 26%.",
          ],
          mistakes: [
            `Dividing the gain by the years: (${moic.toFixed(1)} − 1) / ${yrs} = ${pct((moic - 1) / yrs)}. That ignores compounding and overstates the return.`,
            `Dividing MOIC by years: ${pct(moic / yrs)}.`,
          ],
          excel: [`\`=${moic}^(1/${yrs})-1\`, or \`=RRI(${yrs},${eq},${n(eq * moic, 2)})\`.`],
        },
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
      const uses = ev + fees + cash;
      const ans = uses - debt;
      return {
        blocks: [{ kind: "p", text: `A sponsor buys a company with **${money(ebitda)}m** of EBITDA at **${m.toFixed(1)}x** EV/EBITDA, on a cash-free, debt-free basis. Transaction fees are **${pct(feePct)}** of EV, and the business needs **${money(cash)}m** of minimum cash on the balance sheet at close. Lenders provide **${lev.toFixed(1)}x** EBITDA of debt.` }],
        question: "How much equity must the sponsor contribute, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.05 },
        solution: {
          idea: [
            "Every deal has to balance: the money raised (sources) must equal the money spent (uses). In an LBO, lenders put in as much as the business can support, and the sponsor's equity fills the gap.",
            "Uses are more than the purchase price. Fees must be paid, and the company needs some cash on day one to operate. Cash-free, debt-free means the seller keeps any cash and repays any debt, so the buyer pays EV and starts with a clean balance sheet.",
          ],
          formulas: [
            { expr: "Uses = EV + Fees + Minimum cash", terms: [["EV", "EBITDA × purchase multiple"], ["Fees", "Advisory and financing fees"], ["Minimum cash", "Cash funded into the company at close"]] },
            { expr: "Sponsor equity = Uses − Debt", terms: [["Debt", "EBITDA × leverage multiple"]] },
          ],
          steps: [
            p(`EV = ${money(ebitda)}m × ${m.toFixed(1)} = ${money(ev, 1)}m. Fees = ${pct(feePct)} × ${money(ev, 1)}m = ${money(fees, 2)}m. Debt = ${money(ebitda)}m × ${lev.toFixed(1)} = ${money(debt, 1)}m.`),
            table(["Uses", "$m", "Sources", "$m"], [
              ["Purchase of the business (EV)", num(ev, 2), "Debt", num(debt, 2)],
              ["Transaction fees", num(fees, 2), "Sponsor equity (plug)", `**${num(ans, 2)}**`],
              ["Minimum cash", num(cash, 2), "", ""],
              ["Total uses", num(uses, 2), "Total sources", num(uses, 2)],
            ]),
          ],
          meaning: [
            `The sponsor writes a cheque for **${money(ans, 2)}m**, ${pct(ans / uses, 1)} of the total. Debt is ${lev.toFixed(1)}x EBITDA, ${pct(debt / uses, 1)} of the capital.`,
            "The less equity a sponsor puts in, the higher its potential IRR, but the more risk the business carries.",
          ],
          mistakes: [
            `Equity = EV − debt, forgetting fees and cash: ${money(ev - debt, 2)}m.`,
            `Calculating fees on equity instead of on EV.`,
          ],
          excel: [`\`=${ebitda}*${m}*(1+${n(feePct)})+${cash}-${ebitda}*${lev}\``],
        },
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
      const e0 = pick(rng, 50, 200, 5), m0 = pick(rng, 8, 12, 0.5), lev = pick(rng, 4, 6, 0.5), g = pick(rng, 0.03, 0.12, 0.01), yrs = 5;
      const exitM = m0 + pick(rng, -1.5, 1.5, 0.5), paydownPct = pick(rng, 0.2, 0.6, 0.05);
      const debt0 = e0 * lev, eq0 = e0 * m0 - debt0;
      const e5 = e0 * Math.pow(1 + g, yrs), debt5 = debt0 * (1 - paydownPct);
      const eq5 = e5 * exitM - debt5;
      const ans = irr([-eq0, 0, 0, 0, 0, eq5]) * 100;
      const moic = eq5 / eq0;
      const growth = (e5 - e0) * m0, mult = (exitM - m0) * e5, paydown = debt0 - debt5, gain = eq5 - eq0;
      return {
        blocks: [{ kind: "p", text: `A sponsor buys a business with **${money(e0)}m** EBITDA at **${m0.toFixed(1)}x**, funded with **${lev.toFixed(1)}x** debt and the rest equity (ignore fees). EBITDA grows **${pct(g)}** a year. Over **5 years** the company repays **${pct(paydownPct, 0)}** of the opening debt and holds no excess cash. It exits at **${exitM.toFixed(1)}x**.` }],
        question: "What is the sponsor's IRR? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.03 },
        solution: {
          idea: [
            "A leveraged buyout makes money for the sponsor in three ways: the business earns more (EBITDA growth), the market pays a higher multiple for it at exit (multiple expansion), and the company's cash flow repays debt, so more of the enterprise value belongs to equity (deleveraging).",
            "Debt magnifies all of this. The sponsor only put in part of the purchase price, but it keeps all of the increase in value after the lenders are repaid.",
            "So: work out what the equity was worth going in, what it is worth coming out, and convert that multiple into an annual rate.",
          ],
          formulas: [
            { expr: "Equity = EV − Net debt = EBITDA × Multiple − Debt", terms: [["EV", "Enterprise value at entry or exit"], ["Debt", "Debt outstanding at that date"]] },
            { expr: "MOIC = Exit equity / Entry equity, IRR = MOIC^(1/N) − 1", terms: [["N", "Years held. With no interim dividends, IRR follows directly from MOIC"]] },
            { expr: "Equity gain = ΔEBITDA × Entry multiple + ΔMultiple × Exit EBITDA + Debt repaid", terms: [["Use", "Splits the gain into the three sources of value"]] },
          ],
          steps: [
            table(["", "Entry", "Exit (year 5)"], [
              ["EBITDA", money(e0, 2), `${money(e0, 0)} × (1 + ${pct(g)})^5 = ${money(e5, 2)}`],
              ["Multiple", `${m0.toFixed(1)}x`, `${exitM.toFixed(1)}x`],
              ["Enterprise value", money(e0 * m0, 2), money(e5 * exitM, 2)],
              ["− Debt", money(debt0, 2), `${money(debt0, 2)} × (1 − ${pct(paydownPct, 0)}) = ${money(debt5, 2)}`],
              ["= Equity", money(eq0, 2), money(eq5, 2)],
            ]),
            p(`MOIC = ${money(eq5, 2)} / ${money(eq0, 2)} = ${moic.toFixed(3)}x.`),
            p(`IRR = ${moic.toFixed(3)}^(1/5) − 1 = **${ans.toFixed(2)}%**.`),
            p("Where the gain came from:"),
            table(["Source", "Calculation", "$m", "Share of gain"], [
              ["EBITDA growth", `(${num(e5, 2)} − ${num(e0)}) × ${m0.toFixed(1)}`, num(growth, 2), pct(growth / gain, 1)],
              ["Multiple change", `(${exitM.toFixed(1)} − ${m0.toFixed(1)}) × ${num(e5, 2)}`, num(mult, 2), pct(mult / gain, 1)],
              ["Debt paydown", `${num(debt0, 2)} − ${num(debt5, 2)}`, num(paydown, 2), pct(paydown / gain, 1)],
              ["Total equity gain", "", num(gain, 2), "100%"],
            ]),
          ],
          meaning: [
            ans >= 0
              ? `The sponsor earns **${ans.toFixed(2)}%** a year, ${moic.toFixed(2)}x its money. Most sponsors target 20 to 25% IRR and 2.5 to 3x, so ${ans >= 20 ? "this clears a typical hurdle." : "this falls short of a typical hurdle."}`
              : `The sponsor loses money: ${moic.toFixed(2)}x, an IRR of **${ans.toFixed(2)}%**. Leverage cuts both ways.`,
            mult < 0 ? `Multiple contraction cost ${money(-mult, 2)}m. Underwriting a deal on the assumption you sell at the entry multiple or lower is the conservative standard.` : mult > 0 ? `${money(mult, 2)}m came from multiple expansion. Sponsors try not to rely on it, because it depends on the market at exit rather than on what they did.` : "The multiple was unchanged, so all of the gain came from operations and debt paydown.",
          ],
          mistakes: [
            `Using exit EV instead of exit equity: ${pct(Math.pow((e5 * exitM) / eq0, 1 / 5) - 1)}. Lenders are repaid first.`,
            `Comparing exit equity with the full entry EV: ${pct(Math.pow(eq5 / (e0 * m0), 1 / 5) - 1)}. The sponsor only paid for the equity.`,
            `Annualising the multiple with simple division: (${moic.toFixed(2)} − 1) / 5 = ${pct((moic - 1) / 5)}.`,
          ],
          excel: [`\`=IRR({${n(-eq0, 2)},0,0,0,0,${n(eq5, 2)}})\`, or \`=(${n(eq5, 2)}/${n(eq0, 2)})^(1/5)-1\`.`],
        },
      };
    },
  },
  {
    slug: "dividend-recap-irr",
    title: "Dividend recap and IRR",
    track: "Private Equity",
    difficulty: "Medium",
    concepts: ["LBO", "IRR", "Dividend recapitalisation"],
    generate(rng) {
      const eq0 = pick(rng, 100, 400, 10), k = pick(rng, 2, 3, 1), recap = eq0 * pick(rng, 0.3, 0.8, 0.05), exit = eq0 * pick(rng, 0.6, 2.5, 0.05);
      const flows = [-eq0, 0, 0, 0, 0, exit];
      flows[k] = recap;
      const r = irr(flows), ans = r * 100;
      const moic = (recap + exit) / eq0;
      const noRecap = Math.pow(moic, 1 / 5) - 1, exitOnly = Math.pow(exit / eq0, 1 / 5) - 1;
      const trials = irrTrials(flows, r);
      const pr = (x: number) => pct(x, 4);
      return {
        blocks: [
          { kind: "p", text: `A sponsor invests **${money(eq0)}m** of equity in a buyout at the start of year 1. At the end of **year ${k}** the company borrows more and pays the sponsor a **${money(recap, 1)}m** dividend (a dividend recap). At the end of **year 5** the sponsor sells its stake for **${money(exit, 1)}m**. There are no other cash flows; ignore fees and taxes.` },
        ],
        question: "What is the sponsor's IRR? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.03 },
        solution: {
          idea: [
            "IRR is the single annual rate at which the money the sponsor gets back, discounted to day one, exactly equals what it put in. Unlike a money multiple, it cares about **when** the money comes back.",
            `A dividend recap returns part of the investment early. The total money back (and so the MOIC) is the same whether the cash arrives in year ${k} or year 5, but on a profitable deal cash received earlier is worth more, so the recap raises IRR. That is why sponsors use recaps, and why LPs look at both IRR and MOIC.`,
            "With cash flows in more than one year there is no closed-form answer: you find the rate by trial and error, or let `=IRR` do it.",
          ],
          formulas: [
            { expr: `0 = −E₀ + D / (1 + r)^${k} + X / (1 + r)^5`, terms: [["E₀", "Equity invested at time 0"], ["D", `Recap dividend received at the end of year ${k}`], ["X", "Exit proceeds at the end of year 5"], ["r", "The IRR: the rate that makes the NPV zero"]] },
            { expr: "Next guess = r₂ − NPV₂ × (r₂ − r₁) / (NPV₂ − NPV₁)", terms: [["r₁, r₂", "The last two rates tried"], ["NPV₁, NPV₂", "The NPV at each of them"]] },
            { expr: "MOIC = (D + X) / E₀", terms: [["MOIC", "Multiple of invested capital: total money back over money in, ignoring timing"]] },
          ],
          steps: [
            p(`Cash flows ($m), years 0 to 5: ${flows.map((x) => num(x, 1)).join(", ")}.`),
            p(`**Trial 1:** at 0%, NPV is just the sum of the flows: ${num(trials[0].fx, 2)}. ${trials[0].fx > 0 ? "Positive, so the IRR is above 0%." : "Negative, so the IRR is below 0%: the sponsor gets back less than it put in."}`),
            p(`**Trial 2:** at ${pr(trials[1].x)}, NPV = ${num(trials[1].fx, 2)}.`),
            p(`**Interpolate.** ${interpolationLine(trials[0], trials[1], pr)} Repeat until NPV is essentially zero:`),
            irrTrialTable(trials),
            p(`IRR = **${pct(r)}**. MOIC = (${num(recap, 1)} + ${num(exit, 1)}) / ${num(eq0)} = ${moic.toFixed(2)}x.`),
            p(`Cross-check: the same ${moic.toFixed(2)}x received all at exit would give ${moic.toFixed(2)}^(1/5) − 1 = ${pct(noRecap)}. ${r >= noRecap ? `The recap's early timing adds ${num(ans - noRecap * 100, 2)} percentage points of IRR.` : `Here the early timing costs ${num(noRecap * 100 - ans, 2)} percentage points, because the deal loses money (see below).`}`),
          ],
          meaning: [
            ans >= 0
              ? `The sponsor earns **${pct(r)}** a year on ${moic.toFixed(2)}x its money. ${ans >= 20 ? "That clears the 20 to 25% most buyout funds target." : "That is below the 20 to 25% most buyout funds target."}`
              : `The IRR is negative (**${pct(r)}**): the sponsor gets back only ${moic.toFixed(2)}x what it invested. With a loss, the usual timing logic flips: at a negative rate, later cash is discounted **up**, so getting part of the money back early makes the IRR slightly worse, not better. The recap still reduced the sponsor's risk by banking cash before the exit.`,
            exit < eq0 ? `The exit alone (${money(exit, 1)}m) is less than the original equity. Without the recap this deal ${moic >= 1 ? "would look like a loss; with it the sponsor has its money back plus some" : "loses even more"}. That is why recaps are sometimes called "taking chips off the table".` : `The recap took ${pct(recap / eq0, 0)} of the original equity off the table in year ${k}, de-risking the deal before the exit.`,
            "The extra debt that funds a recap raises the company's leverage and interest bill. Lenders and boards weigh that risk against the sponsor's higher IRR.",
          ],
          mistakes: [
            `Treating the dividend as if it arrived at exit: (${num(recap + exit, 1)} / ${num(eq0)})^(1/5) − 1 = ${pct(noRecap)}. Right MOIC, wrong IRR, because timing matters.`,
            `Ignoring the dividend altogether: (${num(exit, 1)} / ${num(eq0)})^(1/5) − 1 = ${pct(exitOnly)}.`,
            `Simple annualisation: (${moic.toFixed(2)} − 1) / 5 = ${pct((moic - 1) / 5)}. That is neither compounded nor timing-aware.`,
            `Putting the dividend in the wrong year in the cash flow row. Year 0 is the investment date, so the year ${k} dividend is the ${k === 2 ? "3rd" : "4th"} value.`,
          ],
          excel: [
            `\`=IRR({${flows.map((x) => n(x, 2)).join(",")}})\``,
            `MOIC: \`=(${n(recap, 2)}+${n(exit, 2)})/${eq0}\`. Lay the flows out in a row with a 0 in every empty year: leaving a year out shifts everything after it.`,
          ],
        },
      };
    },
  },
  {
    slug: "fund-waterfall-carry",
    title: "Fund waterfall: GP carried interest",
    track: "Private Equity",
    difficulty: "Hard",
    concepts: ["Fund economics", "Carried interest", "Distribution waterfall"],
    generate(rng) {
      const c = pick(rng, 100, 500, 10), mult = pick(rng, 1.3, 2.6, 0.02), yrs = pick(rng, 3, 7, 1);
      const hurdle = 0.08, carry = 0.2;
      const d = c * mult;
      const w = europeanWaterfall({ contributed: c, proceeds: d, years: yrs, hurdle, carry });
      const ans = w.gp;
      const hurdleMult = Math.pow(1 + hurdle, yrs), prefFull = c * (hurdleMult - 1), cuFull = prefFull / 4;
      const profit = d - c;
      const afterRoc = d - w.returnOfCapital, afterPref = afterRoc - w.preferred, afterCu = afterPref - w.catchUp;
      // Wrong answers people get
      const noCatchUp = carry * Math.max(0, d - c - prefFull);
      const simplePref = c * hurdle * yrs;
      const simpleLeft = Math.max(0, d - c - simplePref);
      const withSimple = Math.min(simpleLeft, simplePref / 4) + carry * Math.max(0, simpleLeft - simplePref / 4);
      const zone = afterPref <= 0 ? "below" : afterCu <= 0 ? "catchup" : "full";
      return {
        blocks: [
          { kind: "p", text: `A buyout fund's LPs contribute **${money(c)}m**, all invested at the start. After **${yrs} years** the fund has sold everything and distributes **${money(d, 1)}m** in total, all at the end of year ${yrs}. The fund uses a whole-fund (European) waterfall:` },
          { kind: "table", head: ["Tier", "Terms"], rows: [
            ["1. Return of capital", "100% to LPs until they have their contributions back"],
            ["2. Preferred return", "100% to LPs until they have an 8% a year return, compounded annually"],
            ["3. GP catch-up", "100% to the GP until it has received 20% of all profits distributed so far"],
            ["4. Carried interest split", "80% to LPs, 20% to the GP"],
          ] },
          { kind: "p", text: "Ignore management fees and the GP's own commitment." },
        ],
        question: "How much carried interest does the GP receive, in $m? Two decimals.",
        answer: ans, unit: "$m", tolerance: { abs: 0.02 },
        solution: {
          idea: [
            "A private equity fund's general partner (GP) is paid mainly through **carried interest**: a share, usually 20%, of the profit it earns for its investors (LPs). The **waterfall** is the order in which each dollar of proceeds is paid out, like water filling a series of buckets: a bucket must be full before anything spills into the next.",
            "LPs are protected first: they get their money back, then a minimum return (the **hurdle** or preferred return). Only profit above the hurdle produces carry.",
            "The **catch-up** then gives the GP 100% of the next dollars until it has 20% of all profit paid so far, as if the hurdle had never existed. So once a fund clears the hurdle by enough, the GP ends up with exactly 20% of total profit. The hurdle decides **whether** the GP is paid, not how much it is paid once the fund does well. In between, the GP gets everything above the hurdle.",
          ],
          formulas: [
            { expr: "Preferred return = C × ((1 + h)^T − 1)", terms: [["C", "Capital contributed"], ["h", "Hurdle rate, 8% a year"], ["T", "Years from contribution to distribution"]] },
            { expr: "Full catch-up = carry / (1 − carry) × Preferred return = Preferred / 4", terms: [["carry", "GP share of profits, 20%"], ["Why", "After it, GP has 20% and LPs 80% of (pref + catch-up): catch-up = 0.2 × (pref + catch-up)"]] },
            { expr: "GP carry = Catch-up + 20% × (D − C − Pref − Catch-up)", terms: [["D", "Total proceeds distributed"], ["Each tier", "Capped by whatever is left after the tiers above it"]] },
          ],
          steps: [
            p(`Preferred return owed: ${money(c)}m × (1.08^${yrs} − 1) = ${money(c)}m × ${(hurdleMult - 1).toFixed(5)} = ${money(prefFull, 4)}m. Full catch-up would be ${num(prefFull, 4)} / 4 = ${money(cuFull, 4)}m.`),
            p(`Hurdle test: LPs need ${money(c + prefFull, 2)}m (${hurdleMult.toFixed(4)}x) before any carry. The fund paid ${money(d, 1)}m (${mult.toFixed(2)}x).`),
            table(["Tier", "Available", "To LPs", "To GP", "Left after"], [
              ["1. Return of capital", num(d, 2), num(w.returnOfCapital, 2), "0.00", num(afterRoc, 2)],
              ["2. Preferred return", num(afterRoc, 2), num(w.preferred, 2), "0.00", num(afterPref, 2)],
              ["3. GP catch-up", num(afterPref, 2), "0.00", num(w.catchUp, 2), num(afterCu, 2)],
              ["4. 80 / 20 split", num(afterCu, 2), num(0.8 * w.residual, 2), num(0.2 * w.residual, 2), "0.00"],
              ["Total", num(d, 2), num(w.lp, 2), `**${num(ans, 2)}**`, ""],
            ]),
            p(`GP carried interest = ${num(w.catchUp, 2)} + 20% × ${num(w.residual, 2)} = **${money(ans, 2)}m**.`),
            p(zone === "full"
              ? `Cross-check: the catch-up completed, so the GP should hold exactly 20% of total profit: 20% × (${num(d, 2)} − ${num(c)}) = ${num(0.2 * profit, 2)}. ✓`
              : zone === "catchup"
                ? `Cross-check: the catch-up did not complete, so the GP gets every dollar above the LPs' ${money(c + prefFull, 2)}m hurdle amount: ${num(d, 2)} − ${num(c + prefFull, 2)} = ${num(ans, 2)}. That is ${pct(ans / profit, 1)} of profit, less than the full 20%.`
                : `Cross-check: ${money(d, 1)}m is below the ${money(c + prefFull, 2)}m LPs need to clear the hurdle, so tiers 3 and 4 receive nothing and carry is zero.`),
          ],
          meaning: [
            zone === "full"
              ? `The fund cleared the hurdle with room to spare, so the GP earns the full 20% of profit (**${money(ans, 2)}m**) and LPs keep ${money(w.lp - c, 2)}m of profit. Above this point every extra dollar is split 80/20.`
              : zone === "catchup"
                ? `The fund sits in the **catch-up zone**: it beat the hurdle but not by enough for the GP to reach 20%. Here each extra dollar of proceeds goes entirely to the GP until it holds 20% of profit, so carry is very sensitive to the exit value.`
                : `The fund returned ${mult.toFixed(2)}x, short of the ${hurdleMult.toFixed(3)}x needed for an 8% compounded return over ${yrs} years. The GP earns **no carry**, even though LPs made a profit of ${money(profit, 1)}m. This is the hurdle doing its job.`,
            `The longer the hold, the higher the bar: at 8% a year the hurdle is ${hurdleMult.toFixed(3)}x after ${yrs} years. Slow exits erode carry even when the multiple looks healthy.`,
            "Real funds call capital and distribute over many years, so the hurdle is tested on dated cash flows (an IRR test), not one multiple. Many US funds use a deal-by-deal (American) waterfall instead, which pays carry earlier and usually comes with a clawback.",
          ],
          mistakes: [
            `Leaving out the catch-up (20% of profit above the hurdle): ${money(noCatchUp, 2)}m.`,
            Math.abs(withSimple - ans) > 0.02
              ? `Simple instead of compound hurdle (8% × ${yrs} = ${pct(hurdle * yrs, 0)} rather than ${pct(hurdleMult - 1, 2)}): ${money(withSimple, 2)}m.`
              : `Simple instead of compound hurdle (8% × ${yrs} = ${pct(hurdle * yrs, 0)} rather than ${pct(hurdleMult - 1, 2)}). It happens not to change the answer here because the catch-up completes either way, but it moves the hurdle and gives the wrong carry for funds near it.`,
            zone === "full"
              ? `Taking 20% of total profit straight away gives ${money(0.2 * profit, 2)}m, the right answer here only because the catch-up completed. In the catch-up zone or below the hurdle it overstates carry.`
              : `Taking 20% of total profit and ignoring the hurdle: ${money(0.2 * profit, 2)}m. That overstates carry whenever the catch-up has not completed.`,
            `Taking 20% of total proceeds rather than profit: ${money(0.2 * d, 2)}m. Carry is a share of profit; LPs get their capital back first.`,
          ],
          excel: [
            `Preferred return: \`=${c}*(1.08^${yrs}-1)\` → ${num(prefFull, 4)}.`,
            `Carry in one formula: \`=MIN(MAX(${n(d, 2)}-${c}-${c}*(1.08^${yrs}-1),0),${c}*(1.08^${yrs}-1)/4)+0.2*MAX(${n(d, 2)}-${c}-${c}*(1.08^${yrs}-1)*1.25,0)\`. The \`MAX(…,0)\` stops a tier going negative when the fund falls short of it, and \`*1.25\` is pref plus a full catch-up.`,
          ],
        },
      };
    },
  },
  {
    slug: "fund-multiples-tvpi",
    title: "Fund multiples: DPI, RVPI and TVPI",
    track: "Private Equity",
    difficulty: "Easy",
    concepts: ["Fund performance", "TVPI", "DPI"],
    generate(rng) {
      const commit = pick(rng, 100, 500, 25), called = pick(rng, 0.6, 0.95, 0.05), dm = pick(rng, 0, 1.6, 0.05), vm = pick(rng, 0.3, 1.4, 0.05);
      const paidIn = commit * called, dist = Math.round(paidIn * dm * 10) / 10, nav = Math.round(paidIn * vm * 10) / 10;
      const { dpi, rvpi, tvpi } = fundMultiples(paidIn, dist, nav);
      return {
        blocks: [{ kind: "p", text: `A buyout fund has **${money(commit)}m** of commitments, of which LPs have paid in **${money(paidIn, 2)}m** so far. It has distributed **${money(dist, 1)}m** back to LPs, and its remaining portfolio is held at a net asset value of **${money(nav, 1)}m**.` }],
        question: "What is the fund's TVPI? Multiple to two decimals.",
        answer: tvpi, unit: "x", tolerance: { abs: 0.005 },
        solution: {
          idea: [
            "LPs judge a fund by what it has done with the money it actually called, so every multiple divides by paid-in capital, not commitments. TVPI adds what has come back in cash (DPI) to what is still held at the fund's own valuation (RVPI).",
          ],
          formulas: [
            { expr: "DPI = Distributions / Paid-in, RVPI = NAV / Paid-in", terms: [["Distributions", "Cash returned to LPs so far"], ["NAV", "Net asset value of the unsold portfolio"], ["Paid-in", "Capital called from LPs to date"]] },
            { expr: "TVPI = DPI + RVPI = (Distributions + NAV) / Paid-in", terms: [] },
          ],
          steps: [
            p(`DPI = ${money(dist, 1)}m / ${money(paidIn, 2)}m = ${num(dpi, 3)}x.`),
            p(`RVPI = ${money(nav, 1)}m / ${money(paidIn, 2)}m = ${num(rvpi, 3)}x.`),
            p(`TVPI = ${num(dpi, 3)} + ${num(rvpi, 3)} = **${num(tvpi, 2)}x**.`),
          ],
          meaning: [
            dist === 0
              ? `Nothing has been distributed yet, so the whole ${num(tvpi, 2)}x rests on the fund's own marks. LPs often say "DPI is what you can spend".`
              : `${pct(dpi / tvpi, 0)} of the value is realised cash; the other ${pct(rvpi / tvpi, 0)} is still a valuation that could move before it is sold.`,
            tvpi < 1
              ? "TVPI below 1.0x means the fund is worth less than LPs paid in. Early in a fund's life that is normal, because fees are charged before investments mature (the J-curve)."
              : "TVPI says nothing about timing. Two funds with the same TVPI can have very different IRRs, so LPs read it next to IRR and DPI.",
          ],
          mistakes: [
            `Dividing by commitments instead of paid-in capital: (${money(dist, 1)}m + ${money(nav, 1)}m) / ${money(commit)}m = ${num((dist + nav) / commit, 2)}x.`,
            `Quoting DPI (${num(dpi, 2)}x) as the fund's multiple, which leaves out the unsold portfolio.`,
          ],
          excel: [`\`=(${dist}+${nav})/${n(paidIn, 2)}\``],
        },
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
      const ws = [w1, w2, w3], names = ["Bonds", "Large caps", "Small caps"];
      const ans = (w1 * r[0] + w2 * r[1] + w3 * r[2]) * 100;
      return {
        blocks: [{ kind: "table", head: ["Asset", "Weight", "Expected return"], rows: [["Bonds", pct(w1, 0), pct(r[0])], ["Large caps", pct(w2, 0), pct(r[1])], ["Small caps", pct(w3, 0), pct(r[2])]] }],
        question: "What is the portfolio's expected return? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "A portfolio's expected return is simply the weighted average of the expected returns of what it holds. Each asset contributes in proportion to how much money is in it.",
            "Risk does not average this simply (correlations matter), but expected return always does.",
          ],
          formulas: [{ expr: "E(Rp) = Σ wᵢ × E(Rᵢ)", terms: [["wᵢ", "Share of the portfolio in asset i (weights sum to 100%)"], ["E(Rᵢ)", "Expected return of asset i"]] }],
          steps: [
            table(["Asset", "Weight", "Expected return", "Contribution"], [
              ...names.map((nm, i) => [nm, pct(ws[i], 0), pct(r[i]), pct(ws[i] * r[i], 3)]),
              ["Portfolio", "100%", "", `**${ans.toFixed(3)}%**`],
            ]),
          ],
          meaning: [
            `The portfolio is expected to return **${ans.toFixed(2)}%** a year. Shifting weight towards small caps raises it, but also raises risk.`,
          ],
          mistakes: [
            `Taking a simple average of the three returns: ${pct((r[0] + r[1] + r[2]) / 3, 3)}.`,
            "Weights that do not sum to 100%. Check them before multiplying.",
          ],
          excel: [`\`=SUMPRODUCT({${ws.join(",")}},{${r.join(",")}})\``],
        },
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
      const a = w * w * s1 * s1, b = (1 - w) * (1 - w) * s2 * s2, c = 2 * w * (1 - w) * rho * s1 * s2;
      const avg = w * s1 + (1 - w) * s2;
      return {
        blocks: [{ kind: "p", text: `You hold **${pct(w, 0)}** in asset A (volatility **${pct(s1, 0)}**) and the rest in asset B (volatility **${pct(s2, 0)}**). Their correlation is **${rho.toFixed(1)}**.` }],
        question: "What is the portfolio's volatility? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "Unlike returns, risk does not simply average. When one asset zigs while the other zags, some of their swings cancel out. That is diversification.",
            "Correlation measures how much the two move together. At +1 nothing cancels and portfolio volatility is just the weighted average. Below +1 some risk disappears, and the lower the correlation, the more disappears.",
            "So you work with variances (volatility squared), add a cross term for how the assets interact, then take the square root to get back to volatility.",
          ],
          formulas: [
            { expr: "σp² = w²σA² + (1 − w)²σB² + 2w(1 − w)ρσAσB", terms: [
              ["w, 1 − w", "Weights in A and B"],
              ["σA, σB", "Volatilities (standard deviations) of A and B"],
              ["ρ", "Correlation between A and B, from −1 to +1"],
              ["2w(1 − w)ρσAσB", "The covariance term: where diversification shows up"],
            ] },
          ],
          steps: [
            table(["Term", "Calculation", "Value"], [
              ["A's variance", `${n(w)}² × ${n(s1)}²`, a.toFixed(6)],
              ["B's variance", `${n(1 - w)}² × ${n(s2)}²`, b.toFixed(6)],
              ["Covariance term", `2 × ${n(w)} × ${n(1 - w)} × ${rho.toFixed(1)} × ${n(s1)} × ${n(s2)}`, c.toFixed(6)],
              ["Portfolio variance", "Sum", (a + b + c).toFixed(6)],
            ]),
            p(`σp = √${(a + b + c).toFixed(6)} = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            `The weighted average of the two volatilities is ${pct(avg, 3)}; the portfolio's is ${ans.toFixed(3)}%. Diversification removes ${(avg * 100 - ans).toFixed(2)} points of risk${rho < 0 ? ", helped by the negative correlation" : ""}.`,
            "Only perfect positive correlation gives no benefit. That is why adding assets that do not move with your existing holdings is so valuable.",
          ],
          mistakes: [
            `Averaging the volatilities: ${pct(avg, 3)}. That is only right if ρ = 1.`,
            `Forgetting the 2 in the cross term: ${pct(Math.sqrt(a + b + c / 2), 3)}.`,
            `Forgetting the square root and reporting variance: ${(a + b + c).toFixed(6)}.`,
          ],
          excel: [`\`=SQRT(${n(w)}^2*${n(s1)}^2+${n(1 - w)}^2*${n(s2)}^2+2*${n(w)}*${n(1 - w)}*${rho.toFixed(1)}*${n(s1)}*${n(s2)})\``],
        },
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
        solution: {
          idea: [
            "A high return is not impressive on its own if it came from taking huge risks. The Sharpe ratio asks: how much return above the risk-free rate did the fund earn for each unit of volatility it took on?",
            "It lets you compare funds with different risk levels on one scale.",
          ],
          formulas: [{ expr: "Sharpe = (Rp − Rf) / σp", terms: [["Rp", "Portfolio return"], ["Rf", "Risk-free rate"], ["Rp − Rf", "Excess return: the reward for taking risk"], ["σp", "Volatility of the portfolio's returns"]] }],
          steps: [
            p(`Excess return = ${pct(r)} − ${pct(rf)} = ${pct(r - rf)}.`),
            p(`Sharpe = ${pct(r - rf)} / ${pct(s)} = **${ans.toFixed(3)}**.`),
          ],
          meaning: [
            `Each unit of volatility earned ${ans.toFixed(2)} units of excess return. ${ans >= 1 ? "Above 1 is generally considered good." : ans >= 0.5 ? "Between 0.5 and 1 is respectable; broad equity markets have historically been around 0.3 to 0.5." : ans >= 0 ? "That is modest. Broad equity markets have historically been around 0.3 to 0.5." : "A negative Sharpe means the fund did worse than cash."}`,
            "Sharpe penalises upside and downside volatility equally and assumes returns are roughly normal. For strategies with skewed returns, look at Sortino or drawdown too.",
          ],
          mistakes: [
            `Forgetting to subtract the risk-free rate: ${(r / s).toFixed(3)}.`,
            "Mixing periods, for example a monthly return with an annual volatility.",
          ],
          excel: [`\`=(${n(r)}-${n(rf)})/${n(s)}\``],
        },
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
      const daily = s / Math.sqrt(252);
      const ans = (v * z * s) / Math.sqrt(252);
      return {
        blocks: [{ kind: "p", text: `A **${money(v)}** equity position has annual volatility of **${pct(s)}**. Assume normal returns, zero mean daily return and 252 trading days. Use z = **${z}** for ${conf}% confidence.` }],
        question: `What is the 1-day ${conf}% VaR, in dollars?`,
        answer: ans, unit: "$", tolerance: { rel: 0.001 },
        solution: {
          idea: [
            `Value at risk answers: on a bad day, how much could we lose? More precisely, the loss that should only be exceeded on ${100 - conf}% of days.`,
            "If daily returns are normal with zero mean, that threshold sits z standard deviations below zero. So VaR is just the position size times z times the daily volatility.",
            "Volatility is quoted annually, so first scale it down to one day. Variance grows in proportion to time, which means volatility grows with the square root of time.",
          ],
          formulas: [
            { expr: "σ_daily = σ_annual / √252", terms: [["252", "Trading days in a year"], ["√", "Volatility scales with the square root of time"]] },
            { expr: "VaR = Position × z × σ_daily", terms: [["z", `Standard normal quantile: ${z} for ${conf}% one-tailed`], ["Position", "Market value of the holding"]] },
          ],
          steps: [
            p(`Daily σ = ${pct(s)} / √252 = ${pct(s)} / ${Math.sqrt(252).toFixed(4)} = ${pct(daily, 4)}.`),
            p(`One daily standard deviation in dollars = ${money(v)} × ${pct(daily, 4)} = ${money(v * daily)}.`),
            p(`VaR = ${money(v * daily)} × ${z} = **${money(ans)}**.`),
          ],
          meaning: [
            `On ${conf} days out of 100 the position should lose less than ${money(ans)}. On the other ${100 - conf}, roughly ${conf === 95 ? "one trading day a month" : "two or three trading days a year"}, losses should be at least that large.`,
            "VaR says nothing about how bad those worst days can be. Real returns have fatter tails than the normal distribution, so expected shortfall (the average loss beyond VaR) is often reported alongside it.",
            `To scale to 10 days, multiply by √10: ${money(ans * Math.sqrt(10))}.`,
          ],
          mistakes: [
            `Dividing by 252 instead of √252: ${money((v * z * s) / 252)}.`,
            `Using the annual volatility directly: ${money(v * z * s)}, which is a one-year VaR.`,
            "Using the two-tailed z (1.96 for 95%). VaR is about losses only, one tail.",
          ],
          excel: [`\`=${v}*NORM.S.INV(${conf / 100})*${n(s)}/SQRT(252)\``],
        },
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
      const req = rf + b * (rm - rf);
      const ans = (rp - req) * 100;
      return {
        blocks: [{ kind: "p", text: `A manager returned **${pct(rp)}** with a beta of **${b.toFixed(2)}**. The market returned **${pct(rm)}** and the risk-free rate was **${pct(rf)}**.` }],
        question: "What is Jensen's alpha? Percentage to two decimals, negative if the manager underperformed.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "Beating the market is easy if you just take more market risk: a high-beta portfolio goes up more in a rising market. Alpha strips that out.",
            "CAPM tells you what return the manager should have earned given the market risk they took. Jensen's alpha is the difference between what they actually earned and that benchmark: the part attributable to skill (or luck).",
          ],
          formulas: [
            { expr: "α = Rp − [Rf + β × (Rm − Rf)]", terms: [
              ["Rp", "Portfolio's actual return"],
              ["Rf + β × (Rm − Rf)", "CAPM required return for that beta"],
              ["β", "Portfolio's sensitivity to the market"],
            ] },
          ],
          steps: [
            p(`Market excess return = ${pct(rm)} − ${pct(rf)} = ${pct(rm - rf)}.`),
            p(`Required return = ${pct(rf)} + ${b.toFixed(2)} × ${pct(rm - rf)} = ${pct(req, 3)}.`),
            p(`α = ${pct(rp)} − ${pct(req, 3)} = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            ans >= 0 ? `The manager beat the risk-adjusted benchmark by ${ans.toFixed(2)} points.` : `The manager fell short of the risk-adjusted benchmark by ${(-ans).toFixed(2)} points.`,
            rp > rm && ans < 0 ? "Note the manager beat the market in raw terms but still has negative alpha: the outperformance came from taking extra market risk, which an index fund with leverage could replicate." : rp < rm && ans > 0 ? "Note the manager lagged the market in raw terms but still has positive alpha: they took less market risk and earned more than that risk warranted." : "A single year's alpha is noisy. Judge a manager over many periods and check that the alpha is statistically significant.",
          ],
          mistakes: [
            `Comparing with the market return directly: ${pct(rp - rm, 3)}. That ignores beta.`,
            `Multiplying beta by the market return instead of the market excess return: ${pct(rp - (rf + b * rm), 3)}.`,
          ],
          excel: [`\`=${n(rp)}-(${n(rf)}+${b}*(${n(rm)}-${n(rf)}))\``],
        },
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
      const ds = interest + principal;
      const ans = noi / ds;
      return {
        blocks: [{ kind: "p", text: `A commercial property earns net operating income of **${money(noi)}** a year. Annual loan interest is **${money(interest)}** and scheduled principal repayment is **${money(principal)}**.` }],
        question: "What is the debt service coverage ratio? Two decimals.",
        answer: ans, unit: "x", tolerance: { abs: 0.006 },
        solution: {
          idea: [
            "A lender wants to know whether the property's income can comfortably cover everything the loan requires each year: interest **and** scheduled principal. Together these are debt service.",
            "DSCR is the number of times the income covers that bill. Below 1 the borrower cannot pay from operations alone.",
          ],
          formulas: [{ expr: "DSCR = NOI / (Interest + Principal)", terms: [["NOI", "Net operating income: rents less operating costs, before debt payments"], ["Interest + Principal", "Total annual debt service"]] }],
          steps: [
            p(`Debt service = ${money(interest)} + ${money(principal)} = ${money(ds)}.`),
            p(`DSCR = ${money(noi)} / ${money(ds)} = **${ans.toFixed(2)}x**.`),
          ],
          meaning: [
            ans >= 1
              ? `Income covers debt service ${ans.toFixed(2)} times. NOI could fall ${pct(1 - 1 / ans, 1)} before the property could no longer meet its payments.`
              : `Income covers only ${pct(ans, 0)} of debt service. The borrower must find ${money(ds - noi)} a year from elsewhere, a likely default risk.`,
            `Commercial lenders typically require at least 1.20x to 1.35x. ${ans >= 1.25 ? "This loan would usually pass." : "This loan would usually fail that test or need to be resized."}`,
          ],
          mistakes: [
            `Using interest only: ${(noi / interest).toFixed(2)}x. That is interest coverage, not debt service coverage.`,
            "Using NOI after debt service, which double-counts the payments.",
          ],
          excel: [`\`=${noi}/(${interest}+${principal})\``],
        },
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
        solution: {
          idea: [
            "A loan's expected loss combines three questions. How likely is the borrower to default? If they default, how much will be owed? And of that, how much will the bank fail to recover?",
            "Multiply them together and you get the average loss the bank should expect over a year. It is a cost of doing business, priced into the interest rate and set aside as a provision.",
          ],
          formulas: [
            { expr: "EL = PD × LGD × EAD", terms: [
              ["PD", "Probability of default over the period"],
              ["LGD", "Loss given default = 1 − recovery rate"],
              ["EAD", "Exposure at default: the amount owed when default happens"],
            ] },
          ],
          steps: [
            p(`LGD = 1 − ${pct(recovery, 0)} = ${pct(1 - recovery, 0)}.`),
            p(`Loss if default happens = ${pct(1 - recovery, 0)} × ${money(ead)} = ${money((1 - recovery) * ead)}.`),
            p(`EL = ${pct(pd)} × ${money((1 - recovery) * ead)} = **${money(ans)}**.`),
          ],
          meaning: [
            `The bank should expect to lose ${money(ans)} a year on average, ${pct(ans / ead, 3)} of the exposure. The loan's spread over funding cost should at least cover this.`,
            "Expected loss is the average. In any one year the loss is either zero or the full loss given default. Capital is held for unexpected losses, the deviation from this average.",
            "Under IFRS 9 a healthy loan (stage 1) is provisioned for 12-month expected loss like this; a loan whose credit risk has risen sharply is provisioned for lifetime expected loss.",
          ],
          mistakes: [
            `Using the recovery rate as the LGD: ${money(pd * recovery * ead)}.`,
            `Leaving out LGD: ${money(pd * ead)}. That assumes nothing is ever recovered.`,
          ],
          excel: [`\`=${n(pd)}*(1-${n(recovery)})*${ead}\``],
        },
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
      const avg = (a0 + a1) / 2;
      const ans = ((ii - ie) / avg) * 100;
      return {
        blocks: [{ kind: "table", head: ["Item", "$m"], rows: [["Earning assets, start of year", num(a0)], ["Earning assets, end of year", num(a1, 1)], ["Interest income", num(ii, 1)], ["Interest expense", num(ie, 1)]] }],
        question: "What is the bank's net interest margin on average earning assets? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "A bank borrows (mostly from depositors) and lends at a higher rate. Net interest margin measures the profit from that spread, as a percentage of the assets that earn interest.",
            "Income and expense are earned over the whole year, while the balance sheet is a snapshot. Dividing by the average of opening and closing assets matches a flow with a fair measure of the stock that produced it.",
          ],
          formulas: [
            { expr: "NIM = (Interest income − Interest expense) / Average earning assets", terms: [
              ["Interest income − Interest expense", "Net interest income"],
              ["Average earning assets", "(Opening + closing) / 2: loans, securities and other assets that pay interest"],
            ] },
          ],
          steps: [
            p(`Net interest income = ${num(ii, 1)} − ${num(ie, 1)} = ${num(ii - ie, 2)}.`),
            p(`Average earning assets = (${num(a0)} + ${num(a1, 1)}) / 2 = ${num(avg, 1)}.`),
            p(`NIM = ${num(ii - ie, 2)} / ${num(avg, 1)} = **${ans.toFixed(3)}%**.`),
          ],
          meaning: [
            `The bank earns ${ans.toFixed(2)} cents of net interest per $1 of earning assets. US commercial banks typically run 2.5% to 3.5%; lenders with costly funding or low-yield assets run lower.`,
            "NIM widens when asset yields rise faster than funding costs, which is why many banks benefit early in a rate-hiking cycle, and narrows when deposit costs catch up.",
          ],
          mistakes: [
            `Using year-end assets: ${pct((ii - ie) / a1, 3)}.`,
            `Using only interest income (the asset yield): ${pct(ii / avg, 3)}.`,
          ],
          excel: [`\`=(${n(ii, 2)}-${n(ie, 2)})/AVERAGE(${a0},${n(a1, 2)})\``],
        },
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
        solution: {
          idea: [
            "Interest coverage asks how many times over the company's operating profit could pay its interest bill. It is a measure of how much room there is before a fall in earnings threatens the lenders.",
            "EBIT coverage is stricter than EBITDA coverage because it charges for depreciation, a rough proxy for the reinvestment the business needs just to stand still.",
          ],
          formulas: [
            { expr: "EBIT coverage = EBIT / Interest expense", terms: [["EBIT", "EBITDA − D&A: operating profit"], ["Interest expense", "Debt × average interest rate"]] },
            { expr: "Leverage = Debt / EBITDA", terms: [["Use", "Years of EBITDA needed to repay the debt"]] },
          ],
          steps: [
            p(`EBIT = ${num(ebitda)} − ${num(da, 1)} = ${num(ebitda - da, 1)}.`),
            p(`Interest = ${num(debt, 1)} × ${pct(rate)} = ${num(interest, 2)}.`),
            p(`Coverage = ${num(ebitda - da, 1)} / ${num(interest, 2)} = **${ans.toFixed(2)}x**.`),
            p(`Leverage = ${num(debt, 1)} / ${num(ebitda)} = ${(debt / ebitda).toFixed(2)}x EBITDA.`),
          ],
          meaning: [
            `Operating profit covers interest ${ans.toFixed(2)} times; EBIT could fall ${pct(Math.max(0, 1 - 1 / ans), 0)} before it no longer covers interest. ${ans >= 4 ? "That is comfortable, typical of investment-grade borrowers." : ans >= 2 ? "That is adequate but leaves a moderate cushion, typical of high-yield credits." : "That is thin: a modest downturn would leave the company unable to cover interest from operations."}`,
            `Leverage of ${(debt / ebitda).toFixed(2)}x and coverage move together: more debt means more interest and less coverage. Lenders often set covenants on both.`,
          ],
          mistakes: [
            `Using EBITDA instead of EBIT: ${(ebitda / interest).toFixed(2)}x.`,
            `Dividing by debt instead of interest: ${((ebitda - da) / debt).toFixed(2)}x.`,
          ],
          excel: [`\`=(${ebitda}-${n(da, 2)})/(${n(debt, 2)}*${n(rate)})\``],
        },
      };
    },
  },
  {
    slug: "cet1-ratio",
    title: "CET1 capital ratio",
    track: "Banking & Credit",
    difficulty: "Easy",
    concepts: ["Bank capital", "Risk-weighted assets", "Basel III"],
    generate(rng) {
      const sov = pick(rng, 50, 300, 10), mort = pick(rng, 200, 800, 10), retail = pick(rng, 50, 300, 10), corp = pick(rng, 200, 900, 10), other = pick(rng, 50, 250, 5);
      const book = [
        { name: "Government bonds (AAA)", amount: sov, riskWeight: 0 },
        { name: "Residential mortgages", amount: mort, riskWeight: 0.35 },
        { name: "Retail loans", amount: retail, riskWeight: 0.75 },
        { name: "Corporate loans (unrated)", amount: corp, riskWeight: 1 },
      ];
      const credit = creditRwa(book), rwa = credit + other;
      const cet1 = Math.round(rwa * pick(rng, 0.04, 0.16, 0.0025) * 10) / 10;
      const ans = capitalRatio(cet1, book, other) * 100;
      const assets = sov + mort + retail + corp;
      return {
        blocks: [
          { kind: "p", text: `A bank's loan and bond book ($m) with the risk weights to use (Basel II standardised approach):` },
          { kind: "table", head: ["Exposure", "Amount ($m)", "Risk weight"], rows: book.map((b) => [b.name, num(b.amount), pct(b.riskWeight, 0)]) },
          { kind: "p", text: `Risk-weighted assets for market and operational risk add **${money(other)}m**. The bank holds **${money(cet1, 1)}m** of Common Equity Tier 1 (CET1) capital.` },
        ],
        question: "What is the bank's CET1 ratio? Percentage to two decimals.",
        answer: ans, unit: "%", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "A bank's equity is the cushion that absorbs losses before depositors are hurt. Regulators ask how big that cushion is **relative to how risky the bank's assets are**, not relative to their size.",
            "So each exposure is scaled by a risk weight: safe government bonds count for nothing, a secured mortgage for a third or so, an unsecured corporate loan in full. The total is risk-weighted assets (RWA), and the CET1 ratio is CET1 capital divided by RWA.",
          ],
          formulas: [
            { expr: "RWA = Σ (Exposure × Risk weight) + Market and operational RWA", terms: [["Exposure", "Amount lent or invested in each category"], ["Risk weight", "Regulator-set percentage reflecting credit risk"], ["Market and operational RWA", "Capital charges for trading and operational risk, already expressed as RWA"]] },
            { expr: "CET1 ratio = CET1 capital / RWA", terms: [["CET1 capital", "Common shares plus retained earnings, less deductions such as goodwill: the highest-quality capital"]] },
          ],
          steps: [
            table(["Exposure", "Amount", "Risk weight", "RWA"], [
              ...book.map((b) => [b.name, num(b.amount), pct(b.riskWeight, 0), num(b.amount * b.riskWeight, 1)]),
              ["Credit RWA", num(assets), "", num(credit, 1)],
            ]),
            p(`Total RWA = ${num(credit, 1)} + ${num(other)} = ${money(rwa, 1)}m.`),
            p(`CET1 ratio = ${num(cet1, 1)} / ${num(rwa, 1)} = **${ans.toFixed(2)}%**.`),
          ],
          meaning: [
            ans < 4.5
              ? `At ${ans.toFixed(2)}% the bank is **below the 4.5% Basel III minimum**. Regulators would require it to raise capital or shrink risk-weighted assets at once.`
              : ans < 7
                ? `At ${ans.toFixed(2)}% the bank meets the 4.5% minimum but is inside the 2.5% conservation buffer (7% in total), so it faces limits on dividends, buybacks and bonuses until it rebuilds capital.`
                : `At ${ans.toFixed(2)}% the bank clears the 4.5% minimum plus the 2.5% conservation buffer (7%). Large banks also face surcharges and stress-test buffers, so in practice many target 11 to 14%.`,
            "The weights here are the Basel II standardised ones. Under the 2017 Basel III reforms a residential mortgage's weight depends on its loan-to-value ratio (20% to 70%), so the same book can produce a different RWA.",
            `Credit RWA are ${pct(credit / assets, 0)} of exposures (the bank's RWA density). Moving lending from corporate loans to mortgages would lower RWA and raise the ratio without adding a dollar of capital, which is why regulators also watch a simple leverage ratio.`,
          ],
          mistakes: [
            `Dividing by total exposures instead of RWA: ${num(cet1, 1)} / ${num(assets)} = ${pct(cet1 / assets)}. That is closer to a leverage ratio.`,
            `Leaving out market and operational RWA: ${num(cet1, 1)} / ${num(credit, 1)} = ${pct(cet1 / credit)}.`,
          ],
          excel: [`\`=${n(cet1, 1)}/(SUMPRODUCT({${book.map((b) => b.amount).join(",")}},{${book.map((b) => b.riskWeight).join(",")}})+${other})\``],
        },
      };
    },
  },
];
