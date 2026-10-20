"use client";

const TECH = [
  "Next.js 16", "TypeScript 5", "Prisma ORM", "PostgreSQL",
  "Tailwind CSS 4", "shadcn/ui", "Framer Motion", "Vitest",
  "WhatsApp Web", "Gmail API", "Puppeteer", "HMAC-SHA256",
  "AGPL-3.0", "PWA", "OpenAPI", "Docker-ready",
];

export function TechMarquee() {
  return (
    <div className="relative overflow-hidden py-4 border-y border-border/40 bg-muted/20">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...TECH, ...TECH].map((tech, i) => (
          <span
            key={i}
            className="mx-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" />
            {tech}
          </span>
        ))}
      </div>
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
