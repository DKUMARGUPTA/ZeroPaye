import { Header } from "@/components/zeropaye/header";
import { Hero } from "@/components/zeropaye/hero";
import { TechMarquee } from "@/components/zeropaye/tech-marquee";
import { Acronym } from "@/components/zeropaye/acronym";
import { Comparison } from "@/components/zeropaye/comparison";
import { CheckoutDemo } from "@/components/zeropaye/checkout-demo";
import { Dashboard } from "@/components/zeropaye/dashboard";
import { Security } from "@/components/zeropaye/security";
import { Features } from "@/components/zeropaye/features";
import { Developer } from "@/components/zeropaye/developer";
import { FreeForever } from "@/components/zeropaye/free-forever";
import { Footer } from "@/components/zeropaye/footer";
import { LiveTransactionFeed } from "@/components/zeropaye/live-transaction-feed";
import { AnimatedHeroStats } from "@/components/zeropaye/animated-hero-stats";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <Header />
      <main id="main-content" className="flex-1">
        {/* Hero with live stats */}
        <Hero />

        {/* Tech stack marquee */}
        <TechMarquee />

        {/* Live transaction feed + animated stats */}
        <section className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Left — animated stats */}
              <div>
                <AnimatedHeroStats />
              </div>
              {/* Right — live transaction feed */}
              <div>
                <LiveTransactionFeed />
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <Acronym />

        {/* Comparison */}
        <Comparison />

        {/* Live Demo */}
        <CheckoutDemo />

        {/* Dashboard */}
        <Dashboard />

        {/* Features */}
        <Features />

        {/* Security */}
        <Security />

        {/* Developer */}
        <Developer />

        {/* Free Forever */}
        <FreeForever />
      </main>
      <Footer />
    </div>
  );
}
