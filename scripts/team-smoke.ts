// End-to-end check of team builds: three people split the DCF, build their parts in the browser, and get scored.
// Usage (server running, demo data seeded): BASE_URL=http://localhost:3000 npx tsx --conditions=react-server scripts/team-smoke.ts
import { chromium, type Page } from "playwright";
import { PrismaClient } from "@prisma/client";
import { instantiateModel } from "../src/lib/models";
import { partOfCell, teamInstance, TEAM_SPLITS } from "../src/lib/teams";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR;
const SLUG = "five-year-dcf";
const PART_LI = "section:has(h3:text-is('Parts')) .tparts li";
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

/** Type into a cell the way a person would: click it, type, press Enter. */
async function typeCell(page: Page, a: string, text: string) {
  const m = /^([A-Z])(\d+)$/.exec(a)!;
  const col = m[1].charCodeAt(0) - 64, row = Number(m[2]);
  await page.click(`table.sheet tbody tr:nth-child(${row}) td:nth-child(${col + 1})`);
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
}

async function main() {
  const members = await db.user.findMany({ where: { role: "MEMBER" }, take: 3, orderBy: { handle: "asc" } });
  await db.team.deleteMany({ where: { slug: SLUG, members: { some: { userId: { in: members.map((m) => m.id) } } } } });
  await db.modelState.deleteMany({ where: { slug: SLUG, userId: { in: members.map((m) => m.id) } } });
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
    const [a, b, c] = pages;

    await a.goto(`${BASE}/models/${SLUG}`);
    await Promise.all([a.waitForURL(/\/teams\/.+/), a.click("button:has-text('Start a team')")]);
    const teamId = a.url().split("/teams/")[1];
    check(teamId, `team created (${teamId})`);
    if (SHOTS) await a.screenshot({ path: `${SHOTS}/team-01-new.png` });

    for (const p of [b, c]) {
      await p.goto(`${BASE}/teams/${teamId}`);
      await p.click("button:has-text('Join this team')");
      await p.waitForSelector("button:has-text('I\\'m done')");
    }
    check(true, "two teammates joined from the invite link");

    const parts = TEAM_SPLITS[SLUG];
    const claim = async (p: Page, title: string) => {
      const li = p.locator(PART_LI, { hasText: title });
      await li.locator("button:has-text('Claim')").click();
      await li.locator("button:has-text('Release')").waitFor();
    };
    await claim(a, parts[0].title);
    await claim(b, parts[1].title);
    await claim(c, parts[2].title);
    check(true, "each teammate claimed a part");

    const extra = await b.locator(PART_LI, { hasText: parts[0].title }).locator("button:has-text('Claim')").count();
    check(extra === 0, "a part someone holds can't be claimed by a teammate");

    const inst = teamInstance(instantiateModel(SLUG, `team:${teamId}`), parts);
    const byPart = (k: string) => Object.entries(inst.answer).filter(([cell]) => partOfCell(parts, cell)!.key === k);
    // Forecast: one deliberate mistake in year 1 revenue, which flows into every later cell of the integrated model
    for (const [cell, f] of byPart("forecast")) await typeCell(a, cell, cell === "C16" ? "=B16*1.5" : f);
    for (const [cell, f] of byPart("fcf")) await typeCell(b, cell, f);
    for (const [cell, f] of byPart("valuation")) await typeCell(c, cell, f);
    await a.waitForTimeout(2500);

    // b tries to type in a's part: the sheet must not accept it
    await typeCell(b, "D17", "=999");
    await b.waitForTimeout(1500);
    const d17 = await db.teamCell.findUnique({ where: { teamId_addr: { teamId, addr: "D17" } } });
    check(d17 && d17.value !== "=999" && d17.authorId === members[0].id, "a teammate can't overwrite another person's part");

    // Teammates' work appears on each sheet
    await c.waitForTimeout(6000);
    const cellText = await c.locator("table.sheet tbody tr:nth-child(23) td:nth-child(4)").innerText();
    check(cellText.trim() !== "", `c sees b's free cash flow (${cellText.trim()})`);

    for (const [p, k] of [[a, parts[0].title], [b, parts[1].title], [c, parts[2].title]] as const) {
      await p.locator(PART_LI, { hasText: k }).locator("button:has-text('Check')").click();
      await p.locator(PART_LI, { hasText: k }).locator("text=checks pass").waitFor();
    }
    const txt = async (p: Page, k: string) => p.locator(PART_LI, { hasText: k }).innerText();
    check(!(await txt(a, parts[0].title)).includes("Done."), "the forecast with a mistake doesn't pass");
    check((await txt(b, parts[1].title)).includes("Done."), "free cash flow passes despite the upstream mistake");
    check((await txt(c, parts[2].title)).includes("Done."), "valuation passes despite the upstream mistake");
    if (SHOTS) await c.screenshot({ path: `${SHOTS}/team-02-building.png`, fullPage: true });

    for (const p of pages) { await p.click("button:has-text('I\\'m done')"); await p.waitForTimeout(800); }
    await c.reload();
    await c.locator("h3:has-text('Result')").waitFor();
    if (SHOTS) await c.screenshot({ path: `${SHOTS}/team-03-result.png`, fullPage: true });

    const team = await db.team.findUniqueOrThrow({ where: { id: teamId }, include: { members: true, parts: true } });
    check(team.finalizedAt, "team finalized when everyone marked done");
    const pts = Object.fromEntries(team.members.map((m) => [m.userId, m.points]));
    console.log("    points", members.map((m) => `${m.handle} +${pts[m.id]}`).join(", "), "parts", team.parts.map((p) => `${p.key} ${p.score}`).join(", "));
    check(pts[members[0].id] < pts[members[2].id], "the teammate with a mistake earns less than one without");
    check(pts[members[1].id] > 0 && pts[members[2].id] > 0, "correct parts earn points");
    const after = await db.user.findMany({ where: { id: { in: members.map((m) => m.id) } } });
    for (const u of after) check(u.practicePoints === before[u.id] + pts[u.id], `${u.handle} practice points +${pts[u.id]}`);

    await a.goto(`${BASE}/u/${members[2].handle}`);
    check(await a.locator("h2:has-text('Team work')").count(), "profile lists team builds");
    if (SHOTS) await a.screenshot({ path: `${SHOTS}/team-04-profile.png`, fullPage: true });

    await a.goto(`${BASE}/teams`);
    check(await a.locator("text=Your teams").count(), "teams page loads");
    console.log("\nTeam smoke test passed.");
  } finally {
    await browser.close();
    await db.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
