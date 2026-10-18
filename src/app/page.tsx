import { Header } from "@/components/zeropaye/header";
import { Hero } from "@/components/zeropaye/hero";
import { Acronym } from "@/components/zeropaye/acronym";
import { Comparison } from "@/components/zeropaye/comparison";
import { CheckoutDemo } from "@/components/zeropaye/checkout-demo";
import { Dashboard } from "@/components/zeropaye/dashboard";
import { Security } from "@/components/zeropaye/security";
import { Features } from "@/components/zeropaye/features";
import { Developer } from "@/components/zeropaye/developer";
import { FreeForever } from "@/components/zeropaye/free-forever";
import { Footer } from "@/components/zeropaye/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip-to-content link (accessibility — WCAG 2.1 SC 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <Header />
      <main id="main-content" className="flex-1">
        <Hero />
        <Acronym />
        <Comparison />
        <CheckoutDemo />
        <Dashboard />
        <Features />
        <Security />
        <Developer />
        <FreeForever />
      </main>
      <Footer />
    </div>
  );
}
