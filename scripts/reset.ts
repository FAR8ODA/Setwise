// Drops and recreates the public schema, then reapplies every migration.
// Local development only, never run this against anything you care about.
import "./db-env.ts";
import { Pool } from "pg";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  }
  const pool = new Pool({ connectionString });
  await pool.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await pool.end();
  console.log("schema reset");

  execFileSync(process.execPath, [
    "--experimental-strip-types",
    resolve(import.meta.dirname, "migrate.ts"),
  ], { stdio: "inherit" });

  execFileSync(process.execPath, [
    "--experimental-strip-types",
    resolve(import.meta.dirname, "seed.ts"),
  ], { stdio: "inherit" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
