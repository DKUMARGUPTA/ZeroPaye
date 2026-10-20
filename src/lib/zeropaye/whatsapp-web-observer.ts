// ZeroPaye — WhatsApp Web Observer (Puppeteer-based)
//
// Opens WhatsApp Web in a headless browser, waits for QR scan pairing,
// then monitors incoming messages for:
//   - Bank SMS notifications (forwarded to WhatsApp via WhatsApp's SMS feature)
//   - Direct OTP messages from banks
//   - UPI credit notifications
//
// Detected observations are HMAC-signed and POSTed to ZeroPaye server.
//
// Requirements: puppeteer (npm install puppeteer)
// Runtime: Node.js 20+ (uses puppeteer for browser automation)
//
// Usage:
//   import { WhatsAppWebObserver } from "@/lib/zeropaye/whatsapp-web-observer";
//   const wa = new WhatsAppWebObserver(config);
//   await wa.start();
//   // User scans QR code shown in console
//   // wa.on("observation", (payload) => console.log("Detected:", payload));
//   await wa.stop();

import type { ObserverConfig, ObservationPayload } from "./observer-sdk";
import { postObservation, parseBankNotification, parseOtp } from "./observer-sdk";

export type { ObserverConfig };

export class WhatsAppWebObserver {
  private config: ObserverConfig;
  private browser: any = null;
  private page: any = null;
  private running = false;
  private lastMessageId: string | null = null;
  private listeners: Record<string, ((...args: any[]) => void)[]> = {};

  constructor(config: ObserverConfig) {
    this.config = {
      pollIntervalMs: 5000,
      ...config,
    };
  }

  on(event: "observation" | "otp" | "payment" | "error" | "ready", fn: (...args: any[]) => void) {
    (this.listeners[event] ||= []).push(fn);
  }

  private emit(event: string, ...args: any[]) {
    (this.listeners[event] || []).forEach((fn) => fn(...args));
  }

  /**
   * Start the observer. Opens WhatsApp Web, waits for QR scan.
   * Resolves when WhatsApp Web is ready (after QR scan).
   */
  async start(): Promise<void> {
    let puppeteer: any;
    try {
      puppeteer = await import("puppeteer");
    } catch {
      throw new Error("puppeteer not installed. Run: npm install puppeteer");
    }

    this.browser = await puppeteer.launch({
      headless: false, // must be visible for QR scan
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    console.log("[WhatsAppWebObserver] Opening WhatsApp Web...");
    await this.page.goto("https://web.whatsapp.com", { waitUntil: "networkidle2" });

    // Wait for QR code to appear (or login if already paired)
    await this.waitForLogin();
    console.log("[WhatsAppWebObserver] WhatsApp Web ready! Monitoring messages...");
    this.emit("ready");
    this.running = true;

    // Start polling loop
    this.poll();
  }

  private async waitForLogin(): Promise<void> {
    // Wait for either QR code (not logged in) or chat list (logged in)
    for (let i = 0; i < 60; i++) {
      // 5 min timeout
      const isLoggedIn = await this.page.evaluate(() => {
        // Check if chat list is visible (logged in)
        return !!document.querySelector('[data-testid="chat-list"], #pane-side');
      });
      if (isLoggedIn) return;

      // Print QR code to console for user to scan
      if (i === 0) {
        console.log("[WhatsAppWebObserver] Please scan the QR code shown in the browser window.");
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    throw new Error("Timed out waiting for WhatsApp Web login (5 min). Please scan QR code.");
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        await this.checkForNewMessages();
      } catch (e: any) {
        this.emit("error", e);
      }
      await new Promise((r) => setTimeout(r, this.config.pollIntervalMs!));
    }
  }

  private async checkForNewMessages(): Promise<void> {
    // Get all unread message notifications
    const messages = await this.page.evaluate(() => {
      const results: Array<{ id: string; text: string; sender: string }> = [];

      // WhatsApp Web shows messages in chat panels
      // Look for unread message badges (green dot with count)
      const unreadChats = document.querySelectorAll('[data-testid="unread-count"], .unread-count');

      // Also check the most recent messages in the visible chat
      const messageEls = document.querySelectorAll(
        '[data-testid="msg-container"], .message-in, .message-out',
      );

      for (const el of messageEls) {
        const textEl = el.querySelector('[data-testid="conversation-text"], .selectable-text');
        const text = textEl?.textContent?.trim() || "";
        const id = el.getAttribute("data-id") || text.substring(0, 50);

        if (text && id) {
          results.push({
            id,
            text,
            sender: el.closest(".message-in") ? "incoming" : "outgoing",
          });
        }
      }

      return results;
    });

    for (const msg of messages) {
      if (msg.sender !== "incoming") continue; // only incoming
      if (this.lastMessageId === msg.id) continue; // skip already processed
      this.lastMessageId = msg.id;

      // Try to parse as bank notification (UTR + amount)
      const bankData = parseBankNotification(msg.text);
      if (bankData.utr && bankData.amountPaise) {
        const payload: ObservationPayload = {
          source: "WHATSAPP_WEB",
          rawText: msg.text.slice(0, 2000),
          amountPaise: bankData.amountPaise,
          utr: bankData.utr,
          receivingAccountId: this.config.receivingAccountId,
        };
        this.emit("payment", payload);
        await postObservation(this.config, payload);
        continue;
      }

      // Try to parse as OTP
      const otp = parseOtp(msg.text);
      if (otp) {
        this.emit("otp", { otp, rawText: msg.text });
        // OTPs are not posted to /observer (they're for the customer's checkout)
        // In a real implementation, this would trigger the verify-otp flow
      }
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    console.log("[WhatsAppWebObserver] Stopped.");
  }
}
