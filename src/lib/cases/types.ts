import type { ModelInstance } from "@/lib/models/types";
import type { Block, Difficulty, Track } from "@/lib/problems/types";

/** A primary document a case takes figures from: a filing, an offer document, an annual report. */
export type SourceDoc = {
  id: string;
  /** As the document names itself, for example "Prospectus dated October 17, 2024". */
  title: string;
  issuer: string;
  /** Who published it: "SEC EDGAR", "SEBI". */
  publisher: string;
  url: string;
  /** Date of the document (YYYY-MM-DD). */
  dated: string;
  /** Accession number, filing reference or similar, if the publisher assigns one. */
  ref?: string;
  /** SHA-256 of the copy figures were extracted from, so the extraction can be repeated on the same file. */
  sha256?: string;
  /** How locators in this document read, for example "Page numbers are the printed page numbers". */
  locatorNote: string;
  /** PDF page = printed page + this, so citations can link straight to the page. */
  pageOffset?: number;
  /** A second URL where the figures can be checked by machine, for example the XBRL company facts API. */
  dataUrl?: string;
};

export type FigureUnit = "INR million" | "INR billion" | "INR" | "USD million" | "USD" | "shares" | "count" | "%" | "x";

/** One reported number, exactly as the company or regulator published it. */
export type Figure = {
  value: number;
  unit: FigureUnit;
  /** The company's own line-item name, or the XBRL element label where the presentation label couldn't be read. */
  label: string;
  /** Fiscal period or date in the document's own terms: "Fiscal 2024 (year ended March 31, 2024)". */
  period: string;
  source: string;
  /** Printed page number in the source document. */
  page?: number;
  /** Statement, table or section the figure sits in. */
  section: string;
  /** XBRL element for SEC filings, for example "us-gaap:OperatingIncomeLoss". */
  xbrl?: string;
};

/** A Basis assumption layered on real data. Always shown as hypothetical, with the reason for the number. */
export type Assumption = { value: number; unit: FigureUnit; label: string; why: string };

/** One formula, with every symbol in it explained in plain words. */
export type Formula = { expr: string; terms: [symbol: string, meaning: string][] };

/**
 * A worked solution to one part, in the six sections of agents/problem-author.md. Text supports **bold** and `code`.
 * The shape matches the problem `Solution` so the two renderers can merge later.
 */
export type Solution = {
  idea: string[];
  formulas: Formula[];
  steps: Block[];
  meaning: string[];
  mistakes: string[];
  excel: string[];
};

type PartBase = {
  /** Stable id: progress, team parts and contest scoring key on it. Never rename a key once a case ships. */
  key: string;
  title: string;
  points: number;
  skills: string[];
  prompt: string[];
  solution: Solution;
};

export type NumericPart = PartBase & {
  kind: "numeric";
  answer: number;
  /** Shown next to the input, for example "₹ million" or "%". Percent answers are in percent units (12.5, not 0.125). */
  unit: string;
  /** Accept when |input − answer| ≤ max(abs, rel × |answer|). */
  tol: { abs?: number; rel?: number };
};

export type ChoicePart = PartBase & { kind: "choice"; options: string[]; correct: number };

export type ModelPart = PartBase & { kind: "model"; model: ModelInstance };

export type CasePart = NumericPart | ChoicePart | ModelPart;

export type ExhibitCell = { text: string; fig?: string } | null;
export type Exhibit = { key: string; title: string; note?: string; head: string[]; rows: { label: string; cells: ExhibitCell[] }[] };

/** An arithmetic identity the source data must satisfy: segments add up, statements tie. Checked at build time. */
export type CaseCheck = { label: string; got: number; want: number; tol: number };

export type CaseStudy = {
  slug: string;
  title: string;
  company: string;
  /** "real": every number is as reported. "real-data hypothetical": reported history plus labelled Basis assumptions. */
  kind: "real" | "real-data hypothetical";
  track: Track;
  difficulty: Difficulty;
  minutes: number;
  topics: string[];
  summary: string;
  brief: string[];
  sources: SourceDoc[];
  figures: Record<string, Figure>;
  assumptions: Record<string, Assumption>;
  exhibits: Exhibit[];
  parts: CasePart[];
  checks: CaseCheck[];
  /** Every number printed through the case's formatters. The citation test rejects any other number in the text. */
  printed: ReadonlySet<string>;
  /** Figures and assumptions read while building the case. */
  used: ReadonlySet<string>;
};
