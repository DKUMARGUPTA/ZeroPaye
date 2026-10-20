// ZeroPaye API — Observer heartbeat (keepalive)
// POST /api/zeropaye/observer/heartbeat
// Headers: x-device-id, x-timestamp, x-signature (HMAC)
// Body: { status?: "online" | "offline", stats?: { messagesProcessed?: number } }
//
// Updates device.lastHeartbeatAt. If not called within 5 min, worker
// marks device as stale (dashboard shows "stale heartbeat" warning).
//
// v3.1 C3 fix: heartbeat endpoint now exists (was missing).

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyHmac, sha256Hex, safeEqual } from "@/lib/zeropaye/crypto";
import { jsonOk, jsonErr, getRequestId } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DRIFT_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  try {
    const deviceId = req.headers.get("x-device-id");
    const timestamp = req.headers.get("x-timestamp");
    const signature = req.headers.get("x-signature");

    if (!deviceId || !timestamp || !signature) {
      return jsonErr(401, "Missing required headers: x-device-id, x-timestamp, x-signature");
    }

    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_DRIFT_MS) {
      return jsonErr(401, "Timestamp out of drift window");
    }

    const device = await db.device.findUnique({ where: { deviceId } });
    if (!device || !device.isActive) {
      return jsonErr(401, "Unknown or inactive device");
    }

    // HMAC verify
    const rawBody = await req.text();
    const signedPayload = `${timestamp}.${rawBody}`;

    // For heartbeat, we verify against the same signing key as observations
    // (demo uses sidecar key; production uses per-device key)
    const { getDemoObserverKey } = await import("@/lib/zeropaye/config");
    const demoSecret = await getDemoObserverKey();
    if (!demoSecret) {
      return jsonErr(500, "Observer secret not provisioned");
    }
    if (!safeEqual(device.signingKeyHash, sha256Hex(demoSecret))) {
      return jsonErr(401, "Device signing key mismatch");
    }
    if (!verifyHmac(demoSecret, signedPayload, signature)) {
      return jsonErr(401, "Invalid HMAC signature");
    }

    // Update heartbeat
    const body = JSON.parse(rawBody || "{}");
    const updateData: any = { lastHeartbeatAt: new Date() };

    if (body.status === "offline") {
      updateData.isActive = false;
    }

    await db.device.update({ where: { id: device.id }, data: updateData });

    return jsonOk({
      ok: true,
      deviceId,
      heartbeatAt: updateData.lastHeartbeatAt.toISOString(),
    });
  } catch (e) {
    console.error("[ZeroPaye] heartbeat error", e);
    return jsonErr(500, "Heartbeat failed");
  }
}
