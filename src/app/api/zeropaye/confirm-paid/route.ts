// ZeroPaye API — Customer clicks "I've Paid" — transition ACTIVE -> PROCESSING
// POST /api/zeropaye/confirm-paid
// Body: { sessionId }
// Starts the 30-second verification window (server-authoritative — Invariant 3).

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk, jsonErr, getRequestId, getClientIp } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.sessionId || "");
    if (!sessionId) return jsonErr(400, "sessionId required");

    const session = await db.paymentSession.findUnique({ where: { id: sessionId } });
    if (!session) return jsonErr(404, "Session not found");
    if (session.status !== "ACTIVE") {
      return jsonErr(409, `Session is not ACTIVE (current: ${session.status})`);
    }

    const ip = await getClientIp();
    const updated = await db.paymentSession.update({
      where: { id: sessionId },
      data: { status: "PROCESSING", processingAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        merchantId: session.merchantId,
        paymentSessionId: session.id,
        entityType: "payment_session",
        entityId: session.id,
        action: "CUSTOMER_PAID_CLICKED",
        actorType: "CUSTOMER",
        actorId: ip,
        details: JSON.stringify({ requestId }),
        ipAddress: ip,
        requestId,
      },
    });

    return jsonOk({ session: { id: updated.id, status: updated.status, processingAt: updated.processingAt?.toISOString() } });
  } catch (e) {
    console.error("[ZeroPaye] confirm-paid error", e);
    return jsonErr(500, "Failed to transition to PROCESSING");
  }
}
