"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, KeyRound, Fingerprint, Database, RefreshCw, Lock,
  Server, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { HmacIcon, ShieldLockIcon } from "./zeropaye-icons";

const FIXES = [
  {
    severity: "CRITICAL",
    icon: KeyRound,
    title: "Admin endpoints fully authenticated",
    before: "YouPI-PG: every /api/v1/admin/* endpoint had zero auth — anyone could change the receiving VPA or read the webhook secret.",
    after: "ZeroPaye: admin actions require a per-merchant admin API key (cuid) + secret headers. The webhook secret is never returned in any GET response.",
    audit: "Fixes audit S1, S8",
  },
  {
    severity: "CRITICAL",
    icon: HmacIcon,
    title: "Mandatory HMAC on observer ingestion",
    before: "YouPI-PG: HMAC verification was optional — omitting the X-Signature header bypassed it entirely. Fake SMS could confirm fake payments.",
    after: "ZeroPaye: x-device-id, x-timestamp, x-signature are all mandatory. 60s anti-replay window. Constant-time comparison. Signing keys stored as SHA-256 hashes, never plaintext.",
    audit: "Fixes audit S2, S9, S16",
  },
  {
    severity: "CRITICAL",
    icon: Lock,
    title: "Cryptographically secure OTP",
    before: "YouPI-PG: OTP generated with Math.random() (not CSPRNG), printed to stdout, no rate limiting, no brute-force lockout.",
    after: "ZeroPaye: crypto.randomInt() generation, OTP stored as SHA-256 hash (never plaintext), 30s resend cooldown, 5-attempt lockout for 15 min, constant-time compare.",
    audit: "Fixes audit S3, S4, S5, S16",
  },
  {
    severity: "HIGH",
    icon: ShieldLockIcon,
    title: "Strict SSRF + CORS allow-list",
    before: "YouPI-PG: webhook targets had no SSRF protection (could hit AWS metadata). CORS was Access-Control-Allow-Origin: *.",
    after: "ZeroPaye: SSRF guard blocks private/loopback/link-local/metadata endpoints; HTTPS required in production. CORS allow-listed to same-origin only.",
    audit: "Fixes audit S12, S15",
  },
  {
    severity: "HIGH",
    icon: RefreshCw,
    title: "Webhook retries + idempotency",
    before: "YouPI-PG: webhook retry code existed but was never invoked. Failed deliveries were silently dropped. No idempotency constraint.",
    after: "ZeroPaye: webhook_deliveries table with unique delivery_id (uuid v4), attempt counter, next-retry-at. Merchants can dedupe by X-ZeroPaye-Delivery-Id.",
    audit: "Fixes audit S18, S32, S33",
  },
  {
    severity: "HIGH",
    icon: Fingerprint,
    title: "Strict attribution — no fallback",
    before: "YouPI-PG: when a payment session id wasn't provided, the verifier fell back to ANY active session in the entire DB by amount match.",
    after: "ZeroPaye: attribution requires the exact receiving account + exact integer-paise amount + valid 12-digit UTR regex. No global fallback. No fuzzy matching (Invariant 1).",
    audit: "Fixes audit S19, S20, S21",
  },
  {
    severity: "MEDIUM",
    icon: Database,
    title: "Prisma transactions = BEGIN IMMEDIATE",
    before: "YouPI-PG: queue acquisition used plain BEGIN TRANSACTION — two concurrent calls could both read is_slot_busy=0 and both UPDATE.",
    after: "ZeroPaye: Prisma $transaction wraps SQLite in BEGIN IMMEDIATE, taking the write lock upfront. The single-slot FIFO invariant is now race-proof.",
    audit: "Fixes audit B5, B23",
  },
  {
    severity: "MEDIUM",
    icon: Server,
    title: "No hardcoded PII or secrets",
    before: "YouPI-PG: shipped with the author's personal phone + email in the DB seed, hardcoded webhook secret, hardcoded Windows file paths to /D:/WA-USERAUTH DEV.",
    after: "ZeroPaye: zero author PII. All secrets generated at first boot via crypto.randomBytes. AGPL-3.0 license. No proprietary dependencies required to run.",
    audit: "Fixes audit S6, S7, S10",
  },
];

export function Security() {
  return (
    <section id="security" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
            Security by Design
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Every critical bug from the YouPI-PG audit — fixed
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            We audited the original codebase (105 findings, 13 CRITICAL) and
            rebuilt every boundary in ZeroPaye. Here&apos;s what changed.
          </p>
        </div>

        {/* Severity summary band */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { v: "13", l: "Critical (was)", c: "text-rose-600" },
            { v: "13", l: "High (was)", c: "text-amber-600" },
            { v: "0", l: "Critical (now)", c: "text-emerald-600" },
            { v: "0", l: "High (now)", c: "text-emerald-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border/40 bg-card p-3 text-center">
              <div className={`text-3xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-[11px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {FIXES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: (i % 2) * 0.05 }}
            >
              <Card className="h-full border-l-4 p-5" style={{ borderLeftColor: f.severity === "CRITICAL" ? "#e11d48" : f.severity === "HIGH" ? "#f59e0b" : "#14b8a6" }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/15 to-cyan-500/15 text-teal-600">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{f.title}</h3>
                      <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-semibold">{f.severity}</Badge>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" />
                        <span className="text-muted-foreground">{f.before}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        <span>{f.after}</span>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <Badge variant="secondary" className="text-[10px] font-mono">{f.audit}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Invariants preserved */}
        <div className="mt-12 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/[0.04] to-cyan-500/[0.04] p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-bold">Architectural Invariants — preserved & hardened</h3>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            The original YouPI-PG design had excellent invariants. ZeroPaye keeps them all and fixes the implementation bugs.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Integer-paise arithmetic (no floats)",
              "Server-authoritative dual timers",
              "Pure vector SVG QR (no Google Charts)",
              "Single-slot FIFO queue per VPA",
              "Gateway-owned customer OTP identity",
              "Raw-body HMAC-SHA256 webhook contract",
              "Observation cluster fingerprint dedup",
              "L1/L2/L3 multi-channel verification tiers",
              "Crash-recovery on boot",
            ].map((inv) => (
              <div key={inv} className="flex items-start gap-2 rounded-lg border border-border/40 bg-background/50 p-2.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="text-xs">{inv}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
