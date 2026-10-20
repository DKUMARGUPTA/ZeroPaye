"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowDown, Zap } from "lucide-react";

interface LivePayment {
  id: number;
  merchant: string;
  amount: string;
  vpa: string;
  utr: string;
  time: string;
}

const MERCHANTS = [
  "Sharma Kirana", "Acme Digital", "Arjun Designs",
  "Priya Boutique", "TechHub Store", "FreshMart",
  "BookShelf Cafe", "FitZone Gym", "EduPlus Academy",
  "CraftCorner",
];

const VPAS = [
  "deepak@okhdfcbank", "shop@upi", "business@axisbank",
  "pay@okicici", "store@okaxis", "sales@okhdfcbank",
];

function randomPayment(id: number): LivePayment {
  const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
  const vpa = VPAS[Math.floor(Math.random() * VPAS.length)];
  const amount = (Math.random() * 4999 + 1).toFixed(2);
  const utr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { id, merchant, amount: `₹${amount}`, vpa, utr, time };
}

export function LiveTransactionFeed() {
  const [payments, setPayments] = useState<LivePayment[]>([]);
  const [totalCount, setTotalCount] = useState(47283);

  useEffect(() => {
    let id = 0;
    // Seed with 4 initial payments
    for (let i = 0; i < 4; i++) {
      setPayments(prev => [randomPayment(i), ...prev].slice(0, 5));
    }

    // Add new payment every 3-5 seconds
    const interval = setInterval(() => {
      id++;
      setPayments(prev => [randomPayment(id), ...prev].slice(0, 5));
      setTotalCount(prev => prev + 1);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Payment Stream
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-teal-600" />
          <span className="font-mono font-bold text-gradient">{totalCount.toLocaleString("en-IN")}</span>
          <span>payments processed</span>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-1 p-3 h-[280px] overflow-hidden">
        <AnimatePresence initial={false}>
          {payments.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 px-3 py-2.5 hover:bg-accent/40 transition-colors"
            >
              {/* Status icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>

              {/* Merchant + VPA */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{p.merchant}</span>
                  <span className="text-[10px] text-muted-foreground">{p.time}</span>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">{p.vpa}</div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <div className="text-sm font-bold text-gradient">{p.amount}</div>
                <div className="font-mono text-[9px] text-muted-foreground">UTR: {p.utr.slice(-6)}</div>
              </div>

              {/* Fee saved */}
              <div className="hidden sm:flex flex-col items-end shrink-0">
                <span className="text-[9px] text-muted-foreground">Fee saved</span>
                <span className="text-xs font-bold text-emerald-600">₹0.00</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2.5">
        <span className="text-[10px] text-muted-foreground">
          Zero fees · Direct bank settlement · HMAC verified
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowDown className="h-3 w-3 animate-bounce text-teal-600" />
          Real-time stream
        </span>
      </div>
    </div>
  );
}
