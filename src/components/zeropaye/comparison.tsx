"use client";

import { motion } from "framer-motion";
import { Check, X, TrendingDown, Clock, Lock, Palette, Server } from "lucide-react";

const ROWS = [
  {
    label: "Transaction Fee",
    icon: TrendingDown,
    trad: "2.0% – 3.0% + 18% GST per txn",
    dee: "0.0% — Forever",
  },
  {
    label: "Settlement Speed",
    icon: Clock,
    trad: "T+2 to T+3 business days",
    dee: "Instant (direct P2P UPI)",
  },
  {
    label: "Account Freeze Risk",
    icon: Lock,
    trad: "High — unilateral aggregator freeze",
    dee: "Zero — you own your VPA",
  },
  {
    label: "Branding Control",
    icon: Palette,
    trad: "'Secured by Razorpay' mandatory",
    dee: "100% white-label",
  },
  {
    label: "Deployment",
    icon: Server,
    trad: "SaaS lock-in",
    dee: "Self-hosted / Next.js",
  },
  {
    label: "Source Code",
    icon: Lock,
    trad: "Closed proprietary",
    dee: "AGPL-3.0 open-source",
  },
];

export function Comparison() {
  return (
    <section className="border-y border-border/40 bg-muted/20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
            Why ZeroPaye exists
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Stop paying 2–3% + 18% GST to middlemen
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Traditional aggregators (Razorpay, Cashfree, PayU) lock your revenue
            into fees, delayed settlements, and sudden compliance freezes. ZeroPaye
            flips that model — you keep 100% of your money.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider sm:text-sm">
            <div className="p-4 sm:p-5">Metric</div>
            <div className="border-l border-border p-4 text-center sm:p-5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-foreground/80">Traditional Aggregators</span>
              </div>
            </div>
            <div className="border-l border-border bg-gradient-to-b from-teal-500/10 to-transparent p-4 text-center sm:p-5">
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-bold text-transparent">
                ZeroPaye
              </span>
            </div>
          </div>
          {/* Rows */}
          {ROWS.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-3 items-center ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2.5">
                  <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">{r.label}</span>
                </div>
              </div>
              <div className="border-l border-border p-4 sm:p-5">
                <div className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <span className="text-xs text-muted-foreground sm:text-sm">{r.trad}</span>
                </div>
              </div>
              <div className="border-l border-border bg-teal-500/[0.04] p-4 sm:p-5">
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-xs font-medium text-foreground sm:text-sm">{r.dee}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Example: On ₹5,00,000 monthly volume, traditional gateways cost
          <span className="font-semibold text-rose-600"> ₹11,000+</span> in fees + GST.
          ZeroPaye costs <span className="font-semibold text-emerald-600">₹0</span>.
        </p>
      </div>
    </section>
  );
}
