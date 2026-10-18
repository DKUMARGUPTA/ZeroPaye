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
  Activity, Banknote, CheckCircle2, Clock, CreditCard, Loader2,
  Server, Smartphone, TrendingUp, Users, Zap, ShieldCheck, Copy,
} from "lucide-react";
import { formatINR, formatINRCompact } from "@/lib/zeropaye/money";

interface MerchantData {
  merchant: { businessName: string; publicApiKey: string; branding: any; defaultVpa: string };
  account: { vpa: string; accountName: string; isSlotBusy: boolean; dailyLimitPaise: number } | null;
  devices: { id: string; deviceName: string; isActive: boolean; lastHeartbeatAt: string | null }[];
  stats: {
    total: number; success: number; active: number; queued: number; failed: number;
    totalSettledPaise: number; feesSavedPaise: number; successRate: number;
  };
  sessions: any[];
}

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  ACTIVE: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  PROCESSING: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  QUEUED: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  FAILED: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  EXPIRED: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  INITIATED: "bg-muted text-muted-foreground border-border",
  AUTH_PENDING: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
};

export function Dashboard() {
  const [data, setData] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [adminKey, setAdminKey] = useState<string | null>(null);

  // Fetch the demo admin API key once (dev-only bootstrap route).
  // In production, the merchant would enter their admin key manually.
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/zeropaye/bootstrap");
        if (r.ok) {
          const d = await r.json();
          setAdminKey(d.adminApiKey);
        }
      } catch { /* ignore — production */ }
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = adminKey
        ? { "x-zeropaye-admin-key": adminKey }
        : {};
      const [mRes, sRes] = await Promise.all([
        fetch("/api/zeropaye/merchant", { headers }),
        fetch("/api/zeropaye/session", { headers }),
      ]);
      // If 401 (no/old admin key), re-bootstrap
      if (mRes.status === 401 || sRes.status === 401) {
        const b = await fetch("/api/zeropaye/bootstrap");
        if (b.ok) {
          const d = await b.json();
          setAdminKey(d.adminApiKey);
          const retry = { "x-zeropaye-admin-key": d.adminApiKey };
          const [m2, s2] = await Promise.all([
            fetch("/api/zeropaye/merchant", { headers: retry }),
            fetch("/api/zeropaye/session", { headers: retry }),
          ]);
          const m = await m2.json();
          const s = await s2.json();
          setData({ ...m, sessions: s.sessions || [] });
          return;
        }
      }
      const m = await mRes.json();
      const s = await sRes.json();
      setData({ ...m, sessions: s.sessions || [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminKey) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [adminKey]);

  const copyKey = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.merchant.publicApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading && !data) {
    return (
      <section id="dashboard" className="py-20 sm:py-28">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-20">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="scroll-mt-20 border-y border-border/40 bg-muted/10 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
            Merchant Dashboard
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            One panel for everything
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Live transactions, VPA slot status, observer health, and white-label
            branding — all in a self-hosted panel you control.
          </p>
        </div>

        {data && (
          <>
            {/* Stat tiles */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile icon={Banknote} label="Total Settled" value={formatINRCompact(data.stats.totalSettledPaise)} sub="Direct to bank" tone="teal" />
              <StatTile icon={TrendingUp} label="Fees Saved" value={formatINRCompact(data.stats.feesSavedPaise)} sub="vs 2.2% aggregator" tone="emerald" />
              <StatTile icon={CheckCircle2} label="Success Rate" value={`${data.stats.successRate}%`} sub={`${data.stats.success} of ${data.stats.total}`} tone="teal" />
              <StatTile icon={Activity} label="Live Now" value={`${data.stats.active}`} sub={`${data.stats.queued} queued`} tone="cyan" />
            </div>

            {/* Main dashboard card */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <Card className="mt-8 overflow-hidden">
                <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Server className="h-4 w-4 text-teal-600" />
                        {data.merchant.businessName}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">Self-hosted on your VPS · AGPL-3.0</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${data.account?.isSlotBusy ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                        VPA slot {data.account?.isSlotBusy ? "busy" : "free"}
                      </Badge>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Operational
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="transactions" className="w-full">
                    <div className="border-b border-border/40 px-4 pt-3">
                      <TabsList className="bg-transparent h-9">
                        <TabsTrigger value="transactions" className="text-xs">Transactions</TabsTrigger>
                        <TabsTrigger value="vpa" className="text-xs">VPA & Queue</TabsTrigger>
                        <TabsTrigger value="observers" className="text-xs">Observers</TabsTrigger>
                        <TabsTrigger value="branding" className="text-xs">White-Label</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Transactions tab */}
                    <TabsContent value="transactions" className="m-0 p-4">
                      <div className="overflow-hidden rounded-lg border border-border/40">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 border-b bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <span>Order</span><span>Amount</span><span>Status</span><span>UTR / Time</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {data.sessions.length === 0 ? (
                            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                              No transactions yet. Run the live demo above to populate this.
                            </div>
                          ) : (
                            data.sessions.map((s: any) => (
                              <div key={s.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 border-b border-border/20 px-3 py-2.5 text-xs last:border-0">
                                <span className="truncate font-mono text-[11px]">{s.orderId}</span>
                                <span className="font-medium">{formatINR(s.amountPaise)}</span>
                                <Badge variant="outline" className={`h-5 w-fit px-1.5 text-[10px] ${STATUS_COLOR[s.status] || ""}`}>{s.status}</Badge>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {s.utr ? s.utr : new Date(s.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* VPA & Queue tab */}
                    <TabsContent value="vpa" className="m-0 p-4 space-y-3">
                      <div className="rounded-lg border border-border/40 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Receiving VPA</div>
                            <div className="mt-1 font-mono text-sm font-bold">{data.account?.vpa}</div>
                            <div className="text-[11px] text-muted-foreground">{data.account?.accountName}</div>
                          </div>
                          <Badge variant="outline" className="gap-1">
                            <span className={`h-2 w-2 rounded-full ${data.account?.isSlotBusy ? "bg-amber-500" : "bg-emerald-500"}`} />
                            {data.account?.isSlotBusy ? "BUSY" : "FREE"}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-md bg-muted/40 p-2">
                            <div className="text-[10px] text-muted-foreground">Daily Limit</div>
                            <div className="font-semibold">{formatINR(data.account?.dailyLimitPaise || 0)}</div>
                          </div>
                          <div className="rounded-md bg-muted/40 p-2">
                            <div className="text-[10px] text-muted-foreground">Active</div>
                            <div className="font-semibold">{data.stats.active}</div>
                          </div>
                          <div className="rounded-md bg-muted/40 p-2">
                            <div className="text-[10px] text-muted-foreground">Queued</div>
                            <div className="font-semibold">{data.stats.queued}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-teal-500/[0.04] border border-teal-500/20 p-3">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            <span className="font-semibold text-foreground">Single-slot FIFO invariant.</span> Because P2P UPI alerts
                            don&apos;t carry a merchant order-id, ZeroPaye serializes payments — exactly one ACTIVE
                            session per VPA at any instant. This eliminates amount-collision attribution errors.
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Observers tab */}
                    <TabsContent value="observers" className="m-0 p-4 space-y-3">
                      {data.devices.map((d) => (
                        <div key={d.id} className="rounded-lg border border-border/40 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Smartphone className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold">{d.deviceName}</div>
                                <div className="font-mono text-[10px] text-muted-foreground">{d.id}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="gap-1 text-xs">
                              <span className={`h-1.5 w-1.5 rounded-full ${d.isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                              {d.isActive ? "Online" : "Offline"}
                            </Badge>
                          </div>
                          <div className="mt-2 text-[10px] text-muted-foreground">
                            Last heartbeat: {d.lastHeartbeatAt ? new Date(d.lastHeartbeatAt).toLocaleString("en-IN") : "never"}
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {[
                          { icon: Smartphone, name: "Android Observer", status: "Paired", desc: "SMS + Push notif" },
                          { icon: CreditCard, name: "Gmail Observer", status: "Optional", desc: "OAuth2 / CDP" },
                          { icon: Users, name: "SMS Web Observer", status: "Optional", desc: "Google Messages" },
                        ].map((o) => (
                          <div key={o.name} className="rounded-lg border border-border/40 p-2.5">
                            <o.icon className="h-4 w-4 text-teal-600" />
                            <div className="mt-1.5 text-xs font-semibold">{o.name}</div>
                            <div className="text-[10px] text-muted-foreground">{o.desc}</div>
                            <Badge variant="secondary" className="mt-1.5 h-4 px-1.5 text-[9px]">{o.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Branding tab */}
                    <TabsContent value="branding" className="m-0 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Brand Name</label>
                          <div className="mt-1 rounded-md border border-border/40 bg-muted/20 px-2.5 py-2 text-sm font-medium">
                            {data.merchant.branding?.brandName || "ZeroPaye"}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tagline</label>
                          <div className="mt-1 rounded-md border border-border/40 bg-muted/20 px-2.5 py-2 text-sm font-medium">
                            {data.merchant.branding?.tagline || "—"}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Accent Color</label>
                          <div className="mt-1 flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-2">
                            <span className="h-5 w-5 rounded-md" style={{ background: data.merchant.branding?.accentColor }} />
                            <span className="font-mono text-xs">{data.merchant.branding?.accentColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Default VPA</label>
                          <div className="mt-1 rounded-md border border-border/40 bg-muted/20 px-2.5 py-2 font-mono text-sm">
                            {data.merchant.defaultVpa}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 rounded-lg bg-teal-500/[0.04] border border-teal-500/20 p-3">
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          <Zap className="mr-1 inline h-3 w-3 text-teal-600" />
                          100% white-label: custom domain, custom logo, custom colors. Zero &ldquo;Powered by&rdquo; badges required.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* API key display */}
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border/40 bg-card p-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Public API Key</div>
                <code className="block truncate font-mono text-xs">{data.merchant.publicApiKey}</code>
              </div>
              <Button size="sm" variant="outline" onClick={copyKey} className="shrink-0">
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StatTile({ icon: Icon, label, value, sub, tone }: any) {
  const toneMap: Record<string, string> = {
    teal: "text-teal-600 bg-teal-500/10",
    emerald: "text-emerald-600 bg-emerald-500/10",
    cyan: "text-cyan-600 bg-cyan-500/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4">
        <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground/80">{sub}</div>
      </Card>
    </motion.div>
  );
}
