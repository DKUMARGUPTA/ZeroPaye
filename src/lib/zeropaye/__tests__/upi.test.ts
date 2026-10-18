// Tests for ZeroPaye UPI utilities (src/lib/zeropaye/upi.ts)
// Covers: UPI URI building, UTR validation, mobile validation (legacy).

import { describe, it, expect } from "vitest";
import { buildUpiUri, isValidUtr, UPI_APPS } from "../upi";

describe("upi — buildUpiUri", () => {
  it("builds minimal UPI URI", () => {
    const uri = buildUpiUri({ pa: "deepak@okhdfcbank" });
    expect(uri).toBe("upi://pay?pa=deepak%40okhdfcbank&cu=INR");
  });

  it("builds full UPI URI with all params", () => {
    const uri = buildUpiUri({
      pa: "shop@upi",
      pn: "Sharma Store",
      am: "499.00",
      cu: "INR",
      tn: "Order 12345",
      tr: "ORD-12345",
    });
    expect(uri).toContain("pa=shop%40upi");
    expect(uri).toContain("pn=Sharma%20Store");
    expect(uri).toContain("am=499.00");
    expect(uri).toContain("cu=INR");
    expect(uri).toContain("tn=Order%2012345");
    expect(uri).toContain("tr=ORD-12345");
  });

  it("truncates note to 80 chars (UPI spec)", () => {
    const longNote = "a".repeat(100);
    const uri = buildUpiUri({ pa: "shop@upi", tn: longNote });
    expect(uri).toContain("tn=" + encodeURIComponent("a".repeat(80)));
    expect(uri).not.toContain("tn=" + encodeURIComponent("a".repeat(81)));
  });

  it("strips line breaks from note", () => {
    const uri = buildUpiUri({ pa: "shop@upi", tn: "line1\nline2\ttab" });
    expect(uri).not.toContain("%0A"); // no newline
    expect(uri).not.toContain("%09"); // no tab
  });

  it("throws if pa (VPA) missing", () => {
    expect(() => buildUpiUri({ pa: "" } as any)).toThrow();
  });

  it("uses INR as default currency", () => {
    const uri = buildUpiUri({ pa: "shop@upi" });
    expect(uri).toContain("cu=INR");
  });
});

describe("upi — isValidUtr", () => {
  it("accepts valid 12-digit UTR", () => {
    expect(isValidUtr("123456789012")).toBe(true);
    expect(isValidUtr("000000000000")).toBe(true);
  });

  it("rejects invalid UTRs", () => {
    expect(isValidUtr("")).toBe(false);
    expect(isValidUtr("12345678901")).toBe(false); // 11 digits
    expect(isValidUtr("1234567890123")).toBe(false); // 13 digits
    expect(isValidUtr("12345678901a")).toBe(false); // non-digit
    // isValidUtr internally trims, so leading space is stripped — accepted after trim
    expect(isValidUtr(" 123456789012 ")).toBe(true); // trimmed = valid
  });
});

describe("upi — UPI_APPS", () => {
  it("contains major UPI apps", () => {
    const ids = UPI_APPS.map((a) => a.id);
    expect(ids).toContain("gpay");
    expect(ids).toContain("phonepe");
    expect(ids).toContain("paytm");
    expect(ids).toContain("bhim");
  });

  it("each app has name + scheme", () => {
    for (const app of UPI_APPS) {
      expect(app.name).toBeTruthy();
      expect(app.scheme).toBeTruthy();
      expect(app.scheme).toContain("://");
    }
  });
});
