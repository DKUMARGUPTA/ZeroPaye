#!/usr/bin/env node
// ZeroPaye Setup CLI — merchant onboarding
// Usage: bun run setup
//
// Creates a new merchant, generates API keys, sets up receiving account,
// and prints credentials ONCE (saves to DB, not returned again).

import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════╗
║     ZeroPaye Setup — Merchant Onboarding    ║
║     v4.0 · AGPL-3.0 · Made for Bharat        ║
╚══════════════════════════════════════════════╝
`);

  // Check if merchant already exists
  const existing = await db.merchant.findFirst();
  if (existing) {
    console.log("⚠️  A merchant already exists in this database.");
    const overwrite = await ask("Create a new merchant anyway? (yes/no): ");
    if (overwrite.toLowerCase() !== "yes") {
      console.log("Setup cancelled.");
      await db.$disconnect();
      process.exit(0);
    }
  }

  // Collect merchant info
  const businessName = await ask("Business name (e.g. Sharma Kirana Store): ");
  if (!businessName || businessName.length < 2) {
    console.error("❌ Business name must be at least 2 characters.");
    process.exit(1);
  }

  const vpa = await ask("Your UPI VPA (e.g. deepak@okhdfcbank): ");
  if (!vpa || !vpa.includes("@")) {
    console.error("❌ VPA must contain @ (e.g. name@bank)");
    process.exit(1);
  }

  const accountName = await ask("Account holder name (e.g. Deepak Kumar): ") || businessName;

  const webhookUrl = await ask("Webhook URL (optional, press Enter to skip): ") || null;
  const webhookSecret = webhookUrl ? randomBytes(32).toString("hex") : randomBytes(32).toString("hex");

  // Generate keys
  const publicApiKey = `zp_${randomBytes(24).toString("base64url")}`;
  const adminApiKey = `zp_${randomBytes(24).toString("base64url")}`;
  const { createHash } = await import("node:crypto");
  const adminKeyHash = createHash("sha256").update(adminApiKey).digest("hex");

  // Create merchant + receiving account
  const merchant = await db.merchant.create({
    data: {
      businessName,
      publicApiKey,
      adminApiKey,
      adminKeyHash,
      webhookSecret,
      webhookUrl,
      branding: JSON.stringify({
        brandName: businessName,
        tagline: "Zero • Empowering • Reliable • Open • Payé",
        accentColor: "#0d9488",
        gradientFrom: "#0d9488",
        gradientTo: "#0891b2",
        logoText: businessName.charAt(0).toUpperCase(),
      }),
      defaultVpa: vpa,
      allowClientPricing: false,
      maxOffsetPaise: 25,
    },
  });

  const account = await db.receivingAccount.create({
    data: {
      merchantId: merchant.id,
      vpa,
      accountName,
      isSlotBusy: false,
      dailyLimitPaise: 10000000, // ₹1,00,000
    },
  });

  // Print credentials ONCE
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  SAVE THESE CREDENTIALS — THEY WILL NOT BE SHOWN AGAIN   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Merchant ID:      ${merchant.id}         ║
║  Business Name:    ${businessName}                             ║
║  VPA:              ${vpa}            ║
║                                                              ║
║  Public API Key:    ${publicApiKey}           ║
║  Admin API Key:    ${adminApiKey}           ║
║  Webhook Secret:   ${webhookSecret}  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Next steps:
  1. Save the Admin API Key securely (it will NOT be shown again)
  2. Use the Public API Key in your website SDK:
     <script src="https://pay.yourdomain.com/zeropaye.js"
             data-zeropaye-key="${publicApiKey}"
             data-currency="INR"></script>
  3. ${webhookUrl ? "Configure your webhook endpoint to verify HMAC-SHA256 signatures" : "Set your webhook URL via: curl -X PATCH .../api/zeropaye/admin/merchant -H 'x-zeropaye-admin-key: " + adminApiKey + "' -d '{\"webhookUrl\":\"https://yoursite.com/webhook\"}'"}
  4. Run the observer: bun run scripts/observer-runner.ts --whatsapp
  5. Start the server: bun run start

  Deploy database: bun run db:deploy
  Run tests: bun run test

  🔒 Admin key is stored as SHA-256 hash. Never shared in API responses.
  `);

  await db.$disconnect();
}

main().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
