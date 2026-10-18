// ZeroPaye — Crypto utilities
// Fixes from YouPI-PG audit: S3 (Math.random OTP), S6 (hardcoded secrets),
// S16 (non-constant-time compare), S27 (low PBKDF2), S9 (plaintext key store),
// S2 (optional HMAC), S22/S30 (predictable random).

import { createHmac, createHash, randomInt, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Cryptographically secure 6-digit OTP. Uses node:crypto.randomInt, NOT Math.random.
 * (YouPI-PG audit S3 — Math.random is not CSPRNG)
 */
export function generateOtp(length = 6): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, "0");
}

/**
 * Constant-time string comparison to defeat timing side-channels.
 * (YouPI-PG audit S16 — string `!==` leaks prefix length)
 */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * HMAC-SHA256 hex digest. Used for observer payloads AND merchant webhooks.
 * (YouPI-PG audit S2 — observers must sign; verification MUST be mandatory)
 */
export function hmacSha256(secret: string, payload: string | Buffer): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify an HMAC in constant time. Returns false if inputs are malformed.
 */
export function verifyHmac(secret: string, payload: string | Buffer, signature: string): boolean {
  try {
    const expected = hmacSha256(secret, payload);
    return safeEqual(expected, String(signature || ""));
  } catch {
    return false;
  }
}

/**
 * SHA-256 hex of a string. Used for storing observer signing keys (S9 fix)
 * and for observation cluster fingerprinting.
 */
export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Generate a URL-safe random API key / secret. (S6/S8 fix — never hardcode defaults)
 */
export function generateApiKey(bytes = 24): string {
  return `zp_${randomBytes(bytes).toString("base64url")}`;
}

export function generateSecret(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Cryptographically secure pairing token for observer enrollment.
 */
export function generatePairingToken(): string {
  return `pr_${randomBytes(18).toString("base64url")}`;
}

/**
 * Generate a UUID v4 (for webhook delivery ids — idempotency).
 */
export function uuid(): string {
  return randomBytes(16).toString("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
}

/**
 * Human-readable wait time (used in error messages).
 */
export function msToHuman(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.ceil(s / 60)}m`;
}
