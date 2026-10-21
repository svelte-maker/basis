import type { Fmt } from "@/lib/sheets";
import type { Difficulty, Rng, Track } from "@/lib/problems/types";

/**
 * label/head/note: text the candidate can't edit. input: a given assumption (locked, shocked by the grader).
 * calc: a cell the candidate must fill; its reference formula lives in `answer`.
 * A locked cell whose v starts with "=" is a given formula (for example a link to an input).
 */
export type CellKind = "label" | "head" | "note" | "input" | "calc";
export type CellSpec = { v: string; kind: CellKind; fmt?: Fmt };

export type GradedCell = {
  cell: string;
  label: string;
  points: number;
  /** Accept when |got − expected| ≤ max(abs, rel × |expected|). Defaults: rel 0.05%, abs 1e-6. */
  tol?: { abs?: number; rel?: number };
  /** Each inner list is "use one of these functions" in this cell or the cells it depends on. */
  requires?: string[][];
};

export type Shock = { label: string; set: Record<string, number | string> };

export type ModelInstance = {
  rows: number;
  cols: number;
  /** Column widths in px, column A first. */
  widths: number[];
  cells: Record<string, CellSpec>;
  answer: Record<string, string>;
  graded: GradedCell[];
  shocks: Shock[];
  /** The situation, in short paragraphs (supports **bold**). */
  brief: string[];
  /** What to build, in order. */
  steps: string[];
  /** Worked solution: the reasoning behind the reference model. */
  solution: string[];
};

export type ModelTask = {
  slug: string;
  title: string;
  track: Track;
  difficulty: Difficulty;
  /** Modelling skills this task evidences, for the skill profile. */
  skills: string[];
  /** Excel functions the task practises. */
  functions: string[];
  minutes: number;
  generate: (rng: Rng) => ModelInstance;
};
