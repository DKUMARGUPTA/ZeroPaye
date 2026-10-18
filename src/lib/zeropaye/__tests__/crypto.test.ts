// Tests for ZeroPaye crypto utilities (src/lib/zeropaye/crypto.ts)
// Covers: OTP generation, constant-time compare, HMAC, SHA-256, API key generation.

import { describe, it, expect } from "vitest";
import { generateOtp, safeEqual, hmacSha256, verifyHmac, sha256Hex, generateApiKey, generateSecret, generatePairingToken, uuid } from "../crypto";

describe("crypto — generateOtp", () => {
  it("generates 6-digit OTP by default", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
    expect(otp).toHaveLength(6);
  });

  it("generates custom-length OTP", () => {
    expect(generateOtp(4)).toMatch(/^\d{4}$/);
    expect(generateOtp(8)).toMatch(/^\d{8}$/);
  });

  it("generates different OTPs on subsequent calls (entropy)", () => {
    const o1 = generateOtp();
    const o2 = generateOtp();
    // Extremely unlikely to collide (1 in 1M)
    expect(o1).not.toBe(o2);
  });
});

describe("crypto — safeEqual", () => {
  it("returns true for equal strings", () => {
    expect(safeEqual("hello", "hello")).toBe(true);
    expect(safeEqual("", "")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(safeEqual("hello", "world")).toBe(false);
    expect(safeEqual("hello", "hellp")).toBe(false);
  });

  it("returns false for different-length strings (no timing leak)", () => {
    expect(safeEqual("a", "ab")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});

describe("crypto — HMAC", () => {
  const secret = "test-secret-12345";

  it("hmacSha256 returns 64-char hex", () => {
    const sig = hmacSha256(secret, "payload");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifyHmac accepts valid signature", () => {
    const payload = "test-payload";
    const sig = hmacSha256(secret, payload);
    expect(verifyHmac(secret, payload, sig)).toBe(true);
  });

  it("verifyHmac rejects invalid signature", () => {
    expect(verifyHmac(secret, "payload", "wrong")).toBe(false);
    expect(verifyHmac(secret, "payload", "")).toBe(false);
  });

  it("verifyHmac accepts sha256= prefix (v1.0.1 flex)", () => {
    const payload = "test-payload";
    const sig = hmacSha256(secret, payload);
    expect(verifyHmac(secret, payload, `sha256=${sig}`)).toBe(true);
  });

  it("verifyHmac rejects wrong secret", () => {
    const sig = hmacSha256(secret, "payload");
    expect(verifyHmac("wrong-secret", "payload", sig)).toBe(false);
  });
});

describe("crypto — sha256Hex", () => {
  it("returns 64-char hex", () => {
    expect(sha256Hex("test")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("deterministic for same input", () => {
    expect(sha256Hex("hello")).toBe(sha256Hex("hello"));
  });

  it("different for different input", () => {
    expect(sha256Hex("hello")).not.toBe(sha256Hex("world"));
  });
});

describe("crypto — API key generation", () => {
  it("generates key with zp_ prefix (ZeroPaye prefix)", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^zp_/);
    expect(key.length).toBeGreaterThan(20);
  });

  it("generates unique keys", () => {
    const k1 = generateApiKey();
    const k2 = generateApiKey();
    expect(k1).not.toBe(k2);
  });
});

describe("crypto — generateSecret", () => {
  it("returns 64-char hex (32 bytes)", () => {
    expect(generateSecret()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique secrets", () => {
    expect(generateSecret()).not.toBe(generateSecret());
  });
});

describe("crypto — generatePairingToken", () => {
  it("returns token with pr_ prefix", () => {
    expect(generatePairingToken()).toMatch(/^pr_/);
  });
});

describe("crypto — uuid", () => {
  it("returns UUID v4 format", () => {
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("generates unique UUIDs", () => {
    expect(uuid()).not.toBe(uuid());
  });
});
