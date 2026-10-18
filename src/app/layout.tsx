import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ZeroPayeThemeProvider } from "@/components/zeropaye/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZeroPaye — Zero • Empowering • Reliable • Open • Payé (UPI)",
  description:
    "ZeroPaye is a 100% open-source, zero-fee UPI payment gateway for India. Direct-to-bank P2P settlement, no middlemen, no hidden fees. Built for small merchants, freelancers, and startups.",
  keywords: [
    "ZeroPaye", "UPI", "payment gateway", "open source", "India", "zero fee",
    "free payment gateway", "self-hosted", "AGPL", "merchant", "checkout",
  ],
  authors: [{ name: "ZeroPaye Project" }],
  openGraph: {
    title: "ZeroPaye — Zero-Fee Open-Source UPI Payment Gateway",
    description: "Zero • Empowering • Reliable • Open • Payé. 100% free for everyone, forever.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZeroPaye — Zero-Fee UPI Payment Gateway",
    description: "Zero • Empowering • Reliable • Open • Payé (UPI). Open-source, AGPL-3.0.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ZeroPayeThemeProvider>{children}</ZeroPayeThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
