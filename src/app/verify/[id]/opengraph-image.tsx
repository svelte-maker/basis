import { db } from "@/lib/db";
import { ratingOf } from "@/lib/services/ratings";
import { gradeLabel } from "@/lib/rating/grades";
import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "A verified Basis credential";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id.toUpperCase();
  const user = await db.user.findUnique({ where: { credentialId: id } });
  if (!user || user.role !== "MEMBER") return ogImage({ eyebrow: "Verify a credential", title: "Basis credentials are checked live" });
  const r = ratingOf(user);
  return ogImage({
    eyebrow: `Verified by Basis · ${user.credentialId}`,
    title: user.name,
    subtitle: r.grade === "NR" ? "Not yet rated. Checked live on Basis." : `${gradeLabel(r.grade)}. Checked live on Basis.`,
    stat: r.grade === "NR" ? undefined : { value: String(r.rating), label: r.grade },
  });
}
