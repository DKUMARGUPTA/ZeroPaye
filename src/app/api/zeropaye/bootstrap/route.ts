// ZeroPaye API — Demo bootstrap
// GET /api/zeropaye/bootstrap
//
// v3.3: Now supports DEMO_ADMIN_KEY env var for Vercel deployments.
// If DEMO_ADMIN_KEY is set, this endpoint returns it even in production.
// The demo account is LOCKED — nobody can change the admin key via API.
//
// Set these env vars on Vercel:
//   DEMO_ADMIN_KEY=zp_demo_locked_key_xxx    (fixed admin key, can't be changed)
//   DEMO_PUBLIC_KEY=zp_demo_public_key_xxx   (fixed public key)
//   DEMO_VPA=zeropaye.demo@upi               (demo VPA)
//
// If DEMO_ADMIN_KEY is NOT set, falls back to dev-mode behavior (auto-generated).

import { NextRequest } from "next/server";
import { getDemoMerchant } from "@/lib/zeropaye/config";
import { jsonOk, jsonErr } from "@/lib/zeropaye/security";
import { requireDevMode } from "@/lib/zeropaye/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  // v3.3: Check for DEMO_ADMIN_KEY env var (Vercel deployments)
  const demoAdminKey = process.env.DEMO_ADMIN_KEY;
  const demoPublicKey = process.env.DEMO_PUBLIC_KEY || "zp_demo_public_key_locked_001";
  const demoVpa = process.env.DEMO_VPA || "zeropaye.demo@upi";

  if (demoAdminKey) {
    // Demo mode via env var — works in production too
    return jsonOk({
      merchantId: "demo_merchant_locked",
      businessName: "ZeroPaye Demo Merchant",
      publicApiKey: demoPublicKey,
      adminApiKey: demoAdminKey,
      defaultVpa: demoVpa,
      locked: true,
      message: "Demo account is LOCKED. Admin key cannot be changed. Use this key in x-zeropaye-admin-key header.",
    });
  }

  // Dev mode fallback (auto-generated keys from DB)
  const devGate = requireDevMode();
  if (!devGate.ok) return devGate.response;
  try {
    const { merchant } = await getDemoMerchant();
    return jsonOk({
      merchantId: merchant.id,
      businessName: merchant.businessName,
      publicApiKey: merchant.publicApiKey,
      adminApiKey: merchant.adminApiKey,
      defaultVpa: merchant.defaultVpa,
      message: "Demo bootstrap: use the adminApiKey in the x-zeropaye-admin-key header.",
    });
  } catch {
    // DB not available (Vercel without DATABASE_URL)
    return jsonErr(503, "Database not available. Set DEMO_ADMIN_KEY env var for demo mode without DB.");
  }
}
