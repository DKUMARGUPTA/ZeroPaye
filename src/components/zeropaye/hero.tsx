"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, ArrowRight, Lock, Banknote, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Animated gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-brand opacity-20 blur-3xl animate-gradient-pan" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.10),transparent_60%)]" />
        <div
          className="absolute inset-0 bg-grid opacity-[0.04] dark:opacity-[0.08] mask-fade-b"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:items-center">
          {/* Left — copy + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600" />
              </span>
              100% Open-Source • AGPL-3.0 • Free for Everyone, Forever
            </div>

            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-gradient">ZeroPaye</span>
            </h1>
            <p className="mt-3 text-lg font-semibold text-foreground/90 sm:text-xl">
              Zero • Empowering • Reliable • Open • Payé
            </p>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg lg:mx-0">
              Bharat ka apna zero-fee UPI payment gateway. Paisa seedhe customer
              se aapke bank account mein — koi beech ka dalaal nahi, koi chhupi
              fee nahi.{" "}
              <span className="font-medium text-foreground">
                Built for every dukaandaar, freelancer aur startup.
              </span>
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full rounded-full bg-gradient-brand text-white shadow-lg glow-teal hover:opacity-90 transition-opacity sm:w-auto"
              >
                <Zap className="mr-2 h-4 w-4" />
                Try the Live Checkout Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a
                href="https://github.com/DKUMARGUPTA/ZeroPaye"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="lg" variant="outline" className="w-full rounded-full gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.7 1 .7 2v3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
                  View on GitHub
                </Button>
              </a>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-teal-600" /> HMAC-SHA256 signed</span>
              <span className="inline-flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-teal-600" /> Direct P2P settlement</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Server-authoritative</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-teal-600" /> Integer-paise arithmetic</span>
            </div>
          </motion.div>

          {/* Right — bento stat grid */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            {/* Big highlight tile */}
            <div className="col-span-2 relative overflow-hidden rounded-3xl border border-border/50 glass p-5 sm:p-6">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  The ZeroPaye Promise
                </div>
                <div className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                  <span className="text-gradient">₹0</span>
                  <span className="text-base font-medium text-muted-foreground">/transaction</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Forever. No "Pro tier". No hidden fees. No transaction limits.
                </p>
              </div>
            </div>

            {/* Stat tiles */}
            <StatTile value="T+0" label="Settlement speed" sub="Direct to bank" />
            <StatTile value="100%" label="Open-source" sub="AGPL-3.0" />
            <StatTile value="₹1.5L+" label="Yearly savings" sub="per ₹5L/month" icon={TrendingUp} />
            <StatTile value="0" label="Account freeze risk" sub="You own VPA" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatTile({ value, label, sub, icon: Icon }: { value: string; label: string; sub?: string; icon?: any }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 transition-all hover:border-teal-500/40 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="text-2xl font-bold tracking-tight text-gradient sm:text-3xl">{value}</div>
        {Icon ? <Icon className="h-4 w-4 text-teal-600/60" /> : null}
      </div>
      <div className="mt-1.5 text-xs font-medium text-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
