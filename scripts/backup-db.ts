#!/usr/bin/env node
// ZeroPaye — Database backup script (production gap 10)
// Usage: bun run scripts/backup-db.ts
// Recommended cron: 0 2 * * * (daily at 2am)
//
// Creates a timestamped copy of the SQLite database in backups/ dir.
// For production, upload the backup to S3/GCS after this script.

import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const DB_PATH = join(process.cwd(), "db", "custom.db");
const BACKUP_DIR = join(process.cwd(), "backups");

const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const backupPath = join(BACKUP_DIR, `zeropaye-${ts}.db`);

if (!existsSync(DB_PATH)) {
  console.error("[ZeroPaye backup] Database not found at", DB_PATH);
  process.exit(1);
}

if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

try {
  // v4.0 H6 fix: VACUUM INTO creates a consistent snapshot (was copyFileSync —
  // could be inconsistent if DB was being written to during copy)
  // Note: VACUUM INTO requires SQLite 3.27+ (bundled in Node 20+)
  // For PostgreSQL, use pg_dump instead
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    // VACUUM INTO for SQLite — produces a clean, consistent backup
    await db.$executeRawUnsafe(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`);
    console.log(`[ZeroPaye backup] ✓ VACUUM INTO ${backupPath}`);
  } finally {
    await db.$disconnect();
  }
  // Optionally: clean up backups older than 30 days
  // (implement with fs.readdir + stat + unlink if needed)
} catch (e) {
  console.error("[ZeroPaye backup] ✗ Failed:", e);
  process.exit(1);
}
