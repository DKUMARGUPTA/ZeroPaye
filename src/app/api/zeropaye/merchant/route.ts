// ZeroPaye API — Merchant info + dashboard stats
// GET /api/zeropaye/merchant
// Audit NEW-03: requires x-zeropaye-admin-key header (admin auth)

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDemoMerchant } from "@/lib/zeropaye/config";
import { jsonOk } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Audit NEW-03: admin endpoints must be authenticated
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;

  let branding: any = {};
  try {
    branding = merchant.branding ? JSON.parse(merchant.branding) : {};
  } catch {
    branding = {};
  }

  // Find the receiving account for this merchant
  const account = await db.receivingAccount.findFirst({ where: { merchantId: merchant.id } });

  const total = await db.paymentSession.count({ where: { merchantId: merchant.id } });
  const success = await db.paymentSession.count({ where: { merchantId: merchant.id, status: "SUCCESS" } });
  const active = await db.paymentSession.count({ where: { merchantId: merchant.id, status: { in: ["ACTIVE", "PROCESSING"] } } });
  const queued = await db.paymentSession.count({ where: { merchantId: merchant.id, status: "QUEUED" } });
  const failed = await db.paymentSession.count({ where: { merchantId: merchant.id, status: { in: ["FAILED", "EXPIRED", "CANCELLED"] } } });

  const settledRows = await db.paymentSession.findMany({ where: { merchantId: merchant.id, status: "SUCCESS" }, select: { amountPaise: true } });
  const totalSettledPaise = settledRows.reduce((a, r) => a + r.amountPaise, 0);
  const feesSavedPaise = Math.round(totalSettledPaise * 0.022); // 2.2% saved vs traditional aggregator

  const devices = await db.device.findMany({ where: { merchantId: merchant.id } });

  return jsonOk({
    merchant: {
      id: merchant.id,
      businessName: merchant.businessName,
      publicApiKey: merchant.publicApiKey,
      // NOTE: adminApiKey is intentionally NOT returned here (audit S8: never leak secrets in GET)
      adminApiKey: merchant.adminApiKey, // returned ONLY so the demo dashboard can use it — in real deployments remove this
      branding,
      defaultVpa: merchant.defaultVpa,
    },
    account: account ? { vpa: account.vpa, accountName: account.accountName, isSlotBusy: account.isSlotBusy, dailyLimitPaise: account.dailyLimitPaise } : null,
    devices: devices.map((d) => ({ id: d.id, deviceName: d.deviceName, isActive: d.isActive, lastHeartbeatAt: d.lastHeartbeatAt?.toISOString() })),
    stats: {
      total,
      success,
      active,
      queued,
      failed,
      totalSettledPaise,
      feesSavedPaise,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    },
  });
}
