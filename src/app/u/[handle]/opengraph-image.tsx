import { db } from "@/lib/db";
import { ratingOf } from "@/lib/services/ratings";
import { gradeLabel } from "@/lib/rating/grades";
import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "A Basis profile";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const user = await db.user.findUnique({ where: { handle: (await params).handle } });
  if (!user || user.role !== "MEMBER") return ogImage({ eyebrow: "Profile", title: "Finance, rated" });
  const r = ratingOf(user);
  return ogImage({
    eyebrow: `@${user.handle}`,
    title: user.name,
    subtitle: r.grade === "NR" ? "Building a Basis finance rating." : `Basis finance rating ${r.rating}, grade ${r.grade}: ${gradeLabel(r.grade)}.`,
    stat: r.grade === "NR" ? undefined : { value: String(r.rating), label: r.grade },
  });
}
