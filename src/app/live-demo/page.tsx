import type { Metadata } from "next";
import { buildMetadata, softwareAppJsonLd } from "@/lib/zeropaye/seo";
import { PageLayout, PageHero, SectionHeading, Prose } from "@/components/zeropaye/page-layout";
import { CheckoutDemo } from "@/components/zeropaye/checkout-demo";

export const metadata: Metadata = buildMetadata({
  title: "Live Checkout Demo — Try ZeroPaye UPI Payment Gateway",
  description:
    "Try ZeroPaye's live interactive UPI checkout demo. No signup needed. Experience WhatsApp OTP, vector QR, dual timers, and instant bank settlement. 100% free, open-source.",
  path: "/live-demo",
  keywords: [
    "UPI checkout demo", "ZeroPaye demo", "payment gateway demo India",
    "live UPI payment", "WhatsApp OTP checkout", "open source payment demo",
  ],
  ogType: "website",
});

const jsonLd = softwareAppJsonLd({
  name: "ZeroPaye Live Checkout Demo",
  description:
    "Interactive live demo of ZeroPaye's UPI payment gateway — WhatsApp OTP, vector QR, dual timers, instant settlement.",
  path: "/live-demo",
});

export default function LiveDemoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageLayout breadcrumbs={[{ name: "Product", href: "/" }, { name: "Live Demo", href: "/live-demo" }]}>
        <PageHero
          badge="Live Interactive Demo"
          title="Try ZeroPaye's UPI Checkout — No Signup"
          subtitle="Experience the full payment flow: cart → WhatsApp OTP → UPI QR → instant bank settlement. Zero configuration, zero cost, zero friction."
        />
        <Prose>
          <p>
            ZeroPaye ka live checkout demo aapko poora payment flow dikhata hai — bina kisi
            signup, API key, ya sandbox setup ke. Sirf 2 minute mein aap dekh sakte ho ki
            ek customer ZeroPaye se kaise pays karta hai.
          </p>
        </Prose>

        <div className="my-10">
          <CheckoutDemo />
        </div>

        <SectionHeading
          eyebrow="How it works"
          title="Demo ke 6 steps"
          description="Har step ka real screenshot aur explanation niche diya gaya hai."
        />
        <Prose>
          <ol>
            <li>
              <strong>Cart:</strong> Customer amount dekhta hai, "Pay Securely" click karta hai.
            </li>
            <li>
              <strong>Mobile number:</strong> Customer apna 10-digit Indian mobile number daalta hai.
              ZeroPaye is number ko <em>gateway-owned</em> rakhta hai — merchant ko nahi pata.
            </li>
            <li>
              <strong>WhatsApp OTP:</strong> 6-digit OTP customer ke WhatsApp par jaata hai.
              Demo mode mein OTP screen par dikhta hai; production mein real WhatsApp Business API use hota hai.
            </li>
            <li>
              <strong>QR + 5-minute window:</strong> OTP verify hote hi pure vector SVG QR dikhta hai
              with a 5-minute countdown. Customer kisi bhi UPI app se scan kar sakta hai
              (GPay, PhonePe, Paytm, BHIM, Amazon Pay, CRED).
            </li>
            <li>
              <strong>Verifying (30 seconds):</strong> Customer "I've Paid" click karta hai → 30-second
              verification window. Banking Observer SMS/email padhke payment detect karta hai.
            </li>
            <li>
              <strong>Success:</strong> Bank credit verify hote hi "Payment Successful" screen with
              12-digit UTR (bank reference number). Paisa seedhe merchant ke bank mein.
            </li>
          </ol>
        </Prose>

        <SectionHeading
          eyebrow="Why this demo matters"
          title="Demo mein kya special hai?"
        />
        <Prose>
          <ul>
            <li>
              <strong>Real backend:</strong> Yeh sirf frontend mockup nahi hai. Demo actual Prisma + SQLite
              database, real API routes, aur atomic slot-acquisition transactions use karta hai.
            </li>
            <li>
              <strong>Server-authoritative timers:</strong> 5-minute aur 30-second timers browser pe
              nahi, server pe compute hote hai. Refresh karo toh bhi same rahega.
            </li>
            <li>
              <strong>Single-slot FIFO queue:</strong> Ek time pe ek VPA pe sirf ek hi payment. Baki
              customers queue mein wait karte hain — exact amount matching guaranteed.
            </li>
            <li>
              <strong>Integer paise arithmetic:</strong> ₹499.00 = 49900 paise (integer). Floating-point
              rounding errors mathematically impossible.
            </li>
          </ul>
        </Prose>
      </PageLayout>
    </>
  );
}
