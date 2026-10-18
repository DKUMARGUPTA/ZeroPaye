// ZeroPaye custom pillar icons (SVG via lucide-style props)
// Avoids blue/indigo per design rules; uses teal/cyan/emerald palette.

import { SVGProps } from "react";

export function ZeroIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="12" rx="8" ry="9" />
      <path d="M12 3v18" strokeOpacity="0.0" />
      <path d="M8 8.5c1-1.2 2.3-2 4-2 2.8 0 5 2.4 5 5.5 0 1.3-.4 2.4-1 3.3" />
      <path d="M16 15.5c-1 1.2-2.3 2-4 2-2.8 0-5-2.4-5-5.5 0-1.3.4-2.4 1-3.3" />
    </svg>
  );
}

export function OpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 7c0-2.2 2.7-4 6-4s6 1.8 6 4v10c0-2.2-2.7-4-6-4s-6 1.8-6 4" />
      <path d="M12 7c0-2.2-2.7-4-6-4S0 4.8 0 7v10c0-2.2 2.7-4 6-4s6 1.8 6 4" />
      <path d="M12 7v13" />
    </svg>
  );
}

export function DirectIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12h13" />
      <path d="M16 7l5 5-5 5" />
      <circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="21" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EmpowerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function EffortlessIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

export function PayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="6" width="20" height="13" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
      <path d="M15 14.5a1.5 1.5 0 0 0 3 0c0-1.5-3-1-3-2.5a1.5 1.5 0 0 1 3 0" />
    </svg>
  );
}

export function QrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3h-3z" />
      <path d="M20 14v3" />
      <path d="M14 20h7" />
      <path d="M20 20h1" />
    </svg>
  );
}

export function ObserverIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function QueueIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="14" height="4" rx="1" />
      <rect x="3" y="16" width="10" height="4" rx="1" />
    </svg>
  );
}

export function ShieldLockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" />
      <rect x="9.5" y="11" width="5" height="4" rx="0.5" />
      <path d="M10.5 11V9.5a1.5 1.5 0 0 1 3 0V11" />
    </svg>
  );
}

export function HmacIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M5 12H3" />
      <path d="M21 12h-2" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8v8" />
    </svg>
  );
}
