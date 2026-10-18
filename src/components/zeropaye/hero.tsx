"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, ArrowRight, Github, Lock, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[40rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-teal-500/20 via-cyan-400/15 to-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,148,136,0.08),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
            </span>
            100% Open-Source • AGPL-3.0 • Free for Everyone, Forever
          </div>

          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent dark:from-teal-300 dark:via-cyan-300 dark:to-emerald-300">
              ZeroPaye
            </span>
          </h1>
          <p className="mt-4 text-lg font-semibold text-foreground sm:text-2xl">
            Zero • Empowering • Reliable • Open • Payé
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Bharat ka apna zero-fee UPI payment gateway. Paisa seedhe customer se
            aapke bank account mein — koi beech ka dalaal nahi, koi chhupi hui
            fee nahi. <span className="font-medium text-foreground">Built for every dukaandaar, freelancer aur startup.</span>
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-700 sm:w-auto"
            >
              <Zap className="mr-2 h-4 w-4" />
              Try the Live Checkout Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full rounded-full">
                <Github className="mr-2 h-4 w-4" />
                View Source on GitHub
              </Button>
            </a>
          </div>

          {/* trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-teal-600" /> HMAC-SHA256 signed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-teal-600" /> Direct P2P settlement
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Server-authoritative timers
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-teal-600" /> Integer-paise arithmetic
            </span>
          </div>
        </motion.div>

        {/* stats band */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { v: "0%", l: "Transaction Fee" },
            { v: "T+0", l: "Settlement Speed" },
            { v: "100%", l: "Open-Source (AGPL)" },
            { v: "₹0", l: "Monthly Cost" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-border/60 bg-card/50 p-4 text-center backdrop-blur-sm"
            >
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                {s.v}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
