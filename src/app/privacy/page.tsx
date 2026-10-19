import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy — ZeroPaye Tracks Nothing",
  description:
    "ZeroPaye privacy policy: zero telemetry, zero tracking pixels, zero analytics, zero cookies. Your customer data stays on your server. We don't phone home. Self-hosted, AGPL-3.0, DPDP Act compliant by design.",
  path: "/privacy",
  keywords: ["privacy policy", "ZeroPaye privacy", "fintech privacy India", "DPDP Act", "no tracking", "no cookies"],
});

export default function PrivacyPage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Legal", href: "/" }, { name: "Privacy", href: "/privacy" }]}>
      <PageHero
        badge="Legal"
        title="Privacy Policy — hum track nahi karte"
        subtitle="Zero telemetry. Zero tracking pixels. Zero analytics. Zero cookies. Aapka data aapke server pe, humein nahi."
      />

      <div className="my-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-700 dark:text-emerald-300">
          ✅ TL;DR — ZeroPaye tracks nothing
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>• No Google Analytics, no Mixpanel, no Sentry telemetry</li>
          <li>• No cookies set on your visitors</li>
          <li>• No "phone home" — ZeroPaye server aapse hi talk karta hai</li>
          <li>• Aapka data aapke server pe — humein nahi bheja jaata</li>
          <li>• Self-host = full control = DPDP Act compliant by design</li>
        </ul>
      </div>

      <SectionHeading eyebrow="Data collection" title="Hum kya collect karte hain" />
      <Prose>
        <p>
          <strong>Directly: Nothing.</strong> ZeroPaye project (maintainer) aapse ya aapke customers
          se directly koi data collect nahi karta. Yeh ek self-hosted software hai — aap apne
          server pe chalate ho, aapka data aapke paas rehta hai.
        </p>
        <p>
          <strong>Indirectly: GitHub public stats.</strong> Hum GitHub repository ka star count,
          fork count, issue count — yeh public stats GitHub khud track karta hai. Hum isse control
          nahi karte.
        </p>
      </Prose>

      <SectionHeading eyebrow="Your data" title="Aapke server pe kya store hota hai" />
      <Prose>
        <p>Jab aap ZeroPaye self-host karte ho, aapke server pe yeh data store hota hai:</p>
        <ul>
          <li><strong>Customer mobile number</strong> (10-digit Indian) — OTP verification ke liye</li>
          <li><strong>Customer name</strong> (optional)</li>
          <li><strong>Payment sessions</strong> — orderId, amount, status, UTR, timestamps</li>
          <li><strong>Bank observations</strong> — parsed SMS/email text (max 2000 chars)</li>
          <li><strong>Audit logs</strong> — IP address, request ID, action</li>
          <li><strong>API keys</strong> — public + admin + webhook secret (hashed)</li>
        </ul>
        <p>
          Yeh sab data aapke SQLite/PostgreSQL database mein hai. ZeroPaye maintainers ka is data
          pe koi access nahi.
        </p>
      </Prose>

      <SectionHeading eyebrow="DPDP Act" title="India's DPDP Act 2023 compliance" />
      <Prose>
        <p>
          Digital Personal Data Protection Act 2023 ke under:
        </p>
        <ul>
          <li><strong>Data Principal:</strong> Aapke customers (jisne data diya)</li>
          <li><strong>Data Fiduciary:</strong> Aap (merchant jisne data collect kiya)</li>
          <li><strong>Significant Data Fiduciary:</strong> Volume threshold cross hone par</li>
        </ul>
        <p>
          ZeroPaye self-hosted hone ki wajah se <strong>aap Data Fiduciary ho</strong>. Aapko:
        </p>
        <ul>
          <li>Consent obtain karna hoga (checkout page pe notice display karein)</li>
          <li>Data retention policy define karni hai (v1.2 mein configurable)</li>
          <li>Data deletion request honor karne honge (right to erasure)</li>
          <li>Data breach notification (DPDP Section 8(6)) — 72 hours mein</li>
        </ul>
      </Prose>

      <SectionHeading eyebrow="Cookies" title="Cookies policy" />
      <Prose>
        <p>
          ZeroPaye <strong>koi cookie set nahi karta</strong>. Session management Bearer token
          (in DB) + Authorization header pe based hai — cookie nahi.
        </p>
        <p>
          <a href="/no-cookies">Detailed no-cookies policy →</a>
        </p>
      </Prose>

      <SectionHeading eyebrow="Data retention" title="Data kab tak store hota hai?" />
      <Prose>
        <p>
          By default: <strong>forever</strong> (jab tak aap delete na karein). v1.2 mein
          configurable retention policy aayega (e.g. 180 days).
        </p>
        <p>
          Manual deletion:
        </p>
        <pre><code>{`# Delete customer data older than 180 days
# (Coming in v1.2 as scheduled job)

# Manual: Prisma Studio
npx prisma studio
# Edit/Delete rows directly`}</code></pre>
      </Prose>

      <SectionHeading eyebrow="Your rights" title="Aapke rights" />
      <Prose>
        <p>
          DPDP Act ke under aapke customers ke rights:
        </p>
        <ul>
          <li>✅ Access — apna data dekh sakte hain</li>
          <li>✅ Correction — galat data correct karwa sakte hain</li>
          <li>✅ Erasure — data delete karwa sakte hain</li>
          <li>✅ Grievance redressal — complaint kar sakte hain</li>
          <li>✅ Nominate — death/disability pe data nominate kar sakte hain</li>
        </ul>
        <p>
          Self-hosted ZeroPaye mein aap in rights ko implement karte ho. Hum tools provide karte
          hain (v1.2 mein API endpoints).
        </p>
      </Prose>

      <SectionHeading eyebrow="Changes" title="Policy updates" />
      <Prose>
        <p>
          Yeh policy change ho sakti hai. Changes yeh page pe reflect honge. Major changes ke
          liye GitHub announcement + version bump.
        </p>
      </Prose>

      <SectionHeading eyebrow="Contact" title="Sawaal?" />
      <Prose>
        <p>
          Privacy-related sawaal:
        </p>
        <ul>
          <li>Facebook: <a href="https://www.facebook.com/ideepakkumargread">Deepak Kumar</a></li>
          <li>GitHub: <a href="https://github.com/DKUMARGUPTA/ZeroPaye/discussions">Discussions</a></li>
        </ul>
      </Prose>
    </PageLayout>
  );
}
