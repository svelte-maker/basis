import { pick } from "@/lib/problems/rng";
import { Layout } from "../layout";
import type { ModelTask } from "../types";

export const loanSchedule: ModelTask = {
  slug: "term-loan-amortisation",
  title: "Term loan amortisation schedule",
  track: "Banking & Credit",
  difficulty: "Easy",
  skills: ["Debt schedule", "Time value of money"],
  functions: ["PMT", "IPMT", "SUM"],
  minutes: 15,
  generate(rng) {
    const amount = pick(rng, 500, 5000, 50);
    const rate = pick(rng, 0.06, 0.14, 0.0025);
    const L = new Layout(16, 7, [210, 110, 100, 100, 100, 100, 100]);
    L.head("A1", "Term loan amortisation ($000)")
      .label("A3", "Loan amount").input("B3", amount, "n0")
      .label("A4", "Interest rate (annual)").input("B4", rate, "pct2")
      .label("A5", "Term (years)").input("B5", 5, "n0")
      .label("A7", "Annual payment").calc("B7", "=-PMT(B4,B5,B3)", "n2")
      .head("A9", "Year").head("C9", "Year 1").head("D9", "Year 2").head("E9", "Year 3").head("F9", "Year 4").head("G9", "Year 5")
      .label("A10", "Opening balance").label("A11", "Interest").label("A12", "Principal repaid").label("A13", "Closing balance")
      .calcRow(10, "C", "G", (c, p, i) => (i === 0 ? "=$B$3" : `=${p}13`), "n2")
      .calcRow(11, "C", "G", "={c}10*$B$4", "n2")
      .calcRow(12, "C", "G", "=$B$7-{c}11", "n2")
      .calcRow(13, "C", "G", "={c}10-{c}12", "n2")
      .label("A15", "Total interest paid").calc("B15", "=SUM(C11:G11)", "n2");
    L.grade("B7", "Annual payment", 3, { requires: [["PMT"]] })
      .grade("E11", "Interest in year 3", 2)
      .grade("F12", "Principal repaid in year 4", 2)
      .grade("E13", "Closing balance after year 3", 2)
      .grade("B15", "Total interest paid", 2);
    return L.build({
      shocks: [
        { label: "interest rate up 1.5 points", set: { B4: rate + 0.015 } },
        { label: "loan amount up 20%", set: { B3: amount * 1.2 } },
      ],
      brief: [
        `A company borrows **$${amount.toLocaleString("en-US")}k** on a 5-year term loan at **${(rate * 100).toFixed(2)}%** a year. It repays in equal annual instalments at the end of each year, so each payment covers that year's interest and pays down part of the principal.`,
        "Treasury wants the full amortisation schedule so it can see how the interest charge falls as the loan is repaid.",
      ],
      steps: [
        "In B7, work out the annual payment with **PMT**. Show it as a positive number (Excel's PMT returns a payment as negative).",
        "Build the schedule across C10:G13: opening balance, interest on the opening balance, principal repaid (payment less interest), closing balance. Year 2's opening balance is year 1's closing balance.",
        "In B15, total the interest paid over the life of the loan.",
        "Reference the inputs in B3:B5 rather than typing numbers, so the schedule updates when the rate or amount changes. Lock references with $ (for example $B$4) so you can fill formulas across.",
      ],
      solution: [
        "**Payment.** An amortising loan is an annuity: the present value of five equal payments at the loan rate equals the amount borrowed. `=-PMT(B4,B5,B3)` solves for that payment. The minus sign flips Excel's cash-out convention so the schedule reads in positive numbers.",
        "**Interest** each year is the opening balance times the rate: `=C10*$B$4`. The $ signs keep the rate fixed as you fill right.",
        "**Principal repaid** is what's left of the payment after interest: `=$B$7-C11`. Because the balance falls, interest falls and the principal share of each payment rises. That's why principal repaid in year 4 is larger than in year 1.",
        "**Closing balance** is opening less principal: `=C10-C12`, and the next year opens at that figure (`=C13` in D10). If the schedule is right, the year-5 closing balance is zero. That's your built-in check.",
        "**Cross-check with IPMT.** Year-3 interest also equals `=-IPMT(B4,3,B5,B3)`. Bankers often use IPMT and PPMT to spot-check a schedule without building it.",
        "**Total interest** is `=SUM(C11:G11)`, which also equals 5 × payment − loan amount.",
      ],
    });
  },
};
