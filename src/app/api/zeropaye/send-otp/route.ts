// ZeroPaye API — Send OTP to a customer's mobile (DEMO mode: returns OTP in dev)
// POST /api/zeropaye/send-otp
// Body: { mobile, sessionId? }
// Fixes from audit: S3 (Math.random OTP), S4 (OTP in logs), S5 (no rate limit).
// In this demo, the OTP is shown in a toast (since we have no SMS/WhatsApp).
// Production: integrate an SMS gateway or WhatsApp Business API.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { issueOtp } from "@/lib/zeropaye/otp-store";
import { normalizeIndianMobile, isValidIndianMobileStrict } from "@/lib/zeropaye/validation";
import { jsonOk, jsonErr, rateLimit, getClientIp } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Phase 2: normalize mobile (strip +91 / leading 0) and validate strictly (audit NEW-24)
    const rawMobile = String(body?.mobile || "");
    const mobile = normalizeIndianMobile(rawMobile);

    if (!isValidIndianMobileStrict(rawMobile)) {
      return jsonErr(400, "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)");
    }

    const ip = await getClientIp();
    const mobileLimit = rateLimit({ key: `otp:mobile:${mobile}`, maxTokens: 1, refillPerSec: 1 / 30 });
    if (!mobileLimit.ok) {
      return jsonErr(429, `Please wait ${Math.ceil(mobileLimit.retryAfterMs / 1000)}s before requesting another OTP`);
    }
    const ipLimit = rateLimit({ key: `otp:ip:${ip}`, maxTokens: 5, refillPerSec: 1 / 60 });
    if (!ipLimit.ok) {
      return jsonErr(429, "Too many OTP requests from this IP. Try again later.");
    }

    const result = issueOtp(mobile);
    if ("error" in result) {
      return jsonErr(429, `Please wait ${Math.ceil(result.resendInMs / 1000)}s before resending the OTP`);
    }

    let customer = await db.customer.findUnique({ where: { mobileNumber: mobile } });
    if (!customer) {
      customer = await db.customer.create({ data: { mobileNumber: mobile } });
    }
    if (customer.isBanned) {
      return jsonErr(403, "This mobile number is blocked. Contact support.");
    }

    if (body?.sessionId) {
      await db.paymentSession.updateMany({
        where: { id: String(body.sessionId), status: "INITIATED" },
        data: { status: "AUTH_PENDING", customerId: customer.id },
      });
    }

    return jsonOk({
      sent: true,
      mobile,
      ...(process.env.NODE_ENV !== "production" ? { demoOtp: result.otp } : {}),
      message: "OTP sent via WhatsApp (demo: shown above the input field)",
    });
  } catch (e) {
    console.error("[ZeroPaye] send-otp error", e);
    return jsonErr(500, "Failed to send OTP");
  }
}
