import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Security Disclosure — Report Vulnerabilities Responsibly",
  description:
    "ZeroPaye security vulnerability disclosure policy. Report security bugs privately (not public issues). 48h acknowledge, 90-day fix SLA. Coordinated disclosure. Safe harbor for good-faith researchers.",
  path: "/security-disclosure",
  keywords: ["security disclosure", "vulnerability report", "ZeroPaye security", "CVE", "bug bounty", "responsible disclosure"],
});

export default function SecurityDisclosurePage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Legal", href: "/" }, { name: "Security Disclosure", href: "/security-disclosure" }]}>
      <PageHero
        badge="Legal"
        title="Security Vulnerability Disclosure"
        subtitle="Agar aapko ZeroPaye mein security bug milta hai, responsibly report karein. 48h acknowledge, 90-day fix SLA."
      />

      <div className="my-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300">
          ⚠️ Public issue mein security bug report NA karein
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Security vulnerabilities privately report karein. Public disclosure exploit risk badhata hai.
        </p>
      </div>

      <SectionHeading eyebrow="How to report" title="Vulnerability kaise report karein" />
      <Prose>
        <h3>Step 1: Private report</h3>
        <p>
          GitHub Security Advisories use karein (preferred):
        </p>
        <ol>
          <li>
            <a href="https://github.com/DKUMARGUPTA/ZeroPaye/security/advisories/new" target="_blank" rel="noopener noreferrer">
              github.com/DKUMARGUPTA/ZeroPaye/security/advisories/new
            </a>
          </li>
          <li>"Report a vulnerability" click karein</li>
          <li>Template fill karein (description, impact, reproduction, suggested fix)</li>
          <li>Submit — privately visible only to maintainers</li>
        </ol>
        <p>Alternative:</p>
        <ul>
          <li>Facebook DM: <a href="https://www.facebook.com/ideepakkumargread">Deepak Kumar</a></li>
        </ul>

        <h3>Step 2: Required information</h3>
        <ul>
          <li>Vulnerability ka clear description</li>
          <li>Affected versions (e.g. v1.1, v1.2)</li>
          <li>Reproduction steps (commands, screenshots, PoC)</li>
          <li>Impact assessment (RCE? data leak? privilege escalation?)</li>
          <li>Suggested fix agar pata ho</li>
          <li>Aapka name/handle (for credit)</li>
        </ul>

        <h3>Step 3: Acknowledgment</h3>
        <p>
          Hum <strong>48 hours</strong> mein acknowledge karte hain. Response mein:
        </p>
        <ul>
          <li>Receipt confirmation</li>
          <li>Initial triage (valid? duplicate? severity?)</li>
          <li>ETA for fix</li>
          <li>Coordinated disclosure timeline discussion</li>
        </ul>
      </Prose>

      <SectionHeading eyebrow="SLA" title="Response timeline" />
      <Prose>
        <table>
          <thead><tr><th>Stage</th><th>SLA</th></tr></thead>
          <tbody>
            <tr><td>Acknowledge report</td><td>48 hours</td></tr>
            <tr><td>Initial triage + severity rating</td><td>5 business days</td></tr>
            <tr><td>Fix development</td><td>30-90 days (severity dependent)</td></tr>
            <tr><td>Patch release</td><td>90 days maximum</td></tr>
            <tr><td>Public advisory (CVE)</td><td>After patch + 14-day grace period</td></tr>
          </tbody>
        </table>
      </Prose>

      <SectionHeading eyebrow="Safe harbor" title="Researcher protections" />
      <Prose>
        <p>
          Hum good-faith security research ko welcome karte hain. Yeh activities authorized hain:
        </p>
        <ul>
          <li>✅ Testing on aapka khud ka self-hosted instance</li>
          <li>✅ Bug bounty style research (no compensation, but credit)</li>
          <li>✅ Reporting vulnerabilities privately</li>
        </ul>
        <p>Yeh activities unauthorized hain:</p>
        <ul>
          <li>❌ Public disclosure before fix</li>
          <li>❌ Testing on production zeropaye.com (agar hosted)</li>
          <li>❌ DDoS, brute-force, social engineering</li>
          <li>❌ Accessing other users' data</li>
          <li>❌ Destructive testing</li>
        </ul>
        <p>
          Good-faith researchers ke against hum legal action nahi lenge. Hum credit denge (with
          permission) + hall of fame mein list karenge.
        </p>
      </Prose>

      <SectionHeading eyebrow="Severity" title="Severity ratings" />
      <Prose>
        <table>
          <thead><tr><th>Severity</th><th>Example</th><th>SLA</th></tr></thead>
          <tbody>
            <tr><td><strong>Critical</strong></td><td>RCE, fund theft, mass data leak</td><td>30 days</td></tr>
            <tr><td><strong>High</strong></td><td>Admin auth bypass, HMAC bypass</td><td>60 days</td></tr>
            <tr><td><strong>Medium</strong></td><td>Rate limit bypass, info leak</td><td>90 days</td></tr>
            <tr><td><strong>Low</strong></td><td>Minor info disclosure, cosmetic</td><td>Next release</td></tr>
          </tbody>
        </table>
      </Prose>

      <SectionHeading eyebrow="Hall of fame" title="Acknowledged researchers" />
      <Prose>
        <p>
          Security vulnerabilities responsibly report karne wale researchers yahan list hote hain
          (with permission):
        </p>
        <ul>
          <li><em>No reports yet — be the first!</em></li>
        </ul>
      </Prose>

      <SectionHeading eyebrow="Past advisories" title="Past security fixes" />
      <Prose>
        <p>
          ZeroPaye pehle YouPI-PG ke based pe banaya — usme 105 audit findings the. Sab fixed in v1.0+:
        </p>
        <ul>
          <li><strong>v1.0.1:</strong> Admin auth added, HMAC made mandatory, SSRF guard, race conditions fixed</li>
          <li><strong>v1.1:</strong> DNS-based SSRF, input validation, idempotency keys, security headers</li>
          <li><strong>v1.2:</strong> QR route 410 for expired, /metrics endpoint, DB backup</li>
        </ul>
        <p>
          Full audit report: <a href="https://github.com/DKUMARGUPTA/ZeroPaye#security-by-design">README Security section</a>
        </p>
      </Prose>
    </PageLayout>
  );
}
