"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";

interface BreadcrumbItem {
  name: string;
  href: string;
}

/**
 * Shared layout for all dedicated SEO pages.
 * Includes header, breadcrumb, content area, and footer.
 */
export function PageLayout({
  breadcrumbs,
  children,
}: {
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="page-content" className="flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="border-b border-border/40 bg-muted/20">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto">
              <li>
                <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  <Home className="h-3 w-3" />
                  <span className="sr-only">Home</span>
                </Link>
              </li>
              {breadcrumbs.map((bc, i) => (
                <li key={bc.href} className="flex items-center gap-1.5 shrink-0">
                  <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-foreground" aria-current="page">
                      {bc.name}
                    </span>
                  ) : (
                    <Link href={bc.href} className="hover:text-foreground transition-colors">
                      {bc.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/**
 * Page hero header — consistent across all pages.
 */
export function PageHero({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-10">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">
        {badge}
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
      )}
    </header>
  );
}

/**
 * Section heading — consistent styling.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>}
    </div>
  );
}

/**
 * Content prose styling for article-like pages.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-bold prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:hidden prose-code:after:hidden prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-teal-500 prose-blockquote:not-italic">
      {children}
    </div>
  );
}
