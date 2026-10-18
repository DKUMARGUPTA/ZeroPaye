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
  // Also copy WAL + SHM if they exist (SQLite WAL mode)
  copyFileSync(DB_PATH, backupPath);
  for (const ext of ["-wal", "-shm", "-journal"]) {
    const src = DB_PATH + ext;
    if (existsSync(src)) {
      copyFileSync(src, backupPath + ext);
    }
  }
  console.log(`[ZeroPaye backup] ✓ Created ${backupPath}`);
  // Optionally: clean up backups older than 30 days
  // (implement with fs.readdir + stat + unlink if needed)
} catch (e) {
  console.error("[ZeroPaye backup] ✗ Failed:", e);
  process.exit(1);
}
