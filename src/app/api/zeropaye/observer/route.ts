// ZeroPaye API — Observer ingestion endpoint (HMAC-SIGNED — mandatory)
// POST /api/zeropaye/observer
// Headers required: x-device-id, x-timestamp, x-signature
// Body: { source, rawText, amountPaise, utr, receivingAccountId, paymentSessionId? }
// Fixes from audit: S2 (HMAC optional), S9 (plaintext key), S19 (UTR regex),
// S20 (substring email), S21 (fallback to any session — REMOVED).

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyHmac, sha256Hex, safeEqual } from "@/lib/zeropaye/crypto";
import { jsonOk, jsonErr, getClientIp, getRequestId } from "@/lib/zeropaye/security";
import { isValidUtr } from "@/lib/zeropaye/upi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DRIFT_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const deviceId = req.headers.get("x-device-id");
    const timestamp = req.headers.get("x-timestamp");
    const signature = req.headers.get("x-signature");

    // MANDATORY headers (audit S2 — previously optional)
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

    // HMAC verify — constant time. The signed payload is "<timestamp>.<rawBody>"
    const rawBody = await req.text();
    const signedPayload = `${timestamp}.${rawBody}`;
    // Audit NEW-09: read the demo signing key from a persisted sidecar file
    // (survives restarts). In production, the device keeps the secret; the
    // server stores only the public key / hash.
    const { getDemoObserverKey } = await import("@/lib/zeropaye/config");
    const demoSecret = await getDemoObserverKey();
    if (!demoSecret) {
      return jsonErr(500, "Observer secret not provisioned (run the demo first)");
    }
    // Verify device signing key hash matches (ensures the demo device is the right one)
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
      return jsonErr(400, "utr must be a 12-digit bank reference number"); // S19 fix
    }
    if (!receivingAccountId) {
      return jsonErr(400, "receivingAccountId required");
    }

    // Idempotency: cluster hash deduplicates duplicate observations
    const clusterHash = sha256Hex(`${receivingAccountId}|${amountPaise}|${utr}|${Math.floor(Date.now() / 60000)}`);
    const existing = await db.observation.findFirst({ where: { clusterHash } });
    if (existing) {
      return jsonOk({ deduplicated: true, observationId: existing.id });
    }

    const account = await db.receivingAccount.findUnique({ where: { id: receivingAccountId } });
    if (!account) return jsonErr(404, "Receiving account not found");

    // Audit NEW-05: device must belong to the same merchant as the receiving account
    if (device.merchantId !== account.merchantId) {
      return jsonErr(403, "Device not authorized for this receiving account");
    }

    const ip = await getClientIp();

    // Find the matching ACTIVE/PROCESSING session.
    // Audit NEW-04: even when paymentSessionId is provided, enforce status filter
    // so an EXPIRED/FAILED/SUCCESS session cannot be re-confirmed.
    let session = null;
    if (paymentSessionId) {
      session = await db.paymentSession.findFirst({
        where: { id: paymentSessionId, receivingAccountId, status: { in: ["ACTIVE", "PROCESSING"] } },
      });
    } else {
      session = await db.paymentSession.findFirst({
        where: { receivingAccountId, status: { in: ["ACTIVE", "PROCESSING"] } },
        orderBy: { activatedAt: "asc" },
      });
    }
    if (!session) {
      // Store orphan observation for later matching
      await db.observation.create({
        data: { source, rawText: rawText?.slice(0, 2000), parsedAmountPaise: amountPaise, parsedUtr: utr, receivingAccountId, clusterHash },
      });
      return jsonOk({ stored: true, matched: false });
    }

    // Strict amount match (Invariant 1 — no fuzzy matching)
    if (session.amountPaise !== amountPaise) {
      return jsonErr(409, `Amount mismatch: expected ${session.amountPaise}, got ${amountPaise}`);
    }

    await db.$transaction(async (tx) => {
      await tx.observation.create({
        data: {
          source, rawText: rawText?.slice(0, 2000), parsedAmountPaise: amountPaise, parsedUtr: utr,
          receivingAccountId, paymentSessionId: session.id, clusterHash, verificationTier: 1,
        },
      });
      await tx.paymentSession.update({
        where: { id: session!.id },
        data: { status: "SUCCESS", utr, verificationTier: 1, settledAt: new Date(), observationSources: source },
      });
      await tx.receivingAccount.update({ where: { id: receivingAccountId }, data: { isSlotBusy: false } });
      await tx.auditLog.create({
        data: {
          merchantId: session!.merchantId, paymentSessionId: session!.id,
          entityType: "observation", action: "OBSERVER_CONFIRMED",
          actorType: "OBSERVER", actorId: deviceId,
          details: JSON.stringify({ source, utr, amountPaise, requestId }),
          ipAddress: ip, requestId,
        },
      });
      // Promote next queued
      const next = await tx.paymentSession.findFirst({ where: { receivingAccountId, status: "QUEUED" }, orderBy: { queuePosition: "asc" } });
      if (next) {
        await tx.paymentSession.update({ where: { id: next.id }, data: { status: "ACTIVE", queuePosition: null, activatedAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) } });
        await tx.receivingAccount.update({ where: { id: receivingAccountId }, data: { isSlotBusy: true } });
      }
    });

    return jsonOk({ confirmed: true, sessionId: session.id, utr });
  } catch (e) {
    console.error("[ZeroPaye] observer error", e);
    return jsonErr(500, "Observer ingestion failed");
  }
}
