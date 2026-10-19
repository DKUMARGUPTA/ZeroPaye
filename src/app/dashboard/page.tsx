import type { Metadata } from "next";
import { buildMetadata, softwareAppJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";
import { Dashboard } from "@/components/zeropaye/dashboard";

export const metadata: Metadata = buildMetadata({
  title: "Merchant Dashboard — Live Transactions, VPA Slots, Observers",
  description:
    "ZeroPaye merchant dashboard: live payment tracking, VPA slot status, observer health, white-label branding, fees-saved analytics. Self-hosted, 100% open-source, zero fees.",
  path: "/dashboard",
  keywords: [
    "merchant dashboard", "payment gateway dashboard India",
    "live transaction tracking", "VPA slot status", "UPI payment analytics",
    "white-label branding", "self-hosted dashboard",
  ],
});

const jsonLd = softwareAppJsonLd({
  name: "ZeroPaye Merchant Dashboard",
  description:
    "Self-hosted merchant dashboard with live transactions, VPA slot management, observer health, and white-label branding.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Product", href: "/" }, { name: "Dashboard", href: "/dashboard" }]}>
        <PageHero
          badge="Merchant Dashboard"
          title="Ek panel, sab kuch — live aur self-hosted"
          subtitle="Live transactions, VPA slot status, observer health, white-label branding, aur fees-saved analytics — sab aapke control mein."
        />

        <div className="my-10">
          <Dashboard />
        </div>

        <SectionHeading eyebrow="Features" title="Dashboard mein kya-kya hai?" />
        <Prose>
          <h3>📊 Live Transaction Tracking</h3>
          <p>
            Har payment session ka real-time status — <code>INITIATED</code> → <code>AUTH_PENDING</code> →{" "}
            <code>AUTHENTICATED</code> → <code>ACTIVE</code> / <code>QUEUED</code> → <code>PROCESSING</code> →{" "}
            <code>SUCCESS</code> / <code>FAILED</code> / <code>EXPIRED</code>. Har status transition server-side
            compute hota hai, audit log mein record hota hai.
          </p>

          <h3>🔄 VPA Slot Status</h3>
          <p>
            Single-slot FIFO invariant ka live view — kaunsa VPA abhi busy hai, kitne customers queued hain,
            aur kis position pe. Yeh UPI ki limitation hai (SMS mein order-id nahi hota), aur ZeroPaye isse
            deterministic amount matching ke saath solve karta hai.
          </p>

          <h3>📱 Observer Health</h3>
          <p>
            Android Observer (SMS + push notifications), Gmail Observer (email parsing), aur Google Messages
            Web Observer — teeno channels ka live status. Device offline hua toh dashboard pe turant dikhega.
          </p>

          <h3>🎨 White-Label Branding</h3>
          <p>
            Custom brand name, tagline, accent color, default VPA — sab dashboard se set karein. 100% white-label,
            koi "Powered by ZeroPaye" badge nahi. Aapka brand, aapka domain, aapka control.
          </p>

          <h3>💰 Fees-Saved Analytics</h3>
          <p>
            Dashboard batata hai ki traditional aggregator (Razorpay/Cashfree) ke 2.2% fee ke against mein
            ZeroPaye ne aapka kitna paisa bachaya. ₹5,00,000 monthly volume pe ~₹13,000/month bachat —
            saal mein ₹1,56,000.
          </p>

          <h3>🔑 API Keys Management</h3>
          <p>
            Public API key (<code>zp_...</code>) website integration ke liye, admin API key protected routes
            ke liye. Admin key kisi ko mat dein — yeh aapke merchant account ka "password" hai.
          </p>
        </Prose>

        <SectionHeading eyebrow="Operations" title="Daily workflow" />
        <Prose>
          <ol>
            <li><strong>Subah:</strong> Dashboard kholiye, observer online check karein.</li>
            <li><strong>Day:</strong> Customer payments aate rahenge — dashboard pe live dikhega.</li>
            <li><strong>Sham:</strong> "Total Settled" dekhiye, bank statement se match karein.</li>
            <li><strong>Friday:</strong> "Fees Saved" check karein — kitna bacha hisaab rakhne ke liye.</li>
          </ol>
        </Prose>
      </PageLayout>
    </>
  );
}
