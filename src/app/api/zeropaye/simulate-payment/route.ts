// ZeroPaye API — Simulate a UPI bank credit observation (DEMO ONLY)
// POST /api/zeropaye/simulate-payment
// Body: { sessionId }
// This endpoint mimics what the Android SMS observer / Gmail observer / Google
// Messages observer would POST in production. In ZeroPaye's demo it lets the
// reviewer complete the full flow without a real bank SMS.
//
// Security (audit NEW-01 fixed):
//  - DISABLED in production (NODE_ENV === "production" returns 404)
//  - Requires x-zeropaye-admin-key header (constant-time compare)
//  - Uses conditional updateMany to prevent double-confirm race (audit NEW-07)
//
// Fixes: S2, S9, S19, S21, integer paise, idempotency via UTR, NEW-01, NEW-07, NEW-10.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { buildUpiUri } from "@/lib/zeropaye/upi";
import { formatINR } from "@/lib/zeropaye/money";
import { jsonOk, jsonErr, getRequestId, getClientIp, isSsrfSafe } from "@/lib/zeropaye/security";
import { sha256Hex, uuid, hmacSha256 } from "@/lib/zeropaye/crypto";
import { randomInt } from "node:crypto";
import { requireAdmin, requireDevMode } from "@/lib/zeropaye/admin-auth";
import { incCounter } from "@/lib/zeropaye/metrics/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    // Gate 1: demo-only — disabled in production
    const devGate = requireDevMode();
    if (!devGate.ok) return devGate.response;

    // Gate 2: require admin API key (audit NEW-01)
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || "");
    if (!sessionId) return jsonErr(400, "sessionId is required");

    const session = await db.paymentSession.findUnique({ where: { id: sessionId } });
    if (!session) return jsonErr(404, "Session not found");

    if (!["ACTIVE", "PROCESSING"].includes(session.status)) {
      return jsonErr(409, `Session must be ACTIVE or PROCESSING to confirm (current: ${session.status})`);
    }

    // Generate a realistic 12-digit UTR (bank reference number)
    const utr = String(randomInt(100000000, 1000000000)) + String(randomInt(100, 999));

    const clusterHash = sha256Hex(
      `${session.receivingAccountId}|${session.amountPaise}|${utr}|${Math.floor(Date.now() / 60000)}`
    );

    const ip = await getClientIp();

    // Conditional settlement — only succeeds if status is still ACTIVE/PROCESSING.
    // Prevents the double-confirm race (audit NEW-07).
    const settled = await db.$transaction(async (tx) => {
      // Atomically transition to PROCESSING if still ACTIVE (or keep PROCESSING)
      const transitioned = await tx.paymentSession.updateMany({
        where: { id: sessionId, status: { in: ["ACTIVE", "PROCESSING"] } },
        data: { status: "PROCESSING", processingAt: new Date() },
      });
      if (transitioned.count === 0) {
        // Someone else already settled it — return existing state
        return null;
      }

      await tx.observation.create({
        data: {
          source: "SIMULATED",
          rawText: `[ZeroPaye Demo] UPI credit of ${formatINR(session.amountPaise)} via UTR ${utr}`,
          parsedAmountPaise: session.amountPaise,
          parsedUtr: utr,
          receivingAccountId: session.receivingAccountId,
          paymentSessionId: session.id,
          clusterHash,
          verificationTier: 1,
        },
      });

      // Conditional update: only if still PROCESSING (race-safe)
      const confirm = await tx.paymentSession.updateMany({
        where: { id: sessionId, status: "PROCESSING" },
        data: {
          status: "SUCCESS",
          utr,
          verificationTier: 1,
          observationSources: "SIMULATED",
          settledAt: new Date(),
        },
      });
      if (confirm.count === 0) return null;

      const settled = await tx.paymentSession.findUnique({ where: { id: sessionId } });

      // Free the slot for the next queued customer (Invariant 2)
      if (session.receivingAccountId) {
        await tx.receivingAccount.update({
          where: { id: session.receivingAccountId },
          data: { isSlotBusy: false },
        });
        const next = await tx.paymentSession.findFirst({
          where: { receivingAccountId: session.receivingAccountId, status: "QUEUED" },
          orderBy: { queuePosition: "asc" },
        });
        if (next) {
          await tx.paymentSession.update({
            where: { id: next.id },
            data: { status: "ACTIVE", queuePosition: null, activatedAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
          });
          await tx.receivingAccount.update({ where: { id: session.receivingAccountId }, data: { isSlotBusy: true } });
        }
      }

      await tx.auditLog.create({
        data: {
          merchantId: session.merchantId,
          paymentSessionId: session.id,
          entityType: "observation",
          entityId: utr,
          action: "PAYMENT_CONFIRMED",
          actorType: "OBSERVER",
          actorId: "simulated",
          details: JSON.stringify({ utr, amountPaise: session.amountPaise, requestId }),
          ipAddress: ip,
          requestId,
        },
      });

      return settled;
    });

    if (!settled) {
      // Race lost — another caller already settled. Return current state.
      const cur = await db.paymentSession.findUnique({ where: { id: sessionId } });
      return jsonOk({
        confirmed: cur?.status === "SUCCESS",
        sessionId,
        utr: cur?.utr ?? null,
        alreadyConfirmed: true,
        status: cur?.status,
      });
    }

    incCounter("zeropaye_payments_success_total");
    // Dispatch webhook (queued; retry daemon would handle failures in prod)
    await dispatchWebhook(settled);

    return jsonOk({
      confirmed: true,
      sessionId: settled.id,
      orderId: settled.orderId,
      utr: settled.utr,
      amountPaise: settled.amountPaise,
      amountRupees: (settled.amountPaise / 100).toFixed(2),
      status: settled.status,
      verificationTier: settled.verificationTier,
      settledAt: settled.settledAt?.toISOString(),
    });
  } catch (e) {
    console.error("[ZeroPaye] simulate-payment error", e);
    return jsonErr(500, "Payment simulation failed");
  }
}

