import type { Metadata } from "next";
import { buildMetadata, articleJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";
import { Developer } from "@/components/zeropaye/developer";

export const metadata: Metadata = buildMetadata({
  title: "Developer Guide — SDK, API, Webhooks (5-minute integration)",
  description:
    "Integrate ZeroPaye UPI payment gateway in 5 minutes. Drop-in SDK script, programmatic JS API, Node/Python/PHP/Go webhook verification snippets. Full API reference + architecture docs.",
  path: "/developers",
  keywords: [
    "UPI payment gateway API", "ZeroPaye SDK", "payment gateway integration India",
    "webhook HMAC verification", "Next.js payment gateway", "React UPI checkout",
    "open source payment API", "zp_ API key",
  ],
  ogType: "article",
});

const jsonLd = articleJsonLd({
  headline: "ZeroPaye Developer Guide — Integrate UPI Payments in 5 Minutes",
  description:
    "Complete developer integration guide: drop-in SDK, programmatic API, webhook verification in Node/Python/PHP/Go.",
  path: "/developers",
});

export default function DevelopersPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Product", href: "/" }, { name: "Developers", href: "/developers" }]}>
        <PageHero
          badge="Developer Guide"
          title="5 minute mein integrate karein"
          subtitle="Ek script tag se le kar full programmatic SDK tak — har stack ke liye code snippets. Node.js, Python, PHP, Go webhook verification."
        />

        <Prose>
          <p>
            ZeroPaye ko integrate karna bahut aasan hai. Teen options:
          </p>
          <ul>
            <li><strong>Option A:</strong> HTML drop-in script (static websites, Shopify, WordPress)</li>
            <li><strong>Option B:</strong> Programmatic <code>window.ZeroPaye.pay()</code> (React, Vue, Next.js)</li>
            <li><strong>Option C:</strong> Server-to-server API (backend session creation)</li>
          </ul>
        </Prose>

        <div className="my-10">
          <Developer />
        </div>

        <SectionHeading eyebrow="Quick start" title="Step-by-step setup" />
        <Prose>
          <h3>1. Install ZeroPaye</h3>
          <pre><code>{`git clone https://github.com/DKUMARGUPTA/ZeroPaye.git
cd ZeroPaye
bun install
cp .env.example .env
bun run db:push
bun run dev`}</code></pre>

          <h3>2. Get your API keys</h3>
          <p>
            Pehli baar server chalane par ZeroPaye automatically ek demo merchant banata hai. API keys
            (<code>zp_...</code> public, <code>zp_...</code> admin) <code>/api/zeropaye/bootstrap</code>{" "}
            endpoint se milte hain (dev mode only). Production mein secure onboarding flow se provision karte hain.
          </p>

          <h3>3. Add the SDK to your site</h3>
          <pre><code>{`<script src="https://pay.yourdomain.com/zeropaye.js"
        data-zeropaye-key="zp_your_public_key"
        data-currency="INR"></script>`}</code></pre>

          <h3>4. Add a pay button</h3>
          <pre><code>{`<button data-zeropaye-pay
        data-order-id="ORDER-1001"
        data-amount="499.00"
        data-description="Pro plan top-up">
  Buy Now with ZeroPaye
</button>`}</code></pre>

          <h3>5. Verify webhooks on your backend</h3>
          <p>
            Order fulfill karne ke liye <strong>sirf webhook</strong> par bharosa karo, frontend events par nahi.
            Webhook signature <code>hmac-sha256(webhookSecret, rawBody)</code> hota hai.
          </p>
        </Prose>

        <SectionHeading eyebrow="API Reference" title="Endpoints summary" />
        <Prose>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Purpose</th>
                <th>Auth</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>POST</td><td><code>/api/zeropaye/session</code></td><td>Create checkout session</td><td>Public</td></tr>
              <tr><td>POST</td><td><code>/api/zeropaye/send-otp</code></td><td>Send WhatsApp OTP</td><td>Public</td></tr>
              <tr><td>POST</td><td><code>/api/zeropaye/verify-otp</code></td><td>Verify OTP, acquire slot</td><td>Public</td></tr>
              <tr><td>GET</td><td><code>/api/zeropaye/status/[id]</code></td><td>Get session status</td><td>Public</td></tr>
              <tr><td>POST</td><td><code>/api/zeropaye/confirm-paid</code></td><td>ACTIVE → PROCESSING</td><td>Public</td></tr>
              <tr><td>POST</td><td><code>/api/zeropaye/observer</code></td><td>Bank observation ingest</td><td>HMAC</td></tr>
              <tr><td>POST</td><td><code>/api/zeropaye/simulate-payment</code></td><td>Simulate bank credit (dev)</td><td>Admin</td></tr>
              <tr><td>GET</td><td><code>/api/zeropaye/merchant</code></td><td>Dashboard stats</td><td>Admin</td></tr>
              <tr><td>GET</td><td><code>/api/zeropaye/session</code></td><td>List sessions</td><td>Admin</td></tr>
              <tr><td>GET</td><td><code>/api/zeropaye/qr/[id]</code></td><td>Vector SVG QR</td><td>Public</td></tr>
              <tr><td>GET</td><td><code>/api/zeropaye/health</code></td><td>Liveness + DB check</td><td>Public</td></tr>
              <tr><td>GET</td><td><code>/api/zeropaye/metrics</code></td><td>Prometheus metrics</td><td>Public</td></tr>
            </tbody>
          </table>
        </Prose>

        <SectionHeading eyebrow="Next steps" title="Aur padhein" />
        <Prose>
          <ul>
            <li><a href="/api-reference">Full API reference</a> — har endpoint ka detailed spec</li>
            <li><a href="/architecture">Architecture deep-dive</a> — state machine, invariants, observation mesh</li>
            <li><a href="/self-host-guide">Self-host guide</a> — VPS setup, PM2, HTTPS, backups</li>
            <li><a href="/white-label">White-label branding</a> — custom domain, logo, colors</li>
          </ul>
        </Prose>
      </PageLayout>
    </>
  );
}
