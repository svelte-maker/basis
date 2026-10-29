import { bootstrapZeros, forwardRate } from "@/lib/finance/fixedIncome";
import { annuityFactor, discountFactors, fraSettlement, parSwapRate, swapDv01, swapValueToPayer } from "@/lib/finance/swaps";
import { money, num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

// ---------- Swaps and FRAs ----------

const parCurve = [0.05, 0.055, 0.06];
const zeros = bootstrapZeros(parCurve);
const dfs = discountFactors(zeros);
const annuity = annuityFactor(dfs);
const swap3 = parSwapRate(dfs);
const notional = 10_000_000;
const oldSwap = swapValueToPayer(notional, 0.05, dfs);
const dv01 = swapDv01(notional, dfs);
const f12 = forwardRate(zeros[0], 1, zeros[1], 2);
const f23 = forwardRate(zeros[1], 2, zeros[2], 3);
const fraPay = fraSettlement(notional, 0.06, 0.065, 0.25);
const fraGap = notional * 0.005 * 0.25;

export const swapsFras: Lesson = {
  slug: "interest-rate-swaps-and-fras",
  title: "Interest rate swaps and FRAs: trading the yield curve",
  summary: "How a forward rate agreement locks in a future rate, how a swap turns floating debt into fixed, how to find the par swap rate from discount factors, and how to value and risk-manage a swap once rates move.",
  module: "fixed-income",
  level: "Advanced",
  prerequisites: ["bonds-and-yields"],
  outcomes: [
    "Explain what an FRA and an interest rate swap do for a borrower, and which side gains when rates rise.",
    "Compute an FRA's settlement payment, and its fair rate from the zero curve.",
    "Find the par swap rate from discount factors, and show it equals the par bond yield.",
    "Value an existing swap after rates move, and size its interest rate risk with DV01.",
  ],
  hook: [
    "A company has borrowed $10 million for three years at a floating rate that resets every year. Its board doesn't want the interest bill to jump if the central bank keeps hiking. The treasurer doesn't refinance the loan. She calls a bank and enters a **swap**: the company pays the bank a fixed rate, the bank pays the company the floating rate, and the floating payments cancel. The loan is now fixed-rate in effect, with one phone call and no new lender.",
    "Swaps are the largest derivatives market in the world by notional. Banks use them to manage the gap between floating-rate deposits and fixed-rate loans, bond issuers use them to switch the currency or rate type of their debt, and every fixed income desk prices them off the same discount factors you met in the bonds lesson.",
  ],
  sections: [
    {
      id: "fra",
      title: "Forward rate agreements: locking in one future rate",
      blocks: [
        { kind: "p", text: "A **forward rate agreement (FRA)** fixes the interest rate on a notional amount for one future period. A \"3×6 FRA\" covers the period from 3 months to 6 months from now. No principal changes hands. At the start of the period the two sides compare the agreed **contract rate** with the market **reference rate** fixed that day, and one pays the other the difference." },
        { kind: "formula", expr: "Settlement to buyer = N × (L − K) × τ / (1 + L × τ)", terms: [["N", "notional amount"], ["L", "reference rate fixed at the start of the period"], ["K", "contract rate agreed today"], ["τ", "length of the period in years (0.25 for three months)"], ["1 + L × τ", "discounts the payment, because it is made at the start of the period, not at the end when interest would be due"]] },
        { kind: "p", text: `**Worked example.** A borrower buys a 3×6 FRA on ${money(notional, 0)} at 6%. In three months the reference rate fixes at 6.5%. The undiscounted gap is ${money(notional, 0)} × 0.5% × 0.25 = ${money(fraGap, 0)}. Paid three months early, it is worth **${money(fraPay, 0)}** to the buyer. The borrower then pays 6.5% on its loan, but the FRA payment brings the net cost back to 6%.` },
        { kind: "callout", tone: "insight", title: "Buyer means borrower", text: [
          "The FRA **buyer** pays the fixed rate and gains when rates rise, so it hedges a borrower. The **seller** gains when rates fall, so it hedges a lender or an investor with floating-rate assets. Mix these up and a hedge doubles the risk instead of removing it.",
        ] },
        { kind: "p", text: `**What is the fair contract rate?** The rate that makes the FRA worth nothing today, and that is the **implied forward rate** from the zero curve. With 1- and 2-year zero rates of ${pct(zeros[0], 2)} and ${pct(zeros[1], 3)}, a 1×2 (year) FRA is fair at **${pct(f12, 3)}**. Any other rate would let you lock in a riskless profit by borrowing for one horizon and lending for the other.` },
      ],
    },
    {
      id: "swap",
      title: "A swap is a strip of FRAs, or two bonds",
      blocks: [
        { kind: "p", text: "A **plain vanilla interest rate swap** exchanges a fixed rate for a floating rate on the same notional, on a schedule (say annually for three years). The **payer** pays fixed and receives floating; the **receiver** does the opposite. Only the net difference is paid on each date." },
        { kind: "p", text: "Two ways to see it, and both are useful:" },
        { kind: "list", items: [
          "**A strip of FRAs**, one per period, all at the same fixed rate. Some of those FRAs are in your favour (where the forward rate is above the swap rate) and some against; the swap rate is the single rate that balances them.",
          "**Long one bond, short another.** A fixed payer is short a fixed-rate bond and long a floating-rate note with the same notional. The principal at the end cancels, so no principal is exchanged, but this view makes valuation easy.",
        ] },
        { kind: "callout", tone: "insight", title: "Why the floating leg is worth par", text: [
          "A floating-rate note that pays the market rate each period and resets to it is worth exactly its face value on every reset date: whatever rates do, it always pays the fair rate for the next period. So on a reset date the floating leg of a swap is worth the notional, and the whole swap is the notional minus the value of a fixed-rate bond.",
        ] },
      ],
    },
    {
      id: "par-rate",
      title: "Pricing: the par swap rate",
      blocks: [
        { kind: "p", text: "A new swap is struck at the fixed rate that makes it worth zero. Using the two-bond view with a notional of 1 and annual payments:" },
        { kind: "formula", expr: "Par swap rate = (1 − DFₙ) / (DF₁ + DF₂ + … + DFₙ)", terms: [["DFₜ", "discount factor for year t, 1 ÷ (1 + zₜ)^t from the zero curve"], ["DFₙ", "discount factor at maturity; 1 − DFₙ is the PV of the floating leg's interest"], ["Σ DF", "the **annuity factor**: today's value of 1 paid at the end of every year"]] },
        { kind: "p", text: "Take par bond yields of 5%, 5.5% and 6% for one, two and three years. Bootstrap the zero rates as in the bonds lesson, then turn each into a discount factor:" },
        { kind: "table", head: ["Year", "Par yield", "Zero rate", "Discount factor", "Forward rate for that year"], rows: dfs.map((d, i) => [
          String(i + 1), pct(parCurve[i], 2), pct(zeros[i], 3), num(d, 5), pct(i === 0 ? zeros[0] : i === 1 ? f12 : f23, 3),
        ]), caption: "Forward rates rise faster than zero rates because the curve slopes up." },
        { kind: "p", text: `The annuity factor is ${num(annuity, 5)}, so the three-year par swap rate is (1 − ${num(dfs[2], 5)}) ÷ ${num(annuity, 5)} = **${pct(swap3, 2)}**: exactly the three-year par bond yield. That isn't a coincidence. A par bond and a par swap both set a fixed coupon so that the fixed leg is worth face value, and they use the same discount factors.` },
        { kind: "callout", tone: "desk", title: "The swap curve is the benchmark", text: [
          "Desks quote swaps by their fixed rate: \"5-year SOFR swaps at 3.9%\". The curve of par swap rates by maturity is the benchmark that corporate bonds, mortgages and loans are priced against, and the **swap spread** (swap rate minus the government bond yield of the same maturity) is watched as a gauge of bank credit and balance-sheet stress. In India the most traded rupee swap is the overnight indexed swap (OIS) on the overnight MIBOR rate.",
        ] },
      ],
    },
    {
      id: "valuing",
      title: "Valuing a swap after rates move, and its risk",
      blocks: [
        { kind: "p", text: "A swap is worth zero only on the day it is struck. Once rates move, one side is in the money. On a reset date, the value to the fixed payer is the floating leg (par) minus the fixed leg:" },
        { kind: "formula", expr: "Value to payer = N × [(1 − DFₙ) − K × Σ DF] = N × (S − K) × Σ DF", terms: [["K", "the fixed rate agreed when the swap was struck"], ["S", "today's par swap rate for the remaining maturity"], ["Σ DF", "annuity factor for the remaining payments"]] },
        { kind: "p", text: `**Worked example.** The treasurer from the opening entered a three-year payer swap at 5% on ${money(notional, 0)}. Rates rose, and today's curve is the one in the table, with a three-year par swap rate of ${pct(swap3, 2)}. The swap is worth ${money(notional, 0)} × (6% − 5%) × ${num(annuity, 4)} = **${money(oldSwap, 0)}** to the company. That gain offsets the higher interest on its floating loan: the hedge worked.` },
        { kind: "p", text: `**DV01.** The value changes by about N × Σ DF × 0.0001 for each basis point the swap rate moves: here **${money(dv01, 0)}** per basis point. A payer swap gains when rates rise, so its DV01 has the opposite sign to a bond's. Desks sum the DV01 of every swap and bond in a book, bucket it by maturity, and hedge what is left.` },
        { kind: "callout", tone: "warning", title: "Rates aren't the only risk", text: [
          "If rates fall instead, the company owes on the swap while its loan gets cheaper. That is the point of a hedge, but it means the swap can be a large liability, and the bank will ask for collateral. In autumn 2022 the reverse happened to some UK pension funds: liability hedges built with leveraged gilt and swap positions lost value fast as gilt yields jumped, and the collateral calls forced fire sales. Size hedges to the exposure, and plan for the cash.",
        ] },
      ],
    },
    {
      id: "excel",
      title: "In Excel",
      blocks: [
        { kind: "p", text: "With zero rates in B2:B4 for years 1 to 3, the whole swap fits in a few cells:" },
        { kind: "excel", title: "Three-year annual swap", rows: [
          ["C2", "=1/(1+B2)^A2", num(dfs[0], 5)],
          ["C5", "=SUM(C2:C4)", num(annuity, 5)],
          ["C6", "=(1-C4)/C5", pct(swap3, 4)],
          ["C7", "=10000000*((1-C4)-5%*C5)", money(oldSwap, 2)],
          ["C8", "=10000000*C5*0.0001", money(dv01, 2)],
          ["C9", "=10000000*(6.5%-6%)*0.25/(1+6.5%*0.25)", money(fraPay, 2)],
        ] },
        { kind: "p", text: "Fill C2 down to C4 (A2:A4 hold 1, 2, 3). Real swaps need a day count (actual/360 on the floating side is common), payment dates that roll for holidays, and separate discount and projection curves, but the structure of the calculation is the same." },
      ],
    },
  ],
  gap: [
    { theory: "One curve both projects the floating rate and discounts the cash flows.", practice: "Since 2008, desks discount collateralised swaps on the overnight (OIS) curve and project floating payments off the curve of the rate being swapped. With the move from LIBOR to SOFR and other overnight rates, the two have largely converged in USD, but the separation still matters for other rates." },
    { theory: "Payments are annual and periods are exactly one year.", practice: "Fixed and floating legs often have different frequencies and day counts, and dates shift for holidays. A pricing system handles this; an analyst checks it, because a wrong day count is a classic source of breaks." },
    { theory: "The swap is between two parties and that's it.", practice: "Most standard swaps are now cleared through a central counterparty, with daily margin. Credit, funding and capital costs (the \"XVAs\") are priced on top of the mid-market rate." },
  ],
  mistakes: [
    "Getting the side wrong: a borrower hedging rising rates buys the FRA and pays fixed on the swap.",
    "Forgetting to discount the FRA settlement. It is paid at the start of the period, so divide by (1 + L × τ).",
    "Using par yields as discount rates. Discount factors come from zero rates, which you bootstrap from par yields first.",
    "Treating notional as money at risk. No principal is exchanged; the exposure is the net interest difference, which is why DV01 is the measure that matters.",
  ],
  interview: [
    { q: "How do you value an interest rate swap?", a: "Treat it as two bonds. On a reset date the floating leg is worth par, so the value to the fixed payer is par minus the PV of the fixed leg, using discount factors from the zero curve. Equivalently, it is notional × (today's par swap rate − the fixed rate) × the annuity factor." },
    { q: "A company has floating-rate debt and expects rates to rise. What do you recommend?", a: "Pay fixed on a swap, or buy FRAs or a cap. The swap fixes the cost outright; a cap limits it but costs a premium. Then I'd check the hedge ratio against the actual debt and the collateral the bank will ask for." },
    { q: "Why does a par swap rate equal the par bond yield on the same curve?", a: "Both set a fixed coupon so that the fixed leg is worth par using the same discount factors. The floating leg of the swap is also worth par, so the swap is worth zero at the same coupon." },
  ],
  quiz: [
    { q: "A borrower wants protection if rates rise over the next six months. Which FRA position does it take?", options: ["Buy the FRA", "Sell the FRA", "Either, they are symmetric", "None: FRAs only hedge lenders"], answer: 0, why: "The buyer pays the fixed contract rate and receives the reference rate, so it gains when rates rise, offsetting the borrower's higher interest." },
    { q: "Discount factors for years 1 to 3 are 0.95, 0.90 and 0.85. What is the three-year par swap rate?", options: ["5.00%", "5.56%", "5.88%", "15.00%"], answer: 1, why: "(1 − 0.85) ÷ (0.95 + 0.90 + 0.85) = 0.15 ÷ 2.70 = 5.56%." },
    { q: "You pay 4% fixed on a swap. Today's par swap rate for the remaining term is 4.5% and the annuity factor is 4.2. Per $1 of notional, the swap is worth about:", options: ["−$0.021", "$0.005", "$0.021", "$0.189"], answer: 2, why: "(4.5% − 4%) × 4.2 = 0.021. Rates rose above your fixed rate, so paying fixed is in the money." },
    { q: "On a reset date, a floating-rate note that pays the market rate is worth:", options: ["Less than par if rates have risen", "More than par if rates have risen", "Exactly par", "The PV of its coupons only"], answer: 2, why: "It will pay the fair market rate for the next period, so it is worth par whatever rates have done." },
  ],
  apply: {
    problems: ["implied-forward-rate", "bond-price", "duration-convexity-estimate"],
    models: [],
    cases: [],
    tools: ["bond", "tvm"],
  },
  glossary: [
    { term: "Forward rate agreement (FRA)", definition: "A contract that fixes the interest rate on a notional amount for one future period; the two sides settle the difference between the agreed rate and the market rate." },
    { term: "Interest rate swap", definition: "An agreement to exchange fixed-rate payments for floating-rate payments on the same notional over a set schedule, paying only the net difference." },
    { term: "Par swap rate", definition: "The fixed rate that makes a new swap worth zero: (1 − DFₙ) ÷ the sum of discount factors for annual payments." },
    { term: "Payer swap", definition: "A swap in which you pay fixed and receive floating; it gains value when rates rise." },
    { term: "Swap spread", definition: "The par swap rate minus the government bond yield of the same maturity." },
    { term: "Overnight indexed swap (OIS)", definition: "A swap whose floating leg compounds an overnight rate such as SOFR or MIBOR; the standard curve for discounting collateralised trades." },
  ],
};
