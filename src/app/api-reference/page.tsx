import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "API Reference — ZeroPaye REST Endpoints",
  description:
    "Full ZeroPaye API reference: 12 REST endpoints for UPI checkout, OTP, observer ingestion, webhooks, health, metrics. Request/response schemas, auth, rate limits, error codes.",
  path: "/api-reference",
  keywords: [
    "UPI API reference", "ZeroPaye REST API", "payment gateway API India",
    "webhook API", "HMAC API", "fintech API docs",
  ],
});

export default function ApiReferencePage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Resources", href: "/" }, { name: "API Reference", href: "/api-reference" }]}>
      <PageHero
        badge="API Reference"
        title="ZeroPaye REST API — 12 Endpoints"
        subtitle="Har endpoint ka spec: method, path, auth, request body, response schema, error codes, rate limits."
      />

      <SectionHeading eyebrow="Authentication" title="API keys aur auth model" />
      <Prose>
        <h3>Public API key (<code>zp_...</code>)</h3>
        <p>
          Customer-facing key. Website SDK mein use hota hai (<code>data-zeropaye-key</code> attribute).
          Yeh key <code>/api/zeropaye/bootstrap</code> (dev mode) ya admin API (prod) se milti hai.
        </p>
        <h3>Admin API key (<code>zp_...</code>)</h3>
        <p>
          Secret key. Protected endpoints (<code>GET /session</code>, <code>GET /merchant</code>,{" "}
          <code>POST /simulate-payment</code>) ke liye <code>x-zeropaye-admin-key</code> header mein
          bhejni padti hai. <strong>Yeh key kisi ko mat dein.</strong>
        </p>
        <h3>HMAC signature (observers)</h3>
        <p>
          Observer endpoints pe <code>x-device-id</code>, <code>x-timestamp</code>, <code>x-signature</code>{" "}
          headers mandatory hain. Signature = <code>hmac-sha256(signingKey, timestamp + "." + rawBody)</code>.
        </p>
      </Prose>

      <SectionHeading eyebrow="Endpoints" title="Checkout flow" />
      <Prose>
        <h3>POST <code>/api/zeropaye/session</code> — Create session</h3>
        <p><strong>Auth:</strong> Public. <strong>Rate limit:</strong> 10 req/s per IP.</p>
        <pre><code>{`// Request
{
  "orderId": "ORDER-1001",     // 1-35 chars alnum + dash/underscore
  "amount": 499.00,             // rupees (string or number)
  "currency": "INR",            // ISO 4217, default INR
  "description": "Pro plan",     // optional, max 200 chars
  "customerName": "Arjun"        // optional
}

// Response 200
{
  "session": {
    "id": "cmvd...", "orderId": "ORDER-1001",
    "amountPaise": 49900, "status": "INITIATED",
    ...
  },
  "merchant": { "publicApiKey": "zp_..." }
}`}</code></pre>

        <h3>POST <code>/api/zeropaye/send-otp</code> — Send OTP</h3>
        <p><strong>Auth:</strong> Public. <strong>Rate limit:</strong> 1 req/30s per mobile, 5 req/min per IP.</p>
        <pre><code>{`// Request
{ "mobile": "9876543210", "sessionId": "cmvd..." }

// Response 200
{
  "sent": true, "mobile": "9876543210",
  "demoOtp": "570628"  // only in dev mode (NODE_ENV !== production)
}`}</code></pre>

        <h3>POST <code>/api/zeropaye/verify-otp</code> — Verify OTP</h3>
        <p><strong>Auth:</strong> Public. <strong>Lockout:</strong> 5 wrong attempts → 15-min lock.</p>
        <pre><code>{`// Request
{ "mobile": "9876543210", "otp": "570628", "sessionId": "cmvd..." }

// Response 200 (slot acquired)
{ "verified": true, "session": { "status": "ACTIVE", ... } }

// Response 200 (queued)
{ "verified": true, "session": { "status": "QUEUED", "queuePosition": 1 } }`}</code></pre>

        <h3>GET <code>/api/zeropaye/status/[id]</code> — Get status</h3>
        <p><strong>Auth:</strong> Public. Auto-expires ACTIVE sessions past 5-min window.</p>
        <pre><code>{`// Response 200
{
  "session": { "id": "cmvd...", "status": "ACTIVE", "expiresAt": "..." },
  "account": { "vpa": "zeropaye.demo@upi", "isSlotBusy": true }
}`}</code></pre>

        <h3>POST <code>/api/zeropaye/confirm-paid</code> — ACTIVE → PROCESSING</h3>
        <p>Customer clicked "I've Paid". 30-second verify window starts.</p>

        <h3>POST <code>/api/zeropaye/simulate-payment</code> — Simulate bank credit</h3>
        <p><strong>Auth:</strong> Admin key required. <strong>Dev only:</strong> disabled in production.</p>
      </Prose>

      <SectionHeading eyebrow="Endpoints" title="Observer ingestion" />
      <Prose>
        <h3>POST <code>/api/zeropaye/observer</code> — HMAC-signed observation</h3>
        <p><strong>Auth:</strong> HMAC mandatory. <strong>Anti-replay:</strong> 60-second timestamp drift.</p>
        <pre><code>{`// Headers (all 3 mandatory)
x-device-id: dev_demo_observer_001
x-timestamp: 1700000000000  // epoch ms
x-signature: <hmac-sha256 hex>  // without or with "sha256=" prefix

// Body
{
  "source": "ANDROID_SMS",  // ANDROID_SMS | ANDROID_PUSH | GMAIL | SMS_GATEWAY | MANUAL
  "rawText": "...",          // optional
  "amountPaise": 49900,       // exact paise match required
  "utr": "123456789012",      // 12-digit bank reference
  "receivingAccountId": "...",
  "paymentSessionId": "..."  // optional
}`}</code></pre>
      </Prose>

      <SectionHeading eyebrow="Endpoints" title="Admin & monitoring" />
      <Prose>
        <h3>GET <code>/api/zeropaye/merchant</code> — Dashboard stats</h3>
        <p><strong>Auth:</strong> Admin key. Returns branding, account, devices, stats.</p>

        <h3>GET <code>/api/zeropaye/session</code> — List sessions</h3>
        <p><strong>Auth:</strong> Admin key. Returns last 50 sessions.</p>

        <h3>GET <code>/api/zeropaye/health</code> — Liveness + DB check</h3>
        <p><strong>Auth:</strong> Public. For load balancers, UptimeRobot, k8s probes.</p>
        <pre><code>{`{ "status": "ok", "service": "zeropaye", "version": "1.1.0", "uptimeMs": 12345 }`}</code></pre>

        <h3>GET <code>/api/zeropaye/metrics</code> — Prometheus metrics</h3>
        <p><strong>Auth:</strong> Public. Returns Prometheus-format counters + gauges.</p>

        <h3>GET <code>/api/zeropaye/qr/[id]</code> — Vector SVG QR</h3>
        <p><strong>Auth:</strong> Public. Returns SVG only for ACTIVE/PROCESSING sessions. 410 Gone otherwise.</p>
      </Prose>

      <SectionHeading eyebrow="Errors" title="Error response format" />
      <Prose>
        <pre><code>{`// All errors return:
{ "error": "Human-readable message" }

// Status codes:
400 — validation error
401 — missing/invalid auth (admin key, HMAC)
403 — forbidden (device not authorized, banned customer)
404 — session/account not found
409 — state conflict (e.g. session not ACTIVE)
410 — gone (QR for expired session)
429 — rate limited (retryAfter in body)
500 — server error
503 — service unavailable (DB down)`}</code></pre>
      </Prose>
    </PageLayout>
  );
}
