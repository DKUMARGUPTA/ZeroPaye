// ZeroPaye API — Demo bootstrap (dev-only)
// GET /api/zeropaye/bootstrap
// Returns the demo merchant's admin API key so the demo dashboard can
// call the admin-protected endpoints. DISABLED in production.
//
// Audit NEW-02/NEW-03 fix: admin endpoints now require x-zeropaye-admin-key,
// so the demo dashboard needs a way to fetch it. In production this route
// returns 404 and keys are provisioned via a secure onboarding flow.

import { NextRequest } from "next/server";
import { getDemoMerchant } from "@/lib/zeropaye/config";
import { jsonOk, jsonErr } from "@/lib/zeropaye/security";
import { requireDevMode } from "@/lib/zeropaye/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const devGate = requireDevMode();
  if (!devGate.ok) return devGate.response;
  const { merchant } = await getDemoMerchant();
  return jsonOk({
    merchantId: merchant.id,
    businessName: merchant.businessName,
    publicApiKey: merchant.publicApiKey,
    adminApiKey: merchant.adminApiKey,
    defaultVpa: merchant.defaultVpa,
    message: "Demo bootstrap: use the adminApiKey in the x-zeropaye-admin-key header for protected endpoints. This endpoint is disabled in production.",
  });
}
