import { getCase } from "@/lib/cases";
import { num, pct } from "@/lib/problems/format";
import type { Lesson } from "../types";

/** Indian digit grouping (1,59,258) for rupee amounts. */
const inr = (n: number, dp = 0) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });

// A hypothetical issue: fresh issue plus offer for sale (₹ crore, crore shares)
const ipo = (() => {
  const preShares = 50, promoterPct = 0.9, low = 380, high = 400, fresh = 1000, ofsShares = 5, pat = 600;
  const freshShares = fresh / high;
  const ofsValue = ofsShares * high;
  const issue = fresh + ofsValue;
  const postShares = preShares + freshShares;
  const mcap = postShares * high;
  const promoterPost = (preShares * promoterPct - ofsShares) / postShares;
  const mcapLow = (preShares + fresh / low) * low;
  return { preShares, promoterPct, low, high, fresh, ofsShares, pat, freshShares, ofsValue, issue, postShares, mcap, promoterPost, mcapLow, pe: mcap / pat, epsPre: pat / preShares, epsPost: pat / postShares };
})();

// Hyundai Motor India figures, read from the case's cited Prospectus figures
const hy = (() => {
  const c = getCase("hyundai-motor-india-ipo-2024");
  if (!c) throw new Error("Hyundai case missing");
  const v = (id: string) => {
    const f = c.figures[id];
    if (!f) throw new Error(`Hyundai figure ${id} missing`);
    return f.value;
  };
  return {
    offerPrice: v("offerPrice"), floor: v("floorPrice"), offerCrore: v("offerSize") / 10, offerShares: v("offerShares"),
    promoterPostPct: v("promoterPostPct"), mcapCrore: v("mcapBn") * 100, pe: v("pe24"), anchorShare: v("anchorShares") / v("qibShares"),
  };
})();

// Rights issue: 1 new share for every 4 held, at ₹80, when the share trades at ₹120
const rights = (() => {
  const held = 4, price = 120, sub = 80;
  const terp = (held * price + sub) / (held + 1);
  return { held, price, sub, terp, perOld: price - terp, perRight: terp - sub };
})();

