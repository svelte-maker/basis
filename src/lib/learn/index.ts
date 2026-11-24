import { capitalBudgeting, timeValueOfMoney } from "./lessons/foundations";
import { depreciationInventory, ratioAnalysis, threeStatements, workingCapital } from "./lessons/accounting";
import { costOfCapital, dcfValuation, dividendDiscount, freeCashFlow, multiplesEv } from "./lessons/valuation";
import { excelForFinance, modellingPrinciples } from "./lessons/modelling";
import { ipoFpo } from "./lessons/capitalMarkets";
import { leveragedBuyouts, mergers } from "./lessons/deals";
import { bonds, creditAnalysis, optionsForwards, portfolioRisk } from "./lessons/markets";
import { swapsFras } from "./lessons/rates";
import type { Lesson, LessonBlock, Module, ModuleKey } from "./types";

export * from "./types";

/** The curriculum, in the order a newcomer should take it. */
export const MODULES: Module[] = [
  { key: "foundations", title: "Foundations", blurb: "The time value of money and the decision rules every other topic is built on." },
  { key: "accounting", title: "Accounting and financial statements", blurb: "Read the three statements, follow cash through a business and judge it with ratios." },
  { key: "valuation", title: "Valuation", blurb: "Cost of capital, free cash flow, DCF, multiples and dividend models." },
  { key: "modelling", title: "Financial modelling and Excel", blurb: "Build models people can trust, with the Excel functions that do the real work." },
  { key: "capital-markets", title: "Capital markets: IPOs and FPOs", blurb: "How companies raise money from the public, priced and read the way deal teams do." },
  { key: "deals", title: "Deals: M&A and private equity", blurb: "Accretion, dilution, synergies, and how leveraged buyouts make their returns." },
  { key: "fixed-income", title: "Fixed income", blurb: "Bond pricing, yields, duration and the yield curve." },
  { key: "derivatives", title: "Derivatives", blurb: "Forwards, futures and options: payoffs, no-arbitrage pricing and the Greeks." },
  { key: "risk", title: "Portfolio and risk", blurb: "Diversification, risk-adjusted performance and value at risk." },
  { key: "credit", title: "Banking and credit", blurb: "How lenders assess, structure, price and provision for loans." },
];

export const LESSONS: Lesson[] = [
  timeValueOfMoney, capitalBudgeting,
  threeStatements, workingCapital, depreciationInventory, ratioAnalysis,
  costOfCapital, freeCashFlow, dcfValuation, multiplesEv, dividendDiscount,
  excelForFinance, modellingPrinciples,
  ipoFpo,
  mergers, leveragedBuyouts,
  bonds, swapsFras, optionsForwards, portfolioRisk, creditAnalysis,
];

const bySlug = new Map(LESSONS.map((l) => [l.slug, l]));
if (bySlug.size !== LESSONS.length) throw new Error("Duplicate lesson slug");

export function getLesson(slug: string): Lesson | undefined {
  return bySlug.get(slug);
}

export function moduleOf(key: ModuleKey): Module {
  return MODULES.find((m) => m.key === key)!;
}

export function lessonsIn(key: ModuleKey): Lesson[] {
  return LESSONS.filter((l) => l.module === key);
}

/** Lessons in curriculum order: by module, then as listed. */
export const ORDERED: Lesson[] = MODULES.flatMap((m) => lessonsIn(m.key));

export function neighbours(slug: string): { prev?: Lesson; next?: Lesson } {
  const i = ORDERED.findIndex((l) => l.slug === slug);
  return { prev: i > 0 ? ORDERED[i - 1] : undefined, next: i >= 0 && i < ORDERED.length - 1 ? ORDERED[i + 1] : undefined };
}

function blockText(b: LessonBlock): string {
  switch (b.kind) {
    case "p": case "h": return b.text;
    case "list": return b.items.join(" ");
    case "table": return [b.caption ?? "", ...b.head, ...b.rows.flat()].join(" ");
    case "formula": return [b.expr, ...b.terms.flat()].join(" ");
    case "callout": return [b.title, ...b.text].join(" ");
    case "excel": return b.rows.flat().join(" ");
    case "sheet": return [b.title, b.task, ...Object.values(b.labels)].join(" ");
  }
}

/** Every word a reader would read, for reading time. */
export function lessonText(l: Lesson): string {
  return [
    l.title, l.summary, ...l.outcomes, ...l.hook,
    ...l.sections.flatMap((s) => [s.title, ...s.blocks.map(blockText)]),
    ...l.gap.flatMap((g) => [g.theory, g.practice]), ...l.mistakes,
    ...l.interview.flatMap((q) => [q.q, q.a]), ...l.quiz.flatMap((q) => [q.q, ...q.options, q.why]),
  ].join(" ");
}

/** Minutes at about 200 words a minute, rounded up to the next 5, plus time for the quiz and sheets. */
export function readingMinutes(l: Lesson): number {
  const words = lessonText(l).split(/\s+/).filter(Boolean).length;
  const sheets = l.sections.flatMap((s) => s.blocks).filter((b) => b.kind === "sheet").length;
  return Math.ceil((words / 200 + l.quiz.length + sheets * 3) / 5) * 5;
}

/** Lessons that teach the concept behind a problem, model task or case. */
export function lessonsForProblem(slug: string): Lesson[] {
  return ORDERED.filter((l) => l.apply.problems.includes(slug));
}

export function lessonsForModel(slug: string): Lesson[] {
  return ORDERED.filter((l) => l.apply.models.includes(slug));
}

export function lessonsForCase(slug: string): Lesson[] {
  return ORDERED.filter((l) => l.apply.cases.some((c) => c.slug === slug));
}

export function lessonsForTool(slug: string): Lesson[] {
  return ORDERED.filter((l) => l.apply.tools.includes(slug));
}

export type GlossaryEntry = { term: string; definition: string; lesson: Lesson };

/** All glossary terms across lessons, alphabetical. */
export function glossary(): GlossaryEntry[] {
  return ORDERED.flatMap((l) => l.glossary.map((g) => ({ ...g, lesson: l })))
    .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }));
}

/** URL fragment for a glossary term. */
export function termId(term: string): string {
  return "term-" + term.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
