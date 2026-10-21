#!/usr/bin/env node
// ZeroPaye Doctor — health check + fix suggestions
// Usage: bun run doctor

import { PrismaClient } from "@prisma/client";

const CHECKS = [
  { name: "Node.js version", check: () => process.version >= "v20" ? "✅ " + process.version : "❌ Need Node 20+, got " + process.version },
  { name: "Bun runtime", check: () => typeof (globalThis as any).Bun !== "undefined" ? "✅ Bun " + (globalThis as any).Bun.version : "⚠️ Running on Node (Bun recommended)" },
  { name: "DATABASE_URL env", check: () => process.env.DATABASE_URL ? "✅ " + process.env.DATABASE_URL.substring(0, 30) + "..." : "❌ Not set" },
  { name: "NODE_ENV", check: () => process.env.NODE_ENV ? "✅ " + process.env.NODE_ENV : "⚠️ Not set (defaults to development)" },
  { name: "DEMO_ADMIN_KEY", check: () => process.env.DEMO_ADMIN_KEY ? "✅ Demo mode (locked)" : "ℹ️ Not set (production mode)" },
  { name: "OTP_PROVIDER", check: () => {
    const p = process.env.OTP_PROVIDER || "console";
    if (p === "console" && process.env.NODE_ENV === "production") return "❌ Console OTP in production! Set OTP_PROVIDER=whatsapp or sms";
    return "✅ " + p;
  }},
  { name: "Prisma Client", check: async () => {
    try {
      const db = new PrismaClient();
      await db.merchant.count();
      await db.$disconnect();
      return "✅ Database connected";
    } catch (e: any) {
      return "❌ Database: " + e.message?.slice(0, 80);
    }
  }},
  { name: "Migration files", check: async () => {
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const dir = path.join(process.cwd(), "prisma", "migrations");
      if (!fs.existsSync(dir)) return "❌ No migrations found. Run: bun run db:migrate";
      const dirs = fs.readdirSync(dir).filter(d => !d.startsWith("."));
      return dirs.length > 0 ? `✅ ${dirs.length} migration(s) found` : "❌ Empty migrations dir";
    } catch {
      return "⚠️ Cannot check migrations";
    }
  }},
];

async function main() {
  console.log(`
╔══════════════════════════════════════════════╗
║     ZeroPaye Doctor v4.0 — Health Check      ║
╚══════════════════════════════════════════════╝
`);

  let allOk = true;
  for (const c of CHECKS) {
    try {
      const result = await c.check();
      console.log(`  ${result}  ${c.name}`);
      if (result.startsWith("❌")) allOk = false;
    } catch (e: any) {
      console.log(`  ❌  ${c.name}: ${e.message?.slice(0, 80)}`);
      allOk = false;
    }
  }

  console.log("");
  if (allOk) {
    console.log("✅ All checks passed! ZeroPaye is ready to run.");
    console.log("   Start: bun run dev (development) or bun run start (production)");
  } else {
    console.log("❌ Some checks failed. Fix the issues above, then run again:");
    console.log("   1. Set DATABASE_URL in .env");
    console.log("   2. Run: bun run db:deploy (apply migrations)");
    console.log("   3. Run: bun run setup (create merchant + keys)");
    console.log("   4. For production: set OTP_PROVIDER=whatsapp or sms");
    console.log("   5. Re-run: bun run doctor");
  }
  console.log("");
}

main().catch(console.error);
