import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { HostedCheckout } from "@/components/zeropaye/hosted-checkout";

export const metadata: Metadata = buildMetadata({
  title: "ZeroPaye Checkout — Secure UPI Payment",
  description:
    "Complete your UPI payment securely with ZeroPaye. WhatsApp OTP verified, vector QR, instant bank settlement. Powered by ZeroPaye — zero-fee open-source UPI gateway.",
  path: "/checkout",
  noIndex: true, // checkout pages shouldn't be indexed
});

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HostedCheckout sessionId={id} />;
}
