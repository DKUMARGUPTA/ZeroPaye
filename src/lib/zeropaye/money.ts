// ZeroPaye — Money utilities (integer paise arithmetic)
// Preserved from YouPI-PG: Invariant 5 — Integer Minor Units (Paise).
// All financial values are stored/transported as Int paise. ₹1.00 = 100 paise.
// ₹1,00,000 (UPI daily limit) = 10,000,000 paise — well within Int (2.1B).

/**
 * Convert rupees (string/number) to paise (Int).
 * Validates format strictly; throws on invalid input.
 *
 *   toPaise("499.00")   -> 49900
 *   toPaise(499)        -> 49900
 *   toPaise("1,999.50") -> 199950
 */
export function toPaise(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) throw new Error("Invalid amount");
    // v3.0 POC1 fix: reject >2 decimal places (was silently rounding 499.999 → 500.00)
    const str = String(input);
    if (str.includes(".") && str.split(".")[1]?.length > 2) {
      throw new Error("Amount has more than 2 decimal places (max: 499.99)");
    }
    return Math.round(input * 100);
  }
  const cleaned = String(input).replace(/[, ]/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`Invalid money format: ${input}`);
  }
  const [whole, frac = ""] = cleaned.split(".");
  const paise = parseInt(whole, 10) * 100 + parseInt((frac + "00").slice(0, 2), 10);
  if (paise < 0) throw new Error("Negative amount");
  return paise;
}

/** Format paise as a plain rupees string "499.00". */
export function toRupeesString(paise: number): string {
  return (paise / 100).toFixed(2);
}

/** Format paise as Indian-style ₹ "1,234.50". */
export function formatINR(paise: number): string {
  const rs = paise / 100;
  const [whole, frac] = rs.toFixed(2).split(".");
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return `₹${grouped}.${frac}`;
}

/** Compact formatting for dashboard tiles (₹1.2L, ₹3.4Cr). */
export function formatINRCompact(paise: number): string {
  const rs = paise / 100;
  if (rs >= 10000000) return `₹${(rs / 10000000).toFixed(2)}Cr`;
  if (rs >= 100000) return `₹${(rs / 100000).toFixed(2)}L`;
  if (rs >= 1000) return `₹${(rs / 1000).toFixed(1)}K`;
  return `₹${rs.toFixed(0)}`;
}
