// ZeroPaye — In-memory OTP store (DEMO ONLY).
// Stores OTP HASH (never plaintext), expiry, and attempt count with brute-force
// lockout. In production replace with Redis. This module is process-local and
// resets on server restart — acceptable for the ZeroPaye interactive demo.
//
// Security fixes vs YouPI-PG:
//  - OTP hashed with SHA-256 (audit S4 — no plaintext in logs)
//  - Per-mobile rate limit + 15-min lockout after 5 wrong attempts (audit S5)
//  - Constant-time compare on verify (audit S16)
//  - crypto.randomInt not Math.random (audit S3)

import { generateOtp, sha256Hex, safeEqual } from "./crypto";

interface OtpRecord {
  mobile: string;
  hash: string;          // sha256(otp)
  expiresAt: number;     // epoch ms
  attempts: number;      // wrong verify attempts
  lockedUntil: number;   // epoch ms (0 = not locked)
  lastSentAt: number;
}

const OTPS = new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000;       // OTP valid 5 min
const RESEND_COOLDOWN_MS = 30 * 1000;   // 30s between resend
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;      // 15 min lockout

export function issueOtp(mobile: string): { otp: string; resendInMs: number } | { error: "cooldown"; resendInMs: number } {
  const now = Date.now();
  const existing = OTPS.get(mobile);
  if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    return { error: "cooldown", resendInMs: RESEND_COOLDOWN_MS - (now - existing.lastSentAt) };
  }
  const otp = generateOtp(6);
  const rec: OtpRecord = {
    mobile,
    hash: sha256Hex(otp),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lockedUntil: 0,
    lastSentAt: now,
  };
  OTPS.set(mobile, rec);
  return { otp, resendInMs: RESEND_COOLDOWN_MS };
}

export function verifyOtp(mobile: string, otp: string): { ok: true } | { ok: false; reason: string; lockoutMs?: number } {
  const now = Date.now();
  const rec = OTPS.get(mobile);
  if (!rec) return { ok: false, reason: "No OTP issued. Please request a new code." };
  if (rec.lockedUntil > now) {
    return { ok: false, reason: "Too many wrong attempts. Account locked.", lockoutMs: rec.lockedUntil - now };
  }
  if (rec.expiresAt < now) {
    OTPS.delete(mobile);
    return { ok: false, reason: "OTP expired. Please request a new code." };
  }
  if (!safeEqual(rec.hash, sha256Hex(otp))) {
    rec.attempts += 1;
    if (rec.attempts >= MAX_ATTEMPTS) {
      rec.lockedUntil = now + LOCKOUT_MS;
      OTPS.set(mobile, rec);
      return { ok: false, reason: `Too many wrong attempts. Locked for 15 minutes.`, lockoutMs: LOCKOUT_MS };
    }
    OTPS.set(mobile, rec);
    return { ok: false, reason: `Invalid OTP. ${MAX_ATTEMPTS - rec.attempts} attempts remaining.` };
  }
  OTPS.delete(mobile);
  return { ok: true };
}

export function otpStatus(mobile: string): { issued: boolean; locked: boolean; lockoutMs?: number } {
  const rec = OTPS.get(mobile);
  if (!rec) return { issued: false, locked: false };
  return { issued: rec.expiresAt > Date.now(), locked: rec.lockedUntil > Date.now(), lockoutMs: Math.max(0, rec.lockedUntil - Date.now()) };
}
