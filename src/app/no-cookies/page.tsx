import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";

export const metadata: Metadata = buildMetadata({
  title: "No Cookies Policy — ZeroPaye Uses Zero Cookies",
  description:
    "ZeroPaye sets zero cookies on your visitors. Session management uses Bearer tokens in DB, not browser cookies. No tracking, no analytics, no consent banner needed. GDPR/DPDP friendly by design.",
  path: "/no-cookies",
  keywords: ["no cookies policy", "ZeroPaye cookies", "cookie-free payment gateway", "GDPR cookies", "DPDP cookies"],
});

export default function NoCookiesPage() {
  return (
    <PageLayout breadcrumbs={[{ name: "Legal", href: "/" }, { name: "No Cookies", href: "/no-cookies" }]}>
      <PageHero
        badge="Legal"
        title="No Cookies Policy — zero cookies, zero consent banner"
        subtitle="ZeroPaye koi cookie set nahi karta. Session management Bearer tokens (DB) + Authorization headers pe based hai."
      />

      <div className="my-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-700 dark:text-emerald-300">
          ✅ Summary: Zero cookies
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>• No session cookies</li>
          <li>• No tracking cookies</li>
          <li>• No analytics cookies</li>
          <li>• No advertising cookies</li>
          <li>• No consent banner needed</li>
        </ul>
      </div>

      <SectionHeading eyebrow="How sessions work" title="Cookies ke bina session kaise?" />
      <Prose>
        <p>
          ZeroPaye <strong>Bearer token</strong> approach use karta hai:
        </p>
        <ol>
          <li>Customer OTP verify karta hai</li>
          <li>ZeroPaye ek opaque token generate karta hai (<code>csess_...</code> cuid)</li>
          <li>Token DB mein store hota hai with expiry</li>
          <li>Token <code>Authorization: Bearer csess_...</code> header mein bheja jaata hai</li>
          <li>Browser cookie set nahi hoti — frontend localStorage use karta hai (optional)</li>
        </ol>
        <p>
          Iska fayda: <strong>CORS safe, CSRF-proof, cross-site attacks immune.</strong>
        </p>
      </Prose>

      <SectionHeading eyebrow="Third-party" title="Third-party cookies" />
      <Prose>
        <p>
          ZeroPaye koi third-party service use nahi karta jo cookies set kare:
        </p>
        <ul>
          <li>❌ No Google Analytics</li>
          <li>❌ No Mixpanel</li>
          <li>❌ No Facebook Pixel</li>
          <li>❌ No Google Tag Manager</li>
          <li>❌ No Sentry (you can self-host Sentry if you want)</li>
          <li>❌ No Cloudflare analytics</li>
        </ul>
        <p>
          Aap khud self-host kar rahe ho — koi external dependency nahi.
        </p>
      </Prose>

      <SectionHeading eyebrow="SDK" title="zeropaye.js SDK cookies?" />
      <Prose>
        <p>
          ZeroPaye ka JavaScript SDK (<code>zeropaye.js</code>) bhi koi cookie set nahi karta.
          Yeh sirf:
        </p>
        <ul>
          <li>Modal UI render karta hai (DOM elements)</li>
          <li>API calls karta hai (<code>fetch</code>)</li>
          <li>PostMessage events handle karta hai</li>
        </ul>
        <p>
          Koi <code>document.cookie</code> use nahi. Koi localStorage bhi use nahi (state in-memory only).
        </p>
      </Prose>

      <SectionHeading eyebrow="Compliance" title="GDPR / DPDP compliance" />
      <Prose>
        <p>
          Cookies na hone ki wajah se:
        </p>
        <ul>
          <li>✅ <strong>GDPR ePrivacy Directive:</strong> Consent banner ki zarurat nahi (no cookies = no tracking = no consent needed)</li>
          <li>✅ <strong>DPDP Act 2023:</strong> Cookie-related consent requirement nahi</li>
          <li>✅ <strong>CCPA:</strong> "Do Not Sell" notice zaroori nahi (no data selling)</li>
          <li>✅ <strong>IT Act 2000:</strong> Cookies ka data collection nahi</li>
        </ul>
        <p>
          Aap apne customers ko confidently bata sakte ho: <em>"Hum cookies use nahi karte."</em>
        </p>
      </Prose>

      <SectionHeading eyebrow="Verification" title="Aap khud verify karein" />
      <Prose>
        <p>
          Browser DevTools kholein → Application tab → Cookies → aapka domain. ZeroPaye ke
          koi cookies nahi milenge.
        </p>
        <pre><code>{`# Network tab mein API requests check karein
# Response headers mein Set-Cookie nahi hoga
# Request headers mein Authorization: Bearer csess_... hoga`}</code></pre>
      </Prose>

      <SectionHeading eyebrow="Exception" title="Agar aap cookies add karna chahein" />
      <Prose>
        <p>
          Aap ZeroPaye ko modify karke cookies add kar sakte ho (AGPL allows), lekin:
        </p>
        <ul>
          <li>Consent banner implement karna hoga</li>
          <li>Privacy policy update karni hoga</li>
          <li>DPDP Act requirements follow karne honge</li>
        </ul>
        <p>
          Hum recommend nahi karte — Bearer token approach better hai.
        </p>
      </Prose>
    </PageLayout>
  );
}
