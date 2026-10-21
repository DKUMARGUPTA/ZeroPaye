// ZeroPaye API — Prometheus metrics endpoint
// GET /api/zeropaye/metrics
// Returns Prometheus-formatted metrics for monitoring (production gap 6).
// No external deps — uses in-process counters + DB queries.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk, jsonErr } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

// v4.2: counters extracted to metrics-getCounters().ts (shared import)
import { getCounters } from "@/lib/zeropaye/metrics-counters";

export async function GET(req: NextRequest) {
  try {
    // v4.0 H6 fix: /metrics requires METRICS_TOKEN (was unauthenticated)
    const metricsToken = process.env.METRICS_TOKEN;
    if (metricsToken) {
      const auth = req.headers.get("authorization") || "";
      if (auth !== `Bearer ${metricsToken}`) {
        return jsonErr(401, "Unauthorized: provide Bearer METRICS_TOKEN");
      }
    }
    const uptimeMs = Date.now() - startedAt;
    // DB-backed metrics
    const totalSessions = await db.paymentSession.count();
    const successSessions = await db.paymentSession.count({ where: { status: "SUCCESS" } });
    const activeSessions = await db.paymentSession.count({ where: { status: { in: ["ACTIVE", "PROCESSING"] } } });
    const queuedSessions = await db.paymentSession.count({ where: { status: "QUEUED" } });
    const failedSessions = await db.paymentSession.count({ where: { status: { in: ["FAILED", "EXPIRED", "CANCELLED"] } } });
    const pendingWebhooks = await db.webhookDelivery.count({ where: { status: "RETRYING" } });
    const activeDevices = await db.device.count({ where: { isActive: true } });

    const metrics = [
      `# ZeroPaye metrics`,
      `# TYPE zeropaye_uptime_seconds counter`,
      `zeropaye_uptime_seconds ${Math.floor(uptimeMs / 1000)}`,
      ``,
      `# Process counters (reset on restart)`,
      `# TYPE zeropaye_requests_total counter`,
      `zeropaye_requests_total ${getCounters().zeropaye_requests_total}`,
      `zeropaye_otp_sent_total ${getCounters().zeropaye_otp_sent_total}`,
      `zeropaye_otp_verified_total ${getCounters().zeropaye_otp_verified_total}`,
      `zeropaye_payments_success_total ${getCounters().zeropaye_payments_success_total}`,
      `zeropaye_payments_failed_total ${getCounters().zeropaye_payments_failed_total}`,
      `zeropaye_webhook_dispatched_total ${getCounters().zeropaye_webhook_dispatched_total}`,
      ``,
      `# DB-backed gauges`,
      `# TYPE zeropaye_sessions gauge`,
      `zeropaye_sessions_total ${totalSessions}`,
      `zeropaye_sessions_active ${activeSessions}`,
      `zeropaye_sessions_queued ${queuedSessions}`,
      `zeropaye_sessions_success ${successSessions}`,
      `zeropaye_sessions_failed ${failedSessions}`,
      `zeropaye_webhooks_pending_retry ${pendingWebhooks}`,
      `zeropaye_devices_active ${activeDevices}`,
      ``,
      `# Success rate`,
      `# TYPE zeropaye_success_rate gauge`,
      `zeropaye_success_rate ${totalSessions > 0 ? (successSessions / totalSessions * 100).toFixed(2) : 0}`,
    ].join("\n");

    return new Response(metrics, {
      headers: {
        "content-type": "text/plain; version=0.0.4; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return jsonErr(503, `Metrics unavailable: ${String(e?.message || e).slice(0, 100)}`);
  }
}
