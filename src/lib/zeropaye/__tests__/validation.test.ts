// Tests for ZeroPaye validation utilities (src/lib/zeropaye/validation.ts)
// Covers: orderId, currency, VPA, mobile normalization + validation.

import { describe, it, expect } from "vitest";
import { isValidOrderId, isValidCurrency, isValidVpaStrict, normalizeIndianMobile, isValidIndianMobileStrict } from "../validation";

describe("validation — isValidOrderId", () => {
  it("accepts valid order IDs", () => {
    expect(isValidOrderId("ORDER-1001")).toBe(true);
    expect(isValidOrderId("ZP_2025_001")).toBe(true);
    expect(isValidOrderId("A")).toBe(true);
    expect(isValidOrderId("a".repeat(35))).toBe(true);
  });

  it("rejects invalid order IDs", () => {
    expect(isValidOrderId("")).toBe(false);
    expect(isValidOrderId("a".repeat(36))).toBe(false); // too long
    expect(isValidOrderId("ORDER 1001")).toBe(false); // space
    expect(isValidOrderId("ORDER.1001")).toBe(false); // dot not allowed
    expect(isValidOrderId("ORDER@1001")).toBe(false);
  });
});

describe("validation — isValidCurrency", () => {
  it("accepts valid ISO 4217 codes", () => {
    expect(isValidCurrency("INR")).toBe(true);
    expect(isValidCurrency("USD")).toBe(true);
    expect(isValidCurrency("EUR")).toBe(true);
  });

  it("rejects invalid currency codes", () => {
    expect(isValidCurrency("")).toBe(false);
    expect(isValidCurrency("inr")).toBe(false); // lowercase
    expect(isValidCurrency("INRUPEE")).toBe(false);
    expect(isValidCurrency("IN")).toBe(false);
  });
});

describe("validation — isValidVpaStrict", () => {
  it("accepts valid UPI VPAs", () => {
    expect(isValidVpaStrict("deepak@okhdfcbank")).toBe(true);
    expect(isValidVpaStrict("shop.123@upi")).toBe(true);
    expect(isValidVpaStrict("a_b-c@axis")).toBe(true);
  });

  it("rejects invalid VPAs", () => {
    expect(isValidVpaStrict("")).toBe(false);
    expect(isValidVpaStrict("deepak")).toBe(false); // no @
    expect(isValidVpaStrict("@upi")).toBe(false); // no name
    expect(isValidVpaStrict("deepak@")).toBe(false); // no bank
    expect(isValidVpaStrict("deepak@@upi")).toBe(false);
    expect(isValidVpaStrict("..@..")).toBe(false);
  });
});

describe("validation — normalizeIndianMobile", () => {
  it("strips +91 country code", () => {
    expect(normalizeIndianMobile("+919876543210")).toBe("9876543210");
    expect(normalizeIndianMobile("919876543210")).toBe("9876543210");
  });

  it("strips leading 0", () => {
    expect(normalizeIndianMobile("09876543210")).toBe("9876543210");
  });

  it("strips spaces and dashes", () => {
    expect(normalizeIndianMobile("98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("987-654-3210")).toBe("9876543210");
  });

  it("leaves valid 10-digit mobile unchanged", () => {
    expect(normalizeIndianMobile("9876543210")).toBe("9876543210");
  });
});

describe("validation — isValidIndianMobileStrict", () => {
  it("accepts valid Indian mobiles", () => {
    expect(isValidIndianMobileStrict("9876543210")).toBe(true);
    expect(isValidIndianMobileStrict("6123456789")).toBe(true);
    expect(isValidIndianMobileStrict("+919876543210")).toBe(true);
    expect(isValidIndianMobileStrict("09876543210")).toBe(true);
  });

  it("rejects invalid mobiles", () => {
    expect(isValidIndianMobileStrict("")).toBe(false);
    expect(isValidIndianMobileStrict("1234567890")).toBe(false); // starts with 1
    expect(isValidIndianMobileStrict("5876543210")).toBe(false); // starts with 5
    expect(isValidIndianMobileStrict("987654321")).toBe(false); // 9 digits
    expect(isValidIndianMobileStrict("98765432101")).toBe(false); // 11 digits
  });
});
