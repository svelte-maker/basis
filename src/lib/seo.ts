import { TEMPLATES } from "@/lib/problems";
import { LESSONS } from "@/lib/learn";

/** Public origin for canonical URLs, the sitemap and social cards. Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://basis-psi-roan.vercel.app").replace(/\/+$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Metadata fragment giving a page its canonical URL (resolved against metadataBase). */
export function canonical(path: string) {
  return { alternates: { canonical: path } };
}

/** Pages behind a login or only useful to signed-in users; kept out of search results. */
export const PRIVATE_PATHS = ["/admin", "/settings", "/recruiters", "/login", "/signup"];

export type SitemapEntry = { url: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number };

/**
 * Every public page whose list is known from code: the static sections, every lesson,
 * the glossary, every problem and every tool. Profiles, contests and posts come from the
 * database and are found by crawling the leaderboard, contest and community pages.
 */
export function sitemapEntries(tools: readonly { slug: string }[]): SitemapEntry[] {
  const e = (path: string, changeFrequency: SitemapEntry["changeFrequency"], priority: number): SitemapEntry =>
    ({ url: absoluteUrl(path), changeFrequency, priority });
  return [
    e("/", "daily", 1),
    e("/learn", "weekly", 0.9),
    e("/learn/glossary", "monthly", 0.6),
    ...LESSONS.map((l) => e(`/learn/${l.slug}`, "monthly", 0.8)),
    e("/problems", "weekly", 0.9),
    ...TEMPLATES.map((t) => e(`/problems/${t.slug}`, "monthly", 0.7)),
    e("/models", "weekly", 0.6),
    e("/cases", "weekly", 0.6),
    e("/teams", "daily", 0.5),
    e("/contests", "daily", 0.8),
    e("/leaderboard", "daily", 0.7),
    e("/community", "daily", 0.5),
    e("/tools", "monthly", 0.6),
    ...tools.map((t) => e(`/tools/${t.slug}`, "monthly", 0.5)),
    e("/how-it-works", "monthly", 0.6),
  ];
}
