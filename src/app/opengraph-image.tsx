import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Basis: finance, rated";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Finance, rated",
    title: "Prove your finance skill with a verified rating",
    subtitle: "Graded problems, timed contests and in-depth lessons across valuation, accounting, markets and credit.",
  });
}
