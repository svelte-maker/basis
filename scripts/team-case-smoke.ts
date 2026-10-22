// End-to-end check of a case worked as a team: two people split the Hyundai IPO case, answer in the browser, and get scored.
// Usage (server running, demo data seeded): BASE_URL=http://localhost:3000 npx tsx --conditions=react-server scripts/team-case-smoke.ts
import { chromium, type Page } from "playwright";
import { PrismaClient } from "@prisma/client";
import { getCase } from "../src/lib/cases";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR;
const SLUG = "hyundai-motor-india-ipo-2024";
const CLAIMS = "section:has(h3:text-is('Parts')) .tparts li";
const db = new PrismaClient();

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
  const c = getCase(SLUG)!;
  const members = await db.user.findMany({ where: { role: "MEMBER" }, skip: 3, take: 2, orderBy: { handle: "asc" } });
  await db.team.deleteMany({ where: { kind: "case", slug: SLUG, members: { some: { userId: { in: members.map((m) => m.id) } } } } });
  await db.caseState.deleteMany({ where: { slug: SLUG, userId: { in: members.map((m) => m.id) } } });
  const before = Object.fromEntries(members.map((m) => [m.id, m.practicePoints]));

  const browser = await chromium.launch();
  try {
    const pages: Page[] = [];
    for (const m of members) {
      const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
      const page = await ctx.newPage();
      page.on("pageerror", (e) => console.log("page error:", e.message));
      await login(page, m.email);
      pages.push(page);
    }
    const [a, b] = pages;

    await a.goto(`${BASE}/cases/${SLUG}`);
    await Promise.all([a.waitForURL(/\/teams\/.+/), a.click("button:has-text('Start a team')")]);
    const teamId = a.url().split("/teams/")[1];
    check(teamId, "case team created from the case page");
    await b.goto(`${BASE}/teams/${teamId}`);
    await b.click("button:has-text('Join this team')");
    await b.waitForSelector("button:has-text('I\\'m done')");
    check(true, "teammate joined");

    // a takes the first half and the model, b the rest
    const half = Math.ceil((c.parts.length - 1) / 2);
    const owner = (i: number) => (c.parts[i].kind === "model" || i < half ? a : b);
    for (let i = 0; i < c.parts.length; i++) {
      const p = owner(i);
      const li = p.locator(CLAIMS, { hasText: c.parts[i].title });
      await li.locator("button:has-text('Claim')").click();
      await li.locator("button:has-text('Release')").waitFor();
    }
    check(true, "parts claimed");
    check(await a.locator(CLAIMS, { hasText: c.parts[0].title }).locator("button:has-text('Check')").count() === 0, "number parts can't be checked before the team finishes");

    const wrongKey = c.parts[half].key; // one of b's number answers
    for (let i = 0; i < c.parts.length; i++) {
      const part = c.parts[i];
      const p = owner(i);
      const li = p.locator(".case-parts li.part", { hasText: part.title });
      if (part.kind === "numeric") await li.locator("input[inputmode=decimal]").fill(part.key === wrongKey ? "1" : String(part.answer));
      else if (part.kind === "choice") await li.locator("input[type=radio]").nth(part.correct).check();
      else {
        for (const [cell, f] of Object.entries(part.model.answer)) {
          const m = /^([A-Z])(\d+)$/.exec(cell)!;
          await li.locator(`table.sheet tbody tr:nth-child(${m[2]}) td:nth-child(${m[1].charCodeAt(0) - 63})`).click();
          await p.keyboard.type(f);
          await p.keyboard.press("Enter");
        }
      }
      await p.waitForTimeout(150);
    }
    await a.waitForTimeout(2500);

    // b can't answer a's part
    const disabled = await b.locator(".case-parts li.part", { hasText: c.parts[0].title }).locator("input").first().isDisabled();
    check(disabled, "a teammate's answer box is read-only");

    const model = c.parts.find((p) => p.kind === "model")!;
    await a.locator(CLAIMS, { hasText: model.title }).locator("button:has-text('Check')").click();
    await a.locator(".case-parts li.part", { hasText: model.title }).locator("text=checks pass").waitFor();
    check(await a.locator(".case-parts li.part", { hasText: model.title }).locator("text=/\\d+\\/\\d+ checks pass\\./").count(), "the model part passes its check");

    await b.waitForTimeout(6000);
    const seen = await b.locator(".case-parts li.part", { hasText: c.parts[0].title }).locator("input").first().inputValue();
    check(seen === String(c.parts[0].kind === "numeric" ? c.parts[0].answer : ""), `b sees a's answer (${seen})`);
    if (SHOTS) await b.screenshot({ path: `${SHOTS}/case-team-01-working.png`, fullPage: true });

    for (const p of pages) { await p.click("button:has-text('I\\'m done')"); await p.waitForTimeout(800); }
    await a.reload();
    await a.locator("h3:has-text('Result')").waitFor();
    if (SHOTS) await a.screenshot({ path: `${SHOTS}/case-team-02-result.png`, fullPage: true });

    const team = await db.team.findUniqueOrThrow({ where: { id: teamId }, include: { members: true, parts: true } });
    check(team.finalizedAt, "team finalized when both marked done");
    check(team.parts.find((p) => p.key === wrongKey)?.score === 0, "the wrong answer scores zero");
    check(team.parts.filter((p) => p.key !== wrongKey).every((p) => p.score === 1), "every other part scores full marks");
    const pts = Object.fromEntries(team.members.map((m) => [m.userId, m.points]));
    console.log("    points", members.map((m) => `${m.handle} +${pts[m.id]}`).join(", "));
    check(pts[members[0].id] > 0 && pts[members[1].id] > 0, "both earn points");
    const after = await db.user.findMany({ where: { id: { in: members.map((m) => m.id) } } });
    for (const u of after) check(u.practicePoints === before[u.id] + pts[u.id], `${u.handle} practice points +${pts[u.id]}`);
    check(await a.locator(".solution").count() >= c.parts.length, "answers and worked solutions are shown after the team finishes");
    console.log("\nCase team smoke test passed.");
  } finally {
    await browser.close();
    await db.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
