import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "GitHub — ZeroPaye Source Code, Issues, Releases",
  description:
    "ZeroPaye on GitHub: 100% open-source (AGPL-3.0), TypeScript 90.8%, 11 API routes, 51 tests, CI workflow. Star, fork, contribute, or self-host. Built by Deepak Kumar (DKUMARGUPTA).",
  path: "/github",
  keywords: [
    "ZeroPaye GitHub", "open source UPI gateway", "AGPL payment gateway",
    "DKUMARGUPTA ZeroPaye", "fintech open source India",
  ],
});

export default function GitHubPage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Community", href: "/" }, { name: "GitHub", href: "/github" }]}>
      <PageHero
        badge="Community"
        title="ZeroPaye GitHub Repository"
        subtitle="100% open-source, AGPL-3.0, transparent development. Star karein, fork karein, contribute karein."
      />

      <div className="my-10 rounded-2xl border border-border/60 glass p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-md glow-teal">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.7 1 .7 2v3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
        </div>
        <h3 className="text-xl font-bold">DKUMARGUPTA/ZeroPaye</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Zero • Empowering • Reliable • Open • Payé — 100% open-source zero-fee UPI payment gateway for India.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a href="https://github.com/DKUMARGUPTA/ZeroPaye" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-md glow-teal">
            Visit Repository →
          </a>
          <a href="https://github.com/DKUMARGUPTA/ZeroPaye/stargazers" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
            ⭐ Star
          </a>
          <a href="https://github.com/DKUMARGUPTA/ZeroPaye/fork" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
            🍴 Fork
          </a>
        </div>
      </div>

      <SectionHeading eyebrow="Repo stats" title="Repository ki haalat" />
      <Prose>
        <table>
          <thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Language</td><td>TypeScript 90.8% · Shell 7.6% · CSS 1.1% · JS 0.5%</td></tr>
            <tr><td>License</td><td>AGPL-3.0-or-later</td></tr>
            <tr><td>Tests</td><td>51 (Vitest) — all passing</td></tr>
            <tr><td>CI</td><td>GitHub Actions (lint + test on every push/PR)</td></tr>
            <tr><td>API routes</td><td>11 REST endpoints</td></tr>
            <tr><td>Maintainer</td><td>Deepak Kumar (DKUMARGUPTA)</td></tr>
            <tr><td>Framework</td><td>Next.js 16 + TypeScript 5 + Prisma + SQLite</td></tr>
            <tr><td>Default branch</td><td>main</td></tr>
          </tbody>
        </table>
      </Prose>

      <SectionHeading eyebrow="Quick clone" title="Repo clone karein" />
      <Prose>
        <pre><code>{`# Clone
git clone https://github.com/DKUMARGUPTA/ZeroPaye.git
cd ZeroPaye

# Install
bun install  # or npm install

# Setup
cp .env.example .env
bun run db:push

# Run
bun run dev
# Visit http://localhost:3000`}</code></pre>
      </Prose>

      <SectionHeading eyebrow="Releases" title="Version history" />
      <Prose>
        <ul>
          <li><strong>v2.0</strong> — Complete UI/UX redesign (glassmorphism, bento grids, dark mode glow)</li>
          <li><strong>v1.2</strong> — zeropaye.js SDK + PHP/Go webhook snippets + /metrics endpoint + DB backup</li>
          <li><strong>v1.1</strong> — Test suite (51 tests) + CI + /health + background workers + security headers</li>
          <li><strong>v1.0.1</strong> — Critical security fixes (admin auth, HMAC, SSRF, race conditions)</li>
          <li><strong>v1.0</strong> — Initial release after YouPI-PG audit (105 findings, sab fixed)</li>
        </ul>
        <p>
          Full changelog: <a href="https://github.com/DKUMARGUPTA/ZeroPaye/releases" target="_blank" rel="noopener noreferrer">github.com/DKUMARGUPTA/ZeroPaye/releases</a>
        </p>
      </Prose>
    </PageLayout>
  );
}
