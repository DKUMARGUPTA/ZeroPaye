import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { SetupWizard } from "@/components/zeropaye/setup-wizard";

export const metadata: Metadata = buildMetadata({
  title: "Setup Wizard — ZeroPaye Merchant Onboarding",
  description:
    "Browser-based setup wizard for ZeroPaye. Configure your merchant, VPA, branding, and webhook in 3 steps — no CLI needed.",
  path: "/setup",
  noIndex: true,
});

export default function SetupPage() {
  return <SetupWizard />;
}
