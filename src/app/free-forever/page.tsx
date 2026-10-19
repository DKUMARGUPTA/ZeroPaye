import type { Metadata } from "next";
import { buildMetadata, faqJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";
import { FreeForever } from "@/components/zeropaye/free-forever";

export const metadata: Metadata = buildMetadata({
  title: "Free Forever — ₹0/month, 0% Transaction Fees, AGPL-3.0",
  description:
    "ZeroPaye is free for everyone, forever. ₹0/month per merchant. 0% transaction fees. Unlimited volume. All features unlocked. No telemetry. AGPL-3.0 licensed. No 'Pro tier' paywall.",
  path: "/free-forever",
  keywords: [
    "free payment gateway", "zero fee UPI", "open source payment gateway India",
    "AGPL payment gateway", "free UPI checkout", "self-hosted payment free",
    "no transaction fee gateway",
  ],
});

const faqs = [
  {
    q: "Kya ZeroPaye sach mein free hai?",
    a: "Haan. 100% free, forever. ₹0/month, 0% transaction fees, unlimited volume. AGPL-3.0 license — koi 'Pro tier' nahi, koi paywall nahi.",
  },
  {
    q: "Toh paisa kaise kamate ho?",
    a: "ZeroPaye ek open-source project hai, koi VC-funded company nahi. Hum community support, optional consulting, aur enterprise deployments se operate karte hain. Core code humesha free rahega.",
  },
  {
    q: "Hidden costs kya hain?",
    a: "Sirf apne server ka cost (VPS ₹200-500/month), domain (₹500-1000/year), aur ek Android phone (observer ke liye, ₹5000 one-time). ZeroPaye ka koi fee nahi.",
  },
  {
    q: "Future mein paid ban sakti hai?",
    a: "Nahi. AGPL-3.0 license code ko forever free rakhta hai. Agar hum paid SaaS version bhi launch karte hain, core code public rahega aur self-host option humesha available rahega.",
  },
  {
    q: "Unlimited transactions sach mein?",
    a: "Haan. SQLite 10 TPS tak handle karta hai (single-writer). Agar aapko zyada chahiye toh PostgreSQL pe switch karein (v1.2+). Koi per-transaction fee nahi.",
  },
];

const jsonLd = faqJsonLd(faqs);

export default function FreeForeverPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Product", href: "/" }, { name: "Free Forever", href: "/free-forever" }]}>
        <PageHero
          badge="Free for Everyone, Forever"
          title="No fee. No catch. No kidding."
          subtitle="ZeroPaye free nahi 'abhi ke liye' — free hai 'hamesha ke liye'. 0% transaction fees, ₹0/month, all features unlocked."
        />

        <div className="my-10">
          <FreeForever />
        </div>

        <SectionHeading eyebrow="Honest pricing" title="Kya free, kya paid?" />
        <Prose>
          <table>
            <thead>
              <tr><th>Feature</th><th>ZeroPaye (Free)</th><th>Razorpay/Cashfree</th></tr>
            </thead>
            <tbody>
              <tr><td>Transaction fee</td><td>0%</td><td>2-3% + GST</td></tr>
              <tr><td>Monthly subscription</td><td>₹0</td><td>₹0 ya per-txn</td></tr>
              <tr><td>Volume limit</td><td>Unlimited (SQLite 10 TPS; Postgres for more)</td><td>Varies</td></tr>
              <tr><td>Source code access</td><td>Full (AGPL-3.0)</td><td>Closed</td></tr>
              <tr><td>Self-host</td><td>Yes</td><td>No</td></tr>
              <tr><td>White-label</td><td>Yes, free</td><td>Paid tier</td></tr>
              <tr><td>Telemetry</td><td>Zero</td><td>Yes</td></tr>
              <tr><td>"Pro tier" paywall</td><td>Nahi</td><td>Haan</td></tr>
            </tbody>
          </table>
        </Prose>

        <SectionHeading eyebrow="FAQ" title="Sawaal jo sab puchte hain" />
        <Prose>
          {faqs.map((f, i) => (
            <div key={i}>
              <h4>{f.q}</h4>
              <p>{f.a}</p>
            </div>
          ))}
        </Prose>

        <SectionHeading eyebrow="Real savings" title="Aapka kitna paisa bachega?" />
        <Prose>
          <p>
            Maan lijiye aap <strong>₹5,00,000/month</strong> ka online business chalate ho:
          </p>
          <ul>
            <li>Razorpay (2.2% + GST): <strong>₹13,000/month</strong> fees = ₹1,56,000/year</li>
            <li>Cashfree (2% + GST): <strong>₹11,800/month</strong> fees = ₹1,41,600/year</li>
            <li><strong>ZeroPaye: ₹0</strong> — saal mein ₹1.5+ lakh bachat 💰</li>
          </ul>
          <p>
            Yeh paisa aap apne business mein reinvest kar sakte ho, ya apne customers ko
            cheaper prices de sakte ho. <em>ZeroPaye aapki profit margin badhata hai.</em>
          </p>
        </Prose>
      </PageLayout>
    </>
  );
}
