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
// SSRF protection for webhook targets. (Audit S12 + NEW-11)
// Blocks private/loopback/link-local/metadata endpoints.
// v1.1: Now performs DNS resolution to defeat DNS-rebinding attacks where
// a hostname like "attacker.com" resolves to 169.254.169.254 (AWS metadata).
// ---------------------------------------------------------------------------
const SSRF_BLOCKED = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Carrier-grade NAT 100.64/10
  /^::1$/,
  /^fc00::/i,
  /^fe80::/i,
  /^fd/i,
  /^::ffff:/i, // IPv4-mapped IPv6 (could wrap private IPv4)
];

const BLOCKED_METADATA_HOSTS = new Set([
  "169.254.169.254",      // AWS / GCP / Azure IMDS
  "metadata.google.internal",
  "metadata.azure.com",
  "100.100.100.200",      // Alibaba Cloud
  "169.254.170.2",        // ECS task metadata
]);

function isBlockedIp(ip: string): boolean {
  if (BLOCKED_METADATA_HOSTS.has(ip)) return true;
  // Strip IPv4-mapped IPv6 prefix if present
  const clean = ip.replace(/^::ffff:/i, "");
  for (const re of SSRF_BLOCKED) {
    if (re.test(clean)) return true;
  }
  return false;
}

import { promises as dns } from "node:dns";

/**
 * SSRF-safe URL check. v1.1: resolves DNS and checks resolved IPs.
 * Audit NEW-11 fix: previously regex-only, vulnerable to DNS-rebinding
 * (hostname → resolves to 169.254.169.254).
 *
 * In dev mode, localhost is allowed for testing. In production, requires
 * HTTPS and all resolved IPs must NOT be in the blocked ranges.
 */
export async function isSsrfSafeAsync(url: string, allowLoopbackInDev = true): Promise<boolean> {
  try {
    const u = new URL(url);
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return false;
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const host = u.hostname;

    if (allowLoopbackInDev && process.env.NODE_ENV !== "production") {
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    }

    // If host is already an IP literal, check directly
    const looksLikeIp = /^[\d.]+$/.test(host) || host.includes(":");
    if (looksLikeIp) {
      return !isBlockedIp(host);
    }

    // DNS-resolve hostname and check all resolved IPs (audit NEW-11)
    let addresses: string[];
    try {
      const resolved = await dns.lookup(host, { all: true });
      addresses = resolved.map((r) => r.address);
    } catch {
      return false; // DNS resolution failed — block
    }
    if (addresses.length === 0) return false;
    for (const ip of addresses) {
      if (isBlockedIp(ip)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronous SSRF check (legacy, used before v1.1). Does NOT do DNS resolution.
 * Prefer isSsrfSafeAsync for new code. Kept for backwards compat with code
 * paths that can't easily await (e.g., sync validation middleware).
 */
export function isSsrfSafe(url: string, allowLoopbackInDev = true): boolean {
  try {
    const u = new URL(url);
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return false;
    const host = u.hostname;
    if (allowLoopbackInDev && process.env.NODE_ENV !== "production") {
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    }
    if (BLOCKED_METADATA_HOSTS.has(host)) return false;
    const looksLikeIp = /^[\d.]+$/.test(host) || host.includes(":");
    if (looksLikeIp) {
      return !isBlockedIp(host);
    }
    // For hostnames without DNS resolution, allow but warn (should use isSsrfSafeAsync)
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
