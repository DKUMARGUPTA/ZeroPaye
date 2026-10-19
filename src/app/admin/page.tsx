import type { Metadata } from "next";
import { buildMetadata } from "@/lib/zeropaye/seo";
import { AdminPanel } from "@/components/zeropaye/admin-panel";

export const metadata: Metadata = buildMetadata({
  title: "Admin Panel — Merchant Self-Serve Setup",
  description:
    "ZeroPaye admin panel: update your UPI VPA, white-label branding (name, colors, logo), and view your API keys. Self-serve, no DB editing required.",
  path: "/admin",
  noIndex: true, // admin pages shouldn't be indexed
});

export default function AdminPage() {
  return <AdminPanel />;
}
