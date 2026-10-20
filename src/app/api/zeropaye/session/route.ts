// ZeroPaye API — Create / list payment sessions
// POST  /api/zeropaye/session              -> create INITIATED session
// GET   /api/zeropaye/session               -> list recent sessions (dashboard)
// Fixes from audit: S1 (no auth on admin), S32 (idempotency), integer paise.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDemoMerchant } from "@/lib/zeropaye/config";
import { toPaise } from "@/lib/zeropaye/money";
import { jsonOk, jsonErr, getClientIp, getUserAgent, getRequestId, rateLimit } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";
import { isValidOrderId, isValidCurrency, getIdempotencyKey } from "@/lib/zeropaye/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, amount, currency, description, customerName, publicApiKey } = body || {};

    // v3.0 C5 fix: verify publicApiKey (was ignored — trust-the-client)
    const { merchant, account } = await getDemoMerchant();
    if (publicApiKey && publicApiKey !== merchant.publicApiKey) {
      return jsonErr(401, "Invalid publicApiKey");
    }
    // v3.0 C5 fix: merchantId removed from body (was injectable)

    // v3.0 C5 fix: rate limit session creation
    const ip = await getClientIp();
    const rl = rateLimit({ key: `session:${ip}`, maxTokens: 10, refillPerSec: 1 / 10 });
    if (!rl.ok) {
      return jsonErr(429, "Too many checkout sessions. Slow down.");
    }

    // Input validation
    if (!orderId) return jsonErr(400, "orderId is required");
    if (!isValidOrderId(String(orderId))) {
      return jsonErr(400, "orderId must be 1-35 chars, alphanumeric + dash/underscore only");
    }
    if (amount === undefined || amount === null) return jsonErr(400, "amount is required");
    // v3.0 C5 fix: INR only (was any 3-letter code — "USD" would work)
    if (currency && currency !== "INR") {
      return jsonErr(400, "Only INR is supported (UPI is India-only)");
    }

    let amountPaise: number;
    try {
      amountPaise = toPaise(amount);
    } catch {
      return jsonErr(400, "amount must be a valid rupees value (e.g. 499 or '499.00')");
    }
    if (amountPaise < 100) return jsonErr(400, "Minimum amount is ₹1.00");
    if (amountPaise > 10000000) return jsonErr(400, "Maximum amount is ₹1,00,000 (UPI limit)");

    const realMerchantId = merchant.id;

    // Clean up expired ACTIVE/PROCESSING sessions so the single VPA slot is
    // freed for new demo runs. (Server-authoritative sweep — Invariant 3.)
    if (account) {
      const now = new Date();
      const stale = await db.paymentSession.findMany({
        where: {
          receivingAccountId: account.id,
          status: { in: ["ACTIVE", "PROCESSING"] },
          OR: [
            { expiresAt: { lt: now } },                                  // ACTIVE past 5-min window
            { processingAt: { lt: new Date(now.getTime() - 180000) } },   // v3.2: PROCESSING past 3-min (was 30s)
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

    // v3.0 C5 fix: orderId collision with DIFFERENT amount → 409 (not return old session)
    // Prevents attacker from pre-creating ₹1 session with same orderId.
    // v3.2 fix: allow tolerance of 99 paise (unique-paise suffix range) for same orderId.
    const existing = await db.paymentSession.findFirst({
      where: { merchantId: realMerchantId, orderId, status: { in: ["INITIATED", "AUTH_PENDING", "AUTHENTICATED", "QUEUED", "ACTIVE", "PROCESSING"] } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      const amountDiff = Math.abs(existing.amountPaise - amountPaise);
      if (amountDiff > 99) {
        return jsonErr(409, `orderId "${orderId}" already exists with a different amount (₹${(existing.amountPaise / 100).toFixed(2)}). Use a unique orderId.`);
      }
      // Same amount (within suffix tolerance) → return existing (idempotent)
      return jsonOk({ session: serialize(existing), merchant: { publicApiKey: merchant.publicApiKey, businessName: merchant.businessName } });
    }

    // v3.0 C5 fix: use idempotency key if provided
    const idemKey = getIdempotencyKey(req);

    // v3.2 fix: unique-paise suffix — add 1-99 random paise to each session's amount.
    // This makes every session's expected amount unique (₹499.00 → ₹499.07, ₹499.03, etc.)
    // so that same-amount collision is eliminated. Observer can match by exact amount
    // without needing single-slot FIFO queue (though we keep it as backup).
    // The customer pays the exact amount shown on the QR (includes suffix).
    // The extra 1-99 paise goes to the merchant's bank (real money, negligible).
    const suffixPaise = Math.floor(Math.random() * 99) + 1; // 1-99
    const actualAmountPaise = amountPaise + suffixPaise;

    const session = await db.paymentSession.create({
      data: {
        merchantId: realMerchantId,
        receivingAccountId: account?.id,
        orderId,
        amountPaise: actualAmountPaise, // includes suffix for exact matching
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

export async function GET(req: NextRequest) {
  // Audit NEW-03: admin endpoints must be authenticated
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;
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
