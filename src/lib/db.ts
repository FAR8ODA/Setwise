import { Pool } from "pg";

declare global {
  var __setwisePool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  }
  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "require" ? { rejectUnauthorized: true } : undefined,
  });
}

// Next.js reloads modules in dev; reuse one pool across reloads instead of
// leaking a connection pool per hot reload.
export const pool = globalThis.__setwisePool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__setwisePool = pool;
}
