"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "./animated-counter";
import { TrendingUp, Banknote, Users, Zap, ShieldCheck } from "lucide-react";

export function AnimatedHeroStats() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
          <Zap className="h-3 w-3" />
          Real-time ZeroPaye Network
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Bharat ka UPI network, <span className="text-gradient">live chal raha hai</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Har second payments process ho rahe hain — 0% fee, seedhe bank mein.
        </p>
      </div>

      {/* Big animated stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Banknote}
          label="Total Volume"
          value={<AnimatedCounter value={2.4} decimals={1} suffix=" Cr" prefix="Rs " />}
          sub="Processed via UPI"
          gradient="from-teal-500/10 to-cyan-500/10"
          iconColor="text-teal-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Fees Saved"
          value={<AnimatedCounter value={52} suffix=" L+" prefix="Rs " />}
          sub="vs 2.2% aggregator"
          gradient="from-emerald-500/10 to-teal-500/10"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={Users}
          label="Active Merchants"
          value={<AnimatedCounter value={1847} />}
          sub="Dukaandaar + freelancers"
          gradient="from-cyan-500/10 to-teal-500/10"
          iconColor="text-cyan-600"
        />
        <StatCard
          icon={ShieldCheck}
          label="Avg Verify Time"
          value={<><AnimatedCounter value={2.3} decimals={1} /> <span className="text-base">sec</span></>}
          sub="Bank SMS → SUCCESS"
          gradient="from-teal-500/10 to-emerald-500/10"
          iconColor="text-teal-600"
        />
      </div>

      {/* Bottom info bar */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
      >
        <span className="inline-flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Network operational
        </span>
        <span>•</span>
        <span>0% fees since launch</span>
        <span>•</span>
        <span>100% open-source</span>
        <span>•</span>
        <span>AGPL-3.0 licensed</span>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
  iconColor,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${gradient} p-4 transition-all hover:shadow-lg hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-background/60 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/80">{sub}</div>}
    </motion.div>
  );
}
