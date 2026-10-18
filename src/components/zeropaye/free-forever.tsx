"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Github, Heart, Scale, Users, Server, Code2 } from "lucide-react";

const PROMISES = [
  { icon: Scale, title: "AGPL-3.0 License", body: "Free software, forever. Fork it, audit it, self-host it. The only obligation is to share improvements back — that's what keeps it free." },
  { icon: Users, title: "No per-seat pricing", body: "Unlimited merchants, unlimited transactions, unlimited customers. Whether you do 10 payments or 10 lakh, the bill is the same: ₹0." },
  { icon: Server, title: "No proprietary SaaS lock-in", body: "Runs on any Node 20+ host. SQLite WAL by default. Optional Postgres in prod. No Docker required, no Cloudflare mandatory." },
  { icon: Code2, title: "No telemetry, no analytics", body: "Zero outbound calls to our servers. No tracking pixels. Your customers' data stays on your infrastructure, period." },
  { icon: Heart, title: "Community-supported", body: "Issues, PRs, and docs maintained by the community of merchants who depend on it. Backed by contributors, not VCs." },
  { icon: Github, title: "Auditable source", body: "Every line is public. Every commit is signed. Every release has an SBOM. No binary blobs in the repo. No backdoors." },
];

export function FreeForever() {
  return (
    <section id="free" className="scroll-mt-20 relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-teal-500/15 via-cyan-500/10 to-transparent blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="border-teal-500/40 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
            Free for everyone, forever
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            No fee. No catch. No kidding.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            ZeroPaye is not &ldquo;free for now, paid later.&rdquo; It is not
            &ldquo;free up to X transactions.&rdquo; It is free, full stop —
            the way open-source software is meant to be.
          </p>
        </div>

        {/* The ₹0 card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto mt-12 max-w-md"
        >
          <Card className="relative overflow-hidden border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/[0.04] to-cyan-500/[0.04] p-8 text-center">
            <div className="absolute right-4 top-4">
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">FOREVER</Badge>
            </div>
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-6xl font-bold text-transparent">
              ₹0
            </div>
            <div className="mt-1 text-sm font-semibold text-muted-foreground">per month, per merchant</div>
            <div className="mt-6 space-y-2 text-left">
              {[
                "Unlimited transactions, any volume",
                "Unlimited customers, any country (UPI)",
                "Self-host on any VPS",
                "All features unlocked (no 'Pro' tier)",
                "Community support + commercial optional",
              ].map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="mt-6 block">
              <Button className="w-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                <Github className="mr-2 h-4 w-4" /> Self-host ZeroPaye — it's free
              </Button>
            </a>
          </Card>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: (i % 3) * 0.05 }}
            >
              <Card className="h-full p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                  <p.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3 text-sm font-bold">{p.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
