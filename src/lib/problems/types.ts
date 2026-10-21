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
  solution: string[];
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
