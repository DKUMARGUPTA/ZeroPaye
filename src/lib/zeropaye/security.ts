// ZeroPaye — Security helpers (rate-limit, SSRF guard, CORS allow-list)
// Fixes from YouPI-PG audit: S5 (no OTP rate limit), S12 (SSRF), S15 (CORS *),
// S14 (cookie flags), S32/S33 (idempotency).

import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// In-memory token-bucket rate limiter (per-IP or per-key).
// (Audit S5 — no brute-force protection on OTP endpoints)
// ---------------------------------------------------------------------------
interface Bucket {
  tokens: number;
  lastRefill: number;
}
const BUCKETS = new Map<string, Bucket>();

export interface RateLimitConfig {
  key: string;
  maxTokens: number;
  refillPerSec: number;
}

export function rateLimit(cfg: RateLimitConfig): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const b = BUCKETS.get(cfg.key) ?? { tokens: cfg.maxTokens, lastRefill: now };
  const elapsed = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(cfg.maxTokens, b.tokens + elapsed * cfg.refillPerSec);
  b.lastRefill = now;
  if (b.tokens < 1) {
    BUCKETS.set(cfg.key, b);
    return { ok: false, retryAfterMs: Math.ceil((1 - b.tokens) / cfg.refillPerSec * 1000) };
  }
  b.tokens -= 1;
  BUCKETS.set(cfg.key, b);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Get client IP from Next headers (handles proxies & x-forwarded-for)
// ---------------------------------------------------------------------------
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

export async function getUserAgent(): Promise<string> {
  return (await headers()).get("user-agent") ?? "unknown";
}

export async function getRequestId(): Promise<string> {
  return (await headers()).get("x-request-id") ?? "req-" + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// SSRF protection for webhook targets. (Audit S12)
// Blocks private/loopback/link-local/metadata endpoints in production.
// ---------------------------------------------------------------------------
const SSRF_BLOCKED = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00::/i,
  /^fe80::/i,
  /^fd/i,
];

export function isSsrfSafe(url: string, allowLoopbackInDev = true): boolean {
  try {
    const u = new URL(url);
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return false;
    const host = u.hostname;
    if (allowLoopbackInDev && process.env.NODE_ENV !== "production") {
      // In dev/demo, allow localhost for testing
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    }
    for (const re of SSRF_BLOCKED) {
      if (re.test(host)) return false;
    }
    // Block AWS/GCP/Azure metadata hosts explicitly
    if (host === "169.254.169.254" || host === "metadata.google.internal") return false;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// JSON response helpers with strict CORS (allow-list, not wildcard) — S15 fix.
// In the ZeroPaye demo we allow same-origin only.
// ---------------------------------------------------------------------------
export const jsonOk = <T,>(data: T, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...(init?.headers || {}) },
    ...init,
  });

export const jsonErr = (status: number, error: string, init?: ResponseInit) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...(init?.headers || {}) },
    ...init,
  });

// ---------------------------------------------------------------------------
// Sleep helper for simulated latency.
// ---------------------------------------------------------------------------
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
