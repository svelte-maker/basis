import { pick } from "@/lib/problems/rng";
import { Layout } from "../layout";
import type { ModelTask } from "../types";

export const ipoPricing: ModelTask = {
  slug: "ipo-fresh-issue-ofs",
  title: "IPO sizing: fresh issue, offer for sale and dilution",
  track: "Corporate Finance",
  difficulty: "Medium",
  skills: ["IPO", "Capital markets", "Dilution"],
  functions: [],
  minutes: 20,
  generate(rng) {
    const pre = pick(rng, 40, 120, 0.5); // crore shares
    const promoter = pick(rng, 0.7, 0.95, 0.01);
    const low = pick(rng, 200, 900, 5);
    const high = low + Math.max(5, Math.round((low * pick(rng, 0.03, 0.06, 0.01)) / 5) * 5);
    const fresh = pick(rng, 500, 4000, 50); // ₹ crore
    const ofs = Math.min(Math.round(pre * promoter * pick(rng, 0.05, 0.2, 0.01) * 2) / 2, pre * promoter - 1);
    const pat = Math.round((pre * high) / pick(rng, 25, 60, 1));

    const L = new Layout(22, 3, [330, 120, 260]);
    L.head("A1", "IPO sizing (₹ crore unless stated)")
      .label("A3", "Pre-issue equity shares (crore)").input("B3", pre, "n2")
      .label("A4", "Promoter holding, pre-issue").input("B4", promoter, "pct1")
      .label("A5", "Price band: lower end (₹ per share)").input("B5", low, "n0")
      .label("A6", "Price band: upper end (₹ per share)").input("B6", high, "n0")
      .label("A7", "Fresh issue size").input("B7", fresh, "n0")
      .label("A8", "Offer for sale by promoters (crore shares)").input("B8", ofs, "n2")
      .label("A9", "Profit after tax, latest fiscal year").input("B9", pat, "n0")
      .head("A11", "At the upper end of the band")
      .label("A12", "Fresh issue shares (crore)").calc("B12", "=B7/B6", "n2")
      .label("A13", "Offer for sale size").calc("B13", "=B8*B6", "n1")
      .label("A14", "Total issue size").calc("B14", "=B7+B13", "n1")
      .label("A15", "Offer for sale as % of the issue").calc("B15", "=B13/B14", "pct1")
      .label("A16", "Post-issue shares (crore)").calc("B16", "=B3+B12", "n2")
      .label("A17", "Post-issue market capitalisation").calc("B17", "=B16*B6", "n0")
      .label("A18", "Promoter holding, post-issue").calc("B18", "=(B3*B4-B8)/B16", "pct2")
      .label("A19", "Post-issue P/E").calc("B19", "=B17/B9", "x1")
      .head("A21", "At the lower end of the band")
      .label("A22", "Post-issue market capitalisation").calc("B22", "=(B3+B7/B5)*B5", "n0")
      .note("C12", "New shares the company issues")
      .note("C13", "Existing shares promoters sell")
      .note("C18", "After selling in the OFS and being diluted");
    L.grade("B12", "Fresh issue shares", 2)
      .grade("B14", "Total issue size", 2)
      .grade("B15", "OFS share of the issue", 1)
      .grade("B16", "Post-issue shares", 2)
      .grade("B17", "Market cap at the upper band", 2)
      .grade("B18", "Promoter holding post-issue", 2)
      .grade("B19", "Post-issue P/E", 1)
      .grade("B22", "Market cap at the lower band", 2);
    return L.build({
      shocks: [
        { label: "upper band ₹20 higher", set: { B6: high + 20 } },
        { label: "fresh issue ₹500 crore larger", set: { B7: fresh + 500 } },
        { label: "OFS 1 crore shares larger", set: { B8: ofs + 1 } },
        { label: "lower band ₹10 lower", set: { B5: low - 10 } },
      ],
      brief: [
        "**Hypothetical company.** A promoter-owned consumer business is filing for an IPO on the Indian exchanges. Like most Indian IPOs, the issue has two parts: a **fresh issue** of new shares, whose proceeds go to the company, and an **offer for sale (OFS)**, in which promoters sell existing shares and keep the money.",
        `The price band is **₹${low} to ₹${high}** per share. Figures are in ₹ crore and crore shares, the way an Indian red herring prospectus reports them.`,
      ],
      steps: [
        "At the upper end of the band, work out how many new shares the fresh issue creates (fresh issue size ÷ price).",
        "Size the OFS in ₹ crore, then the total issue and the OFS share of it.",
        "Post-issue shares are pre-issue shares plus the new shares. The OFS doesn't change the share count.",
        "Post-issue market cap, promoter holding after the IPO (promoter shares less OFS shares, over post-issue shares), and the P/E the issue price implies.",
        "Repeat the market cap at the lower end of the band. The fresh issue is a fixed rupee amount, so a lower price means more new shares.",
      ],
      solution: [
        "**Fresh issue vs OFS.** Only the fresh issue raises money for the company, and it's the only part that creates new shares. The OFS is a sale between existing and new shareholders: cash goes to the selling promoters and the share count doesn't change. An IPO that is mostly OFS is an exit for existing owners, which investors read closely.",
        "**New shares.** The fresh issue is set in rupees, so the number of shares depends on the price: `=B7/B6`. In a real offer document this is rounded down to whole shares and adjusted for any employee discount.",
        "**Post-issue shares and market cap.** `=B3+B12` shares, times the issue price. The market cap at the upper band is the headline valuation the issue implies.",
        "**Promoter holding.** Promoters start with B3 × B4 shares, sell B8 in the OFS, and the remainder is spread over a larger share base: `=(B3*B4-B8)/B16`. SEBI rules require a minimum promoter contribution and lock-in, so this number matters for the offer's structure.",
        "**P/E.** Post-issue market cap ÷ the latest fiscal year's profit after tax. Bankers compare it with listed peers to judge whether the band is priced to leave something on the table.",
        "**Lower end of the band.** `=(B3+B7/B5)*B5`. More new shares are issued at the lower price, so market cap falls by less than the price does.",
      ],
    });
  },
};
