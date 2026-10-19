import type { Metadata } from "next";
import { buildMetadata, articleJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "White-Label Branding — Custom Domain, Logo, Colors",
  description:
    "ZeroPaye white-label guide: 100% your brand, no 'Powered by' badges. Custom domain (pay.yourbrand.com), logo, accent colors, gradients, trust badges. Free, open-source, AGPL-3.0.",
  path: "/white-label",
  keywords: [
    "white-label payment gateway", "custom UPI branding", "ZeroPaye white-label",
    "rebrand payment gateway India", "private label fintech", "custom domain payment",
  ],
  ogType: "article",
});

const jsonLd = articleJsonLd({
  headline: "ZeroPaye White-Label Branding — Your Brand, Your Domain, No Attribution",
  description: "Complete guide to white-labeling ZeroPaye: custom domain, logo, colors, trust badges.",
  path: "/white-label",
});

export default function WhiteLabelPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Resources", href: "/" }, { name: "White-Label", href: "/white-label" }]}>
        <PageHero
          badge="White-Label"
          title="100% aapka brand, zero attribution"
          subtitle="Custom domain, logo, colors, trust badges — sab free. Koi 'Powered by ZeroPaye' badge nahi. Aapka customer aapko trust karega, humein nahi."
        />

        <SectionHeading eyebrow="What you control" title="Branding options" />
        <Prose>
          <table>
            <thead><tr><th>Field</th><th>Default</th><th>Custom example</th></tr></thead>
            <tbody>
              <tr><td>Brand name</td><td>ZeroPaye</td><td>Sharma Kirana Store</td></tr>
              <tr><td>Tagline</td><td>Zero • Empowering • Reliable • Open • Payé</td><td>Aapka apna dukaan</td></tr>
              <tr><td>Accent color</td><td>#0d9488 (teal)</td><td>#d97706 (amber) ya #dc2626 (red)</td></tr>
              <tr><td>Gradient</td><td>teal → cyan</td><td>amber → red, blue → purple, etc.</td></tr>
              <tr><td>Logo</td><td>ZeroPaye shield</td><td>Upload your SVG/PNG</td></tr>
              <tr><td>Domain</td><td>pay.yourdomain.com</td><td>pay.sharmastore.in</td></tr>
              <tr><td>Favicon</td><td>ZeroPaye shield</td><td>Your logo</td></tr>
              <tr><td>Trust badges</td><td>Default fintech badges</td><td>Custom or remove</td></tr>
            </tbody>
          </table>
        </Prose>

        <SectionHeading eyebrow="Custom domain" title="Apna domain setup karein" />
        <Prose>
          <h3>Step 1: DNS record add karein</h3>
          <pre><code>{`# In your DNS provider (Cloudflare, GoDaddy, etc.)
Type:  A
Name:  pay (for pay.yourdomain.com)
Value: <your-VPS-IP-address>
TTL:   3600 (1 hour)`}</code></pre>

          <h3>Step 2: Caddyfile update</h3>
          <pre><code>{`pay.yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
}`}</code></pre>
          <p>
            Caddy automatically Let's Encrypt certificate provision karega. 2-3 minute mein HTTPS live.
          </p>

          <h3>Step 3: ZeroPaye mein domain set karein</h3>
          <p>
            v1.2 mein admin UI se set kar sakte hain. Abhi directly DB edit ya{" "}
            <code>merchants.branding</code> JSON update karein:
          </p>
          <pre><code>{`// Update via admin API (coming in v1.2)
// Or directly via Prisma Studio
npx prisma studio

// Edit Merchant.branding JSON:
{
  "brandName": "Sharma Kirana Store",
  "tagline": "Aapka apna dukaan",
  "accentColor": "#d97706",
  "gradientFrom": "#d97706",
  "gradientTo": "#92400e",
  "logoText": "SKS",
  "logoUrl": "https://sharmastore.in/logo.svg"
}`}</code></pre>
        </Prose>

        <SectionHeading eyebrow="Custom logo" title="Apna logo upload karein" />
        <Prose>
          <p>
            Logo SVG ya PNG format mein hona chahiye. Recommended: 512x512px, transparent background.
          </p>
          <pre><code>{`# Place your logo in public/ folder
cp /path/to/your-logo.svg public/brand-logo.svg

# Update merchants.branding.logoUrl:
"logoUrl": "https://pay.yourdomain.com/brand-logo.svg"`}</code></pre>
          <p>
            Logo checkout modal ke header mein, dashboard mein, aur outcome pages mein dikhega.
          </p>
        </Prose>

        <SectionHeading eyebrow="Custom colors" title="Apni brand colors" />
        <Prose>
          <p>
            Accent color + gradient har interactive element pe apply hoga — buttons, links,
            progress bars, QR border, success states. Color picker se hex code copy karein:
          </p>
          <ul>
            <li><strong>Teal (default):</strong> <code>#0d9488</code> → <code>#0891b2</code></li>
            <li><strong>Amber:</strong> <code>#d97706</code> → <code>#92400e</code></li>
            <li><strong>Rose:</strong> <code>#dc2626</code> → <code>#991b1b</code></li>
            <li><strong>Violet:</strong> <code>#7c3aed</code> → <code>#5b21b6</code></li>
            <li><strong>Emerald:</strong> <code>#059669</code> → <code>#047857</code></li>
            <li><strong>Indigo:</strong> <code>#4f46e5</code> → <code>#3730a3</code></li>
          </ul>
        </Prose>

        <SectionHeading eyebrow="SDK branding" title="Checkout modal customize" />
        <Prose>
          <p>
            <code>zeropaye.js</code> SDK mein bhi branding pass kar sakte hain:
          </p>
          <pre><code>{`window.ZeroPaye.pay({
  order_id: 'ORDER-1001',
  amount: 499.00,
  name: 'Sharma Kirana Store',  // ← shown in modal header
  description: 'Wheat Flour 5kg',
  // ...
});`}</code></pre>
          <p>
            Modal title mein <code>name</code> field show hoga, ZeroPaye ka naam nahi.
          </p>
        </Prose>

        <SectionHeading eyebrow="No attribution" title="'Powered by' badge remove karna" />
        <Prose>
          <p>
            ZeroPaye AGPL-3.0 licensed hai. License terms:
          </p>
          <ul>
            <li>✅ <strong>UI mein "Powered by ZeroPaye" hatana allowed hai.</strong> No attribution badge required in the customer-facing UI.</li>
            <li>⚠️ <strong>Source code mein license headers rakhne padenge.</strong> Agar aap code modify karke distribute karte ho, AGPL notice rakhna padega.</li>
            <li>⚠️ <strong>Network service chala rahe ho toh modified code publicly available karna padega.</strong> AGPL ka "network copyleft" rule.</li>
          </ul>
          <p>
            Simple words mein: aapke customers ko pata hi nahi chalega ki ZeroPaye use ho raha hai.
            Lekin agar aap code badalte ho, toh badla hua code public karna padega.
          </p>
        </Prose>

        <SectionHeading eyebrow="Examples" title="Asli dukaan ke examples" />
        <Prose>
          <h3>🏪 Kirana store</h3>
          <pre><code>{`{
  "brandName": "Sharma Kirana",
  "tagline": "Fresh, daily",
  "accentColor": "#16a34a",
  "gradientFrom": "#16a34a",
  "gradientTo": "#15803d"
}`}</code></pre>

          <h3>🎨 Freelance designer</h3>
          <pre><code>{`{
  "brandName": "Arjun Design Studio",
  "tagline": "Pixel-perfect work",
  "accentColor": "#7c3aed",
  "gradientFrom": "#7c3aed",
  "gradientTo": "#5b21b6"
}`}</code></pre>

          <h3>🚀 Tech startup</h3>
          <pre><code>{`{
  "brandName": "Acme SaaS",
  "tagline": "Scale faster",
  "accentColor": "#0d9488",
  "gradientFrom": "#0d9488",
  "gradientTo": "#0891b2"
}`}</code></pre>
        </Prose>
      </PageLayout>
    </>
  );
}
