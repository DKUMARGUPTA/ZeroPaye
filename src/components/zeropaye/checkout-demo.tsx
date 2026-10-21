"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, CheckCircle2, Clock, Loader2, Lock, Smartphone,
  QrCode as QrIcon, XCircle, ShieldCheck, Sparkles, Phone, RefreshCw, Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UPI_APPS } from "@/lib/zeropaye/upi";

type Step = "cart" | "phone" | "otp" | "queued" | "active" | "processing" | "success" | "expired" | "failed";

interface SessionInfo {
  id: string;
  orderId: string;
  amountPaise: number;
  amountRupees: string;
  description: string | null;
  status: string;
  expiresAt: string | null;
  processingAt: string | null;
  settledAt: string | null;
  utr?: string | null;
  verificationTier?: number;
}

export function CheckoutDemo() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("cart");
  const [amount, setAmount] = useState("299");
  const [description, setDescription] = useState("ZeroPaye Pro — 1 month top-up");
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [queuePos, setQueuePos] = useState(1);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [payRemaining, setPayRemaining] = useState(300); // 5 min
  const [verifyRemaining, setVerifyRemaining] = useState(30); // 30 s
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    pollRef.current = null;
    tickRef.current = null;
    setStep("cart");
    setSession(null);
    setMobile("");
    setOtp("");
    setDemoOtp(null);
    setPayRemaining(300);
    setVerifyRemaining(30);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); if (tickRef.current) clearInterval(tickRef.current); }, []);

  // ----- Step 1: create session -----
  const createSession = async () => {
    setLoading(true);
    try {
      const amt = parseFloat(amount);
      if (!amt || amt < 1) { toast({ title: "Invalid amount", variant: "destructive" }); setLoading(false); return; }
      const orderId = `ZP-${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch("/api/zeropaye/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, amount: amt, currency: "INR", description, customerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSession(data.session);
      setStep("phone");
      toast({ title: "Checkout session created", description: `Order ${orderId}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ----- Step 2: send OTP -----
  const sendOtp = async () => {
    setLoading(true);
    try {
      if (mobile.length !== 10) { toast({ title: "Enter a valid 10-digit mobile", variant: "destructive" }); setLoading(false); return; }
      const res = await fetch("/api/zeropaye/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, sessionId: session?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setDemoOtp(data.demoOtp ?? null);
      setStep("otp");
      toast({
        title: "OTP sent via WhatsApp",
        description: data.demoOtp ? `Demo OTP: ${data.demoOtp} (shown because no SMS gateway in demo)` : "Check your WhatsApp",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ----- Step 3: verify OTP & activate -----
  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zeropaye/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, otp, sessionId: session?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setSession((s) => s ? { ...s, status: data.session.status, expiresAt: data.session.expiresAt, ...data.session } : s);
      if (data.session.status === "ACTIVE") {
        setStep("active");
        startTimers();
      } else if (data.session.status === "QUEUED") {
        setStep("queued");
        setQueuePos(data.session.queuePosition ?? 1);
        toast({ title: "You're in the queue", description: `Position #${data.session.queuePosition} — waiting for the VPA slot to free up` });
      }
    } catch (e: any) {
      toast({ title: "OTP verification failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setPayRemaining((r) => {
        if (r <= 1) {
          setStep("expired");
          if (tickRef.current) clearInterval(tickRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, []);

  // Poll for promotion from QUEUED -> ACTIVE
  useEffect(() => {
    if (step !== "queued") return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/zeropaye/status/${session?.id}`);
        const data = await res.json();
        if (data?.session?.status === "ACTIVE") {
          setSession((s) => ({ ...(s as SessionInfo), ...data.session }));
          setStep("active");
          startTimers();
        }
      } catch { /* ignore */ }
    }, 1500);
    return () => clearInterval(t);
  }, [step, session?.id, startTimers]);

  // ----- Step 4: customer clicks "I've Paid" -> PROCESSING -----
  const markPaid = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zeropaye/confirm-paid", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStep("processing");
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        setVerifyRemaining((r) => {
          if (r <= 1) {
            setStep("failed");
            if (tickRef.current) clearInterval(tickRef.current);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ----- Step 5: simulate bank credit (observer confirms) -----
  const simulatePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zeropaye/simulate-payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");
      setSession((s) => s ? { ...s, status: "SUCCESS", utr: data.utr, settledAt: data.settledAt, verificationTier: data.verificationTier } : s);
      setStep("success");
      if (tickRef.current) clearInterval(tickRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      toast({ title: "Payment confirmed!", description: `UTR: ${data.utr}` });
    } catch (e: any) {
      toast({ title: "Simulation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Auto-poll status while active/processing (server-authoritative fallback)
  useEffect(() => {
    if (step !== "active" && step !== "processing") return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/zeropaye/status/${session?.id}`);
        const data = await res.json();
        if (data?.session?.status === "SUCCESS") {
          setSession((s) => ({ ...(s as SessionInfo), ...data.session }));
          setStep("success");
          if (pollRef.current) clearInterval(pollRef.current);
          if (tickRef.current) clearInterval(tickRef.current);
        } else if (data?.session?.status === "EXPIRED") {
          setStep("expired");
          if (pollRef.current) clearInterval(pollRef.current);
          if (tickRef.current) clearInterval(tickRef.current);
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, session?.id]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <section id="demo" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
            Live Interactive Demo
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Experience the full ZeroPaye checkout flow
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            No signup, no sandbox keys — just click through. OTP is shown in the
            toast (demo has no real SMS gateway). The "Simulate bank credit"
            button mimics what an Android SMS observer would do in production.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* Left: phone mockup */}
          <div className="mx-auto w-full max-w-sm">
            <PhoneMockup step={step}>
              <AnimatePresence mode="wait">
                {step === "cart" && (
                  <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <CartView
                      amount={amount} setAmount={setAmount}
                      description={description} setDescription={setDescription}
                      customerName={customerName} setCustomerName={setCustomerName}
                      onSubmit={createSession} loading={loading}
                    />
                  </motion.div>
                )}
                {step === "phone" && (
                  <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <PhoneView mobile={mobile} setMobile={setMobile} onSend={sendOtp} loading={loading} amount={session?.amountRupees || ""} />
                  </motion.div>
                )}
                {step === "otp" && (
                  <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <OtpView mobile={mobile} otp={otp} setOtp={setOtp} demoOtp={demoOtp} onVerify={verifyOtp} onResend={sendOtp} loading={loading} />
                  </motion.div>
                )}
                {step === "queued" && (
                  <motion.div key="queued" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <QueuedView position={queuePos} amount={session?.amountRupees || ""} />
                  </motion.div>
                )}
                {(step === "active" || step === "processing") && (
                  <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <QrView session={session} step={step} payRemaining={payRemaining} verifyRemaining={verifyRemaining} onMarkPaid={markPaid} onSimulate={simulatePayment} loading={loading} fmtTime={fmtTime} />
                  </motion.div>
                )}
                {step === "success" && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <SuccessView session={session} onReset={reset} />
                  </motion.div>
                )}
                {step === "expired" && (
                  <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <OutcomeView
                      variant="expired"
                      title="Session Expired"
                      message="The 5-minute payment window elapsed. Your slot was released for the next customer in queue. No money was deducted."
                      onReset={reset}
                    />
                  </motion.div>
                )}
                {step === "failed" && (
                  <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <OutcomeView
                      variant="failed"
                      title="Verification Timed Out"
                      message="The 30-second verification window elapsed with no bank credit detected. Please try again — no money was deducted."
                      onReset={reset}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </PhoneMockup>
          </div>

          {/* Right: state machine explanation */}
          <div className="space-y-4">
            <StateMachineCard step={step} />
            <SecurityInDemoCard />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Phone mockup shell
// ---------------------------------------------------------------------------
function PhoneMockup({ step, children }: { step: Step; children: React.ReactNode }) {
  const stepLabel: Record<Step, string> = {
    cart: "1 · Cart", phone: "2 · Mobile", otp: "3 · Verify OTP", queued: "3.5 · Queue",
    active: "4 · Pay", processing: "5 · Verifying", success: "6 · Done",
    expired: "— Expired", failed: "— Failed",
  };
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="relative rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-2xl dark:border-slate-800">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-slate-900 dark:bg-slate-800" />
        <div className="relative h-[600px] overflow-hidden rounded-[2rem] bg-gradient-to-b from-background to-muted/30">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-5 pt-8 pb-2 text-[10px] font-medium text-muted-foreground">
              <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-teal-600" /> ZeroPaye</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
              <span className="text-xs font-bold">ZeroPaye Checkout</span>
              <Badge variant="outline" className="text-[9px] font-semibold">{stepLabel[step]}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cart view
// ---------------------------------------------------------------------------
function CartView({ amount, setAmount, description, setDescription, customerName, setCustomerName, onSubmit, loading }: any) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/50 bg-card p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Your order
        </div>
        <p className="mt-1.5 text-sm font-medium leading-tight">{description || "ZeroPaye Pro — 1 month top-up"}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amt" className="text-xs">Amount (₹)</Label>
        <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc" className="text-xs">Description</Label>
        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs">Your name (optional)</Label>
        <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Arjun Sharma" className="h-9 text-sm" />
      </div>
      <Button onClick={onSubmit} disabled={loading} className="mt-2 w-full rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs">
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Lock className="mr-1.5 h-3.5 w-3.5" />}
        Pay Securely <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Button>
      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-2.5 w-2.5" /> 256-bit TLS · WhatsApp OTP verified
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phone view
// ---------------------------------------------------------------------------
function PhoneView({ mobile, setMobile, onSend, loading, amount }: any) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-4 text-center">
        <div className="text-[10px] font-medium text-muted-foreground">Amount to pay</div>
        <div className="text-2xl font-bold">₹{amount}</div>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Confirm your mobile number to receive a WhatsApp OTP. ZeroPaye never shares this with the merchant.
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile" className="text-xs">10-digit mobile</Label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-2 text-xs font-medium text-muted-foreground">+91</span>
          <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} inputMode="numeric" placeholder="9876543210" className="h-9 rounded-l-none text-sm" />
        </div>
      </div>
      <Button onClick={onSend} disabled={loading || mobile.length !== 10} className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs">
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Smartphone className="mr-1.5 h-3.5 w-3.5" />}
        Send WhatsApp OTP
      </Button>
      <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
        <Lock className="h-2.5 w-2.5" /> OTP is gateway-owned (Invariant 6)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OTP view
// ---------------------------------------------------------------------------
function OtpView({ mobile, otp, setOtp, demoOtp, onVerify, onResend, loading }: any) {
  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
          <Smartphone className="h-6 w-6 text-teal-600" />
        </div>
        <p className="mt-2 text-sm font-medium">Enter the 6-digit OTP</p>
        <p className="text-[10px] text-muted-foreground">Sent to +91 {mobile} via WhatsApp</p>
      </div>
      {demoOtp && (
        <div className="rounded-lg border border-teal-500/40 bg-teal-500/10 p-2 text-center">
          <p className="text-[10px] font-medium text-teal-700 dark:text-teal-300">Demo OTP (no SMS gateway configured)</p>
          <p className="font-mono text-lg font-bold tracking-[0.3em] text-teal-700 dark:text-teal-300">{demoOtp}</p>
        </div>
      )}
      <Input
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        inputMode="numeric"
        placeholder="••••••"
        className="text-center font-mono text-lg tracking-[0.4em]"
      />
      <Button onClick={onVerify} disabled={loading || otp.length !== 6} className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs">
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}
        Verify & Continue
      </Button>
      <button onClick={onResend} className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground">
        Resend OTP
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Queued view (FIFO queue waiting for the VPA slot)
// ---------------------------------------------------------------------------
function QueuedView({ position, amount }: { position: number; amount: string }) {
  return (
    <div className="space-y-3 text-center">
      <div className="rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-3">
        <div className="text-[10px] font-medium text-muted-foreground">Amount to pay</div>
        <div className="text-xl font-bold">₹{amount}</div>
      </div>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-600" />
      </div>
      <div>
        <p className="text-sm font-bold">You&apos;re in the queue</p>
        <p className="text-[10px] text-muted-foreground">Position #{position} — waiting for the VPA slot to free up</p>
      </div>
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-2.5 text-left">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Single-slot FIFO queue.</span> P2P UPI alerts
          don&apos;t carry an order-id, so ZeroPaye serializes payments to guarantee exact amount matching.
          You&apos;ll be promoted automatically — no action needed.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QR view (ACTIVE / PROCESSING)
// ---------------------------------------------------------------------------
function QrView({ session, step, payRemaining, verifyRemaining, onMarkPaid, onSimulate, loading, fmtTime }: any) {
  const payPct = (payRemaining / 300) * 100;
  const verifyPct = (verifyRemaining / 30) * 100;
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-3 text-center">
        <div className="text-[10px] font-medium text-muted-foreground">Amount</div>
        <div className="text-xl font-bold">₹{session?.amountRupees}</div>
      </div>

      {step === "active" && (
        <>
          <div className="rounded-xl border border-border/50 bg-white p-3 text-center">
            <img src={`/api/zeropaye/qr/${session?.id}`} alt="UPI QR" className="mx-auto h-36 w-36" />
            <p className="mt-1.5 text-[10px] text-muted-foreground">Scan with any UPI app</p>
          </div>
          {/* UPI App Intent Buttons — mobile pe direct app open karein */}
          <div>
            <p className="mb-1.5 text-center text-[9px] font-medium text-muted-foreground">
              Ya pay directly:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {UPI_APPS.slice(0, 6).map((app) => (
                <a
                  key={app.id}
                  href={`${app.scheme}?pa=zeropaye.demo@upi&pn=ZeroPaye%20Demo&am=${session?.amountRupees}&cu=INR&tn=ZeroPaye%20${session?.orderId}`}
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border/50 bg-card px-1 py-2 transition-all hover:border-teal-500/40 hover:shadow-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-[10px] font-semibold">{app.name}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-teal-600" /> Pay window</span>
              <span className="font-mono">{fmtTime(payRemaining)}</span>
            </div>
            <Progress value={payPct} className="mt-1 h-1.5" />
          </div>
          <Button onClick={onMarkPaid} className="w-full rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> I&apos;ve Paid — Verify Now
          </Button>
        </>
      )}

      {step === "processing" && (
        <>
          <div className="rounded-xl border border-teal-500/40 bg-teal-500/5 p-4 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" />
            <p className="mt-2 text-sm font-semibold">Verifying your payment…</p>
            <p className="text-[10px] text-muted-foreground">Bank SMS observer is scanning for the credit</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-teal-600" /> Verify window</span>
              <span className="font-mono">{fmtTime(verifyRemaining)}</span>
            </div>
            <Progress value={verifyPct} className="mt-1 h-1.5" />
          </div>
          <Button onClick={onSimulate} disabled={loading} className="w-full rounded-lg border border-dashed border-teal-500/50 bg-teal-500/5 text-xs text-teal-700 hover:bg-teal-500/10 dark:text-teal-300">
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
            Simulate bank credit (observer)
          </Button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success view
// ---------------------------------------------------------------------------
function SuccessView({ session, onReset }: any) {
  return (
    <div className="space-y-3 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
        <CheckCircle2 className="h-9 w-9 text-emerald-600" />
      </motion.div>
      <div>
        <p className="text-base font-bold">Payment Successful</p>
        <p className="text-[10px] text-muted-foreground">Your order has been confirmed</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-3 text-left text-xs">
        <Row label="Order ID" value={session?.orderId} />
        <Row label="Amount" value={`₹${session?.amountRupees}`} />
        <Row label="UTR" value={session?.utr || "—"} mono />
        <Row label="Verified by" value="L1 · Android SMS observer" />
        <Row label="Settled" value="Direct to merchant bank (P2P)" />
      </div>
      <Button onClick={onReset} variant="outline" size="sm" className="w-full rounded-lg text-xs">
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Run another demo
      </Button>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? "font-mono text-[10px]" : ""}`}>{value || "—"}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Outcome (expired / failed)
// ---------------------------------------------------------------------------
function OutcomeView({ variant, title, message, onReset }: any) {
  return (
    <div className="space-y-3 text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${variant === "expired" ? "bg-amber-500/15" : "bg-rose-500/15"}`}>
        {variant === "expired" ? <Clock className="h-9 w-9 text-amber-600" /> : <XCircle className="h-9 w-9 text-rose-600" />}
      </div>
      <div>
        <p className="text-base font-bold">{title}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{message}</p>
      </div>
      <Button onClick={onReset} variant="outline" size="sm" className="w-full rounded-lg text-xs">
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right-side: state machine explainer
// ---------------------------------------------------------------------------
function StateMachineCard({ step }: { step: Step }) {
  const states = [
    { id: "INITIATED", label: "Session Created" },
    { id: "AUTH_PENDING", label: "WhatsApp OTP" },
    { id: "ACTIVE", label: "QR + 5-min pay window" },
    { id: "PROCESSING", label: "30-sec verify window" },
    { id: "SUCCESS", label: "Confirmed" },
  ];
  const activeIdx = step === "cart" ? -1 : step === "phone" ? 0 : step === "otp" ? 1 : step === "active" ? 2 : step === "processing" ? 3 : step === "success" ? 4 : 4;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <QrIcon className="h-4 w-4 text-teal-600" />
          Server-Authoritative State Machine
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ol className="space-y-2">
          {states.map((s, i) => {
            const done = activeIdx > i;
            const active = activeIdx === i;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? "bg-emerald-500 text-white" : active ? "bg-teal-600 text-white ring-4 ring-teal-500/20" : "bg-muted text-muted-foreground"
                }`}>
                  {done ? "✓" : i + 1}
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{s.id}</div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 rounded-lg bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mr-1 inline h-3 w-3 text-teal-600" />
          Every transition is a server-side DB transaction. Client timers are display-only — refresh-proof & reboot-proof (Invariant 3).
        </p>
      </CardContent>
    </Card>
  );
}

function SecurityInDemoCard() {
  const items = [
    { icon: Lock, t: "OTP via crypto.randomInt", d: "Not Math.random. Constant-time compare. 15-min lockout after 5 tries." },
    { icon: QrIcon, t: "Pure vector SVG QR", d: "ISO/IEC 18004. No Google Charts API. Sub-second generation." },
    { icon: ShieldCheck, t: "Single-slot FIFO queue", d: "Only one ACTIVE session per VPA. Eliminates amount-collision attribution." },
    { icon: Zap, t: "Integer paise arithmetic", d: "₹499.00 = 49900 paise (Int). Floating-point drift is impossible." },
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Security baked into this demo</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 pt-0 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.t} className="flex gap-2.5">
            <i.icon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <div>
              <div className="text-xs font-semibold">{i.t}</div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">{i.d}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
