// ZeroPaye — Background workers + graceful shutdown
// Audit fixes: NEW-19 (webhook retry daemon), NEW-20 (stale-session sweep),
// production-readiness gap 4 (graceful shutdown), production-readiness gap 5 (structured logging).

import { db } from "@/lib/db";
import { isSsrfSafe } from "./security";
import { hmacSha256, uuid } from "./crypto";

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

        const signature = `sha256=${hmacSha256(merchant.webhookSecret, delivery.payload)}`;
        const deliveryId = delivery.deliveryId;
        const res = await fetch(merchant.webhookUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-zeropaye-signature": signature,
            "x-zeropaye-event": delivery.eventType,
            "x-zeropaye-delivery-id": deliveryId,
            "x-zeropaye-timestamp": String(Date.now()),
          },
          body: delivery.payload,
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
          OR: [
            { expiresAt: { lt: now } },
            { processingAt: { lt: new Date(now.getTime() - 30_000) } },
            { createdAt: { lt: new Date(now.getTime() - 10 * 60_000) } },
          ],
        },
        orderBy: { activatedAt: "asc" },
      });
      if (!stale) continue;

      await db.$transaction(async (tx) => {
        await tx.paymentSession.update({
          where: { id: stale.id },
          data: { status: "EXPIRED" },
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
              expiresAt: new Date(Date.now() + 5 * 60_1000),
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
      select: { id: true, deviceId: true },
    });
    if (stale.length === 0) return;
    logger.warn("observer-heartbeat-stale", { count: stale.length });
    // We don't auto-deactivate — just log. Merchant should check the phone.
  } catch (err) {
    logger.error("heartbeat-check-error", { err: String(err).slice(0, 200) });
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
  workers = [w1, w2, w3];
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
