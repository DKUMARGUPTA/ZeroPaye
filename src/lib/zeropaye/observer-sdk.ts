// ZeroPaye Observer SDK — Browser automation + Gmail API for payment detection
//
// This module provides two observation channels:
// 1. WhatsAppWebObserver — uses Puppeteer to monitor WhatsApp Web for
//    bank SMS notifications (forwarded to WhatsApp) or direct OTP messages
// 2. GmailObserver — uses Gmail API (OAuth2) to poll bank credit emails
//
// Both feed observations into POST /api/zeropaye/observer (HMAC-signed).
//
// Usage:
//   import { WhatsAppWebObserver, GmailObserver } from "@/lib/zeropaye/observer-sdk";
//   const wa = new WhatsAppWebObserver({ apiKey, signingKey, deviceId, serverUrl });
//   await wa.start(); // opens WhatsApp Web, waits for QR scan, monitors messages
//
// License: AGPL-3.0

import { createHmac, randomBytes } from "node:crypto";

export interface ObserverConfig {
  /** ZeroPaye server URL (e.g. https://pay.yourdomain.com) */
  serverUrl: string;
  /** Device ID (from pairing) */
  deviceId: string;
  /** HMAC signing key (from pairing, kept in memory only) */
  signingKey: string;
  /** Receiving account ID (the VPA this observer watches) */
  receivingAccountId: string;
  /** Polling interval (ms), default 5000 */
  pollIntervalMs?: number;
}

export interface ObservationPayload {
  source: "WHATSAPP_WEB" | "GMAIL" | "ANDROID_SMS" | "MANUAL";
  rawText?: string;
  amountPaise?: number;
  utr?: string;
  receivingAccountId: string;
  paymentSessionId?: string;
}

// ---------------------------------------------------------------------------
// HMAC signing (matches server-side verifyHmac)
// ---------------------------------------------------------------------------
export function signPayload(secret: string, timestamp: number, body: string): string {
  const signed = `${timestamp}.${body}`;
  return createHmac("sha256", secret).update(signed).digest("hex");
}

// ---------------------------------------------------------------------------
// HTTP client — posts observation to ZeroPaye server
// ---------------------------------------------------------------------------
export async function postObservation(
  config: ObserverConfig,
  payload: ObservationPayload,
): Promise<{ ok: boolean; status: number; data?: any }> {
  const body = JSON.stringify({ ...payload, receivingAccountId: config.receivingAccountId });
  const timestamp = Date.now();
  const signature = signPayload(config.signingKey, timestamp, body);

  try {
    const res = await fetch(`${config.serverUrl}/api/zeropaye/observer`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-device-id": config.deviceId,
        "x-timestamp": String(timestamp),
        "x-signature": signature,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e.message } };
  }
}

// ---------------------------------------------------------------------------
// UTR + amount parser — extracts from bank SMS/email text
// ---------------------------------------------------------------------------
const UTR_REGEX = /\b(\d{12})\b/;
const AMOUNT_REGEX = /(?:rs\.?|inr|₹)\s*([\d,]+\.?\d{0,2})/i;

export function parseBankNotification(text: string): { utr?: string; amountPaise?: number } {
  const result: { utr?: string; amountPaise?: number } = {};

  // Extract UTR (12-digit bank reference)
  const utrMatch = text.match(UTR_REGEX);
  if (utrMatch) {
    result.utr = utrMatch[1];
  }

  // Extract amount (₹499.00, Rs. 499, INR 499)
  const amtMatch = text.match(AMOUNT_REGEX);
  if (amtMatch) {
    const cleaned = amtMatch[1].replace(/,/g, "");
    const rupees = parseFloat(cleaned);
    if (!isNaN(rupees)) {
      result.amountPaise = Math.round(rupees * 100);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// OTP parser — extracts 6-digit OTP from WhatsApp/SMS messages
// ---------------------------------------------------------------------------
const OTP_REGEX = /\b(\d{6})\b/;

export function parseOtp(text: string): string | null {
  // Look for patterns like "OTP: 123456" or "Your code is 123456"
  const patterns = [
    /otp[:\s]+(\d{6})/i,
    /code[:\s]+(\d{6})/i,
    /verification[:\s]+(\d{6})/i,
    /\b(\d{6})\b/, // fallback: any 6-digit number
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}
