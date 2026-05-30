import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 connects through a driver adapter (no `url` in schema anymore).
// The connection string lives in .env (DATABASE_URL) and is read here. In
// serverless production, default to /tmp because the deployed app directory is
// not a durable writable database location.
const defaultDatabaseUrl =
  process.env.NODE_ENV === "production"
    ? `file:${join(tmpdir(), "oases.db")}`
    : "file:./dev.db";

const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;

const schema = `
CREATE TABLE IF NOT EXISTS "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "perPersonBudgetKRW" INTEGER NOT NULL,
    "preferences" TEXT NOT NULL,
    "notes" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "Member_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Day" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    CONSTRAINT "Day_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "unitCostKRW" INTEGER NOT NULL,
    "perPerson" BOOLEAN NOT NULL,
    "dmcRecommended" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "dayId" TEXT NOT NULL,
    CONSTRAINT "Activity_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "Day" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Day_tripId_day_key" ON "Day"("tripId", "day");
`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function databasePathFromUrl(url: string) {
  const path = url.startsWith("file:") ? url.slice("file:".length) : url;
  return isAbsolute(path) ? path : resolve(path);
}

function ensureDatabase(url: string) {
  const databasePath = databasePathFromUrl(url);
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  db.exec(schema);
  db.close();
}

function createClient() {
  ensureDatabase(databaseUrl);

  const adapter = new PrismaBetterSqlite3({
    url: databaseUrl,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
