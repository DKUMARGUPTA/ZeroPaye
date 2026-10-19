"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, CheckCircle2, Clock, Loader2, Lock, Smartphone,
  XCircle, ShieldCheck, Zap, RefreshCw, AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UPI_APPS } from "@/lib/zeropaye/upi";

type Step = "loading" | "not-found" | "initiated" | "phone" | "otp" | "queued" | "active" | "processing" | "success" | "expired" | "failed";

interface SessionInfo {
  id: string;
  orderId: string;
  amountPaise: number;
  amountRupees: string;
  description: string | null;
  customerName: string | null;
  status: string;
  queuePosition: number | null;
  utr: string | null;
  verificationTier: number | null;
  expiresAt: string | null;
  activatedAt: string | null;
  processingAt: string | null;
  settledAt: string | null;
  createdAt: string;
}

export function HostedCheckout({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("loading");
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [payRemaining, setPayRemaining] = useState(300);
  const [verifyRemaining, setVerifyRemaining] = useState(30);
  const [accountVpa, setAccountVpa] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- Load session on mount -----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/zeropaye/status/${sessionId}`);
        const data = await res.json();
        if (!res.ok || !data.session) {
          setStep("not-found");
          return;
        }
        setSession(data.session);
        setAccountVpa(data.account?.vpa ?? null);
        // Route to correct step based on current status
        const s = data.session.status;
        if (s === "INITIATED") setStep("phone");
        else if (s === "AUTH_PENDING") setStep("otp");
        else if (s === "QUEUED") setStep("queued");
        else if (s === "ACTIVE") { setStep("active"); startTimers(); }
        else if (s === "PROCESSING") { setStep("processing"); }
        else if (s === "SUCCESS") setStep("success");
        else if (s === "EXPIRED") setStep("expired");
        else if (s === "FAILED") setStep("failed");
        else setStep("phone");
      } catch {
        setStep("not-found");
      }
    })();
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId]);

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

  // ----- Send OTP -----
  const sendOtp = async () => {
    setLoading(true);
    try {
      if (mobile.length !== 10) {
        toast({ title: "Enter a valid 10-digit mobile", variant: "destructive" });
        setLoading(false);
        return;
      }
      const res = await fetch("/api/zeropaye/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setDemoOtp(data.demoOtp ?? null);
      setStep("otp");
      toast({
        title: "OTP sent via WhatsApp",
        description: data.demoOtp ? `Demo OTP: ${data.demoOtp}` : "Check your WhatsApp",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ----- Verify OTP -----
  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zeropaye/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mobile, otp, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setSession((s) => s ? { ...s, ...data.session } : s);
      if (data.session.status === "ACTIVE") {
        setStep("active");
        startTimers();
      } else if (data.session.status === "QUEUED") {
        setStep("queued");
      }
    } catch (e: any) {
      toast({ title: "OTP verification failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ----- Mark Paid (ACTIVE → PROCESSING) -----
  const markPaid = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zeropaye/confirm-paid", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId }),
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

  // ----- Poll for status updates while queued/active/processing -----
  useEffect(() => {
    if (step !== "queued" && step !== "active" && step !== "processing") return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/zeropaye/status/${sessionId}`);
        const data = await res.json();
        if (!data?.session) return;
        const s = data.session.status;
        if (s === "ACTIVE" && step === "queued") {
          setSession((prev) => ({ ...(prev as SessionInfo), ...data.session }));
          setStep("active");
          startTimers();
        } else if (s === "SUCCESS") {
          setSession((prev) => ({ ...(prev as SessionInfo), ...data.session }));
          setStep("success");
          if (tickRef.current) clearInterval(tickRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
          // PostMessage to parent (the SDK)
          window.parent?.postMessage({
            event: "zeropaye:payment:success",
            detail: {
              status: "SUCCESS",
              order_id: data.session.orderId,
              utr: data.session.utr,
              amount_received: data.session.amountRupees,
              verificationTier: data.session.verificationTier,
            },
          }, "*");
        } else if (s === "EXPIRED") {
          setStep("expired");
          if (tickRef.current) clearInterval(tickRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
          window.parent?.postMessage({ event: "zeropaye:payment:expired", detail: { order_id: data.session.orderId } }, "*");
        } else if (s === "FAILED") {
          setStep("failed");
          if (tickRef.current) clearInterval(tickRef.current);
          if (pollRef.current) clearInterval(pollRef.current);
          window.parent?.postMessage({ event: "zeropaye:payment:failed", detail: { order_id: data.session.orderId } }, "*");
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, sessionId, startTimers]);

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const closeModal = () => {
    window.parent?.postMessage({ event: "zeropaye:modal:close" }, "*");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">ZeroPaye Checkout</span>
          </div>
          <button
            onClick={closeModal}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close checkout"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
                <p className="mt-3 text-sm text-muted-foreground">Loading checkout…</p>
              </motion.div>
            )}

            {step === "not-found" && (
              <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
                <h2 className="mt-4 text-lg font-bold">Session not found</h2>
                <p className="mt-2 text-sm text-muted-foreground">This checkout link is invalid or has expired.</p>
              </motion.div>
            )}

            {step === "phone" && session && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CheckoutCard session={session}>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10">
                        <Smartphone className="h-7 w-7 text-teal-600" />
                      </div>
                      <h2 className="mt-3 text-lg font-bold">Confirm your mobile number</h2>
                      <p className="mt-1 text-xs text-muted-foreground">We'll send a WhatsApp OTP to verify it's you.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-xs">10-digit mobile number</Label>
                      <div className="flex">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground">+91</span>
                        <Input
                          id="mobile"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                          inputMode="numeric"
                          placeholder="9876543210"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                    <Button onClick={sendOtp} disabled={loading || mobile.length !== 10} className="w-full bg-gradient-brand text-white rounded-lg">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                      Send WhatsApp OTP
                    </Button>
                    <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" /> Your number stays with ZeroPaye, not the merchant.
                    </p>
                  </div>
                </CheckoutCard>
              </motion.div>
            )}

            {step === "otp" && session && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CheckoutCard session={session}>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10">
                        <Smartphone className="h-7 w-7 text-teal-600" />
                      </div>
                      <h2 className="mt-3 text-lg font-bold">Enter the 6-digit OTP</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Sent to +91 {mobile} via WhatsApp</p>
                    </div>
                    {demoOtp && (
                      <div className="rounded-lg border border-teal-500/40 bg-teal-500/10 p-3 text-center">
                        <p className="text-[10px] font-medium text-teal-700 dark:text-teal-300">Demo OTP (no SMS gateway configured)</p>
                        <p className="mt-1 font-mono text-xl font-bold tracking-[0.3em] text-teal-700 dark:text-teal-300">{demoOtp}</p>
                      </div>
                    )}
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                      inputMode="numeric"
                      placeholder="••••••"
                      className="text-center font-mono text-xl tracking-[0.4em] h-14"
                    />
                    <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full bg-gradient-brand text-white rounded-lg">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                      Verify & Continue
                    </Button>
                    <button onClick={sendOtp} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                      Resend OTP
                    </button>
                  </div>
                </CheckoutCard>
              </motion.div>
            )}

            {step === "queued" && session && (
              <motion.div key="queued" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckoutCard session={session}>
                  <div className="text-center py-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/15">
                      <Loader2 className="h-7 w-7 animate-spin text-cyan-600" />
                    </div>
                    <h2 className="mt-3 text-lg font-bold">You're in the queue</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Position #{session.queuePosition ?? 1} — waiting for the VPA slot to free up</p>
                    <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        <strong>Single-slot FIFO queue.</strong> Because P2P UPI alerts don't carry an order-id, ZeroPaye serializes payments to guarantee exact amount matching. You'll be promoted automatically.
                      </p>
                    </div>
                  </div>
                </CheckoutCard>
              </motion.div>
            )}

            {step === "active" && session && (
              <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckoutCard session={session}>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/50 bg-white p-4 text-center">
                      {accountVpa && (
                        <img src={`/api/zeropaye/qr/${sessionId}`} alt="UPI QR Code" className="mx-auto h-48 w-48" />
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">Scan with any UPI app to pay</p>
                      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                        {UPI_APPS.slice(0, 6).map((a) => (
                          <span key={a.id} className="rounded-md border border-border/50 px-2 py-0.5 text-[10px] font-medium">{a.name}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-teal-600" /> Pay window</span>
                        <span className="font-mono">{fmtTime(payRemaining)}</span>
                      </div>
                      <Progress value={(payRemaining / 300) * 100} className="mt-1.5 h-1.5" />
                    </div>
                    <Button onClick={markPaid} className="w-full bg-gradient-brand text-white rounded-lg">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> I've Paid — Verify Now
                    </Button>
                  </div>
                </CheckoutCard>
              </motion.div>
            )}

            {step === "processing" && session && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckoutCard session={session}>
                  <div className="text-center py-6">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal-600" />
                    <h2 className="mt-3 text-lg font-bold">Verifying your payment…</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Bank SMS observer is scanning for the credit</p>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-teal-600" /> Verify window</span>
                        <span className="font-mono">{fmtTime(verifyRemaining)}</span>
                      </div>
                      <Progress value={(verifyRemaining / 30) * 100} className="mt-1.5 h-1.5" />
                    </div>
                  </div>
                </CheckoutCard>
              </motion.div>
            )}

            {step === "success" && session && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <CheckoutCard session={session}>
                  <div className="text-center py-6">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                      <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                    </motion.div>
                    <h2 className="mt-3 text-xl font-bold">Payment Successful</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Your order has been confirmed</p>
                    <div className="mt-4 rounded-xl border border-border/40 bg-card p-3 text-left text-xs space-y-1.5">
                      <Row label="Order ID" value={session.orderId} />
                      <Row label="Amount" value={`₹${session.amountRupees}`} />
                      <Row label="UTR" value={session.utr || "—"} mono />
                      <Row label="Verified by" value={`L${session.verificationTier ?? 1} · Android SMS observer`} />
                      <Row label="Settled" value="Direct to merchant bank (P2P)" />
                    </div>
                  </div>
                </CheckoutCard>
              </motion.div>
            )}

            {step === "expired" && session && (
              <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckoutCard session={session}>
                  <OutcomeView
                    variant="expired"
                    title="Session Expired"
                    message="The 5-minute payment window elapsed. Your slot was released. No money was deducted."
                  />
                </CheckoutCard>
              </motion.div>
            )}

            {step === "failed" && session && (
              <motion.div key="failed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckoutCard session={session}>
                  <OutcomeView
                    variant="failed"
                    title="Verification Timed Out"
                    message="The 30-second verification window elapsed with no bank credit detected. Please try again — no money was deducted."
                  />
                </CheckoutCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-md px-4 py-3 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
            <Lock className="h-2.5 w-2.5" />
            256-bit TLS · WhatsApp OTP verified · ZeroPaye (AGPL-3.0)
          </p>
        </div>
      </footer>
    </div>
  );
}

function CheckoutCard({ session, children }: { session: SessionInfo; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-lg overflow-hidden">
      <div className="border-b border-border/40 bg-gradient-brand-soft p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Amount to pay</div>
            <div className="text-2xl font-bold">₹{session.amountRupees}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Order</div>
            <div className="font-mono text-xs">{session.orderId}</div>
          </div>
        </div>
        {session.description && (
          <p className="mt-2 text-xs text-muted-foreground truncate">{session.description}</p>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? "font-mono text-[10px]" : ""}`}>{value || "—"}</span>
    </div>
  );
}

function OutcomeView({ variant, title, message }: { variant: "expired" | "failed"; title: string; message: string }) {
  return (
    <div className="text-center py-6">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${variant === "expired" ? "bg-amber-500/15" : "bg-rose-500/15"}`}>
        {variant === "expired" ? <Clock className="h-9 w-9 text-amber-600" /> : <XCircle className="h-9 w-9 text-rose-600" />}
      </div>
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}
