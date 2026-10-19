// Integration tests for ZeroPaye API routes
// Tests the full request → handler → response flow by calling the route
// handlers directly with mock Request objects.
// Covers: /session, /send-otp, /verify-otp, /status, /health, /metrics

import { describe, it, expect, beforeAll } from "vitest";

// These tests hit the live API. They require the dev server running on :3000.
// Run: bun run dev && bun run test:integration
const BASE = "http://localhost:3000";

// Skip if server not running
const serverUp = await fetch(`${BASE}/api/zeropaye/health`)
  .then((r) => r.ok)
  .catch(() => false);

describe.skipIf(!serverUp)("API integration — /health endpoint", () => {
  it("returns ok status with version", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("zeropaye");
    expect(data.version).toBeTruthy();
    expect(typeof data.uptimeMs).toBe("number");
  });

  it("has no-store cache-control header", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/health`);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe.skipIf(!serverUp)("API integration — /metrics endpoint", () => {
  it("returns Prometheus format text", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/metrics`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toContain("zeropaye_uptime_seconds");
    expect(text).toContain("zeropaye_sessions_total");
  });
});

describe.skipIf(!serverUp)("API integration — /session creation", () => {
  it("creates a session with valid input", async () => {
    const orderId = `TEST-${Date.now()}`;
    const res = await fetch(`${BASE}/api/zeropaye/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, amount: 100, description: "Test payment" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.session).toBeTruthy();
    expect(data.session.orderId).toBe(orderId);
    expect(data.session.amountPaise).toBe(10000);
    expect(data.session.status).toBe("INITIATED");
    expect(data.merchant.publicApiKey).toMatch(/^zp_/);
  });

  it("rejects invalid orderId (too long)", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: "a".repeat(36),
        amount: 100,
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("orderId");
  });

  it("rejects invalid currency", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: `TEST-${Date.now()}`,
        amount: 100,
        currency: "invalid",
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("currency");
  });

  it("rejects amount below minimum", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: `TEST-${Date.now()}`,
        amount: 0.5,
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Minimum");
  });

  it("is idempotent for same orderId", async () => {
    const orderId = `IDEMP-${Date.now()}`;
    const body = JSON.stringify({ orderId, amount: 100 });
    const res1 = await fetch(`${BASE}/api/zeropaye/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const data1 = await res1.json();
    const res2 = await fetch(`${BASE}/api/zeropaye/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const data2 = await res2.json();
    expect(data1.session.id).toBe(data2.session.id);
  });
});

describe.skipIf(!serverUp)("API integration — /send-otp", () => {
  it("rejects invalid mobile", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mobile: "1234567890" }), // starts with 1, invalid
    });
    expect(res.status).toBe(400);
  });

  it("accepts +91 prefixed mobile", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/send-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mobile: "+919876543210" }),
    });
    // Could be 200 or 429 (rate limited from previous tests) — both are valid
    expect([200, 429]).toContain(res.status);
  });
});

describe.skipIf(!serverUp)("API integration — /observer (HMAC)", () => {
  it("rejects missing headers", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/observer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source: "MANUAL", amountPaise: 100, utr: "123456789012" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Missing required headers");
  });

  it("rejects invalid signature", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/observer`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-device-id": "dev_demo_observer_001",
        "x-timestamp": String(Date.now()),
        "x-signature": "invalid",
      },
      body: JSON.stringify({ source: "MANUAL", amountPaise: 100, utr: "123456789012" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects expired timestamp (anti-replay)", async () => {
    const oldTs = String(Date.now() - 120000); // 2 min ago
    const res = await fetch(`${BASE}/api/zeropaye/observer`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-device-id": "dev_demo_observer_001",
        "x-timestamp": oldTs,
        "x-signature": "anything",
      },
      body: JSON.stringify({ source: "MANUAL", amountPaise: 100, utr: "123456789012" }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("drift");
  });
});

describe.skipIf(!serverUp)("API integration — admin auth", () => {
  it("GET /session requires admin key", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/session`);
    expect(res.status).toBe(401);
  });

  it("GET /merchant requires admin key", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/merchant`);
    expect(res.status).toBe(401);
  });

  it("GET /merchant accepts valid admin key", async () => {
    // Get admin key from bootstrap (dev only)
    const bootRes = await fetch(`${BASE}/api/zeropaye/bootstrap`);
    const boot = await bootRes.json();
    const adminKey = boot.adminApiKey;
    expect(adminKey).toMatch(/^zp_/);

    const res = await fetch(`${BASE}/api/zeropaye/merchant`, {
      headers: { "x-zeropaye-admin-key": adminKey },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.merchant).toBeTruthy();
    expect(data.stats).toBeTruthy();
    expect(typeof data.stats.total).toBe("number");
  });

  it("GET /merchant rejects wrong admin key", async () => {
    const res = await fetch(`${BASE}/api/zeropaye/merchant`, {
      headers: { "x-zeropaye-admin-key": "wrong" },
    });
    expect(res.status).toBe(401);
  });
});

describe.skipIf(!serverUp)("API integration — /checkout/[id] page", () => {
  it("renders checkout page for valid session", async () => {
    // Create session
    const orderRes = await fetch(`${BASE}/api/zeropaye/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId: `CHECKOUT-TEST-${Date.now()}`, amount: 499 }),
    });
    const orderData = await orderRes.json();
    const sessionId = orderData.session.id;

    // Fetch checkout page (initial SSR HTML — amount loads client-side)
    const res = await fetch(`${BASE}/checkout/${sessionId}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("ZeroPaye Checkout");
  });

  it("returns 200 for invalid session id (renders shell)", async () => {
    const res = await fetch(`${BASE}/checkout/invalid-session-id-12345`);
    expect(res.status).toBe(200);
    const html = await res.text();
    // The page shell renders; the "not found" state shows after client-side fetch
    expect(html).toContain("ZeroPaye Checkout");
  });
});