export const ipoFpo: Lesson = {
  slug: "ipo-and-fpo",
  title: "IPOs and FPOs: how companies raise money from the public",
  summary: "How an IPO works from DRHP to listing day: fresh issue versus offer for sale, book building and price bands, investor categories, valuation and dilution, plus FPOs, rights issues, QIPs and block deals.",
  module: "capital-markets",
  level: "Core",
  prerequisites: ["enterprise-value-and-multiples"],
  outcomes: [
    "Explain the difference between a fresh issue and an offer for sale, and who receives the money in each.",
    "Compute issue size, post-issue shares, market capitalisation, dilution and promoter holding across a price band.",
    "Describe the Indian IPO process step by step: DRHP, SEBI observations, RHP, anchor book, bidding, allotment and T+3 listing.",
    "Read the \"Basis for Offer Price\" section of a prospectus critically and test the valuation against peers.",
    "Choose between an FPO, rights issue, QIP, OFS through the exchange and a block deal for a listed company that needs capital or a seller who wants to exit.",
  ],
  hook: [
    `In October 2024 Hyundai Motor India listed with India's largest-ever IPO: ${inr(hy.offerCrore, 0)} crore. Yet the company itself received **nothing**. Every share sold belonged to its parent, Hyundai Motor Company. A few months earlier, other IPOs raised fresh money to build factories and repay debt. The headlines call both \"IPOs\", but for investors they are very different propositions.`,
    "Understanding an IPO means being able to answer, from the offer document alone: who is selling, who gets the money, how much of the company the public now owns, and whether the price is fair compared with what the market already pays for similar companies. That is the skill this lesson builds.",
  ],
  sections: [
    {
      id: "why",
      title: "Why companies go public",
      blocks: [
        { kind: "list", items: [
          "**Raise growth capital** to fund factories, stores, technology or acquisitions, or to repay expensive debt.",
          "**Give existing investors an exit.** Founders, private equity and venture capital funds, and parent companies sell part of their stake.",
          "**Create a currency.** Listed shares can pay for acquisitions and fund employee stock option plans with a visible value.",
          "**Visibility and credibility** with customers, lenders and talent.",
        ] },
        { kind: "p", text: "The costs are real: fees of a few percent of the issue, ongoing disclosure and governance obligations (quarterly results, independent directors, insider trading rules), and a share price that is now marked to market every day." },
        { kind: "p", text: "An IPO happens in the **primary market**: the company or its shareholders sell shares to new investors. After listing, those shares trade between investors in the **secondary market** on the exchanges (NSE and BSE in India), and the company receives nothing from that trading." },
      ],
    },
    {
      id: "fresh-ofs",
      title: "Fresh issue versus offer for sale",
      blocks: [
        { kind: "table", head: ["", "Fresh issue", "Offer for sale (OFS)"], rows: [
          ["What is sold", "New shares created by the company", "Existing shares held by promoters or investors"],
          ["Who gets the money", "The company", "The selling shareholders"],
          ["Share count", "Increases: existing holders are diluted", "Unchanged"],
          ["Signals", "Capital for growth or deleveraging", "Insiders cashing out (not necessarily bad: PE funds must exit)"],
        ] },
        { kind: "p", text: "Most Indian IPOs combine the two. The prospectus's **Objects of the Offer** section says exactly what the fresh money will be used for. Read it: \"general corporate purposes\" is capped by SEBI, and money earmarked for unidentified acquisitions deserves scrutiny." },
        { kind: "h", text: "Worked example" },
        { kind: "p", text: `A company has ${ipo.preShares} crore shares, ${pct(ipo.promoterPct, 0)} held by its promoters. It files for an IPO with a price band of ₹${ipo.low}–₹${ipo.high}: a fresh issue of ${inr(ipo.fresh)} crore plus an OFS of ${ipo.ofsShares} crore shares by the promoters. Last year's profit after tax was ${inr(ipo.pat)} crore.` },
        { kind: "table", caption: "At the upper end of the band (₹ crore unless stated)", head: ["Line", "Calculation", "Result"], rows: [
          ["Fresh issue shares", `${inr(ipo.fresh)} ÷ ₹${ipo.high}`, `${num(ipo.freshShares, 2)} crore shares`],
          ["OFS size", `${ipo.ofsShares} crore × ₹${ipo.high}`, inr(ipo.ofsValue)],
          ["Total issue size", "Fresh + OFS", inr(ipo.issue)],
          ["OFS share of the issue", `${inr(ipo.ofsValue)} ÷ ${inr(ipo.issue)}`, pct(ipo.ofsValue / ipo.issue, 1)],
          ["Post-issue shares", `${ipo.preShares} + ${num(ipo.freshShares, 2)}`, `${num(ipo.postShares, 2)} crore`],
          ["Post-issue market cap", `${num(ipo.postShares, 2)} × ₹${ipo.high}`, inr(ipo.mcap)],
          ["Promoter holding after", `(${ipo.preShares} × ${pct(ipo.promoterPct, 0)} − ${ipo.ofsShares}) ÷ ${num(ipo.postShares, 2)}`, pct(ipo.promoterPost, 2)],
          ["Post-issue P/E", `${inr(ipo.mcap)} ÷ ${inr(ipo.pat)}`, `${num(ipo.pe, 1)}x`],
        ] },
        { kind: "p", text: `The promoters' stake falls from ${pct(ipo.promoterPct, 0)} to ${pct(ipo.promoterPost, 2)} for two reasons: they **sold** ${ipo.ofsShares} crore shares, and the fresh issue **diluted** what they kept. EPS on the enlarged share count falls from ₹${num(ipo.epsPre, 2)} to ₹${num(ipo.epsPost, 2)}. At the bottom of the band, market cap would be ${inr(ipo.mcapLow)} crore: the fresh issue then needs more shares to raise the same rupees.` },
        { kind: "callout", tone: "warning", title: "Which P/E is the \"IPO P/E\"?", text: [
          "Prospectuses usually show P/E on pre-issue EPS, which looks cheaper than P/E on the post-issue share count when there is a fresh issue. Investors should value the company on the shares that will exist after listing. And check which year's earnings are used: a single strong year can flatter the multiple.",
        ] },
      ],
    },
    {
      id: "process",
      title: "The Indian IPO process, step by step",
      blocks: [
        { kind: "list", ordered: true, items: [
          "**Preparation (6–12 months).** Appoint book running lead managers (BRLMs: investment banks), legal counsel and auditors. Restate three years of financials, clean up the cap table, convert to a public limited company, strengthen the board.",
          "**DRHP.** File the Draft Red Herring Prospectus with SEBI and the exchanges. It is public: anyone can read the business, risks, financials, litigation and objects. Investors and the media scrutinise it.",
          "**SEBI observations.** SEBI reviews and issues observations; the company has a limited window to launch after that.",
          "**RHP and price band.** The Red Herring Prospectus is filed with the Registrar of Companies, and the price band is announced at least two working days before the issue opens. The cap may be at most 120% of the floor, and the band must be at least 5% wide.",
          "**Anchor book.** One working day before opening, anchor investors (large institutions) are allotted up to 60% of the QIB portion at a fixed price. Their names are disclosed, which signals demand. Half of anchor shares are locked in for 30 days and half for 90 days.",
          "**Bidding (3 working days).** Investors bid through brokers and banks using UPI or ASBA, so money is only blocked in their accounts, not debited, until allotment.",
          "**Pricing and allotment.** The final price is fixed (usually at the top of the band when demand is strong). Oversubscribed retail portions are allotted by lottery: each successful retail applicant gets at least one lot.",
          "**Listing on T+3.** Since December 2023, SEBI requires listing three working days after the issue closes. The first trade sets the listing price, and any gain or loss over the issue price is the listing-day return.",
        ] },
        { kind: "table", caption: "Investor categories in a main-board book-built issue (profitable issuer)", head: ["Category", "Who", "Share of the net offer"], rows: [
          ["QIB", "Mutual funds, insurers, FPIs, banks; includes anchors", "Not more than 50%"],
          ["Non-institutional (NII / HNI)", "Individuals and companies bidding above ₹2 lakh", "Not less than 15%"],
          ["Retail (RII)", "Individuals bidding up to ₹2 lakh", "Not less than 35%"],
          ["Employees and shareholders' reservations", "Optional, often at a discount", "Outside the net offer"],
        ] },
        { kind: "p", text: "A company that does not meet SEBI's profitability track-record test can still list, but then at least 75% of the net offer must go to QIBs and retail is capped at 10%: the regulator wants sophisticated investors to carry the risk of loss-making businesses. After listing, promoters' minimum contribution (20% of post-issue capital) is locked in, and every listed company must eventually reach 25% public shareholding." },
        { kind: "callout", tone: "desk", title: "What the deal team actually spends its time on", text: [
          "Valuation and investor education. Before the price band is set, the bankers' research analysts publish pre-deal research and the company meets dozens of fund managers. Their feedback, plus the peer multiples, sets the band. During bidding the team watches QIB demand closely: a strong anchor book and early QIB interest usually decide whether the issue prices at the top.",
        ] },
      ],
    },
    {
      id: "valuation",
      title: "Valuing an IPO and reading the prospectus",
      blocks: [
        { kind: "p", text: "An IPO is valued like any listed company: comparable company multiples first (P/E, EV/EBITDA, EV/Sales for loss-makers), sometimes a DCF. The prospectus's **Basis for Offer Price** section must justify the price against listed peers using KPIs. Read it as the seller's argument, not as independent analysis." },
        { kind: "p", text: `Hyundai Motor India was priced at ₹${num(hy.offerPrice, 0)} (band ₹${num(hy.floor, 0)}–₹${num(hy.offerPrice, 0)}), a P/E of ${num(hy.pe, 2)}x on fiscal 2024 diluted EPS and a market capitalisation of about ${inr(hy.mcapCrore, 0)} crore. Because it was a pure OFS, the share count didn't change and the parent's stake fell to ${num(hy.promoterPostPct, 1)}%. Anchors took ${pct(hy.anchorShare, 0)} of the QIB portion.` },
        { kind: "list", items: [
          "**Peer choice.** Are the listed peers really comparable? A conglomerate in the peer set can drag the average multiple down and make the IPO look like a premium or a bargain.",
          "**Earnings quality.** Is the latest year's profit inflated by one-offs, other income, or a cost the company stops paying after listing (or starts paying, such as royalties to a parent)?",
          "**Pre-IPO dividends and transactions.** A large dividend just before listing shrinks equity and inflates return on net worth. The Hyundai case makes you find this.",
          "**Weighted average cost of acquisition.** The prospectus discloses what selling shareholders paid. A PE fund selling at 10x its cost is taking a lot of value off the table.",
          "**Related parties and litigation.** Royalties, brand fees and contracts with the promoter group can transfer value away from minority shareholders.",
        ] },
        { kind: "callout", tone: "insight", title: "Why IPOs are \"underpriced\"", text: [
          "Across markets, IPOs on average list above their issue price. Explanations include the winner's curse (uninformed investors get full allocations of bad issues, so good issues must be priced to compensate them), bankers leaving money on the table for their institutional clients, and issuers wanting a successful debut. The average hides huge variation: many IPOs trade below their issue price within a year.",
        ] },
        { kind: "callout", tone: "warning", title: "The grey market premium is not a valuation", text: [
          "The \"GMP\" quoted in Indian media is an unofficial, unregulated price for shares before listing. It reflects short-term sentiment, can be manipulated, and has no legal standing. It tells you about listing-day demand, not about what the business is worth.",
        ] },
      ],
    },
    {
      id: "listed",
      title: "After listing: FPOs, rights issues, QIPs and block deals",
      blocks: [
        { kind: "p", text: "A company that is already listed and needs more equity, or a shareholder who wants to sell, has several routes. Each trades speed against cost and against who gets to participate." },
        { kind: "table", head: ["Route", "What it is", "Who can buy", "Typical use"], rows: [
          ["FPO (follow-on public offer)", "A public offer of new and/or existing shares by a listed company, with a prospectus", "Everyone, with retail reservation", "Large raises needing broad demand (Vodafone Idea's ₹18,000 crore FPO in 2024)"],
          ["Rights issue", "New shares offered to existing shareholders in proportion to their holding, at a discount", "Existing shareholders (rights can be traded)", "Fair to minorities; used by stressed or capital-hungry companies"],
          ["QIP (qualified institutions placement)", "New shares placed with institutions only, priced off a SEBI formula", "QIBs only", "Fast raises by banks and large companies; no prospectus review by SEBI"],
          ["OFS through the stock exchange", "Promoters sell on an exchange window over two days", "Institutions day 1, retail day 2", "Government disinvestment, promoters meeting minimum public shareholding"],
          ["Block deal", "A large trade between a seller and institutions in a special window", "Institutions", "PE funds and promoters selling quickly, usually at a small discount"],
        ] },
        { kind: "h", text: "Rights issue arithmetic" },
        { kind: "formula", expr: "TERP = (N × P + S) / (N + 1)", terms: [["N", "shares you must hold to get one right"], ["P", "share price before the issue (cum-rights)"], ["S", "subscription price of the new share"], ["TERP", "theoretical ex-rights price after the issue"]] },
        { kind: "p", text: `A 1-for-${rights.held} rights issue at ₹${rights.sub} when the share trades at ₹${rights.price}: TERP = (${rights.held} × ${rights.price} + ${rights.sub}) ÷ ${rights.held + 1} = **₹${num(rights.terp, 2)}**. Each right is worth ₹${num(rights.terp, 2)} − ₹${rights.sub} = ₹${num(rights.perRight, 2)}, which is exactly the ₹${num(rights.perOld, 2)} per old share × ${rights.held} that the price falls by. A shareholder who subscribes, or sells the rights, loses nothing; one who ignores the offer loses value. That is why the discount on a rights issue doesn't hurt existing holders the way a discounted placement to outsiders does.` },
        { kind: "callout", tone: "desk", title: "FPOs can fail too", text: [
          "In January 2023 Adani Enterprises' ₹20,000 crore FPO was fully subscribed, but the company withdrew it and returned the money after its share price fell well below the offer price following a short-seller's report. Pricing a follow-on is harder than an IPO: investors can always buy in the market instead, so the offer has to be priced at a discount to where the shares trade.",
        ] },
      ],
    },
    {
      id: "us",
      title: "How the US process differs",
      blocks: [
        { kind: "list", items: [
          "**S-1** registration statement filed with the SEC, often confidentially at first; a roadshow, then pricing the night before trading.",
          "**No retail reservation** and no lottery: underwriters allocate shares at their discretion, mostly to institutions.",
          "**Greenshoe**: underwriters can sell 15% more shares than the base deal and buy them back in the market to support the price, a stabilisation tool rarely used in India.",
          "**Lock-ups**, typically 180 days, stop insiders selling right after the IPO; the lock-up expiry date often moves the price.",
          "**Direct listings and SPACs** are alternatives that skip parts of the traditional underwritten process.",
        ] },
      ],
    },
  ],
  gap: [
    { theory: "IPO price = fair value of the company.", practice: "IPO prices are set by demand in the book, peer multiples and market mood on the day. Bankers often aim for a price that leaves some upside so the issue trades well." },
    { theory: "Oversubscription means a good company.", practice: "Subscription multiples measure demand, partly driven by leverage and listing-gain speculation. Heavily oversubscribed issues have still fallen below issue price within months." },
    { theory: "OFS is a red flag.", practice: "It depends who is selling and why. PE funds must return money to their investors; a parent selling a minority stake in a subsidiary (as Hyundai did) keeps control. Read the shareholding pattern and lock-ins." },
    { theory: "Read the financial statements.", practice: "Professionals read the risk factors, related-party transactions, objects of the offer, litigation and weighted average cost of acquisition before the financials." },
  ],
  mistakes: [
    "Adding OFS proceeds to the company's cash in a post-IPO valuation. OFS money goes to the sellers.",
    "Using pre-issue shares to compute post-issue market cap when there is a fresh issue.",
    "Computing the promoter's post-issue stake on pre-issue shares plus OFS shares instead of post-issue shares.",
    "Treating the grey market premium or subscription numbers as evidence of value.",
    "Comparing an IPO's P/E with peers on different years' earnings.",
  ],
  interview: [
    { q: "What is the difference between a fresh issue and an offer for sale?", a: "A fresh issue creates new shares and the money goes to the company, diluting existing holders. An offer for sale is existing shareholders selling their shares; the company receives nothing and the share count doesn't change." },
    { q: "How would you value a company that is about to IPO?", a: "Mainly with trading comparables on forward multiples, because that is how the market will price it on day one, cross-checked with a DCF. I would compute multiples on the post-issue share count and adjust the balance sheet for fresh-issue proceeds, then compare the price band with peers' multiples and growth." },
    { q: "Why would a listed company choose a QIP over an FPO?", a: "Speed and cost: a QIP goes only to institutions, needs no SEBI review of an offer document and can be done in days, priced off a formula linked to recent market prices. An FPO reaches retail but takes longer and is more exposed to market moves while it is open." },
  ],
  quiz: [
    { q: "In an offer for sale, the IPO proceeds go to:", options: ["The company", "The selling shareholders", "SEBI", "The underwriters"], answer: 1, why: "In an OFS, existing shareholders sell their own shares and receive the money." },
    { q: "A company with 100 crore shares issues 25 crore new shares in an IPO. A founder who held 40% (and sold nothing) now holds:", options: ["40%", "35%", "32%", "30%"], answer: 2, why: "40 crore ÷ 125 crore = 32%." },
    { q: "A 1-for-3 rights issue at ₹50 when the share is ₹90. The TERP is:", options: ["₹70", "₹80", "₹83.33", "₹60"], answer: 1, why: "(3 × 90 + 50) ÷ 4 = 320 ÷ 4 = ₹80." },
    { q: "In India, how soon after an IPO closes must shares list?", options: ["T+1", "T+3", "T+6", "T+10"], answer: 1, why: "Since December 2023, SEBI requires listing on T+3 working days." },
  ],
  apply: {
    problems: ["diluted-shares-tsm", "implied-price-from-multiple", "enterprise-value-bridge"],
    models: ["ipo-fresh-issue-ofs"],
    cases: [{ slug: "hyundai-motor-india-ipo-2024", parts: ["offer-size", "who-gets-cash", "net-to-promoter", "promoter-stake", "mcap-floor", "pe-premium", "offer-structure-model"] }],
    tools: ["comps"],
  },
  glossary: [
    { term: "IPO", definition: "Initial public offering: the first sale of a company's shares to the public, followed by listing on an exchange." },
    { term: "FPO", definition: "Follow-on public offer: a public issue of shares by a company that is already listed." },
    { term: "Offer for sale (OFS)", definition: "Existing shareholders selling their shares in a public offer. The company receives no money." },
    { term: "Fresh issue", definition: "New shares issued by the company in an offer. The company receives the money and existing holders are diluted." },
    { term: "DRHP", definition: "Draft Red Herring Prospectus: the offer document filed with SEBI before an IPO, without the price." },
    { term: "RHP", definition: "Red Herring Prospectus: the offer document with full details except the final price, filed before the issue opens." },
    { term: "Book building", definition: "Price discovery by collecting bids within a price band and setting the final price from demand." },
    { term: "Anchor investor", definition: "A large institution allotted shares one day before an IPO opens, subject to a lock-in." },
    { term: "QIB", definition: "Qualified institutional buyer: mutual funds, insurers, foreign portfolio investors, banks and similar institutions." },
    { term: "QIP", definition: "Qualified institutions placement: a listed company's issue of shares to QIBs only." },
    { term: "Rights issue", definition: "New shares offered to existing shareholders in proportion to their holdings, usually at a discount." },
    { term: "TERP", definition: "Theoretical ex-rights price: the expected share price after a rights issue." },
    { term: "Greenshoe option", definition: "An over-allotment option letting underwriters sell extra shares and stabilise the price after listing." },
    { term: "Lock-in", definition: "A period during which certain shareholders may not sell their shares after an IPO." },
  ],
};
