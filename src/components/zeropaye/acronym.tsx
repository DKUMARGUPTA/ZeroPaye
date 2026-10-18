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
    color: "from-teal-500 to-cyan-500",
    accent: "text-teal-600 dark:text-teal-300",
    border: "hover:border-teal-500/50",
    title: "Zero transaction fees. Zero middlemen. Zero holdbacks.",
    body:
      " naam hi vada hai. Har transaction par 0% fee — forever. Paisa seedhe customer se aapke bank account mein (P2P UPI). Koi aggregator beech mein nahi, koi 'T+2 settlement' ka wait nahi, koi fund custody nahi.",
    points: ["0% MDR forever — no transaction fee", "Direct P2P UPI to your bank", "No fund custody, no holdbacks"],
  },
  {
    letter: "E",
    word: "Empowering",
    hindi: "सशक्त",
    icon: EmpowerIcon,
    color: "from-cyan-500 to-emerald-500",
    accent: "text-cyan-600 dark:text-cyan-300",
    border: "hover:border-cyan-500/50",
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
    color: "from-emerald-500 to-teal-500",
    accent: "text-emerald-600 dark:text-emerald-300",
    border: "hover:border-emerald-500/50",
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
    color: "from-teal-500 to-emerald-500",
    accent: "text-teal-600 dark:text-teal-300",
    border: "hover:border-teal-500/50",
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
    color: "from-cyan-500 to-teal-500",
    accent: "text-cyan-600 dark:text-cyan-300",
    border: "hover:border-cyan-500/50",
    title: "100% Bharatiya UPI ecosystem ke liye bana.",
    body:
      " (French mein 'payé' = paid). GPay, PhonePe, Paytm, BHIM, Amazon Pay, CRED — sabhi UPI apps support. ISO/IEC 18004 pure vector QR, UPI deep-link intents, aur tri-channel banking observation mesh se har payment verify.",
    points: ["All UPI apps supported", "Pure vector SVG QR (no Google Charts)", "Bank SMS + Gmail + Android observers"],
  },
];

export function Acronym() {
  return (
    <section id="mission" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
            The ZeroPaye Mission
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            ZeroPaye sirf ek naam nahi — yeh hamare mission ka{" "}
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              acronym
            </span>{" "}
            hai
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Har letter ek promise hai. Har promise ek design principle hai.
            Har principle code mein dikhta hai.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {PILLARS.map((p, i) => (
            <motion.div
              key={`${p.letter}-${p.word}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card
                className={`group relative h-full overflow-hidden border-border/60 p-6 transition-all duration-300 hover:shadow-xl ${p.border} sm:p-8`}
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${p.color} text-white shadow-lg`}
                  >
                    <p.icon className="h-8 w-8" />
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background text-sm font-bold shadow-md ring-1 ring-border">
                      {p.letter}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className={`text-2xl font-bold ${p.accent}`}>{p.word}</h3>
                      <span className="text-sm font-medium text-muted-foreground">— {p.hindi}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">{p.title}</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                <ul className="mt-5 space-y-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-sm">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r ${p.color}`} />
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
