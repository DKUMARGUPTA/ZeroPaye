"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { ShieldCheck, Menu, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const NAV = [
  { id: "mission", label: "Mission" },
  { id: "demo", label: "Live Demo" },
  { id: "dashboard", label: "Dashboard" },
  { id: "security", label: "Security" },
  { id: "developers", label: "Developers" },
  { id: "free", label: "Free Forever" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section for nav highlight
  useEffect(() => {
    const sections = ["top", ...NAV.map((n) => n.id)];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "glass border-b border-border/40 shadow-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => go("top")} className="flex items-center gap-2.5 group" aria-label="ZeroPaye home">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-md transition-transform group-hover:scale-105 glow-teal">
            <ShieldCheck className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-lg font-bold tracking-tight">ZeroPaye</span>
            <span className="text-[10px] font-medium text-muted-foreground">0% fee • 100% open</span>
          </div>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active === n.id
                  ? "text-foreground bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
              }`}
            >
              {n.label}
              {active === n.id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-brand" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/DKUMARGUPTA/ZeroPaye"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="ghost" size="sm" className="rounded-full gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.7 1 .7 2v3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
              Star
            </Button>
          </a>
          <Button
            size="sm"
            onClick={() => go("demo")}
            className="rounded-full bg-gradient-brand text-white shadow-md glow-teal hover:opacity-90 transition-opacity sm:inline-flex"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Try Demo
          </Button>
          <ThemeToggle />
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="glass border-t border-border/40 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  active === n.id
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                {n.label}
              </button>
            ))}
            <Button
              size="sm"
              onClick={() => go("demo")}
              className="mt-2 rounded-full bg-gradient-brand text-white"
            >
              Try Live Demo
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
