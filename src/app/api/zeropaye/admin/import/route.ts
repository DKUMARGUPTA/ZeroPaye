// ZeroPaye API — CSV bank statement import (manual reconciliation)
// POST /api/zeropaye/admin/import
// Body: { csv: "date,description,amount,utr\n..." }
// v4.2 F3: Manual bank statement import for merchants without observer setup.
// Parses CSV, creates observations, auto-matches to sessions where possible.

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { jsonOk, jsonErr, getRequestId } from "@/lib/zeropaye/security";
import { requireAdmin } from "@/lib/zeropaye/admin-auth";
import { isDemoMode } from "@/lib/zeropaye/demo-data";
import { isValidUtr } from "@/lib/zeropaye/upi";
import { logger } from "@/lib/zeropaye/workers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = await getRequestId();
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;
  const { merchant } = admin;

  const body = await req.json().catch(() => ({}));
  const { csv, receivingAccountId } = body;

  if (!csv || typeof csv !== "string") {
    return jsonErr(400, "csv field is required (string)");
  }
  if (!receivingAccountId) {
    return jsonErr(400, "receivingAccountId is required");
  }

  if (isDemoMode()) {
    return jsonOk({ imported: 0, matched: 0, message: "Demo mode — CSV import not available" });
  }

  try {
    // Parse CSV — expected format: date,description,amount,utr
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return jsonErr(400, "CSV must have at least a header + 1 row");
    }

    // Skip header row
    const dataLines = lines.slice(1);
    let imported = 0;
    let matched = 0;
    let unmatched = 0;
    let errors = 0;

    for (const line of dataLines) {
      const cols = line.split(",").map((c) => c.trim());
      if (cols.length < 4) { errors++; continue; }

      const [date, description, amountStr, utr] = cols;

      // Validate UTR
      if (!utr || !isValidUtr(utr)) { errors++; continue; }

      // Parse amount (handle ₹, Rs, commas)
      const amountClean = amountStr.replace(/[₹Rs,\s]/g, "");
      const amountPaise = Math.round(parseFloat(amountClean) * 100);
      if (isNaN(amountPaise) || amountPaise < 100) { errors++; continue; }

      // Check for duplicate UTR
      const existing = await db.observation.findFirst({
        where: { parsedUtr: utr, receivingAccountId },
      });
      if (existing) { continue; } // skip duplicate

      // Try to match with an active/expired/unconfirmed session
      const session = await db.paymentSession.findFirst({
        where: {
          receivingAccountId,
          amountPaise,
          status: { in: ["ACTIVE", "PROCESSING", "EXPIRED", "UNCONFIRMED"] },
        },
        orderBy: { activatedAt: "desc" },
      });

      if (session) {
        // Match! Settle the session
        await db.$transaction(async (tx) => {
          await tx.observation.create({
            data: {
              source: "CSV_IMPORT",
              rawText: description?.slice(0, 2000),
              parsedAmountPaise: amountPaise,
              parsedUtr: utr,
              receivingAccountId,
              paymentSessionId: session.id,
              clusterHash: `csv_${utr}`,
              verificationTier: 1,
            },
          });
          await tx.paymentSession.updateMany({
            where: { id: session.id, status: { in: ["ACTIVE", "PROCESSING", "EXPIRED", "UNCONFIRMED"] } },
            data: { status: "SUCCESS", utr, verificationTier: 1, settledAt: new Date(), observationSources: "CSV_IMPORT" },
          });
          await tx.receivingAccount.updateMany({
            where: { id: receivingAccountId },
            data: { isSlotBusy: false },
          });
        });
        matched++;
      } else {
        // Store as unmatched
        await db.observation.create({
          data: {
            source: "CSV_IMPORT",
            rawText: description?.slice(0, 2000),
            parsedAmountPaise: amountPaise,
            parsedUtr: utr,
            receivingAccountId,
            clusterHash: `csv_${utr}`,
          },
        });
        unmatched++;
      }
      imported++;
    }

    logger.info("csv-import", { imported, matched, unmatched, errors, requestId });

    return jsonOk({
      imported,
      matched,
      unmatched,
      errors,
      message: `${imported} rows processed. ${matched} matched to sessions, ${unmatched} stored as unmatched.`,
    });
  } catch (e: any) {
    console.error("[ZeroPaye] CSV import error", e);
    return jsonErr(500, "CSV import failed: " + e.message);
  }
}
