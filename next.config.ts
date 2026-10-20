import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // v3.0 fix: ignoreBuildErrors was true — was hiding real type errors.
  // Now set to false so build catches type issues.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  // v3.0 C7 fix: checkout route needs frame-ancestors to allow merchant embeds.
  // All other routes keep frame-ancestors 'none' (X-Frame-Options DENY).
  async headers() {
    return [
      // v3.0: checkout route — allow iframe embedding (SDK loads this in iframe)
      {
        source: "/checkout/:id*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // v3.0: allow any origin for checkout iframe (merchant sites embed it)
          // In production, restrict to merchant's registered domain (configurable).
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors *", // v3.0: allow merchant sites to embed checkout
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      // All other routes — restrictive (no iframe embedding)
      {
        source: "/((?!checkout).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'", // v3.0: deny all other routes
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
