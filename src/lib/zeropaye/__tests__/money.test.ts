// Unit tests for money edge cases (money.ts)
// v4.0: tests >2 decimals rejection (POC1), negative, edge cases

import { describe, it, expect } from "vitest";
import { toPaise, toRupeesString, formatINR, formatINRCompact } from "../money";

describe("money — toPaise edge cases (v4.0 POC1 fix)", () => {
  it("rejects >2 decimal places (was silently rounding 499.999 → 500.00)", () => {
    expect(() => toPaise(499.999)).toThrow();
    expect(() => toPaise(1.005)).toThrow();
    expect(() => toPaise(0.001)).toThrow();
  });

  it("accepts exactly 2 decimal places", () => {
    expect(toPaise(499.99)).toBe(49999);
    expect(toPaise(1.5)).toBe(150);
    expect(toPaise(1.05)).toBe(105);
  });

  it("accepts integer amounts", () => {
    expect(toPaise(499)).toBe(49900);
    expect(toPaise(1)).toBe(100);
    expect(toPaise(0)).toBe(0);
  });

  it("rejects negative amounts", () => {
    expect(() => toPaise(-100)).toThrow();
    expect(() => toPaise("-100")).toThrow();
  });

  it("handles string input with commas (Indian format)", () => {
    expect(toPaise("1,00,000")).toBe(10000000);
    expect(toPaise("1,999.50")).toBe(199950);
  });

  it("handles string input with spaces", () => {
    expect(toPaise(" 499 ")).toBe(49900);
    expect(toPaise(" 1, 000 ")).toBe(100000);
  });
});

describe("money — toRupeesString", () => {
  it("formats paise as rupees string", () => {
    expect(toRupeesString(49900)).toBe("499.00");
    expect(toRupeesString(100)).toBe("1.00");
    expect(toRupeesString(0)).toBe("0.00");
    expect(toRupeesString(105)).toBe("1.05");
  });
});

describe("money — formatINR", () => {
  it("formats with Indian grouping", () => {
    expect(formatINR(49900)).toBe("₹499.00");
    expect(formatINR(100000)).toBe("₹1,000.00");
    expect(formatINR(10000000)).toBe("₹1,00,000.00");
  });
});

describe("money — formatINRCompact", () => {
  it("formats large amounts compactly", () => {
    expect(formatINRCompact(50000000)).toBe("₹5.00L");
    expect(formatINRCompact(10000000)).toBe("₹1.00L");
    expect(formatINRCompact(100000)).toBe("₹1.0K");
  });
});
