// ZeroPaye API — Health check endpoint
// GET /api/zeropaye/health
// Returns service liveness + DB connectivity + uptime. Used by load
// balancers (UptimeRobot, Pingdom, k8s probes) for monitoring.
// Production-readiness gap 3.

import { db } from "@/lib/db";
import { jsonOk, jsonErr } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  try {
    // DB connectivity check (lightweight)
    await db.merchant.count({ take: 1 });
    const uptimeMs = Date.now() - startedAt;
    return jsonOk({
      status: "ok",
      service: "zeropaye",
      version: "1.1.0",
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
