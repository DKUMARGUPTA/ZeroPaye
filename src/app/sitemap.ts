// ZeroPaye — Dynamic sitemap.xml generator
// Generates sitemap for all 19 dedicated pages + homepage.
// Submitted to Google Search Console for indexing.

import type { MetadataRoute } from "next";

const SITE_URL = "https://zeropaye.com";

const STATIC_PAGES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/live-demo", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/dashboard", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/security", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/developers", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/free-forever", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/docs", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/api-reference", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/architecture", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/self-host-guide", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/white-label", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/github", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/issues", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/discussions", priority: 0.5, changeFrequency: "weekly" as const },
  { path: "/contributing", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/code-of-conduct", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/license", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/security-disclosure", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/no-cookies", priority: 0.4, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
