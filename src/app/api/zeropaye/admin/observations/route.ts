// ZeroPaye API — Admin: list unmatched observations + attach to session
// GET  /api/zeropaye/admin/observations        → list UNMATCHED observations
// POST /api/zeropaye/admin/observations/[id]/attach → attach to a session + settle
// v4.0 A3 fix: reconcile screen for late/wrong-amount bank credits.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk, jsonErr, getRequestId, getClientIp } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";
import { isDemoMode } from "@/lib/zeropaye/demo-data";
import { logger } from "@/lib/zeropaye/workers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — list unmatched observations
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  // Demo mode: return empty list (no real observations in demo)
  if (isDemoMode()) {
    return jsonOk({ observations: [] });
  }

  // Find observations that have no paymentSessionId (unmatched)
  const observations = await db.observation.findMany({
    where: { paymentSessionId: null, parsedUtr: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      source: true,
      parsedAmountPaise: true,
      parsedUtr: true,
      rawText: true,
      receivingAccountId: true,
      createdAt: true,
    },
  });

  return jsonOk({ observations });
}

// POST — attach observation to a session (reconcile)
export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;

  const body = await req.json().catch(() => ({}));
  const { observationId, sessionId } = body;

  if (!observationId || !sessionId) {
    return jsonErr(400, "observationId and sessionId are required");
  }

  // Demo mode: simulate success
  if (isDemoMode()) {
    return jsonOk({ attached: true, sessionId, late: true, message: "Demo mode: simulated attach" });
  }

  try {
    const obs = await db.observation.findUnique({ where: { id: observationId } });
    if (!obs) return jsonErr(404, "Observation not found");
    if (obs.paymentSessionId) return jsonErr(409, "Observation already linked to a session");

    const session = await db.paymentSession.findUnique({ where: { id: sessionId } });
    if (!session) return jsonErr(404, "Session not found");
    if (session.merchantId !== merchant.id) return jsonErr(403, "Session belongs to another merchant");

    // Allow attaching to EXPIRED/UNCONFIRMED sessions (late payment)
    if (!["EXPIRED", "UNCONFIRMED", "ACTIVE", "PROCESSING"].includes(session.status)) {
      return jsonErr(409, `Session is ${session.status} — cannot attach`);
    }

    // Amount must match (exact paise)
    if (obs.parsedAmountPaise !== session.amountPaise) {
      return jsonErr(409, `Amount mismatch: observation ${obs.parsedAmountPaise}, session ${session.amountPaise}`);
    }

    const ip = await getClientIp();
    const result = await db.$transaction(async (tx) => {
      // Link observation to session
      await tx.observation.update({
        where: { id: observationId },
        data: { paymentSessionId: sessionId },
      });

      // Settle session (allowLate = true for reconcile)
      const settled = await tx.paymentSession.updateMany({
        where: { id: sessionId, status: { in: ["EXPIRED", "UNCONFIRMED", "ACTIVE", "PROCESSING"] } },
        data: {
          status: "SUCCESS",
          utr: obs.parsedUtr,
          verificationTier: 1,
          observationSources: obs.source + " (MANUAL)",
          settledAt: new Date(),
        },
      });

      if (settled.count === 0) {
        throw new Error("Session already settled by another process");
      }

      // Free the slot
      if (session.receivingAccountId) {
        await tx.receivingAccount.update({
          where: { id: session.receivingAccountId },
          data: { isSlotBusy: false },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          merchantId: merchant.id,
          paymentSessionId: sessionId,
          entityType: "observation",
          entityId: observationId,
          action: "MANUAL_RECONCILE",
          actorType: "ADMIN",
          actorId: ip,
          details: JSON.stringify({ observationId, sessionId, utr: obs.parsedUtr, late: true, requestId }),
          ipAddress: ip,
          requestId,
        },
      });

      return { attached: true, sessionId, utr: obs.parsedUtr, late: true };
    });

    logger.info("reconcile-attach", { observationId, sessionId, requestId });
    return jsonOk(result);
  } catch (e: any) {
    console.error("[ZeroPaye] reconcile error", e);
    return jsonErr(500, e.message || "Reconcile failed");
  }
}
