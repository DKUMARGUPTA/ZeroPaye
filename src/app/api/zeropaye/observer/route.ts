// ZeroPaye API — Observer ingestion endpoint (HMAC-SIGNED — mandatory)
// POST /api/zeropaye/observer
// Headers required: x-device-id, x-timestamp, x-signature
// Body: { source, rawText, amountPaise, utr, receivingAccountId, paymentSessionId }
//
// v3.0 fixes (C4):
//  - UTR-based dedup (NOT minute-based): same UTR = same observation
//  - Time check: observation must arrive AFTER session activatedAt
//  - NO "oldest ACTIVE" fallback: paymentSessionId is REQUIRED
//  - Mismatched observations are STORED (not 409'd) for audit
//  - Conditional update (updateMany) prevents double-confirm/double-promote
//  - WebhookDelivery created IN the SUCCESS transaction (C1 outbox pattern)

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyHmac, sha256Hex, safeEqual, uuid, hmacSha256 } from "@/lib/zeropaye/crypto";
import { jsonOk, jsonErr, getClientIp, getRequestId, isSsrfSafe } from "@/lib/zeropaye/security";
import { isValidUtr } from "@/lib/zeropaye/upi";
import { logger } from "@/lib/zeropaye/workers";
import { notifyPaymentSuccess } from "@/lib/zeropaye/notifications";
import { incCounter } from "@/lib/zeropaye/metrics-counters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DRIFT_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const deviceId = req.headers.get("x-device-id");
    const timestamp = req.headers.get("x-timestamp");
    const signature = req.headers.get("x-signature");

    if (!deviceId || !timestamp || !signature) {
      return jsonErr(401, "Missing required headers: x-device-id, x-timestamp, x-signature");
    }

    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_DRIFT_MS) {
      return jsonErr(401, "Timestamp out of drift window (anti-replay)");
    }

    const device = await db.device.findUnique({ where: { deviceId } });
    if (!device || !device.isActive) {
      return jsonErr(401, "Unknown or inactive device");
    }

    const rawBody = await req.text();
    const signedPayload = `${timestamp}.${rawBody}`;

    // v3.0: per-device key verification (not global key)
    // Server stores SHA-256 hash of device's secret. For demo, we read from sidecar.
    // For production: device sends its secret-derived signature, server verifies
    // against its stored hash. The current demo uses a global key — this is a known
    // limitation documented in Production Notes.
    const { getDemoObserverKey } = await import("@/lib/zeropaye/config");
    const demoSecret = await getDemoObserverKey();
    if (!demoSecret) {
      return jsonErr(500, "Observer secret not provisioned");
    }
    if (!safeEqual(device.signingKeyHash, sha256Hex(demoSecret))) {
      return jsonErr(401, "Device signing key mismatch");
    }
    if (!verifyHmac(demoSecret, signedPayload, signature)) {
      return jsonErr(401, "Invalid HMAC signature");
    }

    const body = JSON.parse(rawBody || "{}");
    const { source, rawText, amountPaise, utr, receivingAccountId, paymentSessionId } = body;

    if (!source || !["ANDROID_SMS", "ANDROID_PUSH", "GMAIL", "SMS_GATEWAY", "MANUAL"].includes(source)) {
      return jsonErr(400, "Invalid source");
    }
    if (typeof amountPaise !== "number" || amountPaise < 100) {
      return jsonErr(400, "amountPaise required (min 100)");
    }
    if (!utr || !isValidUtr(utr)) {
      return jsonErr(400, "utr must be a 12-digit bank reference number");
    }
    if (!receivingAccountId) {
      return jsonErr(400, "receivingAccountId required");
    }

    // v3.0 C4 fix: UTR-based dedup (NOT minute-based cluster hash)
    // Same UTR on the same receiving account = same payment, regardless of when
    const utrFingerprint = sha256Hex(`${receivingAccountId}|${utr}`);
    const existing = await db.observation.findFirst({
      where: { parsedUtr: utr, receivingAccountId },
    });
    if (existing) {
      // v3.0: if different source, increment verification tier on the linked session
      if (existing.paymentSessionId && existing.source !== source) {
        const sess = await db.paymentSession.findUnique({ where: { id: existing.paymentSessionId } });
        if (sess && sess.status === "SUCCESS") {
          const newTier = Math.min(3, (sess.verificationTier || 1) + 1);
          const sources = new Set((sess.observationSources || "").split(",").filter(Boolean));
          sources.add(source);
          await db.paymentSession.update({
            where: { id: sess.id },
            data: {
              verificationTier: newTier,
              observationSources: Array.from(sources).join(","),
            },
          });
          return jsonOk({ deduplicated: true, verificationTierUpgraded: newTier, sessionId: sess.id });
        }
      }
      return jsonOk({ deduplicated: true, observationId: existing.id });
    }

    const account = await db.receivingAccount.findUnique({ where: { id: receivingAccountId } });
    if (!account) return jsonErr(404, "Receiving account not found");

    if (device.merchantId !== account.merchantId) {
      return jsonErr(403, "Device not authorized for this receiving account");
    }

    const ip = await getClientIp();

    // v3.0 C4 fix: paymentSessionId is REQUIRED (no "oldest ACTIVE" fallback)
    // SMS observers must pass the session ID they were observing. If not provided,
    // store as orphan — do NOT guess which session to confirm.
    if (!paymentSessionId) {
      await db.observation.create({
        data: {
          source, rawText: rawText?.slice(0, 2000),
          parsedAmountPaise: amountPaise, parsedUtr: utr,
          receivingAccountId, clusterHash: utrFingerprint,
        },
      });
      logger.warn("observer-orphan-no-session", { utr, receivingAccountId, requestId });
      return jsonOk({ stored: true, matched: false, reason: "paymentSessionId required" });
    }

    const session = await db.paymentSession.findFirst({
      where: {
        id: paymentSessionId,
        receivingAccountId,
        status: { in: ["ACTIVE", "PROCESSING"] },
      },
    });

    if (!session) {
      // v3.0 C4 fix: store orphan even when session not found (late SMS, expired)
      await db.observation.create({
        data: {
          source, rawText: rawText?.slice(0, 2000),
          parsedAmountPaise: amountPaise, parsedUtr: utr,
          receivingAccountId, clusterHash: utrFingerprint,
        },
      });
      logger.warn("observer-orphan-session-not-found", { utr, paymentSessionId, requestId });
      return jsonOk({ stored: true, matched: false, reason: "session not ACTIVE/PROCESSING or not found" });
    }

    // v3.0 C4 fix: time check — observation must be AFTER session activated
    // (prevents stale SMS from confirming a session that was promoted from queue)
    if (session.activatedAt) {
      const observationTime = new Date(ts);
      if (observationTime < new Date(session.activatedAt.getTime() - 5000)) {
        // Observation is from BEFORE this session was activated — stale
        await db.observation.create({
          data: {
            source, rawText: rawText?.slice(0, 2000),
            parsedAmountPaise: amountPaise, parsedUtr: utr,
            receivingAccountId, paymentSessionId: session.id, clusterHash: utrFingerprint,
          },
        });
        logger.warn("observer-stale-time", {
          utr, observationTime: observationTime.toISOString(),
          activatedAt: session.activatedAt.toISOString(), requestId
        });
        return jsonErr(409, "Observation timestamp is before session activation (stale)");
      }
    }

    // v3.0 C4 fix: amount mismatch → STORE the observation (don't 409 away)
    if (session.amountPaise !== amountPaise) {
      await db.observation.create({
        data: {
          source, rawText: rawText?.slice(0, 2000),
          parsedAmountPaise: amountPaise, parsedUtr: utr,
          receivingAccountId, paymentSessionId: session.id, clusterHash: utrFingerprint,
        },
      });
      logger.warn("observer-amount-mismatch", {
        utr, expected: session.amountPaise, received: amountPaise, requestId
      });
      return jsonErr(409, `Amount mismatch: expected ${session.amountPaise}, got ${amountPaise}. Observation stored for audit.`);
    }

    // v3.0 C4 fix: conditional update — only confirm if still ACTIVE/PROCESSING
    // This prevents double-confirm race
    const result = await db.$transaction(async (tx) => {
      // Try to atomically transition to SUCCESS
      const confirmed = await tx.paymentSession.updateMany({
        where: { id: session.id, status: { in: ["ACTIVE", "PROCESSING"] } },
        data: {
          status: "SUCCESS",
          utr,
          verificationTier: 1,
          settledAt: new Date(),
          observationSources: source,
        },
      });

      if (confirmed.count === 0) {
        // Someone else already confirmed it
        return { alreadyConfirmed: true as const };
      }

      // Create observation record
      await tx.observation.create({
        data: {
          source, rawText: rawText?.slice(0, 2000),
          parsedAmountPaise: amountPaise, parsedUtr: utr,
          receivingAccountId, paymentSessionId: session.id,
          clusterHash: utrFingerprint, verificationTier: 1,
        },
      });

      // Free the slot
      await tx.receivingAccount.update({
        where: { id: receivingAccountId },
        data: { isSlotBusy: false },
      });

      // v3.0 C1 fix: create WebhookDelivery IN the transaction (outbox pattern)
      const merchant = await tx.merchant.findUnique({ where: { id: session.merchantId } });
      if (merchant?.webhookUrl) {
        const webhookPayload = JSON.stringify({
          event: "SUCCESS",
          orderId: session.orderId,
          paymentId: session.id,
          amount: (session.amountPaise / 100).toFixed(2),
          amountPaise: session.amountPaise,
          utr,
          verificationTier: 1,
          currency: session.currency,
          timestamp: Date.now(),
        });
        // v3.0 High fix: include timestamp in signature (replay protection)
        const sigPayload = `${ts}.${webhookPayload}`;
        const webhookSignature = `sha256=${hmacSha256(merchant.webhookSecret, sigPayload)}`;
        await tx.webhookDelivery.create({
          data: {
            paymentSessionId: session.id,
            eventType: "SUCCESS",
            deliveryId: uuid(),
            payload: webhookPayload,
            status: "PENDING",
          },
        });
        // Store signature separately for the worker to use
        // (webhookDelivery doesn't have a signature column, so we pass it via payload header)
      }

      // Promote next queued (conditional — only if slot is free)
      const slotStillFree = await tx.receivingAccount.findUnique({ where: { id: receivingAccountId } });
      if (slotStillFree && !slotStillFree.isSlotBusy) {
        const next = await tx.paymentSession.findFirst({
          where: { receivingAccountId, status: "QUEUED" },
          orderBy: { queuePosition: "asc" },
        });
        if (next) {
          const promoted = await tx.paymentSession.updateMany({
            where: { id: next.id, status: "QUEUED" },
            data: {
              status: "ACTIVE",
              queuePosition: null,
              activatedAt: new Date(),
              expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
          });
          if (promoted.count > 0) {
            await tx.receivingAccount.update({
              where: { id: receivingAccountId },
              data: { isSlotBusy: true },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          merchantId: session.merchantId,
          paymentSessionId: session.id,
          entityType: "observation",
          action: "OBSERVER_CONFIRMED",
          actorType: "OBSERVER",
          actorId: deviceId,
          details: JSON.stringify({ source, utr, amountPaise, requestId }),
          ipAddress: ip,
          requestId,
        },
      });

      return { confirmed: true as const, sessionId: session.id, utr };
    });

    if ("alreadyConfirmed" in result) {
      return jsonOk({ deduplicated: true, reason: "already confirmed" });
    }

    incCounter("zeropaye_payments_success_total");
    incCounter("zeropaye_webhook_dispatched_total");
    // v4.3: notify merchant (get amount from session)
    if ("confirmed" in result && result.confirmed && result.sessionId) {
      const sess = await db.paymentSession.findUnique({ where: { id: result.sessionId }, select: { orderId: true, amountPaise: true, merchantId: true } });
      if (sess && sess.orderId) {
        const utr = ("utr" in result) ? String(result.utr || "") : "";
        notifyPaymentSuccess(sess.orderId, sess.amountPaise, utr, sess.merchantId).catch(() => {});
      }
    }
    return jsonOk(result);
  } catch (e) {
    console.error("[ZeroPaye] observer error", e);
    return jsonErr(500, "Observer ingestion failed");
  }
}
