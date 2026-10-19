import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Documentation Hub — ZeroPaye Guides & Tutorials",
  description:
    "Complete ZeroPaye documentation: getting started, architecture, API reference, self-hosting, white-label, security, merchant guide. Learn how to accept zero-fee UPI payments.",
  path: "/docs",
  keywords: [
    "ZeroPaye documentation", "UPI payment gateway docs", "open source payment guide",
    "fintech docs India", "ZeroPaye tutorial", "self-host payment gateway docs",
  ],
});

const DOC_SECTIONS = [
  { title: "Getting Started", desc: "Pehli baar setup, install, run karein", href: "/self-host-guide", icon: "🚀" },
  { title: "Live Demo", desc: "Interactive checkout flow try karein", href: "/live-demo", icon: "🎮" },
  { title: "Developer Guide", desc: "SDK, API, webhooks integration", href: "/developers", icon: "💻" },
  { title: "API Reference", desc: "Har endpoint ka detailed spec", href: "/api-reference", icon: "📚" },
  { title: "Architecture", desc: "State machine, invariants, observation mesh", href: "/architecture", icon: "🏛️" },
  { title: "Security", desc: "Audit fixes, threat model, best practices", href: "/security", icon: "🔒" },
  { title: "Merchant Guide", desc: "Asli business mein kaise use karein", href: "/dashboard", icon: "🏪" },
  { title: "White-Label", desc: "Custom branding, domain, colors", href: "/white-label", icon: "🎨" },
  { title: "Free Forever", desc: "Pricing, savings, FAQ", href: "/free-forever", icon: "🆓" },
];

export default function DocsPage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Resources", href: "/" }, { name: "Documentation", href: "/docs" }]}>
      <PageHero
        badge="Documentation"
        title="ZeroPaye Docs — sab kuch ek jagah"
        subtitle="Getting started se le kar production deployment tak — har topic detailed aur aasan bhasha mein."
      />
      <Prose>
        <p>
          ZeroPaye documentation har type ke user ke liye design kiya gaya hai — chhote dukaandaar
          se le kar enterprise developer tak. Har page self-contained hai, screenshots + code examples
          ke saath.
        </p>
      </Prose>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOC_SECTIONS.map((s) => (
          <a
            key={s.title}
            href={s.href}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg"
          >
            <div className="text-3xl">{s.icon}</div>
            <h3 className="mt-3 text-sm font-bold">{s.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            <span className="mt-3 inline-block text-xs font-medium text-teal-600 dark:text-teal-300 opacity-0 transition-opacity group-hover:opacity-100">
              Padhne jayein →
            </span>
          </a>
        ))}
      </div>

      <SectionHeading eyebrow="Quick links" title="Popular topics" />
      <Prose>
        <ul>
          <li><a href="/developers">5-minute integration guide</a></li>
          <li><a href="/security">Security audit (105 findings, sab fixed)</a></li>
          <li><a href="/architecture">8 architectural invariants</a></li>
          <li><a href="/self-host-guide">VPS setup (PM2 + HTTPS)</a></li>
          <li><a href="/free-forever">Pricing & savings calculator</a></li>
        </ul>
      </Prose>
    </PageLayout>
  );
}
