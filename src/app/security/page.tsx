import type { Metadata } from "next";
import { buildMetadata, articleJsonLd, faqJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";
import { Security } from "@/components/zeropaye/security";

export const metadata: Metadata = buildMetadata({
  title: "Security — HMAC, OTP, SSRF, Audit Log Architecture",
  description:
    "ZeroPaye security architecture: mandatory HMAC-SHA256 observer verification, crypto.randomInt OTP with 15-min lockout, DNS-based SSRF guard, admin API key auth, integer paise arithmetic. Audited after 105 findings.",
  path: "/security",
  keywords: [
    "payment gateway security", "HMAC-SHA256 verification", "UPI security",
    "OTP brute-force protection", "SSRF guard", "zero fee payment security",
    "open source fintech security", "India UPI security",
  ],
  ogType: "article",
});

const articleJsonLdData = articleJsonLd({
  headline: "ZeroPaye Security Architecture — How We Protect Your Payments",
  description:
    "Deep dive into ZeroPaye's security: HMAC observer verification, OTP crypto, SSRF guards, admin auth, audit logging.",
  path: "/security",
});

const faqs = [
  {
    q: "Kya ZeroPaye ka admin API key safe hai?",
    a: "Haan. Admin API key crypto.randomBytes(24) se banta hai, constant-time comparison se verify hota hai, aur kabhi GET response mein return nahi hota (audit S8 fix).",
  },
  {
    q: "Observer HMAC verification mandatory hai?",
    a: "Haan. Observer route (POST /api/zeropaye/observer) bina x-device-id, x-timestamp, x-signature headers ke reject ho jaata hai. 60-second anti-replay window. Constant-time compare.",
  },
  {
    q: "OTP kaise generate hota hai?",
    a: "crypto.randomInt() (CSPRNG) se 6-digit OTP banta hai. SHA-256 hash store hota hai (plaintext nahi). 5 galat attempts ke baad 15-minute lockout. Math.random() use nahi hota.",
  },
  {
    q: "SSRF attack se kaise bachav hai?",
    a: "Webhook targets pe DNS-based SSRF guard lagta hai — hostname resolve karke sabhi IPs check karta hai. Private/loopback/metadata IPs (169.254.169.254 jaise AWS IMDS) blocked.",
  },
  {
    q: "Floating-point money errors possible hai?",
    a: "Nahi. Sab amounts integer paise mein store hote hai (₹499.00 = 49900 paise). Floating-point rounding drift mathematically impossible hai.",
  },
];

const faqJsonLdData = faqJsonLd(faqs);

export default function SecurityPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLdData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLdData) }} />
      <PageLayout breadcrumbs={[{ name: "Product", href: "/" }, { name: "Security", href: "/security" }]}>
        <PageHero
          badge="Security by Design"
          title="ZeroPaye Security Architecture"
          subtitle="105 audit findings (13 CRITICAL) ko fix karke banaya gaya. Har boundary hardened. Har crypto primitive correct. Har transaction deterministic."
        />

        <Prose>
          <p>
            ZeroPaye ko humne ek <strong>deep security audit</strong> ke baad banaya hai. Original codebase
            (YouPI-PG) mein 105 issues mile the — 13 CRITICAL, 13 HIGH, 7 MEDIUM. Humne sab fix kiye aur
            har finding ka before/after document kiya.
          </p>
        </Prose>

        <div className="my-10">
          <Security />
        </div>

        <SectionHeading eyebrow="Threat model" title="Kis-kis attack se bachav hai?" />
        <Prose>
          <h3>🔐 Authentication Attacks</h3>
          <ul>
            <li><strong>Admin API key brute-force:</strong> Constant-time comparison (timingSafeEqual). Length-mismatch early-return for fixed-length keys only.</li>
            <li><strong>OTP brute-force:</strong> 5 attempts per mobile, 15-minute lockout. Per-IP + per-mobile rate limiting.</li>
            <li><strong>Session fixation:</strong> Bearer token (cuid) generated server-side, stored in DB with expiry.</li>
          </ul>

          <h3>💰 Financial Attacks</h3>
          <ul>
            <li><strong>Fake payment confirmation:</strong> Observer HMAC mandatory (was optional in YouPI-PG). Fake SMS can't confirm payments.</li>
            <li><strong>Amount collision:</strong> Single-slot FIFO queue — ek VPA pe ek time pe ek payment. Eliminates ambiguity.</li>
            <li><strong>Double-confirm race:</strong> Conditional updateMany in Prisma transaction (BEGIN IMMEDIATE). Two parallel calls can't both succeed.</li>
            <li><strong>Replay attack:</strong> 60-second timestamp drift window on observer payload. Cluster hash dedup on observations.</li>
          </ul>

          <h3>🌐 Network Attacks</h3>
          <ul>
            <li><strong>SSRF:</strong> DNS-based guard resolves hostname, checks all IPs against private/loopback/metadata blocklist. AWS/GCP/Azure IMDS blocked.</li>
            <li><strong>CORS:</strong> Same-origin allow-list (never <code>*</code>). Payment gateway APIs don't need cross-origin.</li>
            <li><strong>Security headers:</strong> CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.</li>
          </ul>

          <h3> injection Attacks</h3>
          <ul>
            <li><strong>SQL injection:</strong> Prisma ORM — parameterized queries throughout. No raw SQL.</li>
            <li><strong>XSS:</strong> React escapes all output. CSP restricts script sources.</li>
            <li><strong>Input validation:</strong> orderId (1-35 chars, alnum + dash/underscore, NPCI spec), currency (ISO 4217), VPA (strict regex), mobile (10-digit Indian, +91 normalization).</li>
          </ul>
        </Prose>

        <SectionHeading eyebrow="Audit" title="FAQ — Security sawaal" />
        <Prose>
          {faqs.map((f, i) => (
            <div key={i}>
              <h4>{f.q}</h4>
              <p>{f.a}</p>
            </div>
          ))}
        </Prose>

        <SectionHeading eyebrow="Responsible disclosure" title="Vulnerability report kaise karein?" />
        <Prose>
          <p>
            Agar aapko ZeroPaye mein koi security vulnerability milti hai, toh{" "}
            <a href="/security-disclosure">hamara disclosure policy padhein</a> aur responsibly report karein.
            Hum 48 hours mein acknowledge karte hain aur 90 days mein fix karte hain.
          </p>
        </Prose>
      </PageLayout>
    </>
  );
}
