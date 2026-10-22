import Link from "next/link";
import type { Lesson } from "@/lib/learn";

/** "Learn the concept" links from a practice page back to the lessons that teach it. */
export function LearnLink({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) return null;
  return (
    <div className="panel learn-link">
      <span className="eyebrow">Learn the concept</span>
      {lessons.map((l, i) => <span key={l.slug}>{i > 0 && <span className="muted">· </span>}<Link href={`/learn/${l.slug}`}>{l.title}</Link></span>)}
    </div>
  );
}
