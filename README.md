# ⚡ ZeroPaye

### Zero • Empowering • Reliable • Open • Payé
**The 100% open-source, zero-fee UPI payment gateway for India.**
Direct P2P UPI settlement to your bank account — no middlemen, no hidden fees, no fund custody.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)
[![Fees: 0% Forever](https://img.shields.io/badge/Fees-0%25%20Forever-brightgreen?style=for-the-badge)](#)

<br/>

---

## 💡 Why ZeroPaye?

Traditional Indian payment aggregators (Razorpay, Cashfree, PayU, Paytm) impose:
- **2.0–3.0% + 18% GST** transaction fee per payment
- **T+2 to T+3** settlement delays (holdbacks)
- **Unilateral account freezes** at aggregator discretion
- **Phone spoofing & fraud** via arbitrary fake mobile numbers

**ZeroPaye** eliminates the aggregator intermediary completely:

| | Traditional Aggregators | ⚡ ZeroPaye |
| :--- | :--- | :--- |
| **Transaction Fee** | 2.0–3.0% + 18% GST | **0.0% — Forever** |
| **Settlement Speed** | T+2 to T+3 business days | **Instant (direct P2P UPI)** |
| **Account Freeze Risk** | High | **Zero — you own your VPA** |
| **Branding** | "Secured by X" mandatory | **100% white-label** |
| **Source Code** | Closed proprietary | **AGPL-3.0 open-source** |

<br/>

---

## 🧭 The ZeroPaye Acronym

**ZeroPaye** is not just a name — it is our mission's acronym:

| Letter | Word | Hindi | Promise |
|:---:|---|---|---|
| **Z** | **Zero** | शून्य | Zero transaction fees, zero middlemen, zero holdbacks. The name *is* the value proposition. |
| **E** | **Empowering** | सशक्त | Enterprise-grade payment gateway power for small dukaandaars, freelancers & startups — 100% open-source & free. |
| **R** | **Reliable** | विश्वसनीय | Server-authoritative timers, atomic single-slot FIFO queue, HMAC-SHA256 signed webhooks, crash recovery on boot. |
| **O** | **Open** | खुला | AGPL-3.0 licensed. Auditable source. Zero telemetry, zero tracking. Community-owned. |
| **Payé** | **Pay** | भुगतान | (French "payé" = paid) 100% Bharatiya UPI ecosystem — GPay, PhonePe, Paytm, BHIM, Amazon Pay, CRED. |

<br/>

---

## 🏗️ Architecture

ZeroPaye converts standard Indian UPI receiving accounts into an automated, zero-fee payment gateway by coupling **pure vector SVG QR codes** with an **automated multi-channel banking observation mesh**.

```text
Customer → ZeroPaye Checkout → WhatsApp OTP → Single-Slot FIFO Queue
                                                         ↓
                                              Pure Vector SVG QR (UPI intent)
                                                         ↓
                            Customer scans & pays via any UPI app (GPay/PhonePe/Paytm/BHIM/CRED)
                                                         ↓
                                        Funds land DIRECTLY in merchant's bank (P2P UPI)
                                                         ↓
              Banking Observation Mesh (Android SMS + Gmail + Google Messages Web)
                                                         ↓
                          Observation Normalizer + HMAC Verification + Amount Match
                                                         ↓
                                          SUCCESS → HMAC-SHA256 Webhook → Merchant
```

### Architectural Invariants (preserved & hardened)
1. **Integer paise arithmetic** — ₹499.00 = 49900 paise (Int). Floating-point drift is impossible.
2. **Server-authoritative dual timers** — 5-min pay window + 30-sec verify window, computed from DB state (refresh-proof, reboot-proof, tamper-proof).
3. **Pure vector SVG QR** — ISO/IEC 18004 compliant. No Google Charts. Sub-second generation.
4. **Single-slot FIFO queue** — Exactly ONE active session per receiving VPA at any instant. Eliminates amount-collision attribution.
5. **Gateway-owned customer OTP** — Customers authenticate via WhatsApp/email OTP before slot allocation (eliminates phone spoofing).
6. **Raw-body HMAC-SHA256 webhook** — Polyglot verification snippets (Node/Python/PHP/Go). Idempotent via `X-ZeroPaye-Delivery-Id`.
7. **Observation fingerprint dedup** — `SHA-256(receivingAccount + amount + UTR + timeBucket)` collapses duplicate SMS/push/email alerts.
8. **Crash recovery on boot** — Overdue sessions marked terminal, active timers rescheduled, queued customers promoted.

<br/>

---

## 🔒 Security by Design

ZeroPaye was built after a deep security audit of its predecessor codebase (105 findings: 13 CRITICAL, 13 HIGH, 7 MEDIUM). Every critical bug was fixed:

| Finding | Before | After |
|---|---|---|
| Admin API auth | No authentication on any `/admin/*` endpoint | Per-merchant admin API key (`zp_...`); webhook secret never returned in GET |
| Observer HMAC | Verification **optional** — fake SMS could confirm payments | **Mandatory** HMAC + 60s anti-replay + constant-time compare; signing keys stored as **SHA-256 hash** |
| OTP generation | `Math.random()` (not CSPRNG), printed to stdout | `crypto.randomInt()`, stored as SHA-256 hash, 15-min lockout after 5 attempts |
| CORS / SSRF | `Access-Control-Allow-Origin: *`; no SSRF guard on webhook targets | Same-origin allow-list; SSRF guard blocks private/loopback/metadata IPs; HTTPS required in prod |
| Webhook retries | Retry code existed but was never invoked | `webhook_deliveries` table with unique `delivery_id` (uuid v4), attempt counter, next-retry-at |
| Attribution | Fell back to ANY active session by amount match (payment mix-up) | Strict: exact receiving account + exact integer-paise amount + valid 12-digit UTR regex |
| Hardcoded PII | Author's phone/email in DB seed, hardcoded secrets | Zero PII. All secrets generated at first boot via `crypto.randomBytes` |
| Race condition | Queue acquisition used `BEGIN TRANSACTION` (deferred lock) | Prisma `$transaction` = `BEGIN IMMEDIATE` (write lock upfront, race-proof) |

<br/>

---

## 🚀 Quickstart

### Prerequisites
- **Node.js >= 20** (or [Bun](https://bun.sh) >= 1.0)
- *No Docker, no external database, no Cloudflare required.*

### Install & Run
```bash
git clone https://github.com/DKUMARGUPTA/zeropaye.git
cd zeropaye
bun install          # or npm install

# Set up the database
cp .env.example .env
bun run db:push      # creates SQLite DB + applies Prisma schema

# Start dev server
bun run dev          # http://localhost:3000
```

That's it. On first run, ZeroPaye auto-seeds a demo merchant (`zeropaye.demo@upi`), generates a fresh API key (`zp_...`), and provisions a hashed observer signing key.

### Environment Variables
| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `file:/db/custom.db` | Prisma SQLite connection |
| `NODE_ENV` | — | `development` | Set `production` to hide demo OTPs |

<br/>

---

## 💳 Developer Integration

### 1. Drop-in script (static sites)
```html
<script src="https://pay.yourdomain.com/zeropaye.js"
        data-zeropaye-key="zp_your_public_api_key"
        data-currency="INR">
</script>

<button data-zeropaye-pay
        data-order-id="ORDER-1001"
        data-amount="499.00">
  Buy Now with ZeroPaye
</button>
```

### 2. Programmatic (React / Vue / Next.js)
```javascript
window.ZeroPaye.pay({
  order_id: 'ORDER-1001',
  amount: 499.00,
  currency: 'INR',
  name: 'Acme Digital Store',
  description: 'Pro Subscription Top-Up',
  handler: (response) => {
    // response: { status: 'SUCCESS', order_id, utr, amount_received, verificationTier }
    console.log('Payment confirmed! UTR:', response.utr);
  },
  onClose: () => console.log('Customer closed the modal'),
});
```

### 3. Webhook verification (Node.js)
```javascript
import crypto from 'node:crypto';

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
});
```

### Webhook Payload Contract
- **Headers**: `x-zeropaye-signature: sha256=<hex>`, `x-zeropaye-event: SUCCESS`, `x-zeropaye-delivery-id: <uuid>`, `x-zeropaye-timestamp: <epoch_ms>`
- **Body**:
```json
{
  "event": "SUCCESS",
  "orderId": "ZP-1001",
  "paymentId": "zp_session_xxx",
  "amount": "499.00",
  "amountPaise": 49900,
  "utr": "123456789012",
  "verificationTier": 1,
  "currency": "INR",
  "timestamp": 1700000000000
}
```

<br/>

---

## 📦 Project Structure

```
zeropaye/
├── prisma/schema.prisma              # 9 secure Prisma models
├── src/
│   ├── lib/zeropaye/                 # Secure core utilities
│   │   ├── crypto.ts                 # randomInt OTP, constant-time HMAC, SHA-256
│   │   ├── money.ts                  # Integer-paise arithmetic
│   │   ├── upi.ts                    # UPI URI builder + validators
│   │   ├── qr.ts                     # Pure vector SVG QR generator
│   │   ├── security.ts              # Rate-limit, SSRF guard, CORS, IP helpers
│   │   ├── otp-store.ts             # Hashed OTP + brute-force lockout
│   │   └── config.ts                # Demo merchant seeding (no hardcoded PII)
│   ├── app/
│   │   ├── api/zeropaye/            # 8 secure route handlers
│   │   │   ├── session/route.ts     # Create/list sessions + stale cleanup
│   │   │   ├── send-otp/route.ts    # Rate-limited OTP send
│   │   │   ├── verify-otp/route.ts  # Constant-time verify + slot acquisition
│   │   │   ├── status/[id]/route.ts # Status + auto-expire + queue promote
│   │   │   ├── confirm-paid/route.ts # ACTIVE -> PROCESSING
│   │   │   ├── simulate-payment/    # Observer mesh simulation
│   │   │   ├── observer/route.ts    # Mandatory HMAC ingestion
│   │   │   ├── merchant/route.ts    # Dashboard stats
│   │   │   └── qr/[id]/route.ts     # Vector QR generation
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Single-page app (9 sections)
│   └── components/zeropaye/         # 14 React components (shadcn/ui + Framer Motion)
└── .env.example
```

<br/>

---

## 🆓 Free Forever

- **License**: AGPL-3.0 — fork it, audit it, self-host it. Share improvements back.
- **Pricing**: ₹0/month, per merchant. Unlimited transactions. All features unlocked.
- **Telemetry**: Zero. No tracking pixels, no outbound calls to our servers.
- **Lock-in**: None. Runs on any Node 20+ host with SQLite.

<br/>

---

## 🇮🇳 Built for Bharat

Made for every dukaandaar, freelancer, aur startup in India.
Take back control of your payments. Zero middleman fees. Direct settlement.

⭐ **Star this repository if you believe in open, zero-fee payment infrastructure!**

<br/>

## ⚖️ License

Distributed under the [AGPL-3.0 License](https://www.gnu.org/licenses/agpl-3.0).
See `LICENSE` for full terms.

<br/>

<div align="center">

**ZeroPaye** — Direct • Empowering • Effortless • Pay (UPI)
*Paisa seedhe bank mein.*

</div>
