import type { Template } from "../types";
import { pick } from "../rng";
import { money, num, pct } from "../format";
import { n, p, table } from "../explain";

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
        solution: {
          idea: [
            "Follow one dollar through the business. The retailer buys stock, the stock sits on the shelf, it is sold on credit, and only later does the customer pay. Meanwhile the supplier has allowed the retailer some time before it must pay for that stock.",
            "The cash conversion cycle is the number of days between the moment cash goes out to the supplier and the moment it comes back from the customer. During that gap the business has to fund its own operations, with cash or borrowing.",
          ],
          formulas: [
            { expr: "CCC = DSO + DIO − DPO", terms: [
              ["DSO", "Days sales outstanding: how long customers take to pay. Receivables ÷ revenue × 365."],
              ["DIO", "Days inventory outstanding: how long stock sits before it is sold. Inventory ÷ COGS × 365."],
              ["DPO", "Days payables outstanding: how long the company takes to pay suppliers. Payables ÷ COGS × 365."],
            ] },
          ],
          steps: [
            p(`Lay out the timeline. Day 0: stock arrives. Day ${dio}: it is sold (DIO). Day ${dio} + ${dso} = ${dio + dso}: the customer pays (DSO). So cash comes in on day **${dio + dso}**.`),
            p(`The supplier is paid on day ${dpo} (DPO). So cash goes out on day **${dpo}**.`),
            p(`The gap between cash out and cash in is ${dio + dso} − ${dpo} = **${ans} days**.`),
          ],
          meaning: [
            ans > 0
              ? `For **${ans} days** the retailer has paid for goods it has not yet been paid for. That gap is funded with its own cash or a working capital line, and every day it shortens frees roughly one day of sales in cash.`
              : ans === 0
                ? "A cycle of zero means suppliers are paid exactly when customers pay. The business needs no cash of its own to fund working capital."
                : `A negative cycle (**${ans} days**) means customers pay before suppliers have to be paid. Suppliers are effectively funding the business, a position companies such as Amazon and Dell have been known for. Growth then releases cash instead of consuming it.`,
            "Compare the cycle with peers in the same industry and with the company's own history. A lengthening cycle often means slower collections or inventory piling up.",
          ],
          mistakes: [
            `Adding DPO instead of subtracting it: ${dso} + ${dio} + ${dpo} = ${dso + dio + dpo} days. Payables are credit the company receives, so they shorten the gap.`,
            "Computing DIO or DPO against revenue instead of COGS when working from raw balances. Inventory and payables are carried at cost, so divide by cost of goods sold.",
          ],
          excel: [`\`=${dso}+${dio}-${dpo}\``, "From balances: `=AR/Revenue*365 + Inventory/COGS*365 - AP/COGS*365`."],
        },
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
        solution: {
          idea: [
            "Depreciation is an accounting charge, not a payment. No cheque goes to anyone when it is booked; the cash was spent when the asset was bought.",
            "But depreciation is tax-deductible. A bigger charge lowers taxable income, so the company pays less tax. That tax saving, the depreciation tax shield, is the only effect on cash.",
          ],
          formulas: [
            { expr: "Δ Cash = Δ Depreciation × t", terms: [["Δ Depreciation", "The increase in the depreciation charge"], ["t", "The tax rate"]] },
            { expr: "Δ Net income = −Δ Depreciation × (1 − t)", terms: [["(1 − t)", "The share of a pre-tax change that reaches net income"]] },
          ],
          steps: [
            p("Walk it through the three statements."),
            table(["Statement", "Line", "Change"], [
              ["Income statement", "Depreciation", `+${num(d)}`],
              ["Income statement", "Pre-tax income", `−${num(d)}`],
              ["Income statement", `Tax at ${pct(t)}`, `−${num(d * t, 2)}`],
              ["Income statement", "Net income", `−${num(d * (1 - t), 2)}`],
              ["Cash flow statement", "Net income", `−${num(d * (1 - t), 2)}`],
              ["Cash flow statement", "Add back depreciation", `+${num(d)}`],
              ["Cash flow statement", "Change in cash", `**+${num(ans, 2)}**`],
              ["Balance sheet", "Cash", `+${num(ans, 2)}`],
              ["Balance sheet", "Net PP&E", `−${num(d)}`],
              ["Balance sheet", "Retained earnings", `−${num(d * (1 - t), 2)}`],
            ]),
            p(`Check the balance sheet balances: assets change by +${num(ans, 2)} − ${num(d)} = −${num(d * (1 - t), 2)}, and equity changes by −${num(d * (1 - t), 2)}.`),
            p(`So cash rises by ${money(d)} × ${pct(t)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `Higher depreciation makes the company look less profitable (net income falls ${money(d * (1 - t), 2)}) but leaves it with ${money(ans, 2)} more cash. This is why accelerated tax depreciation has real value: it pulls tax savings forward.`,
            "If the company were loss-making and paid no tax this year, the extra depreciation would have no immediate cash effect at all (until the losses are used).",
          ],
          mistakes: [
            "Answering 0 because depreciation is non-cash. True of the charge itself, but it still changes the tax bill.",
            `Answering −${num(d * (1 - t), 2)}, the change in net income, and forgetting that depreciation is added back on the cash flow statement.`,
            `Answering +${num(d)}, adding back the whole charge without first taking the net income hit.`,
          ],
          excel: [`\`=${d}*${n(t)}\``],
        },
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
      const rows = Array.from({ length: life }, (_, i) => [String(i + 1), money(ans, 2), money(ans * (i + 1), 2), money(cost - ans * (i + 1), 2)]);
      return {
        blocks: [{ kind: "p", text: `A machine costs **${money(cost)}**, has a salvage value of **${money(salvage)}** and a useful life of **${life} years**.` }],
        question: "What is the annual straight-line depreciation charge?",
        answer: ans, unit: "$", tolerance: { abs: 0.5 },
        solution: {
          idea: [
            "A machine helps earn revenue for several years, so its cost is spread over those years instead of being expensed all at once (the matching principle).",
            "Only the part of the cost the company expects to use up is spread: the purchase price less what it expects to sell the machine for at the end. Straight-line spreads that amount evenly.",
          ],
          formulas: [
            { expr: "Annual depreciation = (Cost − Salvage) / Useful life", terms: [
              ["Cost", "What the asset cost to buy and get ready for use"],
              ["Salvage", "What the company expects to recover at the end of the asset's life"],
              ["Cost − Salvage", "The depreciable base: the value actually consumed"],
              ["Useful life", "Years the asset is expected to be used"],
            ] },
          ],
          steps: [
            p(`Depreciable base = ${money(cost)} − ${money(salvage)} = ${money(cost - salvage)}.`),
            p(`Annual charge = ${money(cost - salvage)} / ${life} = **${money(ans, 2)}**.`),
            p("The schedule shows the book value falling evenly to the salvage value:"),
            table(["Year", "Depreciation", "Accumulated", "Book value"], rows),
          ],
          meaning: [
            `Each year the income statement carries ${money(ans, 2)} of expense and the asset's book value falls by the same amount, ending at ${money(salvage)} in year ${life}.`,
            "Book value is an accounting number, not a market value. A machine can be worth far more or less than its book value at any point.",
          ],
          mistakes: [
            `Ignoring salvage: ${money(cost)} / ${life} = ${money(cost / life, 2)}. That would depreciate the machine below what it can be sold for.`,
            "Dividing the cost by the life and then subtracting salvage once. Salvage comes off the base before dividing.",
          ],
          excel: [`\`=SLN(${cost},${n(salvage, 2)},${life})\``],
        },
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
        solution: {
          idea: [
            "Many assets lose value fastest when they are new (think of a car). Accelerated methods charge more depreciation early and less later to reflect that.",
            "Double-declining balance takes twice the straight-line rate and applies it to the **remaining book value** each year, not to the original cost. Because the base shrinks, each year's charge is smaller than the last.",
          ],
          formulas: [
            { expr: "DDB rate = 2 / N", terms: [["N", "Useful life in years"], ["1 / N", "The straight-line rate; DDB doubles it"]] },
            { expr: "Depreciationₜ = Book valueₜ₋₁ × DDB rate", terms: [["Book valueₜ₋₁", "Cost less all depreciation charged before year t"]] },
          ],
          steps: [
            p(`Rate = 2 / ${life} = ${pct(rate)} a year (straight-line would be ${pct(1 / life)}).`),
            table(["Year", "Opening book value", "× Rate", "Depreciation", "Closing book value"], [
              ["1", money(cost, 2), pct(rate), money(y1, 2), money(cost - y1, 2)],
              ["2", money(cost - y1, 2), pct(rate), `**${money(ans, 2)}**`, money(cost - y1 - ans, 2)],
            ]),
            p(`Year 2 depreciation = ${money(cost - y1, 2)} × ${pct(rate)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `Straight-line would charge ${money(cost / life, 2)} every year. DDB charges ${money(y1, 2)} then ${money(ans, 2)}: more in the early years, less later. Total depreciation over the life is the same; only the timing changes.`,
            "Companies switch to straight-line once straight-line on the remaining book value gives a bigger charge, so the asset is fully written down to salvage by the end of its life.",
          ],
          mistakes: [
            `Applying the rate to the original cost again: ${money(cost)} × ${pct(rate)} = ${money(y1, 2)}. The base must shrink.`,
            `Using the straight-line rate 1/${life} on the declining balance: ${money(cost * (1 - 1 / life) / life, 2)}.`,
            "Subtracting salvage from the base before applying the rate. Under DDB, salvage only acts as a floor on book value.",
          ],
          excel: [`\`=DDB(${cost},0,${life},2)\` gives year 2. Change the last argument to see other years.`],
        },
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
      const consume = (order: number[][]) => {
        let left = sold, total = 0;
        const rows: string[][] = [];
        for (const [u, c] of order) {
          const take = Math.min(left, u);
          total += take * c; left -= take;
          rows.push([`${layers.findIndex((l) => l[0] === u && l[1] === c) + 1}`, num(u), num(take), money(c, 2), money(take * c, 2)]);
        }
        rows.push(["Total", "", num(sold), "", `**${money(total, 2)}**`]);
        return { total, rows };
      };
      const fifo = consume(layers), lifo = consume([...layers].reverse());
      const ans = lifo.total - fifo.total;
      const purchases = u1 * c1 + u2 * c2 + u3 * c3, units = u1 + u2 + u3;
      const avgCost = purchases / units;
      const head = ["Layer", "Units bought", "Units sold from it", "Cost per unit", "Cost"];
      return {
        blocks: [
          { kind: "p", text: "A distributor starts the year with no inventory and makes three purchases, in this order:" },
          { kind: "table", head: ["Purchase", "Units", "Cost per unit"], rows: layers.map(([u, c], i) => [`${i + 1}`, num(u), money(c, 2)]) },
          { kind: "p", text: `It sells **${num(sold)} units** during the year. It uses a periodic system.` },
        ],
        question: "How much higher is cost of goods sold under LIFO than under FIFO?",
        answer: ans, unit: "$", tolerance: { abs: 0.5 },
        solution: {
          idea: [
            "The goods on the shelf are identical, but they were bought at different prices. When some are sold, the accountant has to decide **which price** to charge to cost of goods sold. That choice is the cost-flow assumption; it need not match which box physically left the warehouse.",
            "**FIFO** (first in, first out) charges the oldest costs first. **LIFO** (last in, first out) charges the newest costs first. Whatever is not charged to COGS stays on the balance sheet as ending inventory.",
            "Here prices rise with each purchase, so LIFO puts the expensive recent units into COGS and leaves the cheap old units in inventory. LIFO COGS will be higher.",
          ],
          formulas: [
            { expr: "COGS = Σ (units taken from each layer × that layer's cost)", terms: [["Layer", "One purchase batch at a single unit cost"]] },
            { expr: "Ending inventory = Total purchases − COGS", terms: [["Total purchases", "Opening inventory (zero here) plus everything bought"]] },
            { expr: "LIFO reserve = FIFO inventory − LIFO inventory", terms: [["LIFO reserve", "With zero opening inventory this equals LIFO COGS − FIFO COGS, the number asked for"]] },
          ],
          steps: [
            p(`**FIFO.** Take the ${num(sold)} units from the oldest layer first:`),
            table(head, fifo.rows),
            p(`**LIFO.** Take the ${num(sold)} units from the newest layer first:`),
            table(head, lifo.rows),
            p(`Total purchases = ${money(purchases, 2)} for ${num(units)} units, so ending inventory is ${money(purchases - fifo.total, 2)} under FIFO and ${money(purchases - lifo.total, 2)} under LIFO.`),
            p(`Difference in COGS = ${money(lifo.total, 2)} − ${money(fifo.total, 2)} = **${money(ans, 2)}**.`),
          ],
          meaning: [
            `In a period of rising prices LIFO reports ${money(ans, 2)} more COGS, so ${money(ans, 2)} less gross profit and pre-tax income. At a 25% tax rate that would save ${money(ans * 0.25, 2)} of tax, which is why US companies elect LIFO in inflationary periods.`,
            "The balance sheet tells the opposite story: LIFO inventory is stated at old, stale prices. Analysts add the LIFO reserve back to inventory to compare a LIFO company with a FIFO one.",
            "IFRS does not allow LIFO. US GAAP does, and a company that uses LIFO for tax must also use it in its financial statements (the LIFO conformity rule).",
            "Under a perpetual system LIFO is applied at each sale using only units bought by then, which can give a different answer. The question says periodic, so all purchases in the year are available.",
          ],
          mistakes: [
            `Using weighted average cost: ${money(avgCost, 4)} per unit × ${num(sold)} = ${money(avgCost * sold, 2)}. That is a third method and sits between FIFO and LIFO.`,
            "Taking layers in the wrong order, for example charging the newest costs under FIFO. FIFO uses the oldest costs for COGS and leaves the newest in inventory.",
            "Comparing ending inventories and getting the sign backwards. LIFO inventory is lower by exactly the amount LIFO COGS is higher.",
          ],
          excel: [
            "Put units in B2:B4 and costs in C2:C4, oldest first. For FIFO units taken, in D2 enter `=MIN(B2,MAX(0," + sold + "-SUM(B$1:B1)))` and fill down. COGS is `=SUMPRODUCT(C2:C4,D2:D4)`.",
            "For LIFO, sort the layers newest first and repeat. The difference is the LIFO reserve.",
          ],
        },
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
      const eff = (x: number) => (x >= 0 ? `+${num(x)}` : `−${num(-x)}`);
      let run = ni + da;
      const step = (x: number) => (run += x, num(run));
      return {
        blocks: [{ kind: "table", head: ["Item", "This year"], rows: [
          ["Net income", `${money(ni)}m`], ["Depreciation and amortisation", `${money(da)}m`],
          ["Accounts receivable", chg(dAR)], ["Inventory", chg(dInv)], ["Accounts payable", chg(dAP)],
        ] }],
        question: "What is cash flow from operations, in $m?",
        answer: ans, unit: "$m", tolerance: { abs: 0.01 },
        solution: {
          idea: [
            "Net income is measured on an accrual basis: revenue is booked when earned and costs when incurred, whether or not cash has moved. The indirect method starts from net income and undoes every item where profit and cash differ.",
            "Two kinds of adjustment. First, add back non-cash charges such as depreciation. Second, adjust for working capital: if an operating asset grows (more receivables, more inventory), cash was tied up, so subtract the increase. If an operating liability grows (more payables), the company held on to cash it owed, so add the increase.",
          ],
          formulas: [
            { expr: "CFO = Net income + D&A − ΔAR − ΔInventory + ΔAP", terms: [
              ["D&A", "Depreciation and amortisation, charged against profit but not paid in cash this year"],
              ["ΔAR", "Increase in receivables: sales booked but not yet collected"],
              ["ΔInventory", "Increase in inventory: cash spent on stock not yet sold"],
              ["ΔAP", "Increase in payables: costs booked but not yet paid"],
            ] },
          ],
          steps: [
            table(["Item", "Change", "Cash effect", "Why", "Running total"], [
              ["Net income", "", `+${num(ni)}`, "Starting point", num(ni)],
              ["D&A", "", `+${num(da)}`, "Non-cash charge", num(ni + da)],
              ["Receivables", chg(dAR), eff(-dAR), dAR >= 0 ? "Customers owe more: cash not yet received" : "Customers paid down balances: extra cash in", step(-dAR)],
              ["Inventory", chg(dInv), eff(-dInv), dInv >= 0 ? "Bought more stock than was sold" : "Sold stock bought earlier", step(-dInv)],
              ["Payables", chg(dAP), eff(dAP), dAP >= 0 ? "Owe suppliers more: cash kept" : "Paid suppliers down: cash out", step(dAP)],
            ]),
            p(`CFO = ${ni} + ${da} − (${dAR}) − (${dInv}) + (${dAP}) = **${money(ans)}m**.`),
          ],
          meaning: [
            `Operating cash flow of ${money(ans)}m against net income of ${money(ni)}m, a ratio of ${(ans / ni).toFixed(2)}x.`,
            ans < ni
              ? "Cash is lagging profit. If that persists, ask whether receivables or inventory are building up faster than sales: it can signal aggressive revenue recognition or slow-moving stock."
              : "Cash is ahead of profit, helped by the D&A add-back and working capital. Healthy, but check the working capital release is not a one-off (for example stretching suppliers).",
          ],
          mistakes: [
            `Flipping the working capital signs: ${ni} + ${da} + (${dAR}) + (${dInv}) − (${dAP}) = ${money(ni + da + dAR + dInv - dAP)}m. An asset increase uses cash; a liability increase provides it.`,
            `Forgetting to add back D&A: ${money(ans - da)}m.`,
          ],
          excel: [`\`=${ni}+${da}-(${dAR})-(${dInv})+(${dAP})\``],
        },
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
        solution: {
          idea: [
            "Retained earnings are the running total of every profit the company has ever made, less every loss and every dividend it has paid out. They are the link between the income statement and the balance sheet.",
            "Each year: profit adds to the pile, losses take from it, and dividends hand part of it to shareholders.",
          ],
          formulas: [
            { expr: "Closing RE = Opening RE + Net income − Dividends", terms: [
              ["Opening RE", "Retained earnings at the start of the year"],
              ["Net income", "This year's profit (negative if a loss)"],
              ["Dividends", "Cash or stock dividends declared to shareholders"],
            ] },
          ],
          steps: [
            table(["", "$m"], [["Opening retained earnings", num(begin, 1)], [ni >= 0 ? "+ Net income" : "+ Net income (a loss)", num(ni, 1)], ["− Dividends", num(-div, 1)], ["Closing retained earnings", `**${num(ans, 1)}**`]]),
            p(`${num(begin)} + (${num(ni)}) − ${num(div, 1)} = **${money(ans, 1)}m**.`),
          ],
          meaning: [
            ni > 0 ? `The company kept ${money(ni - div, 1)}m of this year's ${money(ni)}m profit (a payout ratio of ${pct(div / ni, 0)}), so equity grows by that amount.`
              : ni === 0 ? "No profit and no dividend, so retained earnings are unchanged."
                : `A loss of ${money(-ni)}m reduces retained earnings directly. No dividend was paid this year.`,
            "Retained earnings are not a pile of cash. The profits may have been spent long ago on equipment, inventory or debt repayment.",
          ],
          mistakes: [
            "Treating dividends as an expense on the income statement. They are a distribution of profit, so they reduce retained earnings but never net income.",
            ni < 0 ? `Getting the sign of the loss wrong: ${num(begin)} − (${num(ni)}) = ${money(begin - ni, 1)}m is wrong; a loss lowers retained earnings.` : "Adding share issuance proceeds. New shares raise share capital, not retained earnings.",
          ],
          excel: [`\`=${begin}+(${ni})-${n(div, 2)}\``],
        },
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
      const oi = rev - cogs - sga;
      const ans = (oi / rev) * 100;
      return {
        blocks: [{ kind: "p", text: `Revenue is **${money(rev)}m**, cost of goods sold is **${money(cogs, 1)}m** and SG&A is **${money(sga, 1)}m**. There is no D&A.` }],
        question: "What is the operating margin? Enter a percentage, for example 12.5.",
        answer: ans, unit: "%", tolerance: { abs: 0.05 },
        solution: {
          idea: [
            "A margin answers: of every dollar of sales, how many cents are left after a given layer of cost?",
            "**Gross margin** is what remains after the direct cost of the product. **Operating margin** is what remains after also paying for running the business (sales, marketing, admin). It measures how profitable the core operations are before financing and tax.",
          ],
          formulas: [
            { expr: "Gross margin = (Revenue − COGS) / Revenue", terms: [["COGS", "Cost of goods sold: materials, direct labour and other direct costs"]] },
            { expr: "Operating margin = (Revenue − COGS − SG&A − D&A) / Revenue", terms: [["SG&A", "Selling, general and administrative expenses"], ["D&A", "Zero in this problem"]] },
          ],
          steps: [
            table(["", "$m", "% of revenue"], [
              ["Revenue", num(rev, 1), "100%"],
              ["− COGS", num(-cogs, 1), pct(cogs / rev)],
              ["Gross profit", num(rev - cogs, 1), pct((rev - cogs) / rev)],
              ["− SG&A", num(-sga, 1), pct(sga / rev)],
              ["Operating income", num(oi, 1), `**${ans.toFixed(2)}%**`],
            ]),
            p(`Operating margin = ${num(oi, 1)} / ${num(rev)} = **${ans.toFixed(2)}%**.`),
          ],
          meaning: [
            `Out of every $100 of sales, about $${(100 - cogsPct * 100).toFixed(0)} is left after product costs and $${ans.toFixed(2)} after overheads.`,
            "Margins are most useful compared with peers and over time. A falling gross margin points to pricing pressure or rising input costs; a falling operating margin with a stable gross margin points to overheads growing faster than sales.",
          ],
          mistakes: [
            `Reporting the gross margin (${pct((rev - cogs) / rev)}) instead of the operating margin.`,
            `Dividing by COGS instead of revenue: ${num(oi, 1)} / ${num(cogs, 1)} = ${pct(oi / cogs)}. Margins are always over revenue.`,
            `Entering the decimal (${(ans / 100).toFixed(4)}) instead of the percentage (${ans.toFixed(2)}).`,
          ],
          excel: [`\`=(${rev}-${n(cogs, 2)}-${n(sga, 2)})/${rev}\` and format as a percentage.`],
        },
      };
    },
  },
];
