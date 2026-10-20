import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { DemoShowcase } from "@/components/zeropaye/demo-showcase";

export const metadata: Metadata = buildMetadata({
  title: "Live Demo — All ZeroPaye Features (Locked Demo Account)",
  description:
    "Try all ZeroPaye features live: checkout flow, WhatsApp OTP, UPI QR, dashboard, admin panel, security, webhooks. Demo account is locked — nobody can change the password.",
  path: "/demo",
  keywords: [
    "ZeroPaye live demo", "UPI payment demo", "ZeroPaye features",
    "locked demo account", "payment gateway demo India",
  ],
});

export default function DemoPage() {
  return <DemoShowcase />;
}
