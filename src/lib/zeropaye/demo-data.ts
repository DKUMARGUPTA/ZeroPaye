// ZeroPaye — Demo data layer (v3.3)
// When DEMO_ADMIN_KEY is set AND database tables don't exist,
// this module provides in-memory mock data so the demo works
// without needing to run `prisma db push`.
//
// This is ONLY for the public demo deployment (Vercel).
// Real deployments must have a working database.

import { logger } from "./workers";

export interface DemoMerchant {
  id: string;
  businessName: string;
  publicApiKey: string;
  adminApiKey: string;
  webhookSecret: string;
  webhookUrl: string | null;
  branding: string;
  defaultVpa: string;
}

export interface DemoSession {
  id: string;
  merchantId: string;
  receivingAccountId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  description: string | null;
  customerName: string | null;
  status: string;
  queuePosition: number | null;
  utr: string | null;
  verificationTier: number;
  expiresAt: string | null;
  activatedAt: string | null;
  processingAt: string | null;
  settledAt: string | null;
  createdAt: string;
}

export interface DemoAccount {
  id: string;
  merchantId: string;
  vpa: string;
  accountName: string;
  isSlotBusy: boolean;
  dailyLimitPaise: number;
}

// In-memory storage (resets on serverless cold start — fine for demo)
const mockSessions: DemoSession[] = [];
let mockSlotBusy = false;
const mockSessionCounter = { value: 0 };

export function isDemoMode(): boolean {
  return !!process.env.DEMO_ADMIN_KEY;
}

export function getDemoMerchantData(): DemoMerchant {
  return {
    id: "demo_merchant_locked",
    businessName: "ZeroPaye Demo Merchant",
    publicApiKey: process.env.DEMO_PUBLIC_KEY || "zp_demo_public_key_locked_001",
    adminApiKey: process.env.DEMO_ADMIN_KEY!,
    webhookSecret: process.env.DEMO_WEBHOOK_SECRET || "demo_webhook_secret_locked",
    webhookUrl: null,
    branding: JSON.stringify({
      brandName: "ZeroPaye",
      tagline: "Zero • Empowering • Reliable • Open • Payé",
      accentColor: "#0d9488",
      gradientFrom: "#0d9488",
      gradientTo: "#0891b2",
      logoText: "ZeroPaye",
    }),
    defaultVpa: process.env.DEMO_VPA || "zeropaye.demo@upi",
  };
}

export function getDemoAccountData(): DemoAccount {
  return {
    id: "demo_account_locked",
    merchantId: "demo_merchant_locked",
    vpa: process.env.DEMO_VPA || "zeropaye.demo@upi",
    accountName: "ZeroPaye Demo Store",
    isSlotBusy: mockSlotBusy,
    dailyLimitPaise: 10000000,
  };
}

export function createDemoSession(orderId: string, amountPaise: number, description?: string, customerName?: string): DemoSession {
  mockSessionCounter.value++;
  const suffixPaise = Math.floor(Math.random() * 99) + 1;
  const session: DemoSession = {
    id: `demo_session_${mockSessionCounter.value}_${Date.now().toString(36)}`,
    merchantId: "demo_merchant_locked",
    receivingAccountId: "demo_account_locked",
    orderId,
    amountPaise: amountPaise + suffixPaise,
    currency: "INR",
    description: description || null,
    customerName: customerName || null,
    status: "INITIATED",
    queuePosition: null,
    utr: null,
    verificationTier: 0,
    expiresAt: null,
    activatedAt: null,
    processingAt: null,
    settledAt: null,
    createdAt: new Date().toISOString(),
  };
  mockSessions.unshift(session);
  // Keep only last 20 sessions
  if (mockSessions.length > 20) mockSessions.length = 20;
  return session;
}

export function getDemoSessions(): DemoSession[] {
  return mockSessions;
}

export function findDemoSession(id: string): DemoSession | null {
  return mockSessions.find(s => s.id === id) || null;
}

export function updateDemoSession(id: string, update: Partial<DemoSession>): DemoSession | null {
  const session = mockSessions.find(s => s.id === id);
  if (!session) return null;
  Object.assign(session, update);
  return session;
}

export function getDemoStats() {
  const total = mockSessions.length;
  const success = mockSessions.filter(s => s.status === "SUCCESS").length;
  const active = mockSessions.filter(s => ["ACTIVE", "PROCESSING"].includes(s.status)).length;
  const queued = mockSessions.filter(s => s.status === "QUEUED").length;
  const failed = mockSessions.filter(s => ["FAILED", "EXPIRED", "CANCELLED"].includes(s.status)).length;
  const settledRows = mockSessions.filter(s => s.status === "SUCCESS");
  const totalSettledPaise = settledRows.reduce((a, s) => a + s.amountPaise, 0);
  const feesSavedPaise = Math.round(totalSettledPaise * 0.022);
  return {
    total, success, active, queued, failed,
    totalSettledPaise, feesSavedPaise,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
  };
}

export function setDemoSlotBusy(busy: boolean) {
  mockSlotBusy = busy;
}

// Seed some demo sessions for initial dashboard display
export function seedDemoSessions() {
  if (mockSessions.length > 0) return;
  const seedData = [
    { orderId: "DEMO-ORD-001", amountPaise: 49900 + 7, status: "SUCCESS", utr: "123456789012", customerName: "Arjun Sharma", minutesAgo: 5 },
    { orderId: "DEMO-ORD-002", amountPaise: 150000 + 13, status: "SUCCESS", utr: "987654321098", customerName: "Priya Gupta", minutesAgo: 12 },
    { orderId: "DEMO-ORD-003", amountPaise: 1000 + 45, status: "SUCCESS", utr: "456789012345", customerName: "Rohan Verma", minutesAgo: 25 },
    { orderId: "DEMO-ORD-004", amountPaise: 29900 + 23, status: "ACTIVE", utr: null, customerName: "Test User", minutesAgo: 1 },
    { orderId: "DEMO-ORD-005", amountPaise: 7500 + 89, status: "EXPIRED", utr: null, customerName: null, minutesAgo: 35 },
  ];
  for (const s of seedData) {
    const created = new Date(Date.now() - s.minutesAgo * 60 * 1000);
    mockSessions.push({
      id: `demo_session_seed_${s.orderId}`,
      merchantId: "demo_merchant_locked",
      receivingAccountId: "demo_account_locked",
      orderId: s.orderId,
      amountPaise: s.amountPaise,
      currency: "INR",
      description: "Demo payment",
      customerName: s.customerName,
      status: s.status,
      queuePosition: null,
      utr: s.utr,
      verificationTier: s.status === "SUCCESS" ? 1 : 0,
      expiresAt: s.status === "ACTIVE" ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null,
      activatedAt: s.status === "ACTIVE" ? created.toISOString() : null,
      processingAt: null,
      settledAt: s.status === "SUCCESS" ? created.toISOString() : null,
      createdAt: created.toISOString(),
    });
  }
  if (mockSessions.some(s => s.status === "ACTIVE")) {
    mockSlotBusy = true;
  }
}

// Initialize seed data on module load
if (isDemoMode()) {
  seedDemoSessions();
  logger.info("demo-mode-initialized", { sessions: mockSessions.length });
}
