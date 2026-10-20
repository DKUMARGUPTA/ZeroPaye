// ZeroPaye — Gmail Observer (OAuth2 API polling)
//
// Uses Gmail API to poll the inbox for bank credit notification emails.
// Parses amount + UTR from email body and posts to ZeroPaye server.
//
// Requirements:
//   - Google Cloud project with Gmail API enabled
//   - OAuth2 credentials (credentials.json)
//   - User grants read-only Gmail access
//
// Setup: https://developers.google.com/gmail/api/quickstart/nodejs
//
// Usage:
//   import { GmailObserver } from "@/lib/zeropaye/gmail-observer";
//   const gmail = new GmailObserver(config, { credentialsPath: "./credentials.json" });
//   await gmail.start(); // opens OAuth flow, then polls
//   await gmail.stop();

import type { ObserverConfig, ObservationPayload } from "./observer-sdk";
import { postObservation, parseBankNotification } from "./observer-sdk";

export interface GmailConfig extends ObserverConfig {
  /** Path to Google OAuth2 credentials.json */
  credentialsPath?: string;
  /** Path to store OAuth token (default: ./gmail-token.json) */
  tokenPath?: string;
  /** Bank sender email patterns to match (default: common Indian banks) */
  senderFilters?: string[];
}

const DEFAULT_BANK_SENDERS = [
  "noreply@hdfcbank.com",
  "alerts@icicibank.com",
  "noreply@sbi.co.in",
  "noreply@axisbank.com",
  "noreply@kotak.com",
  "noreply@pnb.co.in",
  "noreply@bankofbaroda.com",
  "alerts@paytm.com",
  "noreply@phonepe.com",
  "noreply@upiaxisbank.com",
  "no-reply@yesbank.in",
  "alerts@rblbank.com",
  "noreply@idfcfirstbank.com",
  "noreply@aubank.in",
];

export class GmailObserver {
  private config: GmailConfig;
  private running = false;
  private gmail: any = null;
  private oauth2: any = null;
  private lastHistoryId: string | null = null;
  private listeners: Record<string, ((...args: any[]) => void)[]> = {};

  constructor(config: GmailConfig) {
    this.config = {
      credentialsPath: "./credentials.json",
      tokenPath: "./gmail-token.json",
      senderFilters: DEFAULT_BANK_SENDERS,
      pollIntervalMs: 10000, // 10s default for Gmail API
      ...config,
    };
  }

  on(event: "payment" | "error" | "ready", fn: (...args: any[]) => void) {
    (this.listeners[event] ||= []).push(fn);
  }

  private emit(event: string, ...args: any[]) {
    (this.listeners[event] || []).forEach((fn) => fn(...args));
  }

  async start(): Promise<void> {
    let googleapis: any;
    try {
      googleapis = await import("googleapis");
    } catch {
      throw new Error("googleapis not installed. Run: npm install googleapis");
    }

    const fs = await import("node:fs");
    const path = await import("node:path");

    // Load credentials
    const credPath = this.config.credentialsPath!;
    if (!fs.existsSync(credPath)) {
      throw new Error(
        `Gmail credentials not found at ${credPath}. Download from Google Cloud Console (Gmail API > Credentials).`,
      );
    }
    const credentials = JSON.parse(fs.readFileSync(credPath, "utf8"));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    this.oauth2 = new googleapis.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check for stored token
    let token: any = null;
    if (fs.existsSync(this.config.tokenPath!)) {
      token = JSON.parse(fs.readFileSync(this.config.tokenPath!, "utf8"));
      this.oauth2.setCredentials(token);
    } else {
      // OAuth flow — user opens URL in browser, pastes code
      const authUrl = this.oauth2.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/gmail.readonly"],
      });
      console.log("\n[GmailObserver] Authorize this app by visiting this URL:");
      console.log(authUrl);
      console.log("\n[GmailObserver] After authorization, paste the code here:");

      // In a real app, this would be a proper OAuth callback handler
      // For now, we read from stdin
      const code = await new Promise<string>((resolve) => {
        process.stdin.once("data", (data) => resolve(data.toString().trim()));
      });

      const { tokens } = await this.oauth2.getToken(code);
      this.oauth2.setCredentials(tokens);
      fs.writeFileSync(this.config.tokenPath!, JSON.stringify(tokens));
      console.log("[GmailObserver] Token stored at", this.config.tokenPath);
    }

    this.gmail = googleapis.google.gmail({ version: "v1", auth: this.oauth2 });
    console.log("[GmailObserver] Connected! Monitoring for bank credit emails...");
    this.emit("ready");
    this.running = true;

    // Start polling
    this.poll();
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        await this.checkForNewEmails();
      } catch (e: any) {
        this.emit("error", e);
        console.error("[GmailObserver] Poll error:", e.message);
      }
      await new Promise((r) => setTimeout(r, this.config.pollIntervalMs!));
    }
  }

  private async checkForNewEmails(): Promise<void> {
    // Search for recent unread bank emails
    const query = `is:unread newer_than:5m (${this.config.senderFilters!.map((s) => `from:${s}`).join(" OR ")})`;

    const res = await this.gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 10,
    });

    const messages = res.data.messages || [];
    for (const msg of messages) {
      if (this.lastHistoryId === msg.id) continue;
      this.lastHistoryId = msg.id;

      // Fetch full message
      const full = await this.gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      // Extract text from body
      const text = this.extractText(full.data);
      if (!text) continue;

      // Parse bank notification
      const bankData = parseBankNotification(text);
      if (bankData.utr && bankData.amountPaise) {
        const payload: ObservationPayload = {
          source: "GMAIL",
          rawText: text.slice(0, 2000),
          amountPaise: bankData.amountPaise,
          utr: bankData.utr,
          receivingAccountId: this.config.receivingAccountId,
        };
        this.emit("payment", payload);
        await postObservation(this.config, payload);
      }
    }
  }

  private extractText(messageData: any): string {
    const parts = messageData.payload?.parts || [];
    let text = "";

    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        text = Buffer.from(part.body.data, "base64").toString("utf8");
        break;
      }
    }

    // Fallback to HTML if no plain text
    if (!text) {
      for (const part of parts) {
        if (part.mimeType === "text/html" && part.body?.data) {
          const html = Buffer.from(part.body.data, "base64").toString("utf8");
          // Strip HTML tags
          text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          break;
        }
      }
    }

    // Also check snippet
    if (!text && messageData.snippet) {
      text = messageData.snippet;
    }

    return text;
  }

  async stop(): Promise<void> {
    this.running = false;
    console.log("[GmailObserver] Stopped.");
  }
}
