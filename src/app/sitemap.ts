import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/seo";
import { TOOLS } from "./tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries(TOOLS);
}
