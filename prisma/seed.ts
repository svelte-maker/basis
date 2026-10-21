// Demo data. Run with: npm run db:seed (needs the react-server condition for server-only modules).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TEMPLATES, contestSeed, instantiate, getTemplate } from "../src/lib/problems";
import { seeded } from "../src/lib/problems/rng";
import { newCredentialId } from "../src/lib/credential";
import { finalizeIfEnded } from "../src/lib/services/contests";
import { basisRating } from "../src/lib/rating/grades";

const db = new PrismaClient();
const rng = seeded("basis-seed-v1");
const rand = (a: number, b: number) => a + rng() * (b - a);
const pickN = <T,>(xs: T[], n: number) => [...xs].sort(() => rng() - 0.5).slice(0, n);
const DAY = 86_400_000;
const now = Date.now();

const PEOPLE: [string, string, string, string, number][] = [
  ["Aarav Shah", "aarav", "Final-year commerce student, targeting equity research", "Mumbai", 0.55],
  ["Priya Nair", "priya-n", "Equity research associate, consumer sector", "Bengaluru", 0.82],
  ["Daniel Okafor", "daniel-o", "Private equity associate", "London", 0.93],
  ["Lena Kraus", "lena-k", "Fixed income analyst", "Frankfurt", 0.85],
  ["Tomás Romero", "tomas-r", "Corporate development analyst", "Madrid", 0.74],
  ["Aisha Bello", "aisha-b", "Audit senior, CFA Level II candidate", "Dubai", 0.7],
  ["Jordan Park", "jordan-p", "Derivatives trading intern", "Toronto", 0.77],
  ["Mei Lin", "mei-l", "MSc Finance student", "Singapore", 0.6],
  ["Kofi Asante", "kofi-a", "Credit analyst, SME lending", "Accra", 0.58],
  ["Sofia Rossi", "sofia-r", "Investment banking analyst, TMT", "Milan", 0.8],
  ["Rahul Verma", "rahul-v", "FP&A analyst", "Gurugram", 0.52],
  ["Hannah Weiss", "hannah-w", "Risk analyst, market risk", "Zurich", 0.79],
  ["Diego Alvarez", "diego-a", "Valuation consultant", "Mexico City", 0.72],
  ["Yuki Tanaka", "yuki-t", "Quant research intern", "Tokyo", 0.88],
  ["Fatima Zahra", "fatima-z", "Treasury analyst", "Casablanca", 0.5],
  ["Noah Becker", "noah-b", "Undergraduate, economics", "Berlin", 0.42],
  ["Ananya Iyer", "ananya-i", "Chartered accountant", "Chennai", 0.66],
  ["Liam O'Connor", "liam-o", "Leveraged finance analyst", "Dublin", 0.76],
  ["Chloe Martin", "chloe-m", "Asset management analyst", "Paris", 0.63],
  ["Samuel Mensah", "samuel-m", "Banking operations, moving into credit", "Lagos", 0.45],
  ["Isabella Costa", "isabella-c", "Restructuring associate", "São Paulo", 0.84],
  ["Arjun Mehta", "arjun-m", "MBA candidate, finance", "Ahmedabad", 0.57],
  ["Grace Kim", "grace-k", "Portfolio analyst, multi-asset", "Seoul", 0.71],
  ["Omar Haddad", "omar-h", "Corporate banker", "Riyadh", 0.61],
  ["Emily Clarke", "emily-c", "Graduate trainee, transaction services", "Manchester", 0.48],
  ["Vikram Rao", "vikram-r", "Equity analyst, banks and NBFCs", "Hyderabad", 0.69],
  ["Zoe Laurent", "zoe-l", "Sustainable finance analyst", "Brussels", 0.56],
  ["Ethan Wright", "ethan-w", "Hedge fund analyst, event-driven", "New York", 0.9],
  ["Nadia Petrova", "nadia-p", "Credit risk modeller", "Warsaw", 0.74],
  ["Lucas Silva", "lucas-s", "Self-taught, career switcher from engineering", "Lisbon", 0.53],
];

