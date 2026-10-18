// Tests for ZeroPaye money utilities (src/lib/zeropaye/money.ts)
// Covers: paise conversion, formatting, edge cases.

import { describe, it, expect } from "vitest";
import { toPaise, toRupeesString, formatINR, formatINRCompact } from "../money";

describe("money — toPaise", () => {
  it("converts string rupees to paise", () => {
    expect(toPaise("499.00")).toBe(49900);
    expect(toPaise("1")).toBe(100);
    expect(toPaise("0.50")).toBe(50);
  });

  it("converts number rupees to paise", () => {
    expect(toPaise(499)).toBe(49900);
    expect(toPaise(1)).toBe(100);
    expect(toPaise(0.5)).toBe(50);
  });

  it("handles Indian comma format", () => {
    expect(toPaise("1,999.50")).toBe(199950);
    expect(toPaise("1,00,000")).toBe(10000000);
  });

  it("handles decimals with single digit", () => {
    expect(toPaise("499.5")).toBe(49950);
    expect(toPaise("499.0")).toBe(49900);
  });

  it("throws on invalid input", () => {
    expect(() => toPaise("abc")).toThrow();
    expect(() => toPaise("")).toThrow();
    expect(() => toPaise("499.999")).toThrow(); // >2 decimals
    expect(() => toPaise("-100")).toThrow();
  });
});

describe("money — toRupeesString", () => {
  it("formats paise as rupees string with 2 decimals", () => {
    expect(toRupeesString(49900)).toBe("499.00");
    expect(toRupeesString(100)).toBe("1.00");
    expect(toRupeesString(50)).toBe("0.50");
    expect(toRupeesString(0)).toBe("0.00");
  });
});

describe("money — formatINR", () => {
  it("formats with ₹ prefix and Indian grouping", () => {
    expect(formatINR(49900)).toBe("₹499.00");        // 49900 paise = ₹499.00
    expect(formatINR(100000)).toBe("₹1,000.00");    // 100000 paise = ₹1000.00
    expect(formatINR(10000000)).toBe("₹1,00,000.00"); // 10000000 paise = ₹100,000.00
    expect(formatINR(123456789)).toBe("₹12,34,567.89"); // 123456789 paise = ₹1234567.89
  });
});

describe("money — formatINRCompact", () => {
  it("formats large amounts in compact notation", () => {
    expect(formatINRCompact(50000000)).toBe("₹5.00L");   // 50000000 paise = ₹500000 = 5L
    expect(formatINRCompact(10000000)).toBe("₹1.00L");   // 10000000 paise = ₹100000 = 1L
    expect(formatINRCompact(100000)).toBe("₹1.0K");      // 100000 paise = ₹1000 = 1K
    expect(formatINRCompact(1500)).toBe("₹15");          // 1500 paise = ₹15
    expect(formatINRCompact(500)).toBe("₹5");             // 500 paise = ₹5
  });
});
