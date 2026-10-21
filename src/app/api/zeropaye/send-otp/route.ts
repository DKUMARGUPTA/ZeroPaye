// ZeroPaye API — Send OTP to a customer's mobile
// POST /api/zeropaye/send-otp
// Body: { mobile, sessionId? }
//
// v3.2 C2 fix: Pluggable OTP delivery via OTP_PROVIDER env var.
//   - console (default, dev): logs OTP to console
//   - whatsapp: WhatsApp Business API (WHATSAPP_TOKEN, WHATSAPP_PHONE_ID)
//   - sms: SMS gateway (SMS_API_KEY, SMS_API_URL)
//   - email: SMTP (requires customer email)
//
// In dev mode (NODE_ENV != production), OTP is also returned in response (demoOtp).
// In production, OTP is delivered via the configured provider only.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { issueOtp } from "@/lib/zeropaye/otp-store";
import { deliverOtp } from "@/lib/zeropaye/otp-provider";
import { normalizeIndianMobile, isValidIndianMobileStrict } from "@/lib/zeropaye/validation";
import { jsonOk, jsonErr, rateLimit, getClientIp } from "@/lib/zeropaye/security";
import { incCounter } from "@/lib/zeropaye/metrics/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
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

    // v3.2 C2 fix: Deliver OTP via configured provider
    incCounter("zeropaye_otp_sent_total");
    const delivery = await deliverOtp(mobile, result.otp, customer.name || undefined);

    const isDev = process.env.NODE_ENV !== "production";

    return jsonOk({
      sent: delivery.delivered,
      mobile,
      provider: delivery.provider,
      ...(isDev ? { demoOtp: result.otp } : {}), // dev mode: show OTP for testing
      message: delivery.delivered
        ? `OTP sent via ${delivery.provider}`
        : `OTP delivery failed: ${delivery.message}. ${isDev ? "Demo OTP shown above." : "Contact support."}`,
    });
  } catch (e) {
    console.error("[ZeroPaye] send-otp error", e);
    return jsonErr(500, "Failed to send OTP");
  }
}
