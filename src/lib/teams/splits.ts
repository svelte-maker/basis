// How each model task divides into parts that teammates claim. A part owns every cell in its rows,
// so ownership (and therefore credit) is decided by where a cell sits, not by who says what.
import type { GradedCell } from "@/lib/models/types";

export type PartSpec = {
  key: string;
  title: string;
  /** What this part covers, one line. */
  blurb: string;
  /** Sheet rows this part owns, 1-based and inclusive. */
  rows: [number, number][];
  /** Checks added for team play so every part has something graded. They sit in this part's rows. */
  extra?: GradedCell[];
};

export const TEAM_SPLITS: Record<string, PartSpec[]> = {
  "term-loan-amortisation": [
    { key: "payment", title: "Payment", blurb: "The level annual payment with PMT.", rows: [[7, 7]] },
    { key: "schedule", title: "Amortisation schedule", blurb: "Opening balance, interest, principal and closing balance each year, and total interest.", rows: [[10, 15]] },
  ],
  "fund-returns-xirr": [
    { key: "dated", title: "Dated returns", blurb: "XIRR and XNPV on the actual cash flow dates.", rows: [[16, 17]] },
    { key: "multiples", title: "Multiples and annual IRR", blurb: "Distributions, paid-in capital, TVPI and IRR on annual spacing.", rows: [[18, 21]] },
  ],
  "ipo-fresh-issue-ofs": [
    { key: "issue", title: "Issue structure", blurb: "Fresh issue shares, offer for sale, total issue size and the OFS share.", rows: [[12, 15]] },
    { key: "post", title: "Post-issue valuation", blurb: "Post-issue shares, market cap at both ends of the band, promoter holding and P/E.", rows: [[16, 22]] },
  ],
  "trading-comps-lookups": [
    { key: "multiples", title: "Peer multiples", blurb: "EV / EBITDA for each peer, the lookup, the median and the count above the cut-off.", rows: [[4, 15]] },
    { key: "scenario", title: "Scenario valuation", blurb: "Pick the scenario's multiple and apply it.", rows: [[17, 23]] },
  ],
  "five-year-dcf": [
    {
      key: "forecast", title: "Operating forecast", blurb: "Revenue, EBITDA, D&A, EBIT and tax on EBIT for five years.", rows: [[16, 20]],
      extra: [{ cell: "G16", label: "Revenue, year 5", points: 1 }, { cell: "G19", label: "EBIT, year 5", points: 2 }, { cell: "G20", label: "Tax on EBIT, year 5", points: 1 }],
    },
    { key: "fcf", title: "Free cash flow", blurb: "Capex, the increase in working capital and unlevered free cash flow.", rows: [[21, 23]] },
    { key: "valuation", title: "Valuation", blurb: "Discounting, terminal value, enterprise to equity bridge and value per share.", rows: [[25, 32]] },
  ],
  "lbo-debt-sweep": [
    { key: "sources", title: "Sources and uses", blurb: "Entry enterprise value, debt raised and the sponsor's equity.", rows: [[14, 17]] },
    {
      key: "operations", title: "Operating cash flow", blurb: "EBITDA, D&A, interest, taxes, reinvestment and free cash flow.", rows: [[20, 25]],
      extra: [{ cell: "G25", label: "Free cash flow, year 5", points: 2 }],
    },
    { key: "debt", title: "Debt schedule", blurb: "Opening debt, mandatory amortisation, the cash sweep and closing debt.", rows: [[26, 29]] },
    { key: "returns", title: "Exit and returns", blurb: "Exit value, equity value, MOIC and IRR.", rows: [[31, 38]] },
  ],
};

export function teamSplit(slug: string): PartSpec[] | undefined {
  return TEAM_SPLITS[slug];
}

/** 1-based sheet row of an address like "C17". */
export function rowOf(a: string): number {
  const m = /^[A-Z]+(\d+)$/.exec(a);
  return m ? Number(m[1]) : 0;
}

export function partOfCell(parts: PartSpec[], a: string): PartSpec | undefined {
  const r = rowOf(a);
  return parts.find((p) => p.rows.some(([from, to]) => r >= from && r <= to));
}
