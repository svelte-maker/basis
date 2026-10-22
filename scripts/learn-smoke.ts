// Browser check of the Learn section: every lesson renders, the quiz and live sheets work, and
// practice pages link back to lessons. Run against a started server: npx tsx scripts/learn-smoke.ts
import { chromium, type Page } from "playwright";
import { LESSONS } from "../src/lib/learn";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS;

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(`${BASE}/learn`);
  await page.getByRole("heading", { name: /Finance as it is practised/ }).waitFor();
  await shot(page, "01-learn-index");

  for (const l of LESSONS) {
    const res = await page.goto(`${BASE}/learn/${l.slug}`);
    if (!res?.ok()) throw new Error(`${l.slug}: HTTP ${res?.status()}`);
    await page.getByRole("heading", { level: 1, name: l.title }).waitFor();
    await page.locator("#gap").waitFor();
  }

  // Quiz: answer every question correctly and see the lesson marked complete
  const tvm = LESSONS.find((l) => l.slug === "time-value-of-money")!;
  await page.goto(`${BASE}/learn/${tvm.slug}`);
  await shot(page, "02-lesson-top");
  for (let i = 0; i < tvm.quiz.length; i++) {
    await page.locator(".quiz-q").nth(i).locator("label.option").nth(tvm.quiz[i].answer).click();
  }
  await page.getByText("Lesson complete").waitFor();
  await page.locator("#check").scrollIntoViewIfNeeded();
  await shot(page, "03-quiz");
  await page.goto(`${BASE}/learn`);
  await page.locator(`a[href="/learn/${tvm.slug}"] .tick.done`).waitFor();

  // Live sheet: change an input, then rebuild a formula in "Try it yourself"
  await page.goto(`${BASE}/learn/excel-for-finance`);
  const sheet = page.locator(".live-sheet").first();
  await sheet.scrollIntoViewIfNeeded();
  await shot(page, "04-live-sheet");
  await sheet.getByRole("button", { name: "Try it yourself" }).click();
  await sheet.getByText("0/5 cells correct").waitFor();
  const cell = sheet.locator("table.sheet tbody tr").nth(4).locator("td").nth(1); // B5
  await cell.dblclick();
  await page.keyboard.type("=PMT(B2/12,B3*12,-B1)");
  await page.keyboard.press("Enter");
  await sheet.getByText("1/5 cells correct").waitFor();
  await shot(page, "05-try-it");

  // Practice pages link back
  await page.goto(`${BASE}/problems/wacc`);
  await page.locator(".learn-link a[href='/learn/cost-of-capital-wacc']").waitFor();
  await page.goto(`${BASE}/cases/hyundai-motor-india-ipo-2024`);
  await page.locator(".learn-link a[href='/learn/ipo-and-fpo']").waitFor();
  await page.goto(`${BASE}/learn/ipo-and-fpo`);
  await page.locator("#apply").scrollIntoViewIfNeeded();
  await shot(page, "06-apply");
  await page.goto(`${BASE}/learn/glossary`);
  await shot(page, "07-glossary");

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/learn/dcf-valuation`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`Horizontal scroll on mobile: ${overflow}px`);
  await shot(page, "08-mobile");

  if (errors.length) throw new Error("Browser errors:\n" + errors.join("\n"));
  await browser.close();
  console.log(`Learn smoke test passed: ${LESSONS.length} lessons`);
}

main().catch((e) => { console.error(e); process.exit(1); });
