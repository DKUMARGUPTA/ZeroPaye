import type { Metadata } from "next";
import { buildMetadata, articleJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Contributing Guide — How to Contribute to ZeroPaye",
  description:
    "Contribute to ZeroPaye: bug fixes, features, docs, translations. Fork → branch → PR workflow. Tests required for code changes. AGPL-3.0 license. Beginner-friendly community.",
  path: "/contributing",
  keywords: ["open source contribution", "ZeroPaye contribute", "fintech PR guide", "AGPL contributing"],
  ogType: "article",
});

const jsonLd = articleJsonLd({
  headline: "Contributing to ZeroPaye — How to Give Back",
  description: "Complete guide to contributing: code, docs, translations, bug reports.",
  path: "/contributing",
});

export default function ContributingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Community", href: "/" }, { name: "Contributing", href: "/contributing" }]}>
        <PageHero
          badge="Community"
          title="ZeroPaye mein yogdan kaise karein"
          subtitle="Code, docs, translations, bug reports, community help — har tarah ka contribution welcome. Beginner-friendly, Hindi-English mix."
        />

        <SectionHeading eyebrow="Ways to contribute" title="Kya-kya kar sakte ho?" />
        <Prose>
          <h3>🔧 Code contributions</h3>
          <p>Bug fixes, naye features, performance improvements, security hardening.</p>
          <h3>📚 Documentation</h3>
          <p>README, guides, API docs, tutorials, translation (Hindi, regional languages).</p>
          <h3>🐛 Bug reports & testing</h3>
          <p>Bugs find karo, reproduce steps do, edge cases test karo.</p>
          <h3>🎨 Design</h3>
          <p>UI/UX suggestions, screenshots, accessibility improvements, mobile testing.</p>
          <h3>🤝 Community help</h3>
          <p>Discussions mein dusro ki help karo, issues mein reply karo, mentor bano.</p>
          <h3>⭐ Star + share</h3>
          <p>Repo star karo, social media pe share karo, dukaandaar friends ko batao.</p>
        </Prose>

        <SectionHeading eyebrow="Workflow" title="Code contribution ka process" />
        <Prose>
          <h3>1. Fork + clone</h3>
          <pre><code>{`# GitHub pe "Fork" button click karein
# Phir clone:
git clone https://github.com/YOUR-USERNAME/ZeroPaye.git
cd ZeroPaye
git remote add upstream https://github.com/DKUMARGUPTA/ZeroPaye.git
bun install`}</code></pre>

          <h3>2. Branch banayein</h3>
          <pre><code>{`# Descriptive branch name:
git checkout -b fix/qr-rendering-on-safari
# Ya:
git checkout -b feat/add-refund-flow
# Ya:
git checkout -b docs/improve-hindi-translation`}</code></pre>

          <h3>3. Code likhein + tests add karein</h3>
          <pre><code>{`# Changes karein...
# Tests run:
bun run test
# Lint check:
bun run lint
# Dono pass hone chahiye`}</code></pre>

          <h3>4. Commit (conventional commits)</h3>
          <pre><code>{`git add -A
git commit -m "fix(qr): rendering on Safari mobile
- Add viewBox attribute for proper scaling
- Test: added 3 new cases in upi.test.ts
- Fixes #123"`}</code></pre>

          <h3>5. Push + PR</h3>
          <pre><code>{`git push origin fix/qr-rendering-on-safari
# GitHub pe Pull Request create karein
# PR template fill karein: what changed, why, testing done`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="Code standards" title="Coding guidelines" />
        <Prose>
          <ul>
            <li><strong>TypeScript strict mode</strong> — <code>any</code> avoid karein (or document why)</li>
            <li><strong>Tests required</strong> for code changes — Vitest mein add karein</li>
            <li><strong>Lint must pass</strong> — <code>bun run lint</code> clean hona chahiye</li>
            <li><strong>Conventional commits</strong> — <code>feat:</code>, <code>fix:</code>, <code>docs:</code>, <code>refactor:</code></li>
            <li><strong>Small PRs</strong> — ek feature/fix per PR. Bada PR review mushkil hota hai.</li>
            <li><strong>Accessibility</strong> — keyboard nav, screen reader, focus-visible test karein</li>
            <li><strong>No <code>console.log</code></strong> in production code — use <code>logger.info</code> from <code>workers.ts</code></li>
          </ul>
        </Prose>

        <SectionHeading eyebrow="First-time contributors" title="Pehli baar contributor?" />
        <Prose>
          <p>
            Beginner-friendly issues ke liye GitHub pe <code>good first issue</code> label dekho.
            Yeh chhote, well-documented tasks hain jahan hum guidance dete hain.
          </p>
          <p>
            <a href='https://github.com/DKUMARGUPTA/ZeroPaye/issues?q=is%3Aopen+label%3A"good+first+issue"'>
              good-first-issues list dekho →
            </a>
          </p>
        </Prose>

        <SectionHeading eyebrow="License" title="Contributor license agreement" />
        <Prose>
          <p>
            Contributions AGPL-3.0-or-later license ke under aate hain. Jab aap PR submit karte ho,
            aap agree karte ho ki aapka code AGPL-3.0 ke under distribute ho sakta hai.
          </p>
          <p>
            Hum individual CLA use nahi karte — AGPL license hi sufficient hai.
            Aapka copyright aapka rahega, lekin code publicly available hoga.
          </p>
        </Prose>
      </PageLayout>
    </>
  );
}
