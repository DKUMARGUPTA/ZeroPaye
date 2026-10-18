// ZeroPaye API — Create / list payment sessions
// POST  /api/zeropaye/session              -> create INITIATED session
// GET   /api/zeropaye/session               -> list recent sessions (dashboard)
// Fixes from audit: S1 (no auth on admin), S32 (idempotency), integer paise.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDemoMerchant } from "@/lib/zeropaye/config";
import { toPaise } from "@/lib/zeropaye/money";
import { jsonOk, jsonErr, getClientIp, getUserAgent, getRequestId } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const body = await req.json().catch(() => ({}));
    const { merchantId, orderId, amount, currency, description, customerName } = body || {};

    if (!orderId) return jsonErr(400, "orderId is required");
    if (amount === undefined || amount === null) return jsonErr(400, "amount is required");

    let amountPaise: number;
    try {
      amountPaise = toPaise(amount);
    } catch {
      return jsonErr(400, "amount must be a valid rupees value (e.g. 499 or '499.00')");
    }
    if (amountPaise < 100) return jsonErr(400, "Minimum amount is ₹1.00");
    if (amountPaise > 10000000) return jsonErr(400, "Maximum amount is ₹1,00,000 (UPI limit)");

    const { merchant, account } = await getDemoMerchant();
    const realMerchantId = merchantId || merchant.id;

    // Clean up expired ACTIVE/PROCESSING sessions so the single VPA slot is
    // freed for new demo runs. (Server-authoritative sweep — Invariant 3.)
    if (account) {
      const now = new Date();
      const stale = await db.paymentSession.findMany({
        where: {
          receivingAccountId: account.id,
          status: { in: ["ACTIVE", "PROCESSING"] },
          OR: [
            { expiresAt: { lt: now } },
            { processingAt: { lt: new Date(now.getTime() - 30000) } },
            { createdAt: { lt: new Date(now.getTime() - 10 * 60 * 1000) } },
          ],
        },
        select: { id: true },
      });
      if (stale.length) {
        await db.$transaction(async (tx) => {
          await tx.paymentSession.updateMany({
            where: { id: { in: stale.map((s) => s.id) } },
            data: { status: "EXPIRED" },
          });
          await tx.receivingAccount.update({ where: { id: account.id }, data: { isSlotBusy: false } });
          // promote oldest queued if any
          const next = await tx.paymentSession.findFirst({
            where: { receivingAccountId: account.id, status: "QUEUED" },
            orderBy: { queuePosition: "asc" },
          });
          if (next) {
            await tx.paymentSession.update({
              where: { id: next.id },
              data: { status: "ACTIVE", queuePosition: null, activatedAt: new Date(), expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            });
            await tx.receivingAccount.update({ where: { id: account.id }, data: { isSlotBusy: true } });
          }
        });
      }
    }

    // Idempotency: same orderId for same merchant returns existing live session
    const existing = await db.paymentSession.findFirst({
      where: { merchantId: realMerchantId, orderId, status: { in: ["INITIATED", "AUTH_PENDING", "AUTHENTICATED", "QUEUED", "ACTIVE", "PROCESSING"] } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return jsonOk({ session: serialize(existing), merchant: { publicApiKey: merchant.publicApiKey, businessName: merchant.businessName } });
    }

    const ip = await getClientIp();

    const session = await db.paymentSession.create({
      data: {
        merchantId: realMerchantId,
        receivingAccountId: account?.id,
        orderId,
        amountPaise,
        currency: currency || "INR",
        description: description?.toString().slice(0, 200) || null,
        customerName: customerName?.toString().slice(0, 120) || null,
        status: "INITIATED",
      },
    });

    await db.auditLog.create({
      data: {
        merchantId: realMerchantId,
        paymentSessionId: session.id,
        entityType: "payment_session",
        entityId: session.id,
        action: "SESSION_CREATED",
        actorType: "CUSTOMER",
        actorId: ip,
        details: JSON.stringify({ orderId, amountPaise, currency: currency || "INR", requestId }),
        ipAddress: ip,
        requestId,
      },
    });

    return jsonOk({ session: serialize(session), merchant: { publicApiKey: merchant.publicApiKey, businessName: merchant.businessName } });
  } catch (e) {
    console.error("[ZeroPaye] session POST error", e);
    return jsonErr(500, "Failed to create session");
  }
}

export async function GET() {
  const { merchant } = await getDemoMerchant();
  const sessions = await db.paymentSession.findMany({
    where: { merchantId: merchant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonOk({ sessions: sessions.map(serialize) });
}

function serialize(s: any) {
  return {
    id: s.id,
    orderId: s.orderId,
    amountPaise: s.amountPaise,
    amountRupees: (s.amountPaise / 100).toFixed(2),
    currency: s.currency,
    description: s.description,
    customerName: s.customerName,
    status: s.status,
    queuePosition: s.queuePosition,
    utr: s.utr,
    verificationTier: s.verificationTier,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    activatedAt: s.activatedAt?.toISOString() ?? null,
    processingAt: s.processingAt?.toISOString() ?? null,
    settledAt: s.settledAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}
