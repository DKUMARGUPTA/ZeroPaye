// ZeroPaye — Multi-VPA manager
// v4.3: High-volume merchants can add multiple receiving VPAs.
// POST /api/zeropaye/admin/vpa — add a VPA
// DELETE /api/zeropaye/admin/vpa?id=xxx — remove a VPA
// GET /api/zeropaye/admin/vpa — list all VPAs

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk, jsonErr, getRequestId } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";
import { isDemoMode } from "@/lib/zeropaye/demo-data";
import { isValidVpaStrict } from "@/lib/zeropaye/validation";
import { logger } from "@/lib/zeropaye/workers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;

  if (isDemoMode()) {
    return jsonOk({ accounts: [{ id: "demo_vpa_1", vpa: "zeropaye.demo@upi", accountName: "Demo Store", isSlotBusy: false, dailyLimitPaise: 10000000 }] });
  }

  const accounts = await db.receivingAccount.findMany({ where: { merchantId: merchant.id }, orderBy: { createdAt: "asc" } });
  return jsonOk({ accounts: accounts.map((a) => ({ id: a.id, vpa: a.vpa, accountName: a.accountName, isSlotBusy: a.isSlotBusy, dailyLimitPaise: a.dailyLimitPaise })) });
}

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;

  if (isDemoMode()) return jsonErr(403, "Demo account is locked. Cannot add VPAs.");

  const body = await req.json().catch(() => ({}));
  const { vpa, accountName, dailyLimitPaise } = body;

  if (!vpa || !isValidVpaStrict(String(vpa))) return jsonErr(400, "Invalid VPA format (e.g. name@okhdfcbank)");
  if (!accountName || accountName.length < 2) return jsonErr(400, "accountName is required (min 2 chars)");

  const existing = await db.receivingAccount.findFirst({ where: { merchantId: merchant.id, vpa: String(vpa) } });
  if (existing) return jsonErr(409, "This VPA is already added");

  const count = await db.receivingAccount.count({ where: { merchantId: merchant.id } });
  if (count >= 5) return jsonErr(400, "Maximum 5 VPAs per merchant. Remove one first.");

  const account = await db.receivingAccount.create({
    data: { merchantId: merchant.id, vpa: String(vpa), accountName: String(accountName), isSlotBusy: false, dailyLimitPaise: dailyLimitPaise || 10000000 },
  });

  logger.info("vpa-added", { merchantId: merchant.id, vpa, requestId });
  return jsonOk({ added: true, account: { id: account.id, vpa: account.vpa, accountName: account.accountName, isSlotBusy: false, dailyLimitPaise: account.dailyLimitPaise } });
}

export async function DELETE(req: NextRequest) {
  const requestId = await getRequestId();
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;

  if (isDemoMode()) return jsonErr(403, "Demo account is locked.");

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonErr(400, "id query parameter required");

  const account = await db.receivingAccount.findFirst({ where: { id, merchantId: merchant.id } });
  if (!account) return jsonErr(404, "VPA not found");

  const count = await db.receivingAccount.count({ where: { merchantId: merchant.id } });
  if (count <= 1) return jsonErr(400, "Cannot delete the only VPA. Add another first.");
  if (account.isSlotBusy) return jsonErr(409, "VPA has an active payment. Wait for it to complete.");

  await db.receivingAccount.delete({ where: { id } });
  logger.info("vpa-removed", { merchantId: merchant.id, vpa: account.vpa, requestId });
  return jsonOk({ removed: true, id });
}
