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
      <Header />
      <main className="flex-1">
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
