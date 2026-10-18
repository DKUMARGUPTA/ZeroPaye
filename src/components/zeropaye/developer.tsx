"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Copy, Terminal, Code2, Webhook, BookOpen } from "lucide-react";

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="ml-2 text-[11px] font-mono text-slate-400">{lang}</span>
        </div>
        <button onClick={copy} className="text-slate-400 hover:text-slate-100 transition-colors" aria-label="Copy">
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}

const HTML_SNIPPET = `<!-- Step 1: Add the universal script -->
<script src="https://pay.yourdomain.com/zeropaye.js"
        data-zeropaye-key="zp_your_public_api_key"
        data-currency="INR">
</script>

<!-- Step 2: Declarative button — zero JS required -->
<button data-zeropaye-pay
        data-order-id="ORDER-1001"
        data-amount="499.00"
        data-currency="INR">
  Buy Now with ZeroPaye
</button>`;

const JS_SNIPPET = `// Programmatic — for React, Vue, Next.js, Angular
window.ZeroPaye.pay({
  order_id: 'ORDER-1001',
  amount: 499.00,
  currency: 'INR',
  name: 'Acme Digital Store',
  description: 'Pro Subscription Top-Up',
  handler: function (response) {
    // response: { status: 'SUCCESS', order_id, amount_received, utr, verificationTier }
    console.log('Payment confirmed! UTR:', response.utr);
    window.location.href = \`/order-success?order_id=\${response.order_id}&utr=\${response.utr}\`;
  },
  onClose: function () {
    console.log('Customer closed the modal');
  },
});`;

const WEBHOOK_NODE = `import crypto from 'node:crypto';

app.post('/api/zeropaye-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-zeropaye-signature'] || '';
  const secret = process.env.ZEROPAYE_WEBHOOK_SECRET;

  // Constant-time HMAC over the RAW body (parse JSON only AFTER verify)
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.body)
    .digest('hex');

  if (signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event === 'SUCCESS') {
    // Dedupe by X-ZeroPaye-Delivery-Id, then fulfill
    fulfillOrder(event.orderId, event.utr, event.amount, event.amountPaise);
  }
  res.status(200).json({ received: true });
});`;

const WEBHOOK_PYTHON = `import hmac, hashlib
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

@app.post("/api/zeropaye-webhook")
async def zeropaye_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("X-ZeroPaye-Signature", "")
    secret = request.app.state.webhook_secret.encode("utf-8")

    expected = "sha256=" + hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    event = json.loads(raw_body.decode("utf-8"))
    if event.get("event") == "SUCCESS":
        # Dedupe by X-ZeroPaye-Delivery-Id, then fulfill
        fulfill_order(event["orderId"], event["utr"], event["amount"])
    return {"received": True}`;

const API_SESSION = `// Create a payment session (server-to-server)
const res = await fetch('https://pay.yourdomain.com/api/zeropaye/session', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-zeropaye-key': process.env.ZEROPAYE_PUBLIC_KEY,
  },
  body: JSON.stringify({
    orderId: 'ORDER-1001',
    amount: 499.00,           // rupees (string or number)
    currency: 'INR',
    description: 'Pro plan top-up',
    customerName: 'Arjun Sharma',
  }),
});
const { session } = await res.json();
// session.id -> pass to checkout SDK / redirect to /checkout/:id`;

export function Developer() {
  return (
    <section id="developers" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
            Developer Integration
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From zero to checkout in under 5 minutes
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            One script tag for static sites. One <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">ZeroPaye.pay()</code> call for SPAs.
            Raw-body HMAC webhooks for your backend. Polyglot snippets for every stack.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <Card className="h-full p-5">
              <div className="mb-3 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold">1. Frontend — drop-in script</h3>
              </div>
              <CodeBlock code={HTML_SNIPPET} lang="html" />
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <Card className="h-full p-5">
              <div className="mb-3 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold">2. Frontend — programmatic</h3>
              </div>
              <CodeBlock code={JS_SNIPPET} lang="javascript" />
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <Card className="h-full p-5">
              <div className="mb-3 flex items-center gap-2">
                <Webhook className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold">3. Backend — session creation</h3>
              </div>
              <CodeBlock code={API_SESSION} lang="typescript" />
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <Card className="h-full p-5">
              <div className="mb-3 flex items-center gap-2">
                <Webhook className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold">4. Backend — webhook verify</h3>
              </div>
              <Tabs defaultValue="node">
                <TabsList className="h-8 bg-muted/40">
                  <TabsTrigger value="node" className="text-xs">Node</TabsTrigger>
                  <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
                </TabsList>
                <TabsContent value="node" className="mt-3"><CodeBlock code={WEBHOOK_NODE} lang="javascript" /></TabsContent>
                <TabsContent value="python" className="mt-3"><CodeBlock code={WEBHOOK_PYTHON} lang="python" /></TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>

        {/* Webhook contract */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="mt-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold">Webhook contract — headers & payload</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Headers</div>
                <ul className="mt-1.5 space-y-1 text-xs">
                  <li><code className="font-mono text-teal-700 dark:text-teal-300">x-zeropaye-signature:</code> <span className="text-muted-foreground">sha256=&lt;hex&gt;</span></li>
                  <li><code className="font-mono text-teal-700 dark:text-teal-300">x-zeropaye-event:</code> <span className="text-muted-foreground">SUCCESS | FAILED | ...</span></li>
                  <li><code className="font-mono text-teal-700 dark:text-teal-300">x-zeropaye-delivery-id:</code> <span className="text-muted-foreground">uuid v4 (idempotency)</span></li>
                  <li><code className="font-mono text-teal-700 dark:text-teal-300">x-zeropaye-timestamp:</code> <span className="text-muted-foreground">epoch ms</span></li>
                </ul>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payload</div>
                <pre className="mt-1.5 overflow-x-auto rounded-md bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed">{`{
  "event": "SUCCESS",
  "orderId": "ORDER-1001",
  "paymentId": "zp_session_xxx",
  "amount": "499.00",
  "amountPaise": 49900,
  "utr": "123456789012",
  "verificationTier": 1,
  "currency": "INR",
  "timestamp": 1700000000000
}`}</pre>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full">
              <BookOpen className="mr-2 h-4 w-4" /> Read the full docs
            </Button>
          </a>
          <Button onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })} className="rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
            <Terminal className="mr-2 h-4 w-4" /> Try it live now
          </Button>
        </div>
      </div>
    </section>
  );
}
