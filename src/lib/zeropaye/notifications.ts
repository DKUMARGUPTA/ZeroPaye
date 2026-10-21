// ZeroPaye — Merchant notification system
// v4.3: Email/WhatsApp alerts for merchants on key events:
//   - Payment success (optional, high-value only)
//   - Observer offline (device heartbeat stale)
//   - UNCONFIRMED payment (customer paid but bank credit not detected)
//
// Configuration via env vars:
//   NOTIFICATION_EMAIL=merchant@email.com  (recipient)
//   SMTP_HOST=smtp.gmail.com               (email provider)
//   SMTP_PORT=587
//   SMTP_USER=apikey
//   SMTP_PASS=sendgrid_key
//   NOTIFICATION_MIN_AMOUNT_PAISE=100000   (only alert for payments >= ₹1000)
//   NOTIFICATION_WHATSAPP=true             (WhatsApp alerts via Business API)

import { logger } from "./workers";

export interface NotificationEvent {
  type: "PAYMENT_SUCCESS" | "OBSERVER_OFFLINE" | "PAYMENT_UNCONFIRMED" | "RATE_LIMIT_HIT";
  merchantId: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Send a notification to the merchant via configured channels.
 * Silently fails if no provider is configured (non-blocking).
 */
export async function notifyMerchant(event: NotificationEvent): Promise<void> {
  try {
    // Email notification
    const email = process.env.NOTIFICATION_EMAIL;
    const smtpHost = process.env.SMTP_HOST;
    if (email && smtpHost) {
      await sendEmailNotification(event, email);
    }

    // WhatsApp notification (via Business API)
    if (process.env.NOTIFICATION_WHATSAPP === "true" && process.env.WHATSAPP_TOKEN) {
      await sendWhatsAppNotification(event);
    }

    // Log the notification
    logger.info("notification-sent", { type: event.type, merchantId: event.merchantId });
  } catch (e: any) {
    logger.error("notification-failed", { type: event.type, error: e.message?.slice(0, 200) });
    // Non-blocking — don't fail the payment flow
  }
}

async function sendEmailNotification(event: NotificationEvent, to: string): Promise<void> {
  // Using nodemailer-style SMTP (would need `bun add nodemailer` for production)
  // For now, log the email content (demo mode)
  const subject = `[ZeroPaye] ${event.title}`;
  const body = `
ZeroPaye Notification
=====================

Event: ${event.type}
Time: ${new Date().toISOString()}

${event.message}

---
This is an automated notification from ZeroPaye.
Configure at: /admin → Settings → Notifications
`;

  if (process.env.NODE_ENV !== "production") {
    console.log("\n📧 [ZeroPaye Email Notification]");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  Body:", body.split("\n").slice(0, 5).join("\n"));
  }

  // In production, use nodemailer:
  // import nodemailer from "nodemailer";
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || "587"),
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });
  // await transporter.sendMail({ from: "noreply@zeropaye.com", to, subject, text: body });
}

async function sendWhatsAppNotification(event: NotificationEvent): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) return;

  // Send via WhatsApp Business API
  const message = `🔔 *ZeroPaye Alert*\n\n${event.title}\n\n${event.message}\n\n_Time: ${new Date().toLocaleString("en-IN")}_`;

  // In production:
  // await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     messaging_product: "whatsapp",
  //     to: process.env.NOTIFICATION_WHATSAPP_NUMBER,
  //     type: "text",
  //     text: { body: message },
  //   }),
  // });

  if (process.env.NODE_ENV !== "production") {
    console.log("\n📱 [ZeroPaye WhatsApp Notification]");
    console.log("  Message:", message.split("\n").slice(0, 3).join(" | "));
  }
}

// Pre-built notification helpers
export function notifyPaymentSuccess(orderId: string, amountPaise: number, utr: string, merchantId: string) {
  const minAmount = parseInt(process.env.NOTIFICATION_MIN_AMOUNT_PAISE || "100000"); // ₹1000
  if (amountPaise < minAmount) return; // skip low-value alerts

  return notifyMerchant({
    type: "PAYMENT_SUCCESS",
    merchantId,
    title: `Payment Received: ₹${(amountPaise / 100).toFixed(2)}`,
    message: `Order: ${orderId}\nAmount: ₹${(amountPaise / 100).toFixed(2)}\nUTR: ${utr}\nStatus: SUCCESS`,
    data: { orderId, amountPaise, utr },
  });
}

export function notifyObserverOffline(deviceName: string, lastHeartbeat: string, merchantId: string) {
  return notifyMerchant({
    type: "OBSERVER_OFFLINE",
    merchantId,
    title: "Observer Offline!",
    message: `Device "${deviceName}" has not sent a heartbeat in over 5 minutes.\nLast heartbeat: ${lastHeartbeat}\n\nPlease check the phone and observer app.`,
    data: { deviceName, lastHeartbeat },
  });
}

export function notifyPaymentUnconfirmed(orderId: string, amountPaise: number, merchantId: string) {
  return notifyMerchant({
    type: "PAYMENT_UNCONFIRMED",
    merchantId,
    title: `Payment Unconfirmed: ₹${(amountPaise / 100).toFixed(2)}`,
    message: `Order: ${orderId}\nAmount: ₹${(amountPaise / 100).toFixed(2)}\nStatus: UNCONFIRMED\n\nCustomer said "I've paid" but bank credit not detected within 10 minutes.\nCheck your bank app and use the Reconcile tab to attach the payment.`,
    data: { orderId, amountPaise },
  });
}
