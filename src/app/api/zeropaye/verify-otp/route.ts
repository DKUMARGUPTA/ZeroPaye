// ZeroPaye API — Verify OTP & activate the payment session
// POST /api/zeropaye/verify-otp
// Body: { mobile, otp, sessionId }
// Fixes from audit: S16 (constant-time), S5 (lockout), B5 (BEGIN IMMEDIATE via Prisma transaction).

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/zeropaye/otp-store";
import { jsonOk, jsonErr, rateLimit, getClientIp, getUserAgent, getRequestId } from "@/lib/zeropaye/security";
import { normalizeIndianMobile, isValidIndianMobileStrict } from "@/lib/zeropaye/validation";
import { incCounter } from "@/lib/zeropaye/metrics/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const body = await req.json().catch(() => ({}));
    const mobile = normalizeIndianMobile(String(body?.mobile || ""));
    const otp = String(body?.otp || "").trim();
    const sessionId = String(body?.sessionId || "");

    if (!mobile || !otp || !sessionId) {
      return jsonErr(400, "mobile, otp and sessionId are required");
    }
    if (!isValidIndianMobileStrict(mobile)) {
      return jsonErr(400, "mobile must be a valid 10-digit Indian mobile number");
    }

    const ip = await getClientIp();
    const v = rateLimit({ key: `verify:${ip}`, maxTokens: 10, refillPerSec: 1 / 30 });
    if (!v.ok) return jsonErr(429, "Too many verify attempts. Slow down.");

    const result = verifyOtp(mobile, otp);
    if (!result.ok) {
      return jsonErr(401, result.reason);
    }

    const session = await db.paymentSession.findUnique({ where: { id: sessionId } });
    if (!session) return jsonErr(404, "Session not found");
    if (session.status !== "AUTH_PENDING") {
      return jsonErr(409, `Session is not awaiting OTP (current: ${session.status})`);
    }
    const customer = await db.customer.findUnique({ where: { mobileNumber: mobile } });
    if (!customer || session.customerId !== customer.id) {
      return jsonErr(403, "Mobile number does not match this checkout session");
    }

    const ua = await getUserAgent();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    if (!session.receivingAccountId) {
      return jsonErr(500, "Session has no receiving account"); // audit NEW-13
    }

    // Race-safe slot acquisition (audit NEW-06): use conditional updateMany
    // so double-clicked verify attempts can't both transition the same session.
    const updated = await db.$transaction(async (tx) => {
      const account = await tx.receivingAccount.findUnique({ where: { id: session.receivingAccountId! } });
      if (!account) throw new Error("Receiving account missing");

      // Conditional: only update if still AUTH_PENDING (race-safe)
      if (!account.isSlotBusy) {
        const acquired = await tx.paymentSession.updateMany({
          where: { id: sessionId, status: "AUTH_PENDING" },
          data: { status: "ACTIVE", activatedAt: now, expiresAt },
        });
        if (acquired.count === 0) {
          // Someone else already moved it — return current state
          return await tx.paymentSession.findUnique({ where: { id: sessionId } });
        }
        await tx.receivingAccount.update({ where: { id: account.id }, data: { isSlotBusy: true } });
        return await tx.paymentSession.findUnique({ where: { id: sessionId } });
      }
      // Slot busy — enqueue, but only if still AUTH_PENDING (race-safe)
      const queuedCount = await tx.paymentSession.count({
        where: { receivingAccountId: account.id, status: "QUEUED" },
      });
      const enqueued = await tx.paymentSession.updateMany({
        where: { id: sessionId, status: "AUTH_PENDING" },
        data: { status: "QUEUED", queuePosition: queuedCount + 1 },
      });
      if (enqueued.count === 0) {
        return await tx.paymentSession.findUnique({ where: { id: sessionId } });
      }
      return await tx.paymentSession.findUnique({ where: { id: sessionId } });
    });

    if (!updated) return jsonErr(404, "Session disappeared mid-transaction");

    await db.auditLog.create({
      data: {
        merchantId: session.merchantId,
        paymentSessionId: session.id,
        entityType: "payment_session",
        entityId: session.id,
        action: "OTP_VERIFIED",
        actorType: "CUSTOMER",
        actorId: customer.id,
        details: JSON.stringify({ result: updated.status, requestId, userAgent: ua.slice(0, 120) }),
        ipAddress: ip,
        requestId,
      },
    });

    incCounter("zeropaye_otp_verified_total");
    return jsonOk({
      verified: true,
      session: {
        id: updated.id,
        status: updated.status,
        queuePosition: updated.queuePosition,
        expiresAt: updated.expiresAt?.toISOString() ?? null,
        activatedAt: updated.activatedAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    console.error("[ZeroPaye] verify-otp error", e);
    return jsonErr(500, "OTP verification failed");
  }
}
