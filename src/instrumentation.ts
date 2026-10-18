// ZeroPaye — Server instrumentation (Next.js 16)
// Runs once when the server starts. Used for:
//  - Background workers (webhook retry, stale-session sweep)
//  - Graceful shutdown (SIGTERM/SIGINT handlers)
//  - Health monitoring
//
// Audit fixes: NEW-19 (webhook retry worker), NEW-20 (stale session sweep),
// production-readiness gaps 4 (graceful shutdown).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackgroundWorkers, registerShutdownHandlers } = await import(
      "@/lib/zeropaye/workers"
    );
    registerShutdownHandlers();
    startBackgroundWorkers();
    console.log("[ZeroPaye] instrumentation registered: workers + shutdown handlers");
  }
}
