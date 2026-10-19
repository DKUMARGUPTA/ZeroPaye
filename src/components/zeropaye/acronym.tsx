"use client";

import { motion } from "framer-motion";
import { ZeroIcon, EmpowerIcon, ShieldLockIcon, OpenIcon, PayIcon } from "./zeropaye-icons";
import { Card } from "@/components/ui/card";

const PILLARS = [
  {
    letter: "Z",
    word: "Zero",
    hindi: "शून्य",
    icon: ZeroIcon,
    gradient: "from-teal-500 to-cyan-500",
    glow: "group-hover:shadow-teal-500/20",
    title: "Zero transaction fees. Zero middlemen. Zero holdbacks.",
    body:
      "Naam hi vada hai. Har transaction par 0% fee — forever. Paisa seedhe customer se aapke bank account mein (P2P UPI). Koi aggregator beech mein nahi, koi 'T+2 settlement' ka wait nahi, koi fund custody nahi.",
    points: ["0% MDR forever — no transaction fee", "Direct P2P UPI to your bank", "No fund custody, no holdbacks"],
  },
  {
    letter: "E",
    word: "Empowering",
    hindi: "सशक्त",
    icon: EmpowerIcon,
    gradient: "from-cyan-500 to-emerald-500",
    glow: "group-hover:shadow-cyan-500/20",
    title: "Chhote dukaandaar ko enterprise-grade power.",
    body:
      "Hum woh kshamata dena chahte hain jo bade payment aggregators (Razorpay, Cashfree, PayU) mein hoti hai — lekin 100% open-source, self-hosted aur muft. Aapka data, aapka control, aapke niyam.",
    points: ["White-label branding built-in", "Multi-tenant capable", "Self-host on any VPS"],
  },
  {
    letter: "R",
    word: "Reliable",
    hindi: "विश्वसनीय",
    icon: ShieldLockIcon,
    gradient: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/20",
    title: "Server-authoritative. Atomic. Crash-proof.",
    body:
      "Har timer server-side DB se compute hota hai (refresh-proof, reboot-proof). Slot acquisition atomic transaction mein (race-proof). HMAC-SHA256 signed webhooks. Boot pe crash-recovery engine. Har payment deterministic.",
    points: ["Server-authoritative dual timers", "Atomic single-slot FIFO queue", "HMAC-signed webhooks + crash recovery"],
  },
  {
    letter: "O",
    word: "Open",
    hindi: "खुला",
    icon: OpenIcon,
    gradient: "from-teal-500 to-emerald-500",
    glow: "group-hover:shadow-teal-500/20",
    title: "AGPL-3.0. Auditable. Community-owned.",
    body:
      "Poora source code public. Har line auditable. Koi telemetry nahi, koi tracking pixel nahi, koi binary blob nahi. Aap fork karo, audit karo, self-host karo — aur improvements community ko wapas do.",
    points: ["AGPL-3.0 license (free forever)", "Zero telemetry, zero tracking", "Auditable source — no backdoors"],
  },
  {
    letter: "Payé",
    word: "Payé (Pay)",
    hindi: "भुगतान",
    icon: PayIcon,
    gradient: "from-cyan-500 to-teal-500",
    glow: "group-hover:shadow-cyan-500/20",
    title: "100% Bharatiya UPI ecosystem ke liye bana.",
    body:
      " (French mein 'payé' = paid). GPay, PhonePe, Paytm, BHIM, Amazon Pay, CRED — sabhi UPI apps support. ISO/IEC 18004 pure vector QR, UPI deep-link intents, aur tri-channel banking observation mesh se har payment verify.",
    points: ["All UPI apps supported", "Pure vector SVG QR (no Google Charts)", "Bank SMS + Gmail + Android observers"],
  },
];

export function Acronym() {
  return (
    <section id="mission" className="scroll-mt-20 relative py-20 sm:py-28">
      {/* Subtle background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[30rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-brand-soft blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">
            The ZeroPaye Mission
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Naam hi mission ka{" "}
            <span className="text-gradient">acronym</span>{" "}
            hai
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Har letter ek promise. Har promise ek design principle. Har principle code mein dikhta hai.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={`${p.letter}-${p.word}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={i === 4 ? "lg:col-span-3" : ""}
            >
              <Card
                className={`group relative h-full overflow-hidden border-border/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${p.glow} sm:p-7`}
              >
                {/* Decorative gradient blob */}
                <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${p.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`} />

                <div className="relative flex items-start gap-4">
                  <div
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                  >
                    <p.icon className="h-7 w-7" />
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold shadow-md ring-1 ring-border">
                      {p.letter}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-xl font-bold tracking-tight">{p.word}</h3>
                      <span className="text-sm font-medium text-muted-foreground">— {p.hindi}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-foreground/90">{p.title}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.body}</p>

                <ul className="mt-4 grid gap-1.5">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-xs">
                      <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${p.gradient} text-white text-[8px] font-bold`}>✓</span>
                      <span className="text-foreground/80">{pt}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
