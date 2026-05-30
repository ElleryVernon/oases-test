import "dotenv/config";
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const databasePath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : databaseUrl;
const db = new Database(resolve(databasePath));

const migration = readFileSync(
  resolve("prisma/migrations/20260530000000_init/migration.sql"),
  "utf8",
);

db.pragma("foreign_keys = ON");
db.exec(`
  DROP TABLE IF EXISTS "Activity";
  DROP TABLE IF EXISTS "Day";
  DROP TABLE IF EXISTS "Member";
  DROP TABLE IF EXISTS "Trip";
  DROP TABLE IF EXISTS "Post";
`);
db.exec(migration);
db.close();

console.log(`Applied SQLite schema to ${databasePath}.`);
