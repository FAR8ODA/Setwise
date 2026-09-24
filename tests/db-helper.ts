import "../scripts/db-env.ts";
import { Pool, type PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local, or set it in CI.",
  );
}

export const pool = new Pool({ connectionString });

// Runs fn inside a transaction that is always rolled back afterward, so
// tests that need to write fixtures never leave data behind or interfere
// with the seeded catalog.
export async function withRollback<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    return await fn(client);
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    client.release();
  }
}
