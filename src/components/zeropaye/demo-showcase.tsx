"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck, Zap, Lock, Smartphone, QrCode, Activity, Banknote,
  CheckCircle2, Loader2, Key, Eye, EyeOff, Copy, AlertCircle, ArrowRight,
} from "lucide-react";
import { CheckoutDemo } from "./checkout-demo";
import { Dashboard } from "./dashboard";

export function DemoShowcase() {
  const [demoKey, setDemoKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keyLocked, setKeyLocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/zeropaye/bootstrap");
        if (res.ok) {
          const data = await res.json();
          setDemoKey(data.adminApiKey);
          setKeyLocked(data.locked || false);
        }
      } catch {}
    })();
  }, []);

  const copyKey = () => {
    if (!demoKey) return;
    navigator.clipboard.writeText(demoKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-md glow-teal">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="text-lg font-bold">ZeroPaye</span>
              <span className="ml-2 text-[10px] text-muted-foreground">Live Demo</span>
            </div>
          </a>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300">
              <Lock className="h-3 w-3" />
              {keyLocked ? "LOCKED" : "DEMO"}
            </Badge>
            <a href="https://github.com/DKUMARGUPTA/ZeroPaye" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="rounded-full text-xs">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.7 1 .7 2v3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
                GitHub
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              <span className="text-gradient">ZeroPaye</span> Live Demo
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Saare features live try karein. Demo account{" "}
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300">
                <Lock className="h-3 w-3 mr-1" /> LOCKED
              </Badge>{" "}
              — koi bhi password change nahi kar sakta.
            </p>
          </motion.div>
        </div>

        {/* Demo Account Card */}
        <Card className="mb-10 border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4 text-teal-600" />
              Demo Account Credentials
              {keyLocked && (
                <Badge variant="outline" className="ml-2 gap-1 text-xs border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300">
                  <Lock className="h-3 w-3" /> Locked — Cannot Change
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Admin API Key {keyLocked && <span className="text-amber-600">(LOCKED — read-only)</span>}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-border/40 bg-muted/40 px-3 py-2.5 font-mono text-xs">
                  {demoKey ? (showKey ? demoKey : "•••••••••••••••••••••••••••••••••••") : "Loading..."}
                </code>
                <Button size="sm" variant="outline" onClick={() => setShowKey(!showKey)} className="shrink-0">
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={copyKey} className="shrink-0">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Yeh demo account locked hai.</strong> Admin key
                  environment variable se set hota hai aur API se change nahi hota. VPA, branding,
                  aur webhook URL — kuch bhi change nahi kar sakte. Sirf view kar sakte ho.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Tabs */}
        <Tabs defaultValue="checkout" className="w-full">
          <TabsList className="h-10 bg-muted/40 w-full justify-start overflow-x-auto">
            <TabsTrigger value="checkout" className="text-xs gap-1.5">
              <QrCode className="h-3.5 w-3.5" /> Checkout Flow
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Security
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1.5">
              <Zap className="h-3.5 w-3.5" /> API Test
            </TabsTrigger>
          </TabsList>

          {/* Checkout Demo */}
          <TabsContent value="checkout" className="mt-6">
            <div className="rounded-2xl border border-border/40 bg-card p-6">
              <h3 className="mb-2 text-lg font-bold">🔄 Interactive Checkout Flow</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Cart → Mobile → WhatsApp OTP → QR → Pay → Verify → Success. Poora flow live try karein.
              </p>
              <CheckoutDemo />
            </div>
          </TabsContent>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="rounded-2xl border border-border/40 bg-card p-6">
              <h3 className="mb-2 text-lg font-bold">📊 Merchant Dashboard</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Live transactions, VPA slot status, observer health, white-label branding.
              </p>
              <Dashboard />
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-6">
            <div className="rounded-2xl border border-border/40 bg-card p-6">
              <h3 className="mb-4 text-lg font-bold">🔒 Security Features (Live Test)</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <SecurityTestCard
                  icon={Key}
                  title="Admin Auth Required"
                  test="GET /api/zeropaye/session without key"
                  expected="401"
                />
                <SecurityTestCard
                  icon={ShieldCheck}
                  title="HMAC Observer Verification"
                  test="POST /api/zeropaye/observer without HMAC"
                  expected="401"
                />
                <SecurityTestCard
                  icon={Smartphone}
                  title="OTP Rate Limiting"
                  test="Two OTP requests in 30s"
                  expected="429"
                />
                <SecurityTestCard
                  icon={Lock}
                  title="Demo Account Locked"
                  test="PATCH /admin/merchant with demo key"
                  expected="403"
                />
              </div>
            </div>
          </TabsContent>

          {/* API Test */}
          <TabsContent value="api" className="mt-6">
            <div className="rounded-2xl border border-border/40 bg-card p-6">
              <h3 className="mb-4 text-lg font-bold">⚡ API Endpoints (Live Test)</h3>
              <ApiTestTable demoKey={demoKey} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 rounded-2xl border border-teal-500/20 bg-gradient-brand-soft p-6 text-center">
          <h3 className="text-lg font-bold">ZeroPaye ko apne server pe deploy karein</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Yeh sirf demo hai. Asli payments ke liye self-host karein — 100% free, AGPL-3.0.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <a href="https://github.com/DKUMARGUPTA/ZeroPaye" target="_blank" rel="noopener noreferrer">
              <Button className="rounded-full bg-gradient-brand text-white">
                <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.7 1 .7 2v3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
                View on GitHub
              </Button>
            </a>
            <a href="/docs">
              <Button variant="outline" className="rounded-full">
                Read Docs <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function SecurityTestCard({ icon: Icon, title, test, expected }: any) {
  const [status, setStatus] = useState<string>("idle");
  const [result, setResult] = useState<string | null>(null);

  const runTest = async () => {
    setStatus("loading");
    try {
      let res: Response;
      if (title.includes("Admin Auth")) {
        res = await fetch("/api/zeropaye/session");
      } else if (title.includes("HMAC")) {
        res = await fetch("/api/zeropaye/observer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source: "MANUAL", amountPaise: 100, utr: "123456789012" }),
        });
      } else if (title.includes("Rate Limit")) {
        await fetch("/api/zeropaye/send-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mobile: "9123456789" }),
        });
        res = await fetch("/api/zeropaye/send-otp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mobile: "9123456789" }),
        });
      } else if (title.includes("Locked")) {
        const boot = await fetch("/api/zeropaye/bootstrap");
        const bootData = await boot.json();
        res = await fetch("/api/zeropaye/admin/merchant", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-zeropaye-admin-key": bootData.adminApiKey || "test",
          },
          body: JSON.stringify({ defaultVpa: "hacked@upi" }),
        });
      } else {
        res = new Response();
      }
      setResult(`HTTP ${res.status}`);
      setStatus(res.status.toString() === expected ? "pass" : "fail");
    } catch (e: any) {
      setResult(e.message);
      setStatus("fail");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
          <Icon className="h-4 w-4 text-teal-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold">{title}</h4>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{test}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={runTest} disabled={status === "loading"} className="h-7 text-xs rounded-full">
              {status === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Test"}
            </Button>
            {result && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  status === "pass"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                }`}
              >
                {status === "pass" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {result} (expected {expected})
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ApiTestTable({ demoKey }: { demoKey: string | null }) {
  const [tests, setTests] = useState<Record<string, { status: number; ok: boolean } | null>>({});

  const endpoints = [
    { name: "GET /api/zeropaye/health", url: "/api/zeropaye/health", method: "GET", auth: false },
    { name: "GET /api/zeropaye/metrics", url: "/api/zeropaye/metrics", method: "GET", auth: false },
    { name: "POST /api/zeropaye/session", url: "/api/zeropaye/session", method: "POST", auth: false, body: { orderId: `DEMO-${Date.now()}`, amount: 100, publicApiKey: "zp_demo_public_key_locked_001" } },
    { name: "GET /api/zeropaye/session (admin)", url: "/api/zeropaye/session", method: "GET", auth: true },
    { name: "GET /api/zeropaye/merchant (admin)", url: "/api/zeropaye/merchant", method: "GET", auth: true },
    { name: "POST /api/zeropaye/send-otp", url: "/api/zeropaye/send-otp", method: "POST", auth: false, body: { mobile: "9876543210" } },
    { name: "POST /api/zeropaye/observer (no HMAC)", url: "/api/zeropaye/observer", method: "POST", auth: false, body: { source: "MANUAL", amountPaise: 100, utr: "123456789012" } },
  ];

  const runAll = async () => {
    const results: Record<string, { status: number; ok: boolean } | null> = {};
    for (const ep of endpoints) {
      try {
        const headers: Record<string, string> = { "content-type": "application/json" };
        if (ep.auth && demoKey) headers["x-zeropaye-admin-key"] = demoKey;
        const res = await fetch(ep.url, {
          method: ep.method,
          headers,
          body: ep.body ? JSON.stringify(ep.body) : undefined,
        });
        results[ep.name] = { status: res.status, ok: res.ok };
        setTests({ ...results });
      } catch (e: any) {
        results[ep.name] = { status: 0, ok: false };
        setTests({ ...results });
      }
    }
  };

  return (
    <div>
      <Button onClick={runAll} size="sm" className="mb-4 rounded-full bg-gradient-brand text-white">
        <Zap className="mr-2 h-3.5 w-3.5" /> Run All API Tests
      </Button>
      <div className="overflow-hidden rounded-xl border border-border/40">
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 border-b bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Endpoint</span><span>Method</span><span>Status</span>
        </div>
        {endpoints.map((ep) => {
          const result = tests[ep.name];
          return (
            <div key={ep.name} className="grid grid-cols-[2fr_1fr_1fr] gap-2 border-b border-border/20 px-3 py-2.5 text-xs last:border-0">
              <span className="font-mono text-[11px] truncate">{ep.name}</span>
              <span className="text-muted-foreground">{ep.method}</span>
              <span>
                {result ? (
                  <Badge variant="outline" className={`text-[10px] ${result.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
                    {result.status || "ERR"}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-[10px]">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
