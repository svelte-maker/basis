/**
 * A Learn lesson. Lessons are data, not Markdown, so every number in a worked example is computed
 * by the same tested functions in src/lib/finance/ that grade the problems. Text supports **bold**
 * and `code`.
 */

import type { Fmt } from "@/lib/sheets/format";

export type LessonBlock =
  | { kind: "p"; text: string }
  /** A subheading inside a section. */
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "table"; head: string[]; rows: string[][]; caption?: string }
  /** One formula, with every symbol explained. Same shape as a worked solution's formula. */
  | { kind: "formula"; expr: string; terms: [symbol: string, meaning: string][] }
  /**
   * insight: the idea that makes it click. desk: how practitioners actually do it.
   * warning: a trap that costs marks or money.
   */
  | { kind: "callout"; tone: "insight" | "desk" | "warning"; title: string; text: string[] }
  /** A small spreadsheet: cell, what you type, what it shows. */
  | { kind: "excel"; title?: string; rows: [cell: string, formula: string, shows: string][] }
  /**
   * A live spreadsheet the reader can edit, run by the same engine as the model tasks. Labels are
   * locked; inputs and formulas are editable. "Try it yourself" clears the formulas and checks the
   * reader's rebuild against the reference.
   */
  | {
      kind: "sheet"; title: string; task: string; rows: number; cols: number; widths: number[];
      labels: Record<string, string>; heads?: string[]; inputs: Record<string, string>;
      formulas: Record<string, string>; fmt?: Record<string, Fmt>;
    };

export type LessonSection = { id: string; title: string; blocks: LessonBlock[] };

export type QuizQuestion = { q: string; options: string[]; answer: number; why: string };

export type Level = "Foundation" | "Core" | "Advanced";

export type Lesson = {
  slug: string;
  title: string;
  /** One sentence. Used on the index, in search results and in link previews. */
  summary: string;
  module: ModuleKey;
  level: Level;
  /** Lessons worth reading first, by slug. */
  prerequisites: string[];
  /** "After this lesson you can ...", each a concrete skill. */
  outcomes: string[];
  /** Why this matters, told through a real situation before any theory. */
  hook: string[];
  sections: LessonSection[];
  /** Textbook versus the desk: where the classroom version and real practice part ways. */
  gap: { theory: string; practice: string }[];
  mistakes: string[];
  /** Questions interviewers actually ask, with the answer a strong candidate gives. */
  interview: { q: string; a: string }[];
  quiz: QuizQuestion[];
  /** Where to practise it on Basis. Every slug is checked by a test. */
  apply: {
    problems: string[];
    models: string[];
    cases: { slug: string; parts: string[] }[];
    tools: string[];
  };
  glossary: { term: string; definition: string }[];
};

export type ModuleKey =
  | "foundations" | "accounting" | "valuation" | "modelling" | "capital-markets"
  | "deals" | "fixed-income" | "derivatives" | "risk" | "credit";

export type Module = { key: ModuleKey; title: string; blurb: string };
