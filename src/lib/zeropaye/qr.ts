// ZeroPaye — QR code SVG generator (pure, no external API)
// Preserved from YouPI-PG Invariant 4: Pure Vector SVG QR, ISO/IEC 18004.

import QRCode from "qrcode";

/**
 * Generate an SVG QR code for a UPI intent URI.
 * Returns a standalone <svg> string (viewBox 0 0 N N) that scales crisply.
 */
export async function generateQrSvg(data: string, opts: { margin?: number; color?: string; size?: number } = {}): Promise<string> {
  const margin = opts.margin ?? 2;
  const color = opts.color ?? "#0f172a"; // slate-900 (adapts via currentColor in dark)
  const svg = await QRCode.toString(data, {
    type: "svg",
    margin,
    color: { dark: color, light: "#00000000" },
    errorCorrectionLevel: "M",
  });
  return svg;
}

/**
 * Generate a base64 data-URI for embedding <img src> in the UI.
 */
export async function generateQrDataUri(data: string, opts: { margin?: number; size?: number } = {}): Promise<string> {
  return QRCode.toDataURL(data, {
    margin: opts.margin ?? 2,
    errorCorrectionLevel: "M",
    width: opts.size ?? 256,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
