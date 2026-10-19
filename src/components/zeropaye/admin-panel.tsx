"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Loader2, CheckCircle2, Copy, AlertCircle, Palette, Key, Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MerchantInfo {
  id: string;
  businessName: string;
  publicApiKey: string;
  adminApiKey: string;
  defaultVpa: string;
  branding: any;
}

export function AdminPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [vpa, setVpa] = useState("");
  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [accentColor, setAccentColor] = useState("#0d9488");
  const [copied, setCopied] = useState<string | null>(null);

  // Bootstrap admin key
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

  // Load merchant info
  useEffect(() => {
    if (!adminKey) return;
    (async () => {
      try {
        const r = await fetch("/api/zeropaye/merchant", {
          headers: { "x-zeropaye-admin-key": adminKey },
        });
        if (!r.ok) throw new Error("Failed to load");
        const d = await r.json();
        setMerchant(d.merchant);
        setVpa(d.merchant.defaultVpa || "");
        setBrandName(d.merchant.branding?.brandName || "");
        setTagline(d.merchant.branding?.tagline || "");
        setAccentColor(d.merchant.branding?.accentColor || "#0d9488");
      } catch (e: any) {
        toast({ title: "Failed to load", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [adminKey]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/zeropaye/admin/merchant", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-zeropaye-admin-key": adminKey!,
        },
        body: JSON.stringify({
          defaultVpa: vpa,
          branding: { brandName, tagline, accentColor },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to save");
      toast({
        title: "Saved successfully",
        description: "Your VPA and branding have been updated.",
      });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-md glow-teal">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">
                Self-serve your merchant settings — no DB editing required.
              </p>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <Card className="mb-6 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4 text-teal-600" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Public API Key</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-border/40 bg-muted/40 px-3 py-2 font-mono text-xs">
                  {merchant?.publicApiKey}
                </code>
                <Button size="sm" variant="outline" onClick={() => copy(merchant?.publicApiKey || "", "public")}>
                  {copied === "public" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Use in your website SDK (<code>data-zeropaye-key</code>).</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin API Key <span className="text-rose-500">(SECRET)</span></Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 font-mono text-xs">
                  {merchant?.adminApiKey}
                </code>
                <Button size="sm" variant="outline" onClick={() => copy(merchant?.adminApiKey || "", "admin")}>
                  {copied === "admin" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-rose-600">
                <AlertCircle className="h-2.5 w-2.5" />
                Never share this. Required for all admin endpoints.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* VPA + Branding */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4 text-teal-600" />
              VPA & White-Label Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vpa" className="text-xs">Default UPI VPA</Label>
              <Input
                id="vpa"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                placeholder="yourname@okhdfcbank"
                className="mt-1 font-mono text-sm"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                The UPI VPA where customer payments will be settled.
              </p>
            </div>

            <div>
              <Label htmlFor="brandName" className="text-xs">Brand Name</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Sharma Kirana Store"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tagline" className="text-xs">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Aapka apna dukaan"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="accentColor" className="text-xs">Accent Color</Label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  id="accentColor"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-border/40 bg-transparent"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="font-mono text-sm flex-1"
                />
                <div className="h-9 w-9 rounded-lg border border-border/40" style={{ background: accentColor }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Applied to buttons, links, and interactive elements across checkout.
              </p>
            </div>

            {/* Preview */}
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Live preview</div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold" style={{ background: accentColor }}>
                  {brandName ? brandName.charAt(0).toUpperCase() : "Z"}
                </div>
                <div>
                  <div className="text-sm font-bold">{brandName || "ZeroPaye"}</div>
                  <div className="text-[10px] text-muted-foreground">{tagline || "Zero • Empowering • Reliable • Open • Payé"}</div>
                </div>
              </div>
            </div>

            <Button onClick={save} disabled={saving} className="w-full bg-gradient-brand text-white rounded-lg">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Security note */}
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Demo mode:</strong> This admin panel uses the dev-only{" "}
              <code>/bootstrap</code> endpoint to fetch your admin key. In production, the admin key
              is provisioned via a secure onboarding flow and entered manually. Never expose your
              admin key in client-side code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
