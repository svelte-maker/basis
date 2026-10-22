export type Track =
  | "Accounting" | "Corporate Finance" | "Valuation" | "Fixed Income" | "Derivatives"
  | "Private Equity" | "Portfolio & Risk" | "Banking & Credit";

export const TRACKS: Track[] = ["Accounting", "Corporate Finance", "Valuation", "Fixed Income", "Derivatives", "Private Equity", "Portfolio & Risk", "Banking & Credit"];

export type Difficulty = "Easy" | "Medium" | "Hard";

/** Statement text supports **bold**. Tables are plain strings. */
export type Block = { kind: "p"; text: string } | { kind: "table"; head: string[]; rows: string[][] };

export type Unit = "$" | "$m" | "%" | "x" | "years" | "days" | "shares" | "";

export type Instance = {
  blocks: Block[];
  question: string;
  answer: number;
  unit: Unit;
  /** Accept when |input − answer| ≤ max(abs, rel × |answer|). */
  tolerance: { abs?: number; rel?: number };
  solution: Solution;
};

/** One formula, with every symbol in it explained in plain words. */
export type Formula = { expr: string; terms: [symbol: string, meaning: string][] };

/**
 * A worked solution that teaches the concept, not just the answer. Every section is required
 * and is written with the instance's own numbers. See agents/problem-author.md for the bar.
 * Text supports **bold** and `code`.
 */
export type Solution = {
  /** The intuition: what is being measured and why it works, before any maths. */
  idea: string[];
  /** Every formula used, with each term explained. */
  formulas: Formula[];
  /** The calculation with these numbers, one step at a time. Tables for schedules and iterations. */
  steps: Block[];
  /** How to read the result: the decision it drives, its sign and size, and edge cases. */
  meaning: string[];
  /** Mistakes people actually make, with the wrong answer each one gives on these numbers where possible. */
  mistakes: string[];
  /** The same calculation in Excel or Google Sheets, using these numbers. */
  excel: string[];
};

export type Rng = () => number;

export type Template = {
  slug: string;
  title: string;
  track: Track;
  difficulty: Difficulty;
  concepts: string[];
  generate: (rng: Rng) => Instance;
};
