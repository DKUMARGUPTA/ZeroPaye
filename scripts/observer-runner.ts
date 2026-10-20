#!/usr/bin/env node
// ZeroPaye Observer Runner — standalone CLI to start WhatsApp Web + Gmail observers
//
// Usage:
//   bun run scripts/observer-runner.ts --whatsapp --device-id=xxx --signing-key=xxx
//   bun run scripts/observer-runner.ts --gmail --credentials=./credentials.json
//   bun run scripts/observer-runner.ts --all
//
// This script starts the observation services that monitor for bank notifications
// and POST them to the ZeroPaye server (HMAC-signed).

import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    whatsapp: { type: "boolean", default: false },
    gmail: { type: "boolean", default: false },
    all: { type: "boolean", default: false },
    "server-url": { type: "string", default: "http://localhost:3000" },
    "device-id": { type: "string" },
    "signing-key": { type: "string" },
    "receiving-account-id": { type: "string" },
    "credentials": { type: "string", default: "./credentials.json" },
    "poll-interval": { type: "string", default: "5000" },
    help: { type: "boolean", default: false },
  },
});

if (values.help) {
  console.log(`
ZeroPaye Observer Runner

Usage:
  bun run scripts/observer-runner.ts [options]

Options:
  --whatsapp                   Start WhatsApp Web observer (Puppeteer)
  --gmail                      Start Gmail observer (OAuth2 API)
  --all                        Start both observers
  --server-url=<url>           ZeroPaye server URL (default: http://localhost:3000)
  --device-id=<id>             Device ID (from /observer/pair)
  --signing-key=<key>          HMAC signing key (from /observer/pair)
  --receiving-account-id=<id>  Receiving account ID (the VPA this watches)
  --credentials=<path>         Gmail OAuth2 credentials.json path (default: ./credentials.json)
  --poll-interval=<ms>         Polling interval (default: 5000)
  --help                       Show this help

Setup:
  1. Pair a device:
     curl -X POST http://localhost:3000/api/zeropaye/observer/pair \\
       -H "x-zeropaye-admin-key: zp_..." \\
       -H "content-type: application/json" \\
       -d '{"deviceName":"My WhatsApp Observer"}'
     # Save the deviceId + signingKey from response

  2. Start observer:
     bun run scripts/observer-runner.ts --whatsapp \\
       --device-id=dev_xxx \\
       --signing-key=abc123... \\
       --receiving-account-id=cmvd...
`);
  process.exit(0);
}

async function main() {
  const runAll = values.all;
  const runWhatsApp = values.whatsapp || runAll;
  const runGmail = values.gmail || runAll;

  if (!runWhatsApp && !runGmail) {
    console.error("Error: specify --whatsapp, --gmail, or --all");
    process.exit(1);
  }

  if (!values["device-id"] || !values["signing-key"] || !values["receiving-account-id"]) {
    console.error("Error: --device-id, --signing-key, and --receiving-account-id are required");
    console.error("Run with --help for setup instructions");
    process.exit(1);
  }

  const config = {
    serverUrl: values["server-url"]!,
    deviceId: values["device-id"]!,
    signingKey: values["signing-key"]!,
    receivingAccountId: values["receiving-account-id"]!,
    pollIntervalMs: parseInt(values["poll-interval"]!, 10),
  };

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║    ZeroPaye Observer Runner v3.1            ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  Server:    ${config.serverUrl.padEnd(32)}║`);
  console.log(`║  Device:    ${config.deviceId.padEnd(32)}║`);
  console.log(`║  Account:   ${config.receivingAccountId.padEnd(32)}║`);
  console.log(`║  WhatsApp:  ${(runWhatsApp ? "ON" : "OFF").padEnd(32)}║`);
  console.log(`║  Gmail:     ${(runGmail ? "ON" : "OFF").padEnd(32)}║`);
  console.log("╚══════════════════════════════════════════════╝");

  const observers: any[] = [];

  if (runWhatsApp) {
    try {
      const { WhatsAppWebObserver } = await import("../src/lib/zeropaye/whatsapp-web-observer");
      const wa = new WhatsAppWebObserver(config);
      wa.on("payment", (payload: any) => {
        console.log(`\n✅ [WhatsApp] Payment detected: UTR=${payload.utr}, amount=${payload.amountPaise / 100}`);
      });
      wa.on("otp", (data: any) => {
        console.log(`\n📱 [WhatsApp] OTP detected: ${data.otp}`);
      });
      wa.on("ready", () => console.log("✅ WhatsApp Web observer ready"));
      wa.on("error", (e: any) => console.error("❌ WhatsApp error:", e.message));
      await wa.start();
      observers.push(wa);
    } catch (e: any) {
      console.error("Failed to start WhatsApp observer:", e.message);
      console.error("Install puppeteer: bun add puppeteer");
    }
  }

  if (runGmail) {
    try {
      const { GmailObserver } = await import("../src/lib/zeropaye/gmail-observer");
      const gmail = new GmailObserver({
        ...config,
        credentialsPath: values.credentials,
      });
      gmail.on("payment", (payload: any) => {
        console.log(`\n✅ [Gmail] Payment detected: UTR=${payload.utr}, amount=${payload.amountPaise / 100}`);
      });
      gmail.on("ready", () => console.log("✅ Gmail observer ready"));
      gmail.on("error", (e: any) => console.error("❌ Gmail error:", e.message));
      await gmail.start();
      observers.push(gmail);
    } catch (e: any) {
      console.error("Failed to start Gmail observer:", e.message);
      console.error("Install googleapis: bun add googleapis");
      console.error("Get credentials: https://developers.google.com/gmail/api/quickstart/nodejs");
    }
  }

  if (observers.length === 0) {
    console.error("\nNo observers started. Check errors above.");
    process.exit(1);
  }

  console.log("\nObservers running. Press Ctrl+C to stop.\n");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nStopping observers...");
    for (const obs of observers) {
      if (obs.stop) await obs.stop();
    }
    process.exit(0);
  });
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
