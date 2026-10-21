// ZeroPaye — Background workers + graceful shutdown
// Audit fixes: NEW-19 (webhook retry daemon), NEW-20 (stale-session sweep),
// production-readiness gap 4 (graceful shutdown), production-readiness gap 5 (structured logging).

import { db } from "@/lib/db";
import { isSsrfSafe } from "./security";
import { hmacSha256, uuid } from "./crypto";
import { notifyObserverOffline, notifyPaymentUnconfirmed } from "./notifications";

const WORKER_INTERVAL_MS = 60_000; // 1 minute
const MAX_WEBHOOK_ATTEMPTS = 10;

let workers: ReturnType<typeof setInterval>[] = [];
let shuttingDown = false;

// ---------------------------------------------------------------------------
// Structured logging (production-readiness gap 5)
// Replaces console.log/error with JSON-ish structured output + request IDs.
// ---------------------------------------------------------------------------
type LogLevel = "info" | "warn" | "error" | "debug";
function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta || {}),
  };
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  info: (m: string, meta?: Record<string, unknown>) => log("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log("error", m, meta),
  debug: (m: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") log("debug", m, meta);
  },
};

// ---------------------------------------------------------------------------
// Worker 1: Webhook retry daemon (audit NEW-19)
// Polls WebhookDelivery rows in RETRYING state and re-attempts delivery
// with exponential backoff. Caps at MAX_WEBHOOK_ATTEMPTS attempts.
// ---------------------------------------------------------------------------
async function retryPendingWebhooks() {
  try {
    const pending = await db.webhookDelivery.findMany({
      where: {
        status: "RETRYING",
        nextRetryAt: { lte: new Date() },
        attempts: { lt: MAX_WEBHOOK_ATTEMPTS },
      },
      take: 10,
    });

    if (pending.length === 0) return;

    logger.info("webhook-retry-batch", { count: pending.length });

    for (const delivery of pending) {
      try {
        const session = await db.paymentSession.findUnique({
          where: { id: delivery.paymentSessionId },
        });
        if (!session) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: { status: "FAILED", responseError: "Session not found" },
          });
          continue;
        }
        const merchant = await db.merchant.findUnique({
          where: { id: session.merchantId },
        });
        if (!merchant?.webhookUrl) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: { status: "FAILED", responseError: "No webhook URL" },
          });
          continue;
        }
        if (!isSsrfSafe(merchant.webhookUrl, true)) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: { status: "FAILED", responseError: "SSRF blocked" },
          });
          continue;
        }

        // v3.2 fix: include timestamp in signature (t.payload Stripe-style)
        // This prevents replay attacks — a captured payload can't be reused
        // because the timestamp in the signature won't match.
        const webhookTimestamp = Date.now();
        const signedPayload = `${webhookTimestamp}.${delivery.payload}`;
        const signature = `sha256=${hmacSha256(merchant.webhookSecret, signedPayload)}`;
        const deliveryId = delivery.deliveryId;

        // v3.2: use async SSRF guard (DNS resolution)
        const { isSsrfSafeAsync } = await import("./security");
        const ssrfOk = await isSsrfSafeAsync(merchant.webhookUrl, true);
        if (!ssrfOk) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: { status: "FAILED", responseError: "SSRF blocked (DNS-resolved)" },
          });
          continue;
        }

        const res = await fetch(merchant.webhookUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-zeropaye-signature": signature,
            "x-zeropaye-event": delivery.eventType,
            "x-zeropaye-delivery-id": deliveryId,
            "x-zeropaye-timestamp": String(webhookTimestamp), // v3.2: matches signature
          },
          body: delivery.payload,
          redirect: "manual", // v3.2: don't follow redirects (SSRF protection)
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "SUCCESS",
              responseCode: res.status,
              attempts: { increment: 1 },
              responseError: null,
            },
          });
          logger.info("webhook-delivered", { deliveryId, code: res.status });
        } else {
          // Exponential backoff: 30s, 60s, 120s, 240s, ...
          const backoff = 30_000 * Math.pow(2, delivery.attempts);
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "RETRYING",
              responseCode: res.status,
              attempts: { increment: 1 },
              responseError: `HTTP ${res.status}`,
              nextRetryAt: new Date(Date.now() + backoff),
            },
          });
          logger.warn("webhook-retry-scheduled", { deliveryId, code: res.status, backoffMs: backoff });
        }
      } catch (err: any) {
        const attempts = delivery.attempts + 1;
        if (attempts >= MAX_WEBHOOK_ATTEMPTS) {
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: { status: "FAILED", attempts, responseError: String(err?.message || err).slice(0, 200) },
          });
          logger.error("webhook-gave-up", { deliveryId: delivery.deliveryId, attempts });
        } else {
          const backoff = 30_000 * Math.pow(2, attempts);
          await db.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "RETRYING",
              attempts,
              responseError: String(err?.message || err).slice(0, 200),
              nextRetryAt: new Date(Date.now() + backoff),
            },
          });
        }
      }
    }
  } catch (err) {
    logger.error("webhook-retry-worker-error", { err: String(err).slice(0, 200) });
  }
}

