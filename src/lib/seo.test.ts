import { describe, expect, it } from "vitest";
import { absoluteUrl, PRIVATE_PATHS, SITE_URL, sitemapEntries } from "./seo";
import { TEMPLATES } from "./problems";
import { LESSONS } from "./learn";

describe("sitemap", () => {
  const tools = [{ slug: "dcf" }, { slug: "lbo" }];
  const urls = sitemapEntries(tools).map((e) => e.url);

  it("lists every lesson, the glossary, every problem and every tool", () => {
    for (const l of LESSONS) expect(urls).toContain(absoluteUrl(`/learn/${l.slug}`));
    for (const t of TEMPLATES) expect(urls).toContain(absoluteUrl(`/problems/${t.slug}`));
    for (const t of tools) expect(urls).toContain(absoluteUrl(`/tools/${t.slug}`));
    expect(urls).toContain(absoluteUrl("/learn/glossary"));
  });

  it("has absolute, unique URLs and no private pages", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const u of urls) {
      expect(u.startsWith(`${SITE_URL}/`)).toBe(true);
      expect(PRIVATE_PATHS.some((p) => u === absoluteUrl(p) || u.startsWith(absoluteUrl(`${p}/`)))).toBe(false);
    }
  });

  it("joins paths without doubled slashes", () => {
    expect(absoluteUrl("/a")).toBe(`${SITE_URL}/a`);
    expect(absoluteUrl("a")).toBe(`${SITE_URL}/a`);
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});
