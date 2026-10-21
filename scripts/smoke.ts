// End-to-end smoke test against a running server with seeded demo data.
// Usage: BASE_URL=http://localhost:3000 npx tsx --conditions=react-server scripts/smoke.ts
import { chromium, type Page } from "playwright";
import { PrismaClient } from "@prisma/client";
import { instantiate, practiceSeed, contestSeed } from "../src/lib/problems";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR;
const db = new PrismaClient();
const errors: string[] = [];
let step = 0;

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${String(++step).padStart(2, "0")}-${name}.png`, fullPage: false });
}
function check(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAILED: ${msg}`);
  console.log(`ok  ${msg}`);
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`);
  await page.fill("#email", email);
  await page.fill("#password", "basis-demo");
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click("button:has-text('Log in')")]);
}

async function main() {
  const browser = await chromium.launch();
  try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  // External fonts are irrelevant to behaviour and can stall in sandboxes
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  ctx.setDefaultTimeout(20_000);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror on ${page.url()}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

  await page.goto(BASE);
  check(await page.isVisible("text=Prove what you can do in finance"), "home page renders");
  await shot(page, "home");

  await login(page, "aarav@demo.basis");
  const aarav = await db.user.findUniqueOrThrow({ where: { email: "aarav@demo.basis" } });

  // Practice: wrong then right answer on an unsolved problem
  const solved = new Set((await db.practiceState.findMany({ where: { userId: aarav.id, everSolved: true } })).map((s) => s.slug));
  const slug = ["project-npv", "wacc", "bond-price", "capm-cost-of-equity", "lbo-exit-returns", "put-call-parity", "fifo-vs-lifo"].find((s) => !solved.has(s))!;
  await page.goto(`${BASE}/problems/${slug}`);
  const state = await db.practiceState.findUniqueOrThrow({ where: { userId_slug: { userId: aarav.id, slug } } });
  const inst = instantiate(slug, practiceSeed(aarav.id, slug, state.variant));
  await page.fill("#answer", String(inst.answer * 1.5 + 7));
  await page.click("button:has-text('Submit')");
  await page.waitForSelector("text=Not quite");
  check(true, `wrong answer rejected on ${slug}`);
  await page.fill("#answer", inst.answer.toFixed(4));
  await page.click("button:has-text('Submit')");
  await page.waitForSelector("text=Correct.");
  check(await page.isVisible("text=Worked solution"), "correct answer accepted and solution shown");
  await shot(page, "problem-solved");

  // Live contest: register, solve one, see standings
  const live = await db.contest.findUniqueOrThrow({ where: { slug: "weekly-valuation-sprint-42" } });
  await page.goto(`${BASE}/contests/${live.slug}`);
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await page.locator("h2", { hasText: "Problems" }).waitFor();
  const cslug = "wacc";
  const cinst = instantiate(cslug, contestSeed(live.id, aarav.id, cslug));
  const article = page.locator("article", { hasText: "Weighted average cost of capital" });
  await article.locator("input[name=answer]").fill(cinst.answer.toFixed(3));
  await article.locator("button:has-text('Submit')").click();
  await article.locator("text=Solved for").waitFor();
  check(true, "contest answer scored");
  await page.reload();
  check(await page.isVisible("text=Live standings"), "live standings visible");
  await shot(page, "contest-live");

  // Profile and credential
  await page.goto(`${BASE}/u/aarav`);
  check(await page.isVisible("text=Resume credential"), "own profile shows resume credential");
  await shot(page, "profile");
  await page.goto(`${BASE}/verify/${aarav.credentialId}`);
  check(await page.isVisible("text=Verified by Basis"), "verification page works");
  await shot(page, "verify");

  // Community: post and comment
  await page.goto(`${BASE}/community`);
  await page.fill("#title", "My first DCF: a mid-cap Indian FMCG company");
  await page.fill("#body", "Five-year forecast with 9% revenue growth fading to 5%, WACC 11.5%. Feedback welcome on the terminal growth.");
  await Promise.all([page.waitForURL(/\/community\/.+/), page.click("button:has-text('Post')")]);
  await page.fill("#comment", "Adding the model link once I've cleaned it up.");
  await page.click("button:has-text('Comment')");
  await page.waitForSelector("text=Adding the model link");
  check(true, "post and comment created");
  await page.goto(`${BASE}/community`);
  await shot(page, "community");

  // Members can't open recruiter search
  await page.goto(`${BASE}/recruiters`);
  check(!page.url().includes("/recruiters"), "members are kept out of recruiter search");

  // Tools
  for (const t of ["dcf", "lbo", "wacc", "comps", "bond", "options", "tvm", "loan", "ratios", "risk"]) {
    await page.goto(`${BASE}/tools/${t}`);
    check(await page.locator(".kpis, .panel.card h3, table.mini").first().isVisible(), `tool ${t} renders results`);
    if (t === "dcf" || t === "lbo") await shot(page, `tool-${t}`);
  }
  await page.goto(`${BASE}/tools/dcf`);
  const before = await page.locator(".kpi").nth(2).innerText();
  await page.fill("#wacc", "11");
  const after = await page.locator(".kpi").nth(2).innerText();
  check(before !== after, "DCF recalculates when WACC changes");

  // Recruiter flow
  await page.click("button:has-text('Log out')");
  await login(page, "recruiter@demo.basis");
  await page.goto(`${BASE}/recruiters?minGrade=A`);
  check(await page.locator("table.data tbody tr").count() > 0, "recruiter search returns A-or-better candidates");
  await shot(page, "recruiters");
  const res = await page.request.get(`${BASE}/recruiters/shortlist/export`);
  check(res.ok() && (await res.text()).includes("Verify link"), "shortlist CSV export works");

  // Leaderboard and contests list
  await page.goto(`${BASE}/leaderboard`);
  check(await page.locator("table.data tbody tr").count() >= 10, "leaderboard lists rated members");
  await shot(page, "leaderboard");

  // Mobile layout
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const mobile = await mctx.newPage();
  await mobile.goto(`${BASE}/problems/wacc`);
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 1, "no horizontal scroll on a phone");
  if (SHOTS) await mobile.screenshot({ path: `${SHOTS}/99-mobile.png` });

  } finally {
    await browser.close();
  }
  const real = errors.filter((e) => !/fonts\.(googleapis|gstatic)|ERR_FAILED|net::/.test(e));
  if (real.length) { console.log(real.join("\n")); throw new Error(`${real.length} browser errors`); }
  console.log("\nAll smoke checks passed.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
