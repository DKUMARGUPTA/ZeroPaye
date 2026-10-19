"use client";

import { motion } from "framer-motion";
import { Check, X, TrendingDown, Clock, Lock, Palette, Server, Code2 } from "lucide-react";

const ROWS = [
  { icon: TrendingDown, label: "Transaction Fee", trad: "2.0% – 3.0% + 18% GST per txn", dee: "0.0% — Forever", deePositive: true },
  { icon: Clock, label: "Settlement Speed", trad: "T+2 to T+3 business days", dee: "Instant (direct P2P UPI)", deePositive: true },
  { icon: Lock, label: "Account Freeze Risk", trad: "High — unilateral aggregator freeze", dee: "Zero — you own your VPA", deePositive: true },
  { icon: Palette, label: "Branding Control", trad: '"Secured by Razorpay" mandatory', dee: "100% white-label", deePositive: true },
  { icon: Server, label: "Deployment", trad: "SaaS lock-in", dee: "Self-hosted / Next.js", deePositive: true },
  { icon: Code2, label: "Source Code", trad: "Closed proprietary", dee: "AGPL-3.0 open-source", deePositive: true },
];

export function Comparison() {
  return (
    <section className="relative border-y border-border/40 bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">
            Why ZeroPaye exists
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Stop paying <span className="text-rose-500">2–3% + 18% GST</span> to middlemen
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
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
          className="mt-12 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lg"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1.2fr_1.2fr] gap-2 border-b border-border/40 bg-muted/40 p-4 text-xs font-semibold uppercase tracking-wider sm:text-sm sm:p-5">
            <div className="text-muted-foreground">Metric</div>
            <div className="text-center text-muted-foreground/80">Traditional Aggregators</div>
            <div className="relative text-center">
              <span className="text-gradient font-bold">ZeroPaye</span>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-[1fr_1.2fr_1.2fr] items-center gap-2 p-4 transition-colors sm:p-5 ${
                i % 2 === 0 ? "bg-background/50" : "bg-muted/20"
              } hover:bg-accent/40`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <r.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium sm:text-sm">{r.label}</span>
              </div>
              <div className="flex items-start gap-2 px-1 sm:px-2">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span className="text-[11px] text-muted-foreground sm:text-sm">{r.trad}</span>
              </div>
              <div className="flex items-start gap-2 px-1 sm:px-2 sm:rounded-lg sm:bg-teal-500/[0.04] sm:p-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-[11px] font-medium text-foreground sm:text-sm">{r.dee}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Savings highlight */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 rounded-2xl border border-teal-500/20 bg-gradient-brand-soft p-4 text-center"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Real example:</span> On ₹5,00,000 monthly volume, traditional gateways cost{" "}
            <span className="font-bold text-rose-600">₹13,000+</span> in fees + GST. ZeroPaye costs{" "}
            <span className="font-bold text-emerald-600">₹0</span>. That's{" "}
            <span className="font-bold text-gradient">₹1,56,000/year</span> saved. 💰
          </p>
        </motion.div>
      </div>
    </section>
  );
}
