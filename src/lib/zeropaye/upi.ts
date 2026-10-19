// ZeroPaye — UPI URI builder
// Preserved from YouPI-PG: pure vector UPI deep-link URI, no Google Charts.

export interface UpiParams {
  pa: string; // Payee Address (VPA) — required, e.g. "merchant@upi"
  pn?: string; // Payee Name
  am?: string; // Amount (string rupees, 2 decimals)
  cu?: string; // Currency (default INR)
  tn?: string; // Transaction Note (max 80 chars, no special chars)
  tr?: string; // Transaction Reference (merchant order id)
  mc?: string; // Merchant Code
}

/**
 * Build a UPI intent URI: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...&tr=...
 */
export function buildUpiUri(params: UpiParams): string {
  if (!params.pa) throw new Error("VPA (pa) is required");
  const cu = params.cu || "INR";
  const parts: string[] = [`pa=${encodeURIComponent(params.pa)}`];
  if (params.pn) parts.push(`pn=${encodeURIComponent(params.pn)}`);
  if (params.am) parts.push(`am=${encodeURIComponent(params.am)}`);
  parts.push(`cu=${encodeURIComponent(cu)}`);
  if (params.tn) {
    const note = params.tn.replace(/[\r\n\t]+/g, " ").slice(0, 80);
    parts.push(`tn=${encodeURIComponent(note)}`);
  }
  if (params.tr) parts.push(`tr=${encodeURIComponent(params.tr)}`);
  return `upi://pay?${parts.join("&")}`;
}

/** Validate Indian 10-digit mobile (no country code). */
export function isValidIndianMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(String(mobile).replace(/[\s+-]/g, ""));
}

/** Validate a UPI VPA format (audit NEW-23 — tightened). */
export function isValidVpa(vpa: string): boolean {
  return /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9][a-zA-Z0-9._-]{1,63}$/.test(String(vpa || ""));
}

/** Validate 12-digit UTR / bank reference. */
export function isValidUtr(utr: string): boolean {
  return /^\d{12}$/.test(String(utr || "").trim());
}

/** Common UPI app deep-link schemes (for the "Pay with app" buttons). */
export const UPI_APPS = [
  { id: "gpay", name: "Google Pay", scheme: "tez://upi/pay" },
  { id: "phonepe", name: "PhonePe", scheme: "phonepe://upi/pay" },
  { id: "paytm", name: "Paytm", scheme: "paytmmp://upi/pay" },
  { id: "bhim", name: "BHIM", scheme: "upi://pay" },
  { id: "amazonpay", name: "Amazon Pay", scheme: "upi://pay" },
  { id: "cred", name: "CRED", scheme: "cred://upi/pay" },
] as const;
