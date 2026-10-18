"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { ShieldCheck, Menu, X } from "lucide-react";
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-border/60 bg-background/80 backdrop-blur-xl shadow-sm"
          : "border-transparent bg-background/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => go("top")} className="flex items-center gap-2.5 group" aria-label="ZeroPaye home">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/30 transition-transform group-hover:scale-105">
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
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex"
          >
            <Button variant="outline" size="sm" className="rounded-full">
              Star on GitHub
            </Button>
          </a>
          <Button
            size="sm"
            onClick={() => go("demo")}
            className="hidden rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 sm:inline-flex"
          >
            Try Live Demo
          </Button>
          <ThemeToggle />
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {n.label}
              </button>
            ))}
            <Button
              size="sm"
              onClick={() => go("demo")}
              className="mt-1 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white"
            >
              Try Live Demo
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