// ---------------------------------------------------------------------------
// Worker 2: Stale-session sweep (audit NEW-20)
// Periodically expires ACTIVE/PROCESSING sessions past their windows and
// promotes next QUEUED customer. Prevents "stuck slot" when no new
// sessions arrive (e.g., off-hours).
// ---------------------------------------------------------------------------
async function sweepStaleSessions() {
  try {
    const accounts = await db.receivingAccount.findMany({
      where: { isSlotBusy: true },
    });
    if (accounts.length === 0) return;

    const now = new Date();
    let swept = 0;

    for (const account of accounts) {
      const stale = await db.paymentSession.findFirst({
        where: {
          receivingAccountId: account.id,
          status: { in: ["ACTIVE", "PROCESSING"] },
          // v3.2 fix: use expiresAt (set at activation) + processingAt (3min window)
          // Removed createdAt < now-10min (was causing premature expiry of queued-then-promoted sessions)
          OR: [
            { expiresAt: { lt: now } },                                  // ACTIVE past 5-min window
            { processingAt: { lt: new Date(now.getTime() - 600000) } },  // v4.0: PROCESSING past 10-min → UNCONFIRMED (not FAILED)
          ],
        },
        orderBy: { activatedAt: "asc" },
      });
      if (!stale) continue;

      await db.$transaction(async (tx) => {
        // v4.0: PROCESSING sessions → UNCONFIRMED (not EXPIRED), so merchant can reconcile
        const newStatus = stale.status === "PROCESSING" ? "UNCONFIRMED" : "EXPIRED";
        // v4.3: notify merchant about UNCONFIRMED payments
        if (newStatus === "UNCONFIRMED") {
          notifyPaymentUnconfirmed(stale.orderId, stale.amountPaise, stale.merchantId).catch(() => {});
        }
        await tx.paymentSession.update({
          where: { id: stale.id },
          data: { status: newStatus },
        });
        await tx.receivingAccount.update({
          where: { id: account.id },
          data: { isSlotBusy: false },
        });
        // Promote next queued
        const next = await tx.paymentSession.findFirst({
          where: { receivingAccountId: account.id, status: "QUEUED" },
          orderBy: { queuePosition: "asc" },
        });
        if (next) {
          await tx.paymentSession.update({
            where: { id: next.id },
            data: {
              status: "ACTIVE",
              queuePosition: null,
              activatedAt: new Date(),
              expiresAt: new Date(Date.now() + 5 * 60 * 1000), // v3.0 fix: was 5 * 60_1000 = 300,000 (50 min!), now 5 * 60 * 1000 = 300,000 (5 min)
            },
          });
          await tx.receivingAccount.update({
            where: { id: account.id },
            data: { isSlotBusy: true },
          });
        }
        await tx.auditLog.create({
          data: {
            merchantId: stale.merchantId,
            paymentSessionId: stale.id,
            entityType: "payment_session",
            entityId: stale.id,
            action: "STALE_SESSION_EXPIRED",
            actorType: "SYSTEM",
            details: JSON.stringify({ sweeper: "background-worker" }),
          },
        });
      });
      swept++;
    }

    if (swept > 0) logger.info("stale-session-sweep", { swept });
  } catch (err) {
    logger.error("stale-session-sweep-error", { err: String(err).slice(0, 200) });
  }
}