// Minimal in-process webhook dispatcher (demo).
// In production this would be a queued job with retries + idempotency table.
async function dispatchWebhook(session: any) {
  try {
    const merchant = await db.merchant.findUnique({ where: { id: session.merchantId } });
    if (!merchant?.webhookUrl) return;
    const payload = JSON.stringify({
      event: "SUCCESS",
      orderId: session.orderId,
      paymentId: session.id,
      amount: (session.amountPaise / 100).toFixed(2),
      amountPaise: session.amountPaise,
      utr: session.utr,
      verificationTier: session.verificationTier,
      currency: session.currency,
      timestamp: Date.now(),
    });
    const signature = `sha256=${hmacSha256(merchant.webhookSecret, payload)}`;
    const deliveryId = uuid();
    const delivery = await db.webhookDelivery.create({
      data: {
        paymentSessionId: session.id,
        eventType: "SUCCESS",
        deliveryId,
        payload,
        status: "PENDING",
      },
    });
    // Attempt delivery (best-effort; SSRF guard in security.ts)
    if (!isSsrfSafe(merchant.webhookUrl, true)) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED", responseError: "SSRF blocked" },
      });
      return;
    }
    try {
      const res = await fetch(merchant.webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-zeropaye-signature": signature,
          "x-zeropaye-event": "SUCCESS",
          "x-zeropaye-delivery-id": deliveryId,
          "x-zeropaye-timestamp": String(Date.now()),
        },
        body: payload,
        signal: AbortSignal.timeout(10000),
      });
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: res.ok ? "SUCCESS" : "FAILED", responseCode: res.status, attempts: { increment: 1 } },
      });
    } catch (err: any) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "RETRYING", responseError: String(err?.message || err).slice(0, 200), attempts: { increment: 1 }, nextRetryAt: new Date(Date.now() + 30000) },
      });
    }
  } catch (e) {
    console.error("[ZeroPaye] webhook dispatch error", e);
  }
}
