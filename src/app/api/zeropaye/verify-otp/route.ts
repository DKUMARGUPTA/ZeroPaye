// ZeroPaye API — Verify OTP & activate the payment session
// POST /api/zeropaye/verify-otp
// Body: { mobile, otp, sessionId }
// Fixes from audit: S16 (constant-time), S5 (lockout), B5 (BEGIN IMMEDIATE via Prisma transaction).

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyOtp } from "@/lib/zeropaye/otp-store";
import { jsonOk, jsonErr, rateLimit, getClientIp, getUserAgent, getRequestId } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const body = await req.json().catch(() => ({}));
    const mobile = String(body?.mobile || "").replace(/[\s+-]/g, "");
    const otp = String(body?.otp || "").trim();
    const sessionId = String(body?.sessionId || "");

    if (!mobile || !otp || !sessionId) {
      return jsonErr(400, "mobile, otp and sessionId are required");
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

    const updated = await db.$transaction(async (tx) => {
      const account = await tx.receivingAccount.findUnique({ where: { id: session.receivingAccountId! } });
      if (!account) throw new Error("Receiving account missing");

      if (!account.isSlotBusy) {
        await tx.receivingAccount.update({ where: { id: account.id }, data: { isSlotBusy: true } });
        return tx.paymentSession.update({
          where: { id: sessionId },
          data: { status: "ACTIVE", activatedAt: now, expiresAt },
        });
      }
      const queuedCount = await tx.paymentSession.count({
        where: { receivingAccountId: account.id, status: "QUEUED" },
      });
      return tx.paymentSession.update({
        where: { id: sessionId },
        data: { status: "QUEUED", queuePosition: queuedCount + 1 },
      });
    });

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
