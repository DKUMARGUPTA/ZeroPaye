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
        webhookSecret: generateSecret(32),
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

export async function getDemoMerchant() {
  const m = await ensureDemoMerchant();
  const account = await db.receivingAccount.findFirst({ where: { merchantId: m.id } });
  return { merchant: m, account };
}