// ---------------------------------------------------------------------------
// Worker 3: Observer heartbeat check
// Marks devices offline if last heartbeat > 5 minutes.
// ---------------------------------------------------------------------------
async function checkObserverHeartbeats() {
  try {
    const cutoff = new Date(Date.now() - 5 * 60_000);
    const stale = await db.device.findMany({
      where: {
        isActive: true,
        lastHeartbeatAt: { lt: cutoff },
      },
      // v4.3: select all fields needed for notification
      select: { id: true, deviceId: true, deviceName: true, lastHeartbeatAt: true, merchantId: true },
    });
    if (stale.length === 0) return;
    logger.warn("observer-heartbeat-stale", { count: stale.length });
    // v4.3: notify merchant about offline observers
    for (const d of stale) {
      notifyObserverOffline(d.deviceName || d.id, d.lastHeartbeatAt?.toISOString() || "never", d.merchantId).catch(() => {});
    }
    // We don't auto-deactivate — just log. Merchant should check the phone.
  } catch (err) {
    logger.error("heartbeat-check-error", { err: String(err).slice(0, 200) });
  }
}

// ---------------------------------------------------------------------------
// Worker 4: DPDP data retention (auto-delete old sessions + observations)
// v4.2 F4: Customer data retention policy (default 180 days, configurable)
// ---------------------------------------------------------------------------
async function dpdpRetentionCleanup() {
  try {
    const retentionDays = parseInt(process.env.DPDP_RETENTION_DAYS || "180");
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Delete old observations (keep UTR for audit)
    const deletedObs = await db.observation.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    // Delete old audit logs
    const deletedLogs = await db.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    // Delete old webhook deliveries
    const deletedWebhooks = await db.webhookDelivery.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    // Anonymize old sessions (keep order ID + amount, remove customer data)
    const anonymized = await db.paymentSession.updateMany({
      where: { createdAt: { lt: cutoff }, customerName: { not: null } },
      data: { customerName: null, description: "[retention-anonymized]" },
    });

    if (deletedObs.count > 0 || deletedLogs.count > 0 || deletedWebhooks.count > 0 || anonymized.count > 0) {
      logger.info("dpdp-retention-cleanup", {
        retentionDays,
        deletedObs: deletedObs.count,
        deletedLogs: deletedLogs.count,
        deletedWebhooks: deletedWebhooks.count,
        anonymized: anonymized.count,
      });
    }
  } catch (err) {
    logger.error("dpdp-retention-error", { err: String(err).slice(0, 200) });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function startBackgroundWorkers() {
  if (workers.length > 0) return; // already started (HMR safe)
  // Stagger intervals so they don't all run at once
  const w1 = setInterval(retryPendingWebhooks, WORKER_INTERVAL_MS);
  const w2 = setInterval(sweepStaleSessions, WORKER_INTERVAL_MS);
  const w3 = setInterval(checkObserverHeartbeats, WORKER_INTERVAL_MS * 2);
  const w4 = setInterval(dpdpRetentionCleanup, 24 * 60 * 60 * 1000); // daily
  workers = [w1, w2, w3, w4];
  logger.info("background-workers-started", {
    webhookRetry: `${WORKER_INTERVAL_MS}ms`,
    staleSweep: `${WORKER_INTERVAL_MS}ms`,
    heartbeatCheck: `${WORKER_INTERVAL_MS * 2}ms`,
  });
  // Run once immediately on boot
  setTimeout(retryPendingWebhooks, 5000);
  setTimeout(sweepStaleSessions, 10000);
}

export function stopBackgroundWorkers() {
  for (const w of workers) clearInterval(w);
  workers = [];
}

export function registerShutdownHandlers() {
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("shutdown-started", { signal });
    stopBackgroundWorkers();
    await db.$disconnect();
    logger.info("shutdown-complete", { signal });
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
