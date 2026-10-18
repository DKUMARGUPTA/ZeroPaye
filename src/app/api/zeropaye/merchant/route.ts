// ZeroPaye API — Merchant info + dashboard stats
// GET /api/zeropaye/merchant

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDemoMerchant } from "@/lib/zeropaye/config";
import { jsonOk } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const { merchant, account } = await getDemoMerchant();
  const branding = merchant.branding ? JSON.parse(merchant.branding) : {};

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
