import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";

export const accounting: Template[] = [
  {
    slug: "cash-conversion-cycle",
    title: "Cash conversion cycle",
    track: "Accounting",
    difficulty: "Easy",
    concepts: ["Working capital", "DSO", "DIO", "DPO"],
    generate(rng) {
      const dso = pick(rng, 25, 70, 1), dio = pick(rng, 20, 95, 1), dpo = pick(rng, 15, 60, 1);
      const ans = dso + dio - dpo;
      return {
        blocks: [{ kind: "p", text: `A retailer has days sales outstanding of **${dso}**, days inventory outstanding of **${dio}** and days payables outstanding of **${dpo}**.` }],
        question: "What is its cash conversion cycle, in days?",
        answer: ans, unit: "days", tolerance: { abs: 0.01 },
        solution: [`CCC = DSO + DIO − DPO = ${dso} + ${dio} − ${dpo} = **${ans} days**.`, "It measures how long cash is tied up between paying suppliers and collecting from customers."],
      };
    },
  },
  {
    slug: "depreciation-and-cash",
    title: "Depreciation and cash",
    track: "Accounting",
    difficulty: "Medium",
    concepts: ["Three statements", "Tax shield"],
    generate(rng) {
      const d = pick(rng, 10, 100, 10), t = pick(rng, 0.2, 0.35, 0.01);
      const ans = d * t;
      return {
        blocks: [{ kind: "p", text: `Depreciation expense rises by **${money(d)}** and nothing else changes. The tax rate is **${pct(t)}**.` }],
        question: "By how much does the company's cash balance change? Enter a positive number for an increase.",
        answer: ans, unit: "$", tolerance: { abs: 0.01 },
        solution: [
          `Pre-tax income falls ${money(d)}, so tax falls ${money(d * t, 2)} and net income falls ${money(d * (1 - t), 2)}.`,
          `On the cash flow statement, depreciation is added back: −${num(d * (1 - t), 2)} + ${num(d)} = **+${money(ans, 2)}**.`,
          "The only cash effect of depreciation is the tax it saves.",
        ],
      };
    },
  },
  {
    slug: "straight-line-depreciation",
    title: "Straight-line depreciation",
    track: "Accounting",
    difficulty: "Easy",
    concepts: ["Depreciation", "PP&E"],
    generate(rng) {
      const cost = pick(rng, 50_000, 500_000, 10_000), salvage = pick(rng, 0, 0.2, 0.05) * cost, life = pick(rng, 4, 12, 1);
      const ans = (cost - salvage) / life;
      return {
        blocks: [{ kind: "p", text: `A machine costs **${money(cost)}**, has a salvage value of **${money(salvage)}** and a useful life of **${life} years**.` }],
        question: "What is the annual straight-line depreciation charge?",
        answer: ans, unit: "$", tolerance: { abs: 0.5 },
        solution: [`(${money(cost)} − ${money(salvage)}) / ${life} = **${money(ans, 2)}** per year.`],
      };
    },
  },
  {
    slug: "double-declining-balance",
    title: "Double-declining balance, year 2",
    track: "Accounting",
    difficulty: "Medium",
    concepts: ["Depreciation", "Accelerated methods"],
    generate(rng) {
      const cost = pick(rng, 20_000, 200_000, 5_000), life = pick(rng, 4, 10, 1);
      const rate = 2 / life;
      const y1 = cost * rate, ans = (cost - y1) * rate;
      return {
        blocks: [{ kind: "p", text: `Equipment costs **${money(cost)}** with a **${life}-year** life. The company uses double-declining balance and ignores salvage value until the final years.` }],
        question: "What is the depreciation expense in year 2?",
        answer: ans, unit: "$", tolerance: { abs: 0.5 },
        solution: [
          `Rate = 2 / ${life} = ${pct(rate)}.`,
          `Year 1: ${money(cost)} × ${pct(rate)} = ${money(y1, 2)}. Book value falls to ${money(cost - y1, 2)}.`,
          `Year 2: ${money(cost - y1, 2)} × ${pct(rate)} = **${money(ans, 2)}**.`,
        ],
      };
    },
  },
  {
    slug: "fifo-vs-lifo",
    title: "COGS under FIFO and LIFO",
    track: "Accounting",
    difficulty: "Hard",
    concepts: ["Inventory", "FIFO", "LIFO"],
    generate(rng) {
      const u1 = pick(rng, 100, 300, 10), c1 = pick(rng, 10, 20, 0.5);
      const u2 = pick(rng, 100, 300, 10), c2 = c1 + pick(rng, 1, 5, 0.5);
      const u3 = pick(rng, 100, 300, 10), c3 = c2 + pick(rng, 1, 5, 0.5);
      const sold = pick(rng, Math.max(u1, u3) + 10, u1 + u2 + u3 - 20, 10);
      const layers = [[u1, c1], [u2, c2], [u3, c3]];
      const cogs = (order: number[][]) => {
        let left = sold, total = 0;
        for (const [u, c] of order) { const take = Math.min(left, u); total += take * c; left -= take; }
        return total;
      };
      const fifo = cogs(layers), lifo = cogs([...layers].reverse());
      const ans = lifo - fifo;
      return {
        blocks: [
          { kind: "p", text: "A distributor starts the year with no inventory and makes three purchases, in this order:" },
          { kind: "table", head: ["Purchase", "Units", "Cost per unit"], rows: layers.map(([u, c], i) => [`${i + 1}`, num(u), money(c, 2)]) },
          { kind: "p", text: `It sells **${num(sold)} units** during the year. It uses a periodic system.` },
        ],
        question: "How much higher is cost of goods sold under LIFO than under FIFO?",
        answer: ans, unit: "$", tolerance: { abs: 0.5 },
        solution: [
          `FIFO takes the oldest layers first: COGS = **${money(fifo, 2)}**.`,
          `LIFO takes the newest layers first: COGS = **${money(lifo, 2)}**.`,
          `Difference = **${money(ans, 2)}**. With rising prices, LIFO gives higher COGS and lower taxable income.`,
        ],
      };
    },
  },
  {
    slug: "cfo-indirect-method",
    title: "Cash from operations, indirect method",
    track: "Accounting",
    difficulty: "Medium",
    concepts: ["Cash flow statement", "Working capital"],
    generate(rng) {
      const ni = pick(rng, 50, 400, 5), da = pick(rng, 10, 120, 5);
      const dAR = pick(rng, -40, 60, 5), dInv = pick(rng, -30, 50, 5), dAP = pick(rng, -30, 40, 5);
      const ans = ni + da - dAR - dInv + dAP;
      const chg = (x: number) => (x >= 0 ? `up ${money(x)}m` : `down ${money(-x)}m`);
      return {
        blocks: [{ kind: "table", head: ["Item", "This year"], rows: [
          ["Net income", `${money(ni)}m`], ["Depreciation and amortisation", `${money(da)}m`],
          ["Accounts receivable", chg(dAR)], ["Inventory", chg(dInv)], ["Accounts payable", chg(dAP)],
        ] }],
        question: "What is cash flow from operations, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.01 },
        solution: [
          "Start from net income, add back non-cash charges, then subtract increases in operating assets and add increases in operating liabilities.",
          `${ni} + ${da} − (${dAR}) − (${dInv}) + (${dAP}) = **${money(ans)}m**.`,
        ],
      };
    },
  },
  {
    slug: "retained-earnings-rollforward",
    title: "Retained earnings roll-forward",
    track: "Accounting",
    difficulty: "Easy",
    concepts: ["Balance sheet", "Equity"],
    generate(rng) {
      const begin = pick(rng, 200, 2000, 10), ni = pick(rng, -50, 300, 5), divPayout = pick(rng, 0, 0.6, 0.1);
      const div = Math.max(0, ni) * divPayout;
      const ans = begin + ni - div;
      return {
        blocks: [{ kind: "p", text: `Retained earnings were **${money(begin)}m** at the start of the year. Net income was **${money(ni)}m** and the company paid **${money(div, 1)}m** of dividends.` }],
        question: "What are retained earnings at year end, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.05 },
        solution: [`${num(begin)} + ${num(ni)} − ${num(div, 1)} = **${money(ans, 1)}m**.`],
      };
    },
  },
  {
    slug: "gross-margin",
    title: "Gross and operating margin",
    track: "Accounting",
    difficulty: "Easy",
    concepts: ["Income statement", "Margins"],
    generate(rng) {
      const rev = pick(rng, 200, 2000, 10), cogsPct = pick(rng, 0.35, 0.75, 0.01), sga = pick(rng, 0.08, 0.2, 0.01) * rev;
      const cogs = rev * cogsPct;
      const ans = ((rev - cogs - sga) / rev) * 100;
      return {
        blocks: [{ kind: "p", text: `Revenue is **${money(rev)}m**, cost of goods sold is **${money(cogs, 1)}m** and SG&A is **${money(sga, 1)}m**. There is no D&A.` }],
        question: "What is the operating margin? Enter a percentage, for example 12.5.",
        answer: ans, unit: "%", tolerance: { abs: 0.05 },
        solution: [`Operating income = ${num(rev)} − ${num(cogs, 1)} − ${num(sga, 1)} = ${num(rev - cogs - sga, 1)}.`, `Margin = ${num(rev - cogs - sga, 1)} / ${num(rev)} = **${ans.toFixed(2)}%**.`],
      };
    },
  },
];
