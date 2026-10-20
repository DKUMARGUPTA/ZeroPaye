// ZeroPaye API — Observer device pairing (enrollment)
// POST /api/zeropaye/observer/pair
// Body: { deviceName, merchantId? }
// Auth: x-zeropaye-admin-key (merchant must authorize device enrollment)
//
// Returns: { deviceId, signingKey (shown ONCE), signingKeyHash (stored) }
// The signingKey is the HMAC secret the observer keeps (in memory / encrypted storage).
// The server only stores the SHA-256 hash.
//
// v3.1 C3 fix: observer enrollment now exists (was imaginary in README).

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDemoMerchant, invalidateDemoMerchantCache } from "@/lib/zeropaye/config";
import { jsonOk, jsonErr, getRequestId, getClientIp } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";
import { generateSecret, sha256Hex } from "@/lib/zeropaye/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;
    const { merchant } = admin;

    const body = await req.json().catch(() => ({}));
    const { deviceName } = body;

    if (!deviceName || typeof deviceName !== "string" || deviceName.length < 2 || deviceName.length > 100) {
      return jsonErr(400, "deviceName is required (2-100 chars)");
    }

    // Generate device ID + signing key
    const deviceId = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const signingKey = generateSecret(32); // 64-char hex
    const signingKeyHash = sha256Hex(signingKey);

    // Store device in DB (only hash, NOT the plaintext)
    const device = await db.device.create({
      data: {
        merchantId: merchant.id,
        deviceName,
        deviceId,
        signingKeyHash,
        isActive: true,
        lastHeartbeatAt: new Date(),
      },
    });

    // Audit log
    const ip = await getClientIp();
    await db.auditLog.create({
      data: {
        merchantId: merchant.id,
        entityType: "device",
        entityId: device.id,
        action: "DEVICE_PAIRED",
        actorType: "ADMIN",
        actorId: ip,
        details: JSON.stringify({ deviceId, deviceName, requestId }),
        ipAddress: ip,
        requestId,
      },
    });

    // Invalidate cache (new device affects merchant stats)
    invalidateDemoMerchantCache();

    // Return signingKey ONCE (merchant must save it — server won't show it again)
    return jsonOk({
      paired: true,
      deviceId,
      deviceName,
      signingKey, // ⚠️ SHOW ONCE — merchant must securely store this
      message: "Save this signingKey securely. It will NOT be shown again. Use it in your observer service to sign HMAC payloads.",
    });
  } catch (e) {
    console.error("[ZeroPaye] observer pair error", e);
    return jsonErr(500, "Pairing failed");
  }
}