async function main() {
  await db.$transaction([db.vote.deleteMany(), db.comment.deleteMany(), db.post.deleteMany(), db.shortlist.deleteMany(), db.submission.deleteMany(), db.contestEntry.deleteMany(), db.contest.deleteMany(), db.ratingEvent.deleteMany(), db.practiceState.deleteMany(), db.user.deleteMany()]);
  const passwordHash = await bcrypt.hash("basis-demo", 10);

  await db.user.create({ data: { name: "Basis Admin", handle: "admin", email: "admin@demo.basis", passwordHash, role: "ADMIN", credentialId: newCredentialId(), openToWork: false } });
  const recruiter = await db.user.create({ data: { name: "Maya Fernandes", handle: "maya-recruits", email: "recruiter@demo.basis", passwordHash, role: "RECRUITER", company: "Northbridge Capital", credentialId: newCredentialId(), openToWork: false } });

  const members: { u: Awaited<ReturnType<typeof db.user.create>>; skill: number }[] = [];
  for (const [name, handle, headline, location, skill] of PEOPLE) {
    const u = await db.user.create({ data: {
      name, handle, headline, location, passwordHash, credentialId: newCredentialId(), openToWork: rng() < 0.8,
      email: handle === "aarav" ? "aarav@demo.basis" : `${handle}@demo.basis`,
      bio: handle === "aarav" ? "Building valuation skills one problem at a time. Interested in consumer and retail coverage." : "",
      createdAt: new Date(now - rand(120, 200) * DAY),
    } });
    members.push({ u, skill });
  }

  // Practice history, dated before the contests so the rating chart reads in order
  for (const { u, skill } of members) {
    const count = Math.round(TEMPLATES.length * Math.min(0.9, skill * rand(0.3, 0.9)));
    const solved = pickN(TEMPLATES, count);
    let practice = 0;
    for (const [i, t] of solved.entries()) {
      const at = new Date(now - (110 - (i / Math.max(1, count)) * 20) * DAY);
      await db.practiceState.create({ data: { userId: u.id, slug: t.slug, solved: true, everSolved: true, solvedAt: at, attempts: 1 + Math.floor(rng() * 3) } });
      const pts = { Easy: 2, Medium: 5, Hard: 10 }[t.difficulty];
      const before = basisRating(1200, practice);
      practice += pts;
      const after = basisRating(1200, practice);
      if (after !== before) await db.ratingEvent.create({ data: { userId: u.id, kind: "practice", delta: after - before, ratingAfter: after, note: `Solved ${t.title}`, createdAt: at } });
    }
    await db.user.update({ where: { id: u.id }, data: { practicePoints: practice } });
  }

  // Past contests: simulated submissions, then finalized through the real rating code
  const pastTitles = ["Weekly Valuation Sprint #38", "Accounting Blitz #8", "Weekly Valuation Sprint #39", "Fixed Income Round #15", "Accounting Blitz #9", "Weekly Valuation Sprint #40", "Fixed Income Round #16", "Weekly Valuation Sprint #41"];
  for (const [k, title] of pastTitles.entries()) {
    const startsAt = new Date(now - (84 - k * 10) * DAY);
    const endsAt = new Date(startsAt.getTime() + 75 * 60_000);
    const problems = [...pickN(TEMPLATES.filter((t) => t.difficulty === "Easy"), 2), ...pickN(TEMPLATES.filter((t) => t.difficulty === "Medium"), 2), ...pickN(TEMPLATES.filter((t) => t.difficulty === "Hard"), 1)].map((t) => t.slug);
    const c = await db.contest.create({ data: { slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""), title, startsAt, endsAt, rated: true, problemSlugs: JSON.stringify(problems), description: "Five problems, 75 minutes." } });
    const field = members.filter((m) => m.u.handle === "aarav" ? k >= 3 : rng() < 0.75);
    for (const { u, skill } of field) {
      await db.contestEntry.create({ data: { contestId: c.id, userId: u.id, registeredAt: new Date(startsAt.getTime() - DAY) } });
      let minute = Math.floor(rand(3, 10));
      let submitted = false;
      for (const slug of problems) {
        const diff = getTemplate(slug)!.difficulty;
        const p = Math.min(0.97, skill * (diff === "Easy" ? 1.25 : diff === "Medium" ? 0.95 : 0.65) + rand(-0.15, 0.15));
        const seed = contestSeed(c.id, u.id, slug);
        const answer = instantiate(slug, seed).answer;
        const wrong = rng() < 1 - skill ? Math.floor(rand(1, 3)) : 0;
        for (let w = 0; w < wrong && minute < 74; w++) {
          minute += Math.floor(rand(2, 6));
          await db.submission.create({ data: { userId: u.id, slug, seed, input: String((answer * 1.1).toFixed(2)), correct: false, contestId: c.id, createdAt: new Date(startsAt.getTime() + minute * 60_000) } });
          submitted = true;
        }
        if (rng() < p) {
          minute += Math.floor(rand(4, 16) * (1.3 - skill));
          if (minute >= 75) break;
          await db.submission.create({ data: { userId: u.id, slug, seed, input: String(answer.toFixed(2)), correct: true, contestId: c.id, createdAt: new Date(startsAt.getTime() + minute * 60_000) } });
          submitted = true;
        }
      }
      if (!submitted) await db.contestEntry.delete({ where: { contestId_userId: { contestId: c.id, userId: u.id } } });
    }
    await finalizeIfEnded(c.id);
  }

  // A live contest and two upcoming ones
  const live = await db.contest.create({ data: { slug: "weekly-valuation-sprint-42", title: "Weekly Valuation Sprint #42", description: "Five problems across valuation and corporate finance. Join any time before the end.", startsAt: new Date(now - 15 * 60_000), endsAt: new Date(now + 60 * 60_000), rated: true, problemSlugs: JSON.stringify(["capm-cost-of-equity", "enterprise-value-bridge", "wacc", "implied-price-from-multiple", "unlever-relever-beta"]) } });
  for (const { u, skill } of members.filter((m) => m.u.handle !== "aarav" && rng() < 0.6)) {
    await db.contestEntry.create({ data: { contestId: live.id, userId: u.id } });
    const slug = "capm-cost-of-equity";
    if (rng() < skill) {
      const seed = contestSeed(live.id, u.id, slug);
      await db.submission.create({ data: { userId: u.id, slug, seed, input: "x", correct: true, contestId: live.id, createdAt: new Date(now - Math.floor(rand(1, 12)) * 60_000) } });
    }
  }
  const next = new Date(now + 2 * DAY); next.setUTCHours(15, 0, 0, 0);
  await db.contest.create({ data: { slug: "fixed-income-round-17", title: "Fixed Income Round #17", description: "Bond pricing, duration, curves and credit.", startsAt: next, endsAt: new Date(next.getTime() + 60 * 60_000), rated: true, problemSlugs: JSON.stringify(["bond-price", "current-yield", "macaulay-duration", "implied-forward-rate", "yield-to-maturity"]) } });
  const later = new Date(now + 6 * DAY); later.setUTCHours(14, 0, 0, 0);
  await db.contest.create({ data: { slug: "deals-and-derivatives-1", title: "Deals and Derivatives #1", description: "M&A, LBOs and option pricing.", startsAt: later, endsAt: new Date(later.getTime() + 90 * 60_000), rated: true, problemSlugs: JSON.stringify(["lbo-sources-and-uses", "put-call-parity", "eps-accretion-dilution", "lbo-exit-returns", "black-scholes-call"]) } });

  // Community
  const by = (h: string) => members.find((m) => m.u.handle === h)!.u;
  const posts = [
    ["priya-n", "Model", "Valuation", "Airline DCF with fuel-hedge scenarios (open template)", "Three-statement model for a mid-cap carrier with a jet fuel sensitivity tab. Revenue is built from ASKs × load factor × yield. I'd like feedback on how I handled operating leases after IFRS 16: I've treated lease liabilities as debt and added back the depreciation of right-of-use assets to EBITDA.", 9],
    ["daniel-o", "Case write-up", "Private Equity", "Why I'd pass on the SaaS LBO from Sprint #41, problem 5", "The 7x leverage only works if net revenue retention stays above 115%. At 105% NRR, EBITDA growth halves and the sweep can't get leverage below 5x by year 5. Downside case and covenant maths below.\n\nKey point: with a 10x exit, multiple expansion was doing most of the work in the base case.", 6],
    ["mei-l", "Question", "Valuation", "Stock-based comp in unlevered free cash flow: add back or not?", "I see banks do both. What do people use in interviews versus real valuation work? If you add it back, aren't you double counting when you also use diluted shares?", 3],
    ["tomas-r", "Research", "Banking & Credit", "Yield curve inversion and bank NIM: a 30-year look", "I charted net interest margin for the 20 largest US banks against the 2s10s spread. The lag is longer than most people assume: NIM compression shows up 4 to 6 quarters after inversion, because asset yields reprice faster than deposits only once deposit betas catch up.", 5],
    ["lena-k", "Model", "Fixed Income", "Bootstrapping a zero curve from par yields, step by step", "Spreadsheet that bootstraps annual zero rates from a par curve and then prices off-the-run bonds against it. Includes a check that the par bonds reprice exactly to 100.", 4],
    ["yuki-t", "Research", "Derivatives", "When is early exercise of an American call ever optimal?", "Short answer: only just before an ex-dividend date, when the dividend exceeds the remaining time value of the strike. I built a 500-step binomial tree to show where the boundary sits for a few dividend sizes.", 4],
    ["aisha-b", "Question", "Accounting", "Working capital changes in the cash flow statement: sign conventions trip me up", "An increase in receivables reduces cash, but an increase in payables increases it. Is there a simple mental model people use under exam pressure?", 2],
  ] as const;
  for (const [i, [h, kind, track, title, body, comments]] of posts.entries()) {
    const author = by(h);
    const post = await db.post.create({ data: { authorId: author.id, kind, track, title, body, createdAt: new Date(now - (i * 1.7 + 0.3) * DAY) } });
    const voters = pickN(members.filter((m) => m.u.id !== author.id), Math.floor(rand(4, 22)));
    for (const v of voters) await db.vote.create({ data: { userId: v.u.id, postId: post.id } });
    await db.post.update({ where: { id: post.id }, data: { score: voters.length } });
    const replies = ["Really clear, thanks for sharing.", "I'd sanity-check the terminal growth against nominal GDP.", "Same question came up in my superday.", "Think of the balance sheet: if an operating asset grows, cash funded it.", "Nice. Did you test the result against a simpler method?", "Saving this for interview prep.", "Have you tried a tornado chart for the key drivers?", "Good point on leases, most comps sets mix pre- and post-IFRS 16 numbers.", "Your sweep assumption looks aggressive for year 1."];
    for (let k = 0; k < comments; k++) {
      const a = members[Math.floor(rng() * members.length)].u;
      await db.comment.create({ data: { postId: post.id, authorId: a.id, body: replies[Math.floor(rng() * replies.length)], createdAt: new Date(post.createdAt.getTime() + (k + 1) * 3_600_000) } });
    }
  }

  await db.shortlist.create({ data: { recruiterId: recruiter.id, candidateId: by("daniel-o").id, note: "Strong LBO write-up. Schedule first call." } });
  await db.shortlist.create({ data: { recruiterId: recruiter.id, candidateId: by("lena-k").id, note: "" } });

  const top = await db.user.findMany({ where: { role: "MEMBER" }, orderBy: { glickoRating: "desc" }, take: 3 });
  console.log(`Seeded ${members.length} members, ${pastTitles.length + 3} contests, ${posts.length} posts. Top: ${top.map((u) => `${u.name} ${Math.round(u.glickoRating)}`).join(", ")}`);
}

main().finally(() => db.$disconnect());
