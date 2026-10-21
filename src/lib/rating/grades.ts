// Displayed rating and credit-style grades.

export const PRACTICE_BONUS_CAP = 150;
export const PROVISIONAL_RD = 110;

export const GRADES = [
  { min: 1800, grade: "AAA", label: "Exceptional" },
  { min: 1600, grade: "AA", label: "Very strong" },
  { min: 1400, grade: "A", label: "Strong" },
  { min: 1200, grade: "BBB", label: "Solid" },
  { min: 1000, grade: "BB", label: "Developing" },
  { min: -Infinity, grade: "B", label: "Early" },
] as const;

export type Grade = (typeof GRADES)[number]["grade"] | "NR";

/** The headline number: contest rating plus a capped bonus for practice. */
export function basisRating(contestRating: number, practicePoints: number): number {
  return Math.round(contestRating + Math.min(PRACTICE_BONUS_CAP, practicePoints));
}

/** "NR" (not rated) until someone has finished at least one rated contest. */
export function gradeFor(rating: number, ratedContests: number): Grade {
  if (ratedContests === 0) return "NR";
  return GRADES.find((g) => rating >= g.min)!.grade;
}

export function gradeLabel(grade: Grade): string {
  if (grade === "NR") return "Not yet rated";
  return GRADES.find((g) => g.grade === grade)!.label;
}

export function isProvisional(rd: number): boolean {
  return rd > PROVISIONAL_RD;
}
