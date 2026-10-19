import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Report Issues — Bugs, Feature Requests, Security",
  description:
    "Report ZeroPaye bugs, request features, or flag security issues. Use GitHub Issues for bugs/features, dedicated disclosure process for security vulnerabilities. 48h response time.",
  path: "/issues",
});

export default function IssuesPage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Community", href: "/" }, { name: "Issues", href: "/issues" }]}>
      <PageHero
        badge="Community"
        title="Bug report ya feature request karein"
        subtitle="Aapki feedback humare liye zaroori hai. Bugs, feature requests, ya security issues — sab welcome."
      />

      <SectionHeading eyebrow="Types" title="Kya-kya report kar sakte ho?" />
      <Prose>
        <h3>🐛 Bug report</h3>
        <p>
          Agar ZeroPaye mein koi bug milta hai (crash, galat behavior, visual glitch), toh GitHub
          Issue create karein with:
        </p>
        <ul>
          <li>Bug ka clear description</li>
          <li>Reproduce karne ke steps</li>
          <li>Expected vs actual behavior</li>
          <li>Screenshot/recorded video agar possible</li>
          <li>Aapka environment (OS, Node version, browser)</li>
        </ul>

        <h3>💡 Feature request</h3>
        <p>
          Naya feature chahiye? "enhancement" label ke saath issue kholiye. Hum community requests
          ko priority dete hain.
        </p>

        <h3>🔒 Security vulnerability</h3>
        <p>
          <strong>Security bug ko public issue mein report na karein.</strong> Hamara responsible
          disclosure process follow karein:{" "}
          <a href="/security-disclosure">/security-disclosure</a> page padhein.
        </p>
      </Prose>

      <SectionHeading eyebrow="How to" title="Issue create karein" />
      <Prose>
        <ol>
          <li>
            <a href="https://github.com/DKUMARGUPTA/ZeroPaye/issues/new" target="_blank" rel="noopener noreferrer">
              github.com/DKUMARGUPTA/ZeroPaye/issues/new
            </a>{" "}
            par jayein.
          </li>
          <li>Issue title clear aur specific rakhein (e.g. "QR not rendering on mobile Safari" not "QR broken")</li>
          <li>Issue template fill karein (bug / feature / question)</li>
          <li>Screenshots, logs, code snippets attach karein</li>
          <li>Labels add karein: <code>bug</code>, <code>enhancement</code>, <code>question</code>, etc.</li>
        </ol>
      </Prose>

      <SectionHeading eyebrow="Response time" title="Kitni jaldi reply milega?" />
      <Prose>
        <table>
          <thead><tr><th>Issue type</th><th>Acknowledge</th><th>Fix target</th></tr></thead>
          <tbody>
            <tr><td>Critical bug (payment broken)</td><td>24 hours</td><td>72 hours</td></tr>
            <tr><td>High bug</td><td>48 hours</td><td>1 week</td></tr>
            <tr><td>Medium bug</td><td>1 week</td><td>Next minor release</td></tr>
            <tr><td>Low bug / cosmetic</td><td>2 weeks</td><td>Backlog</td></tr>
            <tr><td>Feature request</td><td>1 week</td><td>Roadmap review</td></tr>
            <tr><td>Security</td><td>48 hours</td><td>90 days (SLA)</td></tr>
          </tbody>
        </table>
      </Prose>

      <SectionHeading eyebrow="Before reporting" title="Pehle yeh check karein" />
      <Prose>
        <ul>
          <li>Existing issues mein search karein — duplicate report na karein</li>
          <li>Latest version (<code>git pull && bun install</code>) pe reproduce karein</li>
          <li><code>dev.log</code> mein error logs check karein</li>
          <li><code>/api/zeropaye/health</code> endpoint check karein (DB + server up hai?)</li>
        </ul>
      </Prose>

      <div className="mt-10 rounded-2xl border border-teal-500/20 bg-gradient-brand-soft p-6 text-center">
        <h3 className="text-lg font-bold">Issue kholne ke liye</h3>
        <p className="mt-2 text-sm text-muted-foreground">GitHub Issues sabse fast aur transparent tareeka hai.</p>
        <a href="https://github.com/DKUMARGUPTA/ZeroPaye/issues/new" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-medium text-white shadow-md glow-teal">
          GitHub pe issue kholiye →
        </a>
      </div>
    </PageLayout>
  );
}
