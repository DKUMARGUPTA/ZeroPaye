// ZeroPaye — Admin authentication helper
// Fixes audit NEW-01/NEW-02/NEW-03: wire the adminApiKey into protected routes.
// Reads the merchant's adminApiKey (generated at first boot) and compares
// the request's x-zeropaye-admin-key header in constant time.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { safeEqual } from "./crypto";
import { jsonErr } from "./security";
import { getDemoMerchant } from "./config";

export const runtime = "nodejs";

/**
 * Require a valid x-zeropaye-admin-key header on a request.
 * Returns the merchant on success, or a 401 Response on failure.
 */
export async function requireAdmin(req: NextRequest) {
  const provided = req.headers.get("x-zeropaye-admin-key") || "";
  if (!provided) {
    return { ok: false as const, response: jsonErr(401, "Missing x-zeropaye-admin-key header") };
  }
  const { merchant } = await getDemoMerchant();
  if (!safeEqual(provided, merchant.adminApiKey)) {
    return { ok: false as const, response: jsonErr(401, "Invalid admin API key") };
  }
  return { ok: true as const, merchant };
}

/**
 * Gate a "demo-only" route (like simulate-payment) behind NODE_ENV.
 * In production, the route is disabled entirely.
 * Fixes audit NEW-01: unauthenticated simulate-payment could confirm any payment.
 */
export function requireDevMode() {
  if (process.env.NODE_ENV === "production") {
    return { ok: false as const, response: jsonErr(404, "Endpoint not available in production") };
  }
  return { ok: true as const };
}
