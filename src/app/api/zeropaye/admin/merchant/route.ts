// ZeroPaye API — Admin: update merchant VPA + branding
// PATCH /api/zeropaye/admin/merchant
// Body: { defaultVpa?, branding? }
// Auth: x-zeropaye-admin-key (constant-time compare)
//
// Allows merchants to self-serve update their VPA and branding without
// editing the DB directly. v1.2 onboarding feature.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDemoMerchant, invalidateDemoMerchantCache } from "@/lib/zeropaye/config";
import { jsonOk, jsonErr, getRequestId, getClientIp } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";
import { isValidVpaStrict } from "@/lib/zeropaye/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_BRANDING_KEYS = [
  "brandName", "tagline", "accentColor", "gradientFrom", "gradientTo",
  "logoText", "logoUrl", "faviconUrl",
] as const;

export async function PATCH(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    const { merchant } = admin;

    const body = await req.json().catch(() => ({}));
    const { defaultVpa, branding } = body;

    // Build update data
    const updateData: any = {};

    // Validate + set VPA
    if (defaultVpa !== undefined) {
      if (!isValidVpaStrict(String(defaultVpa))) {
        return jsonErr(400, "defaultVpa must be a valid UPI VPA (e.g. yourname@okhdfcbank)");
      }
      updateData.defaultVpa = String(defaultVpa);
    }

    // Validate + set branding
    if (branding !== undefined) {
      if (typeof branding !== "object" || branding === null) {
        return jsonErr(400, "branding must be an object");
      }
      // Parse existing branding
      let existing: any = {};
      try { existing = merchant.branding ? JSON.parse(merchant.branding) : {}; } catch {}
      // Merge only allowed keys
      const merged: any = { ...existing };
      for (const key of ALLOWED_BRANDING_KEYS) {
        if (key in branding) {
          const val = branding[key];
          if (val === null || val === undefined) {
            delete merged[key];
          } else if (typeof val === "string" && val.length <= 200) {
            merged[key] = val;
          }
        }
      }
      updateData.branding = JSON.stringify(merged);
    }

    if (Object.keys(updateData).length === 0) {
      return jsonErr(400, "Provide at least one field to update: defaultVpa, branding");
    }

    // Update merchant
    const updated = await db.merchant.update({
      where: { id: merchant.id },
      data: updateData,
    });

    // If VPA changed, also update the receiving account's VPA
    if (defaultVpa) {
      const account = await db.receivingAccount.findFirst({ where: { merchantId: merchant.id } });
      if (account) {
        await db.receivingAccount.update({
          where: { id: account.id },
          data: { vpa: String(defaultVpa) },
        });
      }
    }

    // Invalidate cache so next request gets fresh data
    invalidateDemoMerchantCache();

    // Audit log
    const ip = await getClientIp();
    await db.auditLog.create({
      data: {
        merchantId: merchant.id,
        entityType: "merchant",
        entityId: merchant.id,
        action: "MERCHANT_UPDATED",
        actorType: "ADMIN",
        actorId: ip,
        details: JSON.stringify({
          fields: Object.keys(updateData),
          requestId,
        }),
        ipAddress: ip,
        requestId,
      },
    });

    return jsonOk({
      updated: true,
      merchant: {
        id: updated.id,
        businessName: updated.businessName,
        defaultVpa: updated.defaultVpa,
        branding: updated.branding ? JSON.parse(updated.branding) : {},
      },
    });
  } catch (e) {
    console.error("[ZeroPaye] admin merchant PATCH error", e);
    return jsonErr(500, "Failed to update merchant");
  }
}
