import { getTemplate, TEMPLATES } from "@/lib/problems";
import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "A graded finance problem on Basis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const t = getTemplate((await params).slug);
  if (!t) return ogImage({ eyebrow: "Problem", title: "Finance problems, graded" });
  return ogImage({
    eyebrow: `${t.track} · ${t.difficulty}`,
    title: t.title,
    subtitle: "Solve it with your own numbers, get it graded instantly, then read the worked solution.",
  });
}
