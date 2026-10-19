import type { Metadata } from "next";
import { buildMetadata, articleJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "Architecture — State Machine, Invariants, Observation Mesh",
  description:
    "ZeroPaye architecture: 8 invariants (integer paise, server-authoritative timers, single-slot FIFO), state machine (INITIATED→SUCCESS), tri-channel banking observation mesh, HMAC webhook contract.",
  path: "/architecture",
  keywords: [
    "payment gateway architecture", "UPI state machine", "FIFO queue payment",
    "banking observation mesh", "ZeroPaye architecture", "fintech system design",
  ],
  ogType: "article",
});

const jsonLd = articleJsonLd({
  headline: "ZeroPaye Architecture — Invariants, State Machine, Observation Mesh",
  description: "Deep-dive into ZeroPaye's 8 architectural invariants, payment state machine, and tri-channel banking observation mesh.",
  path: "/architecture",
});

const INVARIANTS = [
  { num: 1, title: "Integer paise arithmetic", desc: "₹499.00 = 49900 paise (Int). Floating-point drift impossible." },
  { num: 2, title: "Server-authoritative dual timers", desc: "5-min pay + 30-sec verify, server-side. Refresh/reboot/hack-proof." },
  { num: 3, title: "Pure vector SVG QR", desc: "ISO/IEC 18004 compliant. No Google Charts. Sub-second." },
  { num: 4, title: "Single-slot FIFO queue", desc: "Exactly ONE active session per VPA. Eliminates amount-collision." },
  { num: 5, title: "Gateway-owned customer OTP", desc: "Gateway verifies phone before slot. Eliminates spoofing." },
  { num: 6, title: "Raw-body HMAC-SHA256 webhook", desc: "Idempotent via delivery_id. Polyglot verify snippets." },
  { num: 7, title: "Observation fingerprint dedup", desc: "SHA-256(account + amount + UTR + timeBucket) unique." },
  { num: 8, title: "Crash recovery", desc: "Stale sessions expire on next session creation + background sweep." },
];

