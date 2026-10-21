import type { Grade as G } from "@/lib/rating/grades";
import { gradeLabel } from "@/lib/rating/grades";

export function Grade({ grade, large }: { grade: G; large?: boolean }) {
  return <span className={`grade g-${grade}${large ? " lg" : ""}`} title={gradeLabel(grade)}>{grade}</span>;
}
