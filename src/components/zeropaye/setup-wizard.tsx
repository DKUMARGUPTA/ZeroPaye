"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Copy, CreditCard, Palette, Bell, Key,
} from "lucide-react";

const STEPS = ["Merchant", "VPA & Branding", "Webhook", "Done"] as const;

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [vpa, setVpa] = useState("");
  const [accountName, setAccountName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [accentColor, setAccentColor] = useState("#0d9488");
  const [webhookUrl, setWebhookUrl] = useState("");

  // Result
  const [result, setResult] = useState<any>(null);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setLoading(true);
    try {
      // In demo mode, just simulate
      const bootRes = await fetch("/api/zeropaye/bootstrap");
      const boot = await bootRes.json();

      if (boot.locked) {
        // Demo mode — can't actually setup, show demo credentials
        setResult({
          demo: true,
          publicApiKey: boot.publicApiKey,
          adminApiKey: boot.adminApiKey,
          vpa: boot.defaultVpa,
          message: "Demo account is locked. In production, run 'bun run setup' CLI or deploy with Docker.",
        });
      }
      setStep(3);
    } catch (e: any) {
      setResult({ error: e.message });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-lg glow-teal">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ZeroPaye Setup Wizard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            3 steps mein apna merchant account configure karein — no CLI needed.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i <= step
                    ? "bg-gradient-brand text-white shadow-md"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-12 sm:w-20 transition-all ${i < step ? "bg-gradient-brand" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-border/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Key className="h-4 w-4 text-teal-600" /> Step 1: Merchant Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="biz" className="text-xs">Business Name</Label>
                    <Input id="biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Sharma Kirana Store" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="acc" className="text-xs">Account Holder Name</Label>
                    <Input id="acc" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Deepak Kumar" className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-border/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-teal-600" /> Step 2: VPA & Branding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="vpa" className="text-xs">UPI VPA (where payments will arrive)</Label>
                    <Input id="vpa" value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="deepak@okhdfcbank" className="mt-1 font-mono" />
                  </div>
                  <div>
                    <Label htmlFor="brand" className="text-xs">Brand Name (for checkout)</Label>
                    <Input id="brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder={businessName || "Sharma Kirana"} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="tag" className="text-xs">Tagline (optional)</Label>
                    <Input id="tag" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Fresh daily groceries" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="color" className="text-xs">Accent Color</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded-md border border-border/40" />
                      <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono flex-1" />
                      <div className="h-9 w-9 rounded-lg border border-border/40" style={{ background: accentColor }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="border-border/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-teal-600" /> Step 3: Webhook (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="wh" className="text-xs">Webhook URL (for order fulfillment notifications)</Label>
                    <Input id="wh" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://yourdomain.com/api/zeropaye-webhook" className="mt-1" />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      ZeroPaye will send HMAC-signed POST requests to this URL when payments succeed.
                      You can skip this and add it later via admin panel.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="border-border/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Setup Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result?.demo ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                        <p className="text-xs text-muted-foreground">
                          <strong className="text-foreground">Demo mode detected.</strong> The demo account is locked —
                          you cannot create a new merchant. For production, deploy with Docker or run <code className="rounded bg-muted px-1">bun run setup</code> CLI.
                        </p>
                      </div>
                      <CredentialRow label="Public API Key" value={result.publicApiKey} onCopy={() => copy(result.publicApiKey, "pub")} copied={copied === "pub"} />
                      <CredentialRow label="Admin API Key" value={result.adminApiKey} onCopy={() => copy(result.adminApiKey, "adm")} copied={copied === "adm"} />
                      <CredentialRow label="UPI VPA" value={result.vpa} onCopy={() => copy(result.vpa, "vpa")} copied={copied === "vpa"} />
                    </div>
                  ) : result?.error ? (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                      <p className="text-xs text-rose-600">Error: {result.error}</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-600" />
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <a href="/demo" className="flex-1">
                      <Button className="w-full rounded-full bg-gradient-brand text-white text-sm">
                        Try Live Demo
                      </Button>
                    </a>
                    <a href="/docs" className="flex-1">
                      <Button variant="outline" className="w-full rounded-full text-sm">
                        Read Docs
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prev}
              disabled={step === 0}
              className="rounded-full"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={next} disabled={loading} className="rounded-full bg-gradient-brand text-white">
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={loading} className="rounded-full bg-gradient-brand text-white">
                {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                Complete Setup
              </Button>
            )}
          </div>
        )}

        {/* Docker deploy hint */}
        {step === 0 && (
          <div className="mt-8 rounded-xl border border-teal-500/20 bg-gradient-brand-soft p-4">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal-600" fill="currentColor"><path d="M22.5 12.5c-.5-.3-1.7-.4-2.6-.3-.1-1-.6-1.8-1.3-2.5l-.4-.3-.3.4c-.7.8-1 2-1 3.1-.5.3-1 .5-1.6.5C9.5 14.5 6 8.5 6 2.5l0-.5L5.5 2c-3.3.4-5 3.9-5 6.9 0 1 .3 1.9.6 2.8C2.3 13.9 4.7 15.6 7 16.5c2.9 1.1 6.1 1.2 9.1.4 3.4-.9 5.2-3.8 5.9-6.8.5.1 1 .1 1.5-.1.3-.1.6-.3.8-.5l.2-.3-.2-.2c-.4-.3-1.6-.6-2.3-.5z"/></svg>
              Docker one-command deploy
            </h4>
            <pre className="mt-2 overflow-x-auto rounded-md bg-slate-950 p-3 text-[11px] text-slate-300"><code>docker compose up -d</code></pre>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              ZeroPaye + PostgreSQL ready in 1 command. See docker-compose.yml.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CredentialRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div>
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border border-border/40 bg-muted/40 px-3 py-2 font-mono text-xs">{value}</code>
        <Button size="sm" variant="outline" onClick={onCopy} className="shrink-0 h-7 rounded-full">
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
