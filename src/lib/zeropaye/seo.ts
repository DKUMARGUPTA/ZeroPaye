// ZeroPaye — Shared SEO metadata helper
// Generates Next.js Metadata objects with proper SEO tags, OpenGraph,
// Twitter cards, canonical URLs, and JSON-LD structured data.

import type { Metadata } from "next";

const SITE_URL = "https://zeropaye.com";
const SITE_NAME = "ZeroPaye";
const DEFAULT_OG_IMAGE = "/screenshots/zeropaye-hero.png";

interface SeoOptions {
  title: string;
  description: string;
  path?: string;            // e.g. "/live-demo"
  keywords?: string[];
  ogType?: "website" | "article";
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

/**
 * Build a Next.js Metadata object with all SEO best practices.
 */
export function buildMetadata(opts: SeoOptions): Metadata {
  const path = opts.path || "/";
  const url = `${SITE_URL}${path}`;
  const fullTitle = opts.title.includes("ZeroPaye") ? opts.title : `${opts.title} — ZeroPaye`;
  const keywords = opts.keywords ?? [
    "ZeroPaye", "UPI", "payment gateway", "zero fee", "open source",
    "India", "fintech", "merchant", "AGPL", "self-hosted",
  ];

  return {
    title: fullTitle,
    description: opts.description,
    keywords,
    authors: [{ name: opts.author || "Deepak Kumar" }, { name: "ZeroPaye Project" }],
    creator: "Deepak Kumar",
    publisher: "ZeroPaye Project",
    alternates: {
      canonical: url,
    },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
    openGraph: {
      type: opts.ogType || "website",
      url,
      title: fullTitle,
      description: opts.description,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1344,
          height: 768,
          alt: fullTitle,
        },
      ],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: opts.description,
      images: [DEFAULT_OG_IMAGE],
      creator: "@zeropaye",
      site: "@zeropaye",
    },
    category: "fintech",
    icons: {
      icon: "/logo.svg",
      apple: "/logo.svg",
    },
    manifest: "/manifest.webmanifest",
  };
}

/**
 * JSON-LD structured data for the organization (ZeroPaye).
 * Embed in layout.tsx for sitelinks + brand entity in Google.
 */
export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ZeroPaye",
  alternateName: "ZeroPaye Payment Gateway",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  description:
    "ZeroPaye is a 100% open-source, zero-fee UPI payment gateway for India. Direct P2P UPI settlement, no middlemen, no hidden fees.",
  founder: {
    "@type": "Person",
    name: "Deepak Kumar",
    url: "https://www.facebook.com/ideepakkumargread",
  },
  sameAs: [
    "https://github.com/DKUMARGUPTA/ZeroPaye",
    "https://www.facebook.com/ideepakkumargread",
  ],
  license: "https://www.gnu.org/licenses/agpl-3.0.html",
  keywords: [
    "UPI payment gateway",
    "zero fee payment gateway",
    "open source payment gateway India",
    "self-hosted UPI gateway",
  ],
};

/**
 * JSON-LD for a BreadcrumbList (helps Google show breadcrumbs in SERP).
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * JSON-LD for a SoftwareApplication (rich result for product pages).
 */
export function softwareAppJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  applicationCategory?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    applicationCategory: opts.applicationCategory || "FinanceApplication",
    operatingSystem: "Web, Linux, Windows, macOS",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1",
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Person",
      name: "Deepak Kumar",
    },
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
  };
}

/**
 * JSON-LD for a FAQPage (rich result for FAQ sections).
 */
export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

/**
 * JSON-LD for an Article (rich result for blog/docs pages).
 */
export function articleJsonLd(opts: {
  headline: string;
  description: string;
  path: string;
  author?: string;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
    author: {
      "@type": "Person",
      name: opts.author || "Deepak Kumar",
      url: "https://www.facebook.com/ideepakkumargread",
    },
    publisher: {
      "@type": "Organization",
      name: "ZeroPaye Project",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.svg`,
      },
    },
    datePublished: opts.datePublished || "2025-01-01",
    dateModified: new Date().toISOString().split("T")[0],
    license: "https://www.gnu.org/licenses/agpl-3.0.html",
  };
}
