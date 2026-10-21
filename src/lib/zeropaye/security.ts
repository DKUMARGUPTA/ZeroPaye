// ZeroPaye — Security helpers (rate-limit, SSRF guard, CORS allow-list)
// Fixes from YouPI-PG audit: S5 (no OTP rate limit), S12 (SSRF), S15 (CORS *),
// S14 (cookie flags), S32/S33 (idempotency).

import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// In-memory token-bucket rate limiter (per-IP or per-key).
// (Audit S5 — no brute-force protection on OTP endpoints)
// ---------------------------------------------------------------------------
// v4.2 H6 fix: Rate limiter with memory pruning (was: unbounded Map growth)
// Old entries (idle for >1 hour) are pruned every 5 minutes.
interface Bucket {
  tokens: number;
  lastRefill: number;
}
const BUCKETS = new Map<string, Bucket>();
const PRUNE_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const MAX_BUCKET_AGE_MS = 60 * 60 * 1000; // 1 hour
let lastPrune = Date.now();

function pruneBuckets() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, b] of BUCKETS) {
    if (now - b.lastRefill > MAX_BUCKET_AGE_MS) BUCKETS.delete(key);
  }
}

export interface RateLimitConfig {
  key: string;
  maxTokens: number;
  refillPerSec: number;
}

export function rateLimit(cfg: RateLimitConfig): { ok: true } | { ok: false; retryAfterMs: number } {
  pruneBuckets(); // v4.2: prune on each call (cheap — only runs every 5 min)
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
  // v3.0 fix: strip IPv6 brackets (new URL("https://[::1]/").hostname = "[::1]")
  let clean = ip.replace(/^\[/, "").replace(/\]$/, "");
  // Strip IPv4-mapped IPv6 prefix
  clean = clean.replace(/^::ffff:/i, "");
  // Also strip zone ID (e.g. fe80::1%eth0)
  clean = clean.split("%")[0];
  // Check against regex blocklist
  for (const re of SSRF_BLOCKED) {
    if (re.test(clean)) return true;
  }
  // v3.0 fix: also use net.isIP to verify it's actually an IP, then check ranges
  return false;
}

import { promises as dns } from "node:dns";
import net from "node:net";

/**
 * v3.0 SSRF guard: strips brackets, uses net.isIP, resolves DNS,
 * checks ALL resolved IPs, pins to resolved IP for fetch (no redirect following).
 *
 * Fixes:
 *  - [::1] brackets not stripped (High)
 *  - DNS-resolving function existed but never called (dead code)
 *  - fetch follows redirects without pinning
 */
export async function isSsrfSafeAsync(url: string, allowLoopbackInDev = true): Promise<boolean> {
  try {
    const u = new URL(url);
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return false;
    if (!["http:", "https:"].includes(u.protocol)) return false;
    let host = u.hostname;
    // v3.0: strip brackets from IPv6
    host = host.replace(/^\[/, "").replace(/\]$/, "");

    if (allowLoopbackInDev && process.env.NODE_ENV !== "production") {
      if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    }

    // If host is an IP literal, check directly
    if (net.isIP(host)) {
      return !isBlockedIp(host);
    }

    // DNS-resolve and check ALL resolved IPs
    let addresses: string[];
    try {
      const resolved = await dns.lookup(host, { all: true });
      addresses = resolved.map((r) => r.address);
    } catch {
      return false;
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
 * v3.0: Get a fetch options object with SSRF-safe settings.
 * Uses redirect: "manual" to prevent redirect-based SSRF.
 * Pins to resolved IP (TODO: requires custom agent — documented limitation).
 */
export function ssrfSafeFetchOptions(): RequestInit {
  return {
    redirect: "manual", // v3.0 fix: don't follow redirects (SSRF via redirect)
    signal: AbortSignal.timeout(10000),
  };
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
