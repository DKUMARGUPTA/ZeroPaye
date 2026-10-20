// ZeroPaye — Admin authentication helper
// v3.3: Supports DEMO_ADMIN_KEY env var for Vercel deployments (no DB needed).
// The demo account is LOCKED — admin key can't be changed via API.

import { NextRequest } from "next/server";
import { safeEqual } from "./crypto";
import { jsonErr } from "./security";
import { getDemoMerchant } from "./config";

export const runtime = "nodejs";

/**
 * Require a valid x-zeropaye-admin-key header on a request.
 * v3.3: If DEMO_ADMIN_KEY env var is set, use it directly (no DB needed).
 * Returns the merchant on success, or a 401 Response on failure.
 */
export async function requireAdmin(req: NextRequest) {
  const provided = req.headers.get("x-zeropaye-admin-key") || "";
  if (!provided) {
    return { ok: false as const, response: jsonErr(401, "Missing x-zeropaye-admin-key header") };
  }

  // v3.3: Demo mode — use DEMO_ADMIN_KEY env var (no DB needed)
  const demoAdminKey = process.env.DEMO_ADMIN_KEY;
  if (demoAdminKey) {
    if (safeEqual(provided, demoAdminKey)) {
      // Return a mock merchant object for demo mode
      return {
        ok: true as const,
        merchant: {
          id: "demo_merchant_locked",
          businessName: "ZeroPaye Demo Merchant",
          publicApiKey: process.env.DEMO_PUBLIC_KEY || "zp_demo_public_key_locked_001",
          adminApiKey: demoAdminKey,
          webhookSecret: process.env.DEMO_WEBHOOK_SECRET || "demo_webhook_secret_locked",
          webhookUrl: null,
          branding: JSON.stringify({
            brandName: "ZeroPaye",
            tagline: "Zero • Empowering • Reliable • Open • Payé",
            accentColor: "#0d9488",
            gradientFrom: "#0d9488",
            gradientTo: "#0891b2",
            logoText: "ZeroPaye",
          }),
          defaultVpa: process.env.DEMO_VPA || "zeropaye.demo@upi",
        },
      };
    }
    return { ok: false as const, response: jsonErr(401, "Invalid admin API key") };
  }

  // Normal mode — verify against DB
  try {
    const { merchant } = await getDemoMerchant();
    if (!safeEqual(provided, merchant.adminApiKey)) {
      return { ok: false as const, response: jsonErr(401, "Invalid admin API key") };
    }
    return { ok: true as const, merchant };
  } catch {
    return { ok: false as const, response: jsonErr(503, "Database not available. Set DEMO_ADMIN_KEY for demo mode.") };
  }
}

/**
 * Gate a "demo-only" route (like simulate-payment) behind NODE_ENV.
 * v3.3: If DEMO_ADMIN_KEY is set, allow demo routes even in production.
 */
export function requireDevMode() {
  // v3.3: Demo mode bypasses production check
  if (process.env.DEMO_ADMIN_KEY) {
    return { ok: true as const };
  }
  if (process.env.NODE_ENV === "production") {
    return { ok: false as const, response: jsonErr(404, "Endpoint not available in production") };
  }
  return { ok: true as const };
}