export default function ArchitecturePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Resources", href: "/" }, { name: "Architecture", href: "/architecture" }]}>
        <PageHero
          badge="System Architecture"
          title="ZeroPaye kaise kaam karta hai"
          subtitle="8 architectural invariants, ek deterministic state machine, aur tri-channel banking observation mesh — sab milke 100% exact payment matching guarantee."
        />

        <SectionHeading eyebrow="Flow" title="Payment lifecycle (8 steps)" />
        <Prose>
          <pre><code>{`1. Customer checkout click
       ↓
2. ZeroPaye session banata hai (INITIATED)
       ↓
3. WhatsApp/email OTP bhejta hai (AUTH_PENDING)
       ↓
4. Customer OTP verify karta hai (AUTHENTICATED)
       ↓
5. Slot acquisition (FIFO queue):
   - VPA slot free? → ACTIVE (5-min pay window)
   - VPA busy? → QUEUED (position #1, #2...)
       ↓
6. QR code dikhata hai (pure vector SVG, ISO/IEC 18004)
       ↓
7. Customer kisi bhi UPI app se scan + pay
   (GPay, PhonePe, Paytm, BHIM, Amazon Pay, CRED)
       ↓
8. Paisa seedhe merchant ke bank account mein (P2P UPI)
       ↓
9. Banking Observation Mesh payment detect karta hai:
   - Android app: Bank SMS + push notification
   - Gmail observer: Bank credit email
   - Google Messages Web: SMS web read
       ↓
10. Observation Normalizer:
   - Amount match (exact paise)
   - UTR (12-digit bank reference) extract
   - HMAC signature verify (constant-time)
   - Anti-replay check (60-second window)
   - Cluster hash dedup (duplicate collapse)
       ↓
11. Session: PROCESSING → SUCCESS
       ↓
12. VPA slot free → next QUEUED customer promote
       ↓
13. HMAC-SHA256 webhook merchant ke server pe
       ↓
14. Merchant order fulfill karta hai (webhook verify)`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="State machine" title="Session lifecycle states" />
        <Prose>
          <pre><code>{`INITIATED → AUTH_PENDING → AUTHENTICATED → (ACTIVE | QUEUED)
                                                    ↓
                                              ACTIVE (5 min)
                                                    ↓
                                              PROCESSING (30 sec)
                                                    ↓
                  SUCCESS | FAILED | EXPIRED | CANCELLED | SUSPICIOUS | BLOCKED`}</code></pre>
          <p>
            <strong>Sab timers server-side compute hote hai.</strong> Browser refresh karo,
            server restart karo, hack karne ki koshish karo — timer wahi rahega. Client-side
            timers sirf display hai, source of truth server hai.
          </p>
        </Prose>

        <SectionHeading eyebrow="Invariants" title="8 architectural principles" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {INVARIANTS.map((inv) => (
            <div key={inv.num} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-white">
                  {inv.num}
                </span>
                <div>
                  <h4 className="text-sm font-bold">{inv.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{inv.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <SectionHeading eyebrow="Observation mesh" title="Tri-channel verification" />
        <Prose>
          <p>
            ZeroPaye payments ko teen different sources se verify karta hai — redundant aur tamper-proof:
          </p>
          <h3>Layer 1: Android Observer (primary)</h3>
          <p>
            Kotlin foreground service (<code>com.zeropaye.observer</code>) bank SMS + push notifications
            capture karta hai. Ephemeral QR enrollment, HMAC-SHA256 payload signing, 60-second anti-replay.
            Battery-optimized, 24/7 chalta hai.
          </p>
          <h3>Layer 2: Gmail Observer (backup)</h3>
          <p>
            Google Cloud OAuth2 API se bank credit emails parse karta hai (HDFC, ICICI, SBI, Axis, Kotak, PNB).
            Headless Chrome CDP fallback option bhi hai.
          </p>
          <h3>Layer 3: Google Messages Web (tertiary)</h3>
          <p>
            Headless Chrome DevTools Protocol se Google Messages for Web (<code>messages.google.com/web</code>)
            pe cellular SMS read karta hai. Real-time DOM text extraction.
          </p>
          <h3>Multi-tier verification (L1/L2/L3)</h3>
          <p>
            Agar ek channel confirm karta hai → <strong>L1</strong>. Do channels → <strong>L2</strong>.
            Teeno channels → <strong>L3</strong>. Zyada channels = zyada confidence.
          </p>
        </Prose>

        <SectionHeading eyebrow="Database" title="Schema overview" />
        <Prose>
          <p>
            9 Prisma models, SQLite WAL mode (production mein PostgreSQL option):
          </p>
          <ul>
            <li><code>Merchant</code> — businessName, publicApiKey, adminApiKey, webhookSecret, branding</li>
            <li><code>ReceivingAccount</code> — VPA, isSlotBusy (single-slot flag), dailyLimitPaise</li>
            <li><code>Customer</code> — mobileNumber, name, riskTier, isBanned</li>
            <li><code>CustomerSession</code> — token, expiresAt, userAgent, ipAddress</li>
            <li><code>PaymentSession</code> — orderId, amountPaise, status, queuePosition, utr</li>
            <li><code>Observation</code> — source, parsedAmountPaise, parsedUtr, clusterHash (unique)</li>
            <li><code>Device</code> — deviceId, signingKeyHash (SHA-256, not plaintext), isActive</li>
            <li><code>AuditLog</code> — entityType, action, actorType, ipAddress, requestId</li>
            <li><code>WebhookDelivery</code> — deliveryId (uuid, unique), status, attempts, nextRetryAt</li>
          </ul>
        </Prose>

        <SectionHeading eyebrow="Production" title="Scaling aur reliability" />
        <Prose>
          <h3>Single-instance (current)</h3>
          <p>
            SQLite WAL mode + in-memory rate limiter + OTP store. 10 TPS tak handle karta hai.
            Single-merchant self-host ke liye perfect.
          </p>
          <h3>Multi-instance (v1.2+)</h3>
          <p>
            PostgreSQL + Redis-backed rate limiter + Redis OTP store. Load balancer ke peeche
            N instances. Horizontal scaling.
          </p>
          <h3>Background workers (v1.1+)</h3>
          <p>
            Webhook retry daemon (60s poll, exponential backoff, max 10 attempts), stale-session sweep
            (60s), observer heartbeat check (120s). <code>instrumentation.ts</code> se auto-start.
          </p>
        </Prose>
      </PageLayout>
    </>
  );
}
