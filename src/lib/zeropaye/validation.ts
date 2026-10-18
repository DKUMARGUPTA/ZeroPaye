// ZeroPaye — Input validation helpers (Phase 2)
// Audit fixes: NEW-18 (orderId/currency validation), NEW-23 (VPA regex tightening),
// NEW-24 (mobile country-code handling), production-readiness gap 15 (Idempotency-Key).

import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// orderId: NPCI UPI 'tr' field is max 35 chars, alnum + dash + underscore.
// ---------------------------------------------------------------------------
const ORDER_ID_RE = /^[a-zA-Z0-9_-]{1,35}$/;
export function isValidOrderId(id: string): boolean {
  return ORDER_ID_RE.test(String(id || ""));
}

// ---------------------------------------------------------------------------
// currency: ISO 4217, 3 uppercase letters.
// ---------------------------------------------------------------------------
const CURRENCY_RE = /^[A-Z]{3}$/;
export function isValidCurrency(c: string): boolean {
  return CURRENCY_RE.test(String(c || ""));
}

// ---------------------------------------------------------------------------
// UPI VPA: tightened regex (audit NEW-23).
// Format: name@bank — name 2-64 chars alnum/dot/dash/underscore; bank starts
// with alphanumeric, 2-64 chars.
// ---------------------------------------------------------------------------
export function isValidVpaStrict(vpa: string): boolean {
  return /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9][a-zA-Z0-9._-]{1,63}$/.test(String(vpa || ""));
}

// ---------------------------------------------------------------------------
// Indian mobile: 10 digits starting 6-9, with optional +91 prefix (audit NEW-24).
// ---------------------------------------------------------------------------
export function normalizeIndianMobile(input: string): string {
  let m = String(input || "").replace(/[\s+-]/g, "");
  // Strip leading 91 if present and length is 12
  if (m.startsWith("91") && m.length === 12) m = m.slice(2);
  // Strip leading 0 if present
  if (m.startsWith("0") && m.length === 11) m = m.slice(1);
  return m;
}

export function isValidIndianMobileStrict(input: string): boolean {
  const m = normalizeIndianMobile(input);
  return /^[6-9]\d{9}$/.test(m);
}

// ---------------------------------------------------------------------------
// Idempotency-Key: UUID v4 or any string 8-128 chars (audit production gap 15).
// Used to deduplicate POST /session calls.
// ---------------------------------------------------------------------------
const IDEMPOTENCY_KEY_RE = /^[a-zA-Z0-9._:-]{8,128}$/;
export function getIdempotencyKey(req: NextRequest): string | null {
  const k = req.headers.get("idempotency-key") || req.headers.get("x-zeropaye-idempotency-key");
  if (!k) return null;
  if (!IDEMPOTENCY_KEY_RE.test(k)) return null;
  return k;
}
