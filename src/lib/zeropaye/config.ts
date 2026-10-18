// ZeroPaye — Demo merchant configuration & seeding
// Fixes from YouPI-PG audit: S7 (hardcoded author PII), S8 (default webhook
// secret), S6 (hardcoded enrollment secret). ZeroPaye generates fresh random
// secrets on first boot and stores NO author PII.

import { db } from "@/lib/db";
import { generateApiKey, generateSecret, sha256Hex } from "./crypto";

export const DEMO_MERCHANT = {
  businessName: "ZeroPaye Demo Merchant",
  brandName: "ZeroPaye",
  tagline: "Zero • Empowering • Reliable • Open • Payé",
  vpa: "zeropaye.demo@upi",
  accountName: "ZeroPaye Demo Store",
  accentColor: "#0d9488", // teal-600 (NOT indigo/blue per design rules)
  gradientFrom: "#0d9488",
  gradientTo: "#0891b2", // cyan-600
};

export async function ensureDemoMerchant() {
  let m = await db.merchant.findFirst();
  if (!m) {
    m = await db.merchant.create({
      data: {
        businessName: DEMO_MERCHANT.businessName,
        publicApiKey: generateApiKey(),
        adminApiKey: generateApiKey(),
        // D8 fix: allow ZEROPAYE_WEBHOOK_SECRET env var to override auto-generated secret
        webhookSecret: process.env.ZEROPAYE_WEBHOOK_SECRET || generateSecret(32),
        branding: JSON.stringify({
          brandName: DEMO_MERCHANT.brandName,
          tagline: DEMO_MERCHANT.tagline,
          accentColor: DEMO_MERCHANT.accentColor,
          gradientFrom: DEMO_MERCHANT.gradientFrom,
          gradientTo: DEMO_MERCHANT.gradientTo,
          logoText: "ZeroPaye",
        }),
        defaultVpa: DEMO_MERCHANT.vpa,
      },
    });
    // Seed the default receiving account (VPA)
    await db.receivingAccount.create({
      data: {
        merchantId: m.id,
        vpa: DEMO_MERCHANT.vpa,
        accountName: DEMO_MERCHANT.accountName,
        isSlotBusy: false,
        dailyLimitPaise: 10000000, // ₹1,00,000
      },
    });
    // Seed a demo Android observer device (with HASHED signing key — S9 fix)
    const signingKey = generateSecret(32);
    await db.device.create({
      data: {
        merchantId: m.id,
        deviceName: "Demo Android Observer",
        deviceId: "dev_demo_observer_001",
        signingKeyHash: sha256Hex(signingKey),
        isActive: true,
        lastHeartbeatAt: new Date(),
      },
    });
    // Audit NEW-09: persist the demo plaintext signing key to a 0600-perm sidecar
    // file so it survives server restarts. In real deployments, the device keeps
    // the plaintext in EncryptedSharedPreferences; the server stores only the hash.
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const keyFile = path.join(process.cwd(), ".demo-observer-key");
      fs.writeFileSync(keyFile, signingKey, { mode: 0o600 });
    } catch (e) {
      console.error("[ZeroPaye] could not persist demo observer key", e);
    }
  }
  return m;
}

/**
 * Read the demo observer signing key from the sidecar file (persists across restarts).
 * Audit NEW-09: previously stored in process.env which is lost on restart.
 */
export async function getDemoObserverKey(): Promise<string | null> {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const keyFile = path.join(process.cwd(), ".demo-observer-key");
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, "utf8").trim();
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Phase 4: Module-level cache to avoid repeated DB queries on every API
// request (audit NEW-21). The demo merchant + account rarely change after
// first boot, so we cache them in-process. Cache invalidated on explicit
// reset or server restart.
let cachedMerchant: any = null;
let cachedAccount: any = null;
let cachePromise: Promise<{ merchant: any; account: any }> | null = null;

export async function getDemoMerchant() {
  if (cachedMerchant && cachedAccount) {
    return { merchant: cachedMerchant, account: cachedAccount };
  }
  // Dedupe concurrent calls — only one fetch in-flight at a time
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const m = await ensureDemoMerchant();
    const account = await db.receivingAccount.findFirst({ where: { merchantId: m.id } });
    cachedMerchant = m;
    cachedAccount = account;
    cachePromise = null;
    return { merchant: m, account };
  })();
  return cachePromise;
}

/** Force re-fetch on next call (e.g., after branding change). */
export function invalidateDemoMerchantCache() {
  cachedMerchant = null;
  cachedAccount = null;
  cachePromise = null;
}

