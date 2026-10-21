// ZeroPaye API — Health check endpoint
// GET /api/zeropaye/health
// v3.3: In demo mode, skip DB check (no tables needed)

import { db } from "@/lib/db";
import { jsonOk, jsonErr } from "@/lib/zeropaye/security";
import { isDemoMode } from "@/lib/zeropaye/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  try {
    const uptimeMs = Date.now() - startedAt;

    // v3.3: Demo mode — skip DB check (no tables exist on Vercel)
    if (isDemoMode()) {
      return jsonOk({
        status: "ok",
        service: "zeropaye",
        version: "4.2.0",
        uptimeMs,
        uptimeHuman: `${Math.floor(uptimeMs / 1000)}s`,
        timestamp: new Date().toISOString(),
        node: process.version,
        env: process.env.NODE_ENV || "development",
        demo: true,
        message: "Running in demo mode (no database)",
      });
    }

    // Normal mode — DB connectivity check
    await db.merchant.count({ take: 1 });
    return jsonOk({
      status: "ok",
      service: "zeropaye",
      version: "4.2.0",
      uptimeMs,
      uptimeHuman: `${Math.floor(uptimeMs / 1000)}s`,
      timestamp: new Date().toISOString(),
      node: process.version,
      env: process.env.NODE_ENV || "development",
    });
  } catch (e: any) {
    return jsonErr(503, `Service unavailable: ${String(e?.message || e).slice(0, 100)}`);
  }
}
