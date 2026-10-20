// ZeroPaye API — Get session status (polled by checkout UI)
// GET /api/zeropaye/status/[id]
// Returns the current state machine status + timing fields.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk, jsonErr } from "@/lib/zeropaye/security";
import { isDemoMode, findDemoSession, getDemoAccountData, updateDemoSession } from "@/lib/zeropaye/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // v3.3: Demo mode — use in-memory data
  if (isDemoMode()) {
    const session = findDemoSession(id);
    if (!session) return jsonErr(404, "Session not found");
    const account = getDemoAccountData();
    // Check expiry
    if (session.status === "ACTIVE" && session.expiresAt) {
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        updateDemoSession(id, { status: "EXPIRED" });
        session.status = "EXPIRED";
      }
    }
    return jsonOk({
      session: {
        id: session.id, orderId: session.orderId,
        amountPaise: session.amountPaise,
        amountRupees: (session.amountPaise / 100).toFixed(2),
        currency: session.currency,
        description: session.description,
        customerName: session.customerName,
        status: session.status,
        queuePosition: session.queuePosition,
        utr: session.utr,
        verificationTier: session.verificationTier,
        expiresAt: session.expiresAt,
        activatedAt: session.activatedAt,
        processingAt: session.processingAt,
        settledAt: session.settledAt,
        createdAt: session.createdAt,
      },
      account: { vpa: account.vpa, accountName: account.accountName, isSlotBusy: account.isSlotBusy, dailyLimitPaise: account.dailyLimitPaise },
    });
  }

  const session = await db.paymentSession.findUnique({ where: { id } });
  if (!session) return jsonErr(404, "Session not found");

  const account = session.receivingAccountId
    ? await db.receivingAccount.findUnique({ where: { id: session.receivingAccountId } })
    : null;

  // Auto-expire ACTIVE sessions past their window (server-authoritative — Invariant 3)
  // v3.2 fix: use expiresAt (set when session became ACTIVE), not createdAt
  if (session.status === "ACTIVE" && session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    await expireSession(session.id, session.receivingAccountId);
  }
  // v4.0 fix: PROCESSING timeout → UNCONFIRMED (not FAILED)
  // Customer said "I've paid" but bank credit not detected within 10 min.
  // Merchant can manually attach observation via reconcile screen.
  if (session.status === "PROCESSING" && session.processingAt) {
    const elapsed = Date.now() - session.processingAt.getTime();
    if (elapsed > 600000) { // 10 minutes (was 3 min, now 10 min for Indian bank SMS)
      await db.paymentSession.update({
        where: { id: session.id },
        data: { status: "UNCONFIRMED" },
      }).catch(() => {});
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
