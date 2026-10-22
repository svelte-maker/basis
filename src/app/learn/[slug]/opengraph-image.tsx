import { getLesson, LESSONS, moduleOf } from "@/lib/learn";
import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "A lesson on Basis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const l = getLesson((await params).slug);
  if (!l) return ogImage({ eyebrow: "Learn", title: "Finance lessons that end in graded practice" });
  return ogImage({ eyebrow: `Learn · ${moduleOf(l.module).title}`, title: l.title, subtitle: l.summary });
}
