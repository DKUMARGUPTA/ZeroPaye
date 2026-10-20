// ZeroPaye API — Merchant info + dashboard stats
// GET /api/zeropaye/merchant
// v3.3: In demo mode, uses in-memory mock data (no DB needed for Vercel)

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";
import { isDemoMode, getDemoMerchantData, getDemoAccountData, getDemoStats, getDemoSessions } from "@/lib/zeropaye/demo-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;

  // v3.3: Demo mode — use in-memory data, no DB needed
  if (isDemoMode()) {
    const m = getDemoMerchantData();
    const account = getDemoAccountData();
    const stats = getDemoStats();
    const sessions = getDemoSessions();
    let branding: any = {};
    try { branding = JSON.parse(m.branding); } catch {}
    return jsonOk({
      merchant: {
        id: m.id,
        businessName: m.businessName,
        publicApiKey: m.publicApiKey,
        // v4.0 H4 fix: NEVER return adminApiKey in GET response
        adminApiKey: null,
        branding,
        defaultVpa: m.defaultVpa,
      },
      account: { vpa: account.vpa, accountName: account.accountName, isSlotBusy: account.isSlotBusy, dailyLimitPaise: account.dailyLimitPaise },
      devices: [{ id: "dev_demo_001", deviceName: "Demo Android Observer", isActive: true, lastHeartbeatAt: new Date().toISOString() }],
      stats,
      sessions,
    });
  }

  // Normal mode — use DB
  let branding: any = {};
  try {
    branding = merchant.branding ? JSON.parse(merchant.branding) : {};
  } catch {
    branding = {};
  }

  const account = await db.receivingAccount.findFirst({ where: { merchantId: merchant.id } });

  const total = await db.paymentSession.count({ where: { merchantId: merchant.id } });
  const success = await db.paymentSession.count({ where: { merchantId: merchant.id, status: "SUCCESS" } });
  const active = await db.paymentSession.count({ where: { merchantId: merchant.id, status: { in: ["ACTIVE", "PROCESSING"] } } });
  const queued = await db.paymentSession.count({ where: { merchantId: merchant.id, status: "QUEUED" } });
  const failed = await db.paymentSession.count({ where: { merchantId: merchant.id, status: { in: ["FAILED", "EXPIRED", "CANCELLED"] } } });

  const settledRows = await db.paymentSession.findMany({ where: { merchantId: merchant.id, status: "SUCCESS" }, select: { amountPaise: true } });
  const totalSettledPaise = settledRows.reduce((a, r) => a + r.amountPaise, 0);
  const feesSavedPaise = Math.round(totalSettledPaise * 0.022);

  const devices = await db.device.findMany({ where: { merchantId: merchant.id } });

  return jsonOk({
    merchant: {
      id: merchant.id,
      businessName: merchant.businessName,
      publicApiKey: merchant.publicApiKey,
      // v4.0 H4 fix: NEVER return adminApiKey in GET response
      adminApiKey: null,
      branding,
      defaultVpa: merchant.defaultVpa,
    },
    account: account ? { vpa: account.vpa, accountName: account.accountName, isSlotBusy: account.isSlotBusy, dailyLimitPaise: account.dailyLimitPaise } : null,
    devices: devices.map((d) => ({ id: d.id, deviceName: d.deviceName, isActive: d.isActive, lastHeartbeatAt: d.lastHeartbeatAt?.toISOString() })),
    stats: {
      total, success, active, queued, failed,
      totalSettledPaise, feesSavedPaise,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    },
  });
}
