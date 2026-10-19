"use client";

import { ShieldCheck, Heart, Github } from "lucide-react";

const LINKS = {
  Product: ["Live Demo", "Dashboard", "Security", "Developers", "Free Forever"],
  Community: ["GitHub", "Issues", "Discussions", "Contributing", "Code of Conduct"],
  Resources: ["Documentation", "API Reference", "Architecture", "Self-Host Guide", "White-Label"],
  Legal: ["AGPL-3.0 License", "Privacy (we don't track)", "Security Disclosure", "No Cookies"],
};

export function Footer() {
  return (
    <footer className="mt-auto relative overflow-hidden border-t border-border/40 bg-muted/20">
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-brand opacity-30" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-md glow-teal">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="leading-none">
                <div className="text-lg font-bold">ZeroPaye</div>
                <div className="text-[10px] text-muted-foreground">Zero • Empowering • Reliable • Open • Payé</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Bharat ka apna zero-fee, open-source UPI payment gateway. Built for
              every dukaandaar, freelancer aur startup. Paisa seedhe bank mein.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a
                href="https://github.com/DKUMARGUPTA/ZeroPaye"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 hover:bg-accent hover:border-teal-500/40 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/ideepakkumargread"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 hover:bg-accent hover:border-teal-500/40 transition-colors"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(LINKS).map(([group, items]) => (
              <div key={group}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{group}</h4>
                <ul className="mt-3 space-y-2">
                  {items.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ZeroPaye Project · AGPL-3.0 · Made for Bharat, by Bharat.
          </p>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            Built with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> and open source
          </p>
        </div>
      </div>
    </footer>
  );
}
