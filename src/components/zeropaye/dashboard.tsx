"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Banknote, CheckCircle2, Clock, CreditCard, Loader2,
  Server, Smartphone, TrendingUp, Users, Zap, ShieldCheck, Copy, ArrowUpRight,
  AlertCircle,
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
  UNCONFIRMED: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

export function Dashboard() {
  const [data, setData] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/zeropaye/bootstrap");
        if (r.ok) {
          const d = await r.json();
          setAdminKey(d.adminApiKey);
        }
      } catch {}
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
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <p className="text-sm text-muted-foreground">Loading dashboard…</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="scroll-mt-20 relative border-y border-border/40 bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">
              Admin Dashboard
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Merchant <span className="text-gradient">Control Center</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Track payments, manage VPA, monitor observers, configure settings — sab ek jagah.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Live
            </Badge>
          </div>
        </div>

        {data && (
          <>
            {/* Bento grid stat tiles */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile
                icon={Banknote}
                value={formatINRCompact(data.stats.totalSettledPaise)}
                label="Total Settled"
                sub="Direct to bank"
                gradient="from-teal-500/15 to-cyan-500/15"
                iconColor="text-teal-600"
              />
              <StatTile
                icon={TrendingUp}
                value={formatINRCompact(data.stats.feesSavedPaise)}
                label="Fees Saved"
                sub="vs 2.2% aggregator"
                gradient="from-emerald-500/15 to-teal-500/15"
                iconColor="text-emerald-600"
              />
              <StatTile
                icon={CheckCircle2}
                value={`${data.stats.successRate}%`}
                label="Success Rate"
                sub={`${data.stats.success} of ${data.stats.total}`}
                gradient="from-cyan-500/15 to-teal-500/15"
                iconColor="text-cyan-600"
              />
              <StatTile
                icon={Activity}
                value={`${data.stats.active}`}
                label="Live Now"
                sub={`${data.stats.queued} queued`}
                gradient="from-teal-500/15 to-emerald-500/15"
                iconColor="text-teal-600"
                pulse={data.stats.active > 0}
              />
            </div>

            {/* Main dashboard card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <Card className="overflow-hidden border-border/60 shadow-lg">
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
                        <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
                        <TabsTrigger value="vpa" className="text-xs">VPA & Queue</TabsTrigger>
                        <TabsTrigger value="observers" className="text-xs">Observers</TabsTrigger>
                        <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
                        <TabsTrigger value="reconcile" className="text-xs gap-1.5">
                          Reconcile
                        </TabsTrigger>
                        <TabsTrigger value="branding" className="text-xs">Branding</TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Transactions tab */}
                    <TabsContent value="transactions" className="m-0 p-4">
                      {/* Search bar */}
                      <div className="mb-3 flex items-center gap-2">
                        <Input
                          placeholder="Search by order ID, UTR, or customer…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-8 text-sm max-w-xs"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {data.sessions.length} total
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-border/40">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 border-b bg-muted/40 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <span>Order</span><span>Amount</span><span>Status</span><span>UTR / Time</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {data.sessions.length === 0 ? (
                            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                              No transactions yet. Run the live demo above to populate this.
                            </div>
                          ) : (
                            data.sessions
                              .filter((s: any) => !searchQuery ||
                                s.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                s.utr?.includes(searchQuery) ||
                                s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((s: any) => (
                              <div key={s.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 border-b border-border/20 px-3 py-2.5 text-xs last:border-0 hover:bg-accent/40 transition-colors">
                                <div className="min-w-0">
                                  <span className="truncate block font-mono text-[11px]">{s.orderId}</span>
                                  {s.customerName && <span className="text-[9px] text-muted-foreground truncate block">{s.customerName}</span>}
                                </div>
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

                    {/* Analytics tab */}
                    <TabsContent value="analytics" className="m-0 p-4 space-y-4">
                      <div>
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment Status Breakdown</h4>
                        <div className="space-y-2">
                          {[
                            { label: "Success", count: data.stats.success, color: "bg-emerald-500" },
                            { label: "Active/Processing", count: data.stats.active, color: "bg-teal-500" },
                            { label: "Queued", count: data.stats.queued, color: "bg-cyan-500" },
                            { label: "Failed/Expired", count: data.stats.failed, color: "bg-rose-500" },
                          ].map(s => (
                            <div key={s.label}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{s.label}</span>
                                <span className="font-medium">{s.count}</span>
                              </div>
                              <Progress value={data.stats.total > 0 ? (s.count / data.stats.total) * 100 : 0} className="mt-1 h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="text-2xl font-bold text-emerald-600">{formatINR(data.stats.feesSavedPaise)}</div>
                        <div className="text-[10px] text-muted-foreground">Total fees saved vs 2.2% aggregator</div>
                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Razorpay would charge:</span>
                            <span className="font-medium text-rose-500">{formatINR(Math.round(data.stats.totalSettledPaise * 0.022))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ZeroPaye charged:</span>
                            <span className="font-bold text-emerald-600">Rs 0.00</span>
                          </div>
                          <div className="flex justify-between border-t border-border/30 pt-1.5">
                            <span className="font-medium">You saved:</span>
                            <span className="font-bold text-emerald-600">{formatINR(data.stats.feesSavedPaise)}</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* VPA tab */}
                    <TabsContent value="vpa" className="m-0 p-4 space-y-3">
                      <div className="rounded-2xl border border-border/40 p-4 bg-gradient-brand-soft">
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
                          <div className="rounded-lg bg-background/60 p-2">
                            <div className="text-[10px] text-muted-foreground">Daily Limit</div>
                            <div className="font-semibold">{formatINR(data.account?.dailyLimitPaise || 0)}</div>
                          </div>
                          <div className="rounded-lg bg-background/60 p-2">
                            <div className="text-[10px] text-muted-foreground">Active</div>
                            <div className="font-semibold">{data.stats.active}</div>
                          </div>
                          <div className="rounded-lg bg-background/60 p-2">
                            <div className="text-[10px] text-muted-foreground">Queued</div>
                            <div className="font-semibold">{data.stats.queued}</div>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-teal-500/20 bg-teal-500/[0.04] p-3">
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
                        <div key={d.id} className="rounded-xl border border-border/40 p-3 flex items-center justify-between">
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

                    {/* Reconcile tab — unmatched observations + manual attach */}
                    <TabsContent value="reconcile" className="m-0 p-4">
                      <ReconcileTab adminKey={adminKey} />
                    </TabsContent>

                    {/* Branding tab */}
                    <TabsContent value="branding" className="m-0 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <BrandingField label="Brand Name" value={data.merchant.branding?.brandName || "ZeroPaye"} />
                        <BrandingField label="Tagline" value={data.merchant.branding?.tagline || "—"} />
                        <BrandingField
                          label="Accent Color"
                          value={data.merchant.branding?.accentColor || "#0d9488"}
                          colorSwatch={data.merchant.branding?.accentColor || "#0d9488"}
                        />
                        <BrandingField label="Default VPA" value={data.merchant.defaultVpa} mono />
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
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border/40 glass p-3">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Public API Key</div>
                <code className="block truncate font-mono text-xs">{data.merchant.publicApiKey}</code>
              </div>
              <Button size="sm" variant="outline" onClick={copyKey} className="shrink-0 rounded-full">
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

function StatTile({
  icon: Icon, value, label, sub, gradient, iconColor, pulse,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative overflow-hidden p-4 bg-gradient-to-br ${gradient}`}>
        <div className="flex items-start justify-between">
          <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-background/60 ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          {pulse && (
            <span className="flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-teal-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
          )}
        </div>
        <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {sub && <div className="mt-0.5 text-[10px] text-muted-foreground/80">{sub}</div>}
      </Card>
    </motion.div>
  );
}

function BrandingField({ label, value, colorSwatch, mono }: { label: string; value: string; colorSwatch?: string; mono?: boolean }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-1 flex items-center gap-2 rounded-md border border-border/40 bg-background/60 px-2.5 py-2 text-sm font-medium">
        {colorSwatch && <span className="h-5 w-5 rounded-md shrink-0" style={{ background: colorSwatch }} />}
        <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reconcile Tab — unmatched bank credits + manual attach to sessions
// ---------------------------------------------------------------------------
function ReconcileTab({ adminKey }: { adminKey: string | null }) {
  const [observations, setObservations] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [attaching, setAttaching] = useState<string | null>(null);
  const [attachResult, setAttachResult] = useState<string | null>(null);

  const loadData = async () => {
    if (!adminKey) return;
    try {
      const headers = { "x-zeropaye-admin-key": adminKey };
      const [obsRes, sessRes] = await Promise.all([
        fetch("/api/zeropaye/admin/observations", { headers }),
        fetch("/api/zeropaye/session", { headers }),
      ]);
      const obsData = await obsRes.json();
      const sessData = await sessRes.json();
      setObservations(obsData.observations || []);
      // Filter sessions that can be reconciled (EXPIRED/UNCONFIRMED)
      setSessions((sessData.sessions || []).filter((s: any) => ["EXPIRED", "UNCONFIRMED"].includes(s.status)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [adminKey]);

  const attach = async (observationId: string, sessionId: string) => {
    setAttaching(observationId);
    setAttachResult(null);
    try {
      const res = await fetch("/api/zeropaye/admin/observations", {
        method: "POST",
        headers: { "content-type": "application/json", "x-zeropaye-admin-key": adminKey! },
        body: JSON.stringify({ observationId, sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAttachResult(`✅ Attached to session ${sessionId.slice(0, 12)}... UTR: ${data.utr}`);
        loadData(); // refresh
      } else {
        setAttachResult(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setAttachResult(`❌ ${e.message}`);
    } finally {
      setAttaching(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-teal-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-medium text-foreground">Unmatched Bank Credits</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Yeh woh bank credits hain jahan SMS/email aayi par koi ACTIVE session nahi mila
              (late SMS, wrong amount, ya session expire ho gaya). Manually correct session
              se attach karke payment confirm karein.
            </p>
          </div>
        </div>
      </div>

      {/* Attach result */}
      {attachResult && (
        <div className={`rounded-lg p-3 text-xs ${attachResult.startsWith("✅") ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
          {attachResult}
        </div>
      )}

      {/* Unmatched observations */}
      {observations.length === 0 ? (
        <div className="rounded-xl border border-border/40 py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/60" />
          <p className="mt-2 text-sm font-medium">Sab credits matched!</p>
          <p className="text-[10px] text-muted-foreground">Koi unmatched observation nahi hai.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {observations.map((obs: any) => (
            <div key={obs.id} className="rounded-xl border border-border/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">{obs.source}</Badge>
                    <span className="font-mono text-xs font-bold">{obs.parsedUtr}</span>
                    <span className="text-sm font-bold text-gradient">
                      Rs {(obs.parsedAmountPaise / 100).toFixed(2)}
                    </span>
                  </div>
                  {obs.rawText && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">{obs.rawText.slice(0, 100)}</p>
                  )}
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {new Date(obs.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              {/* Attach to session */}
              <div className="mt-2 flex items-center gap-2">
                <select
                  className="flex-1 rounded-md border border-border/40 bg-background px-2 py-1 text-xs"
                  onChange={(e) => e.target.value && attach(obs.id, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Select a session to attach…</option>
                  {sessions.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.orderId} — Rs {(s.amountPaise / 100).toFixed(2)} — {s.status}
                    </option>
                  ))}
                </select>
                {attaching === obs.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reconcilable sessions */}
      {sessions.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sessions needing reconciliation ({sessions.length})
          </h4>
          <div className="space-y-1.5">
            {sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
                <span className="font-mono">{s.orderId}</span>
                <span className="font-medium">Rs {(s.amountPaise / 100).toFixed(2)}</span>
                <Badge variant="outline" className={STATUS_COLOR[s.status] || ""}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
