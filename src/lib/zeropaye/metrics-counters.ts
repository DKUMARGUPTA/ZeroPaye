// ZeroPaye — Metrics counters (shared across all routes)
// v4.2: Extracted from metrics/route.ts so other routes can import incCounter
// without importing a route file (which causes tsc errors).

const counters: Record<string, number> = {
  zeropaye_requests_total: 0,
  zeropaye_otp_sent_total: 0,
  zeropaye_otp_verified_total: 0,
  zeropaye_payments_success_total: 0,
  zeropaye_payments_failed_total: 0,
  zeropaye_webhook_dispatched_total: 0,
};

export function incCounter(name: keyof typeof counters, by = 1) {
  counters[name] = (counters[name] || 0) + by;
}

export function getCounters() {
  return { ...counters };
}
