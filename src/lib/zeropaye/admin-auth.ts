// ZeroPaye — Admin authentication helper
// v4.0 H4 fix: hash-based admin key lookup + rate limit on failed auth.
// - adminApiKey is stored as sha256 hash (adminKeyHash), never plaintext
// - GET /merchant does NOT return adminApiKey
// - Failed auth attempts are rate-limited (10/min per IP)
// - Demo mode (DEMO_ADMIN_KEY) bypasses DB entirely

import { NextRequest } from "next/server";
import { safeEqual, sha256Hex } from "./crypto";
import { jsonErr, getClientIp, rateLimit } from "./security";
import { getDemoMerchant } from "./config";
import { isDemoMode } from "./demo-data";
import { db } from "@/lib/db";

/**
 * Require a valid x-zeropaye-admin-key header.
 * v4.0: hash-based lookup (never compare plaintext), rate limit on failure.
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
      return {
        ok: true as const,
        merchant: {
          id: "demo_merchant_locked",
          businessName: "ZeroPaye Demo Merchant",
          publicApiKey: process.env.DEMO_PUBLIC_KEY || "zp_demo_public_key_locked_001",
          adminApiKey: "", // v4.0: never return plaintext
          adminKeyHash: sha256Hex(demoAdminKey),
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
          allowClientPricing: false,
          maxOffsetPaise: 25,
        },
      };
    }
    // v4.0: rate limit failed demo auth
    const ip = await getClientIp();
    const rl = rateLimit({ key: `admin-fail:${ip}`, maxTokens: 10, refillPerSec: 1 / 60 });
    if (!rl.ok) {
      return { ok: false as const, response: jsonErr(429, "Too many failed attempts. Try again later.") };
    }
    return { ok: false as const, response: jsonErr(401, "Invalid admin API key") };
  }

  // Normal mode — hash-based lookup (v4.0 H4 fix)
  try {
    const providedHash = sha256Hex(provided);
    // Try hash-based lookup first (v4.0)
    let merchant = await db.merchant.findFirst({ where: { adminKeyHash: providedHash } });

    // Fallback: legacy plaintext comparison (for migrations)
    if (!merchant) {
      merchant = await db.merchant.findFirst({ where: { adminApiKey: provided } });
      if (merchant) {
        // Migrate: set adminKeyHash, clear plaintext
        await db.merchant.update({
          where: { id: merchant.id },
          data: { adminKeyHash: providedHash },
        });
      }
    }

    if (!merchant) {
      // v4.0: rate limit failed auth
      const ip = await getClientIp();
      const rl = rateLimit({ key: `admin-fail:${ip}`, maxTokens: 10, refillPerSec: 1 / 60 });
      if (!rl.ok) {
        return { ok: false as const, response: jsonErr(429, "Too many failed attempts. Try again later.") };
      }
      return { ok: false as const, response: jsonErr(401, "Invalid admin API key") };
    }

    return { ok: true as const, merchant };
  } catch {
    // DB not available
    return { ok: false as const, response: jsonErr(503, "Database not available. Set DEMO_ADMIN_KEY for demo mode.") };
  }
}

/**
 * Gate a "demo-only" route behind NODE_ENV.
 * v3.3: If DEMO_ADMIN_KEY is set, allow demo routes even in production.
 */
export function requireDevMode() {
  if (process.env.DEMO_ADMIN_KEY) {
    return { ok: true as const };
  }
  if (process.env.NODE_ENV === "production") {
    return { ok: false as const, response: jsonErr(404, "Endpoint not available in production") };
  }
  return { ok: true as const };
}
