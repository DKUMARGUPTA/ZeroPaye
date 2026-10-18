"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  Zap, MessageCircle, ListOrdered, Smartphone, Mail, Store,
  Palette, FileCheck, ShieldCheck, Banknote, QrCode, Lock,
} from "lucide-react";
import { DirectIcon, EmpowerIcon, EffortlessIcon, PayIcon, ObserverIcon, QueueIcon } from "./zeropaye-icons";

const FEATURES = [
  { icon: Zap, title: "0% fees — forever", body: "Every rupee goes straight from customer to merchant via NPCI UPI rails. No intermediaries hold your money.", accent: "from-teal-500 to-cyan-500" },
  { icon: MessageCircle, title: "Gateway-owned OTP", body: "WhatsApp / email OTP verified before slot allocation. Eliminates phone-spoofing, bot spam, and fake orders.", accent: "from-cyan-500 to-emerald-500" },
  { icon: QueueIcon, title: "Single-slot FIFO queue", body: "Exactly ONE active session per VPA at a time. Eliminates amount-collision attribution errors in P2P UPI.", accent: "from-emerald-500 to-teal-500" },
  { icon: QrCode, title: "Pure vector SVG QR", body: "ISO/IEC 18004 compliant. Sub-second generation. No Google Charts. Scales crisply to any resolution.", accent: "from-teal-500 to-emerald-500" },
  { icon: ObserverIcon, title: "Tri-channel observation", body: "Android SMS + push, Gmail alerts, Google Messages Web. L1/L2/L3 verification tiers as more channels confirm.", accent: "from-cyan-500 to-teal-500" },
  { icon: Smartphone, title: "Native Android observer", body: "Lightweight Kotlin foreground service. HMAC-signed payloads. Ephemeral QR pairing. No Google Play required.", accent: "from-teal-500 to-cyan-500" },
  { icon: Store, title: "Dual operating mode", body: "Online selling (UPI + COD) AND offline counter (UPI + cash-at-till + card-at-POS). One gateway, every store.", accent: "from-emerald-500 to-cyan-500" },
  { icon: Palette, title: "100% white-label", body: "Custom brand name, logo, colors, domain. Zero 'Powered by' badges. Your customers see only your brand.", accent: "from-teal-500 to-emerald-500" },
  { icon: FileCheck, title: "5 outcome pages", body: "Standardized success / failed / suspicious / expired / cancelled. Never leave customers with a blank screen.", accent: "from-cyan-500 to-emerald-500" },
  { icon: ShieldCheck, title: "Server-authoritative timers", body: "5-min pay + 30-sec verify countdowns computed from DB state. Refresh-proof. Reboot-proof. Tamper-proof.", accent: "from-emerald-500 to-teal-500" },
  { icon: Lock, title: "HMAC-SHA256 webhooks", body: "Raw-body signed. Constant-time verify. Idempotent delivery IDs. Polyglot verification snippets (Node/Python/PHP/Go).", accent: "from-teal-500 to-cyan-500" },
  { icon: Banknote, title: "Direct P2P settlement", body: "Funds land in your bank instantly. No T+2 holdbacks. No fund custody by ZeroPaye. You own your money.", accent: "from-cyan-500 to-teal-500" },
];

export function Features() {
  return (
    <section className="border-y border-border/40 bg-muted/10 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
            Superpowers
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything an enterprise gateway has — free, open, and yours
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Twelve production-grade features designed for Bharat&apos;s UPI
            ecosystem. No paywalls. No telemetry. No lock-in.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.05 }}
            >
              <Card className="group h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent} text-white shadow-md transition-transform group-hover:scale-110`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 text-sm font-bold">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
