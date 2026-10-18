// ZeroPaye API — Get session status (polled by checkout UI)
// GET /api/zeropaye/status/[id]
// Returns the current state machine status + timing fields.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk, jsonErr } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await db.paymentSession.findUnique({ where: { id } });
  if (!session) return jsonErr(404, "Session not found");

  const account = session.receivingAccountId
    ? await db.receivingAccount.findUnique({ where: { id: session.receivingAccountId } })
    : null;

  // Auto-expire ACTIVE sessions past their window (server-authoritative — Invariant 3)
  if (session.status === "ACTIVE" && session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    await expireSession(session.id, session.receivingAccountId);
  }
  if (session.status === "PROCESSING" && session.processingAt) {
    const elapsed = Date.now() - session.processingAt.getTime();
    if (elapsed > 30000) {
      await failSession(session.id, session.receivingAccountId, "Verification timed out (30s)");
    }
  }

  const final = (await db.paymentSession.findUnique({ where: { id } }))!;

  return jsonOk({
    session: {
      id: final.id,
      orderId: final.orderId,
      amountPaise: final.amountPaise,
      amountRupees: (final.amountPaise / 100).toFixed(2),
      currency: final.currency,
      description: final.description,
      customerName: final.customerName,
      status: final.status,
      queuePosition: final.queuePosition,
      utr: final.utr,
      verificationTier: final.verificationTier,
      expiresAt: final.expiresAt?.toISOString() ?? null,
      activatedAt: final.activatedAt?.toISOString() ?? null,
      processingAt: final.processingAt?.toISOString() ?? null,
      settledAt: final.settledAt?.toISOString() ?? null,
      createdAt: final.createdAt.toISOString(),
    },
    account: account ? { vpa: account.vpa, accountName: account.accountName, isSlotBusy: account.isSlotBusy } : null,
  });
}

async function expireSession(id: string, accountId: string | null) {
  await db.$transaction(async (tx) => {
    await tx.paymentSession.update({ where: { id }, data: { status: "EXPIRED" } });
    if (accountId) {
      await tx.receivingAccount.update({ where: { id: accountId }, data: { isSlotBusy: false } });
    }
    // Promote next queued session
    const next = await tx.paymentSession.findFirst({
      where: { receivingAccountId: accountId, status: "QUEUED" },
      orderBy: { queuePosition: "asc" },
    });
    if (next) {
      await tx.paymentSession.update({
        where: { id: next.id },
        data: { status: "ACTIVE", queuePosition: null, activatedAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      });
      await tx.receivingAccount.update({ where: { id: accountId! }, data: { isSlotBusy: true } });
    }
  });
}

async function failSession(id: string, accountId: string | null, _reason: string) {
  await db.$transaction(async (tx) => {
    await tx.paymentSession.update({ where: { id }, data: { status: "FAILED" } });
    if (accountId) {
      await tx.receivingAccount.update({ where: { id: accountId }, data: { isSlotBusy: false } });
    }
    const next = await tx.paymentSession.findFirst({
      where: { receivingAccountId: accountId, status: "QUEUED" },
      orderBy: { queuePosition: "asc" },
    });
    if (next) {
      await tx.paymentSession.update({
        where: { id: next.id },
        data: { status: "ACTIVE", queuePosition: null, activatedAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      });
      await tx.receivingAccount.update({ where: { id: accountId! }, data: { isSlotBusy: true } });
    }
  });
}
