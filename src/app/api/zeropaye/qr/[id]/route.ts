// ZeroPaye API — Generate QR code SVG for a payment session
// GET /api/zeropaye/qr/[id]
// Returns a vector SVG QR encoding the UPI intent URI. (Invariant 4)

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateQrSvg } from "@/lib/zeropaye/qr";
import { buildUpiUri } from "@/lib/zeropaye/upi";
import { jsonErr } from "@/lib/zeropaye/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await db.paymentSession.findUnique({ where: { id } });
  if (!session) return jsonErr(404, "Session not found");

  const account = session.receivingAccountId
    ? await db.receivingAccount.findUnique({ where: { id: session.receivingAccountId } })
    : null;
  if (!account) return jsonErr(404, "Receiving account not found");

  const upiUri = buildUpiUri({
    pa: account.vpa,
    pn: account.accountName,
    am: (session.amountPaise / 100).toFixed(2),
    cu: session.currency || "INR",
    tn: session.description || `ZeroPaye order ${session.orderId}`,
    tr: session.orderId,
  });

  const svg = await generateQrSvg(upiUri, { margin: 1 });
  return new Response(svg, {
    headers: { "content-type": "image/svg+xml", "cache-control": "no-store" },
  });
}
