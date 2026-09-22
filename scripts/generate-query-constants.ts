// Reads every file in db/queries/*.sql and emits them as string constants in
// src/lib/queries/sql.generated.ts. This keeps one source of truth for each
// query: the same text that ships in db/queries (for anyone reading the
// repo) is what actually executes, and what the /queries gallery displays.
// Runtime fs reads would work locally but are fragile on serverless
// deploys where the filesystem the function ships with is traced at build
// time, so this bakes the SQL into the JS bundle instead.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const QUERIES_DIR = resolve(import.meta.dirname, "..", "db", "queries");
const OUT_PATH = resolve(import.meta.dirname, "..", "src", "lib", "queries", "sql.generated.ts");

function toConstantName(filename: string): string {
  return filename.replace(/\.sql$/, "").toUpperCase() + "_SQL";
}

const files = readdirSync(QUERIES_DIR).filter((f) => f.endsWith(".sql")).sort();

const lines: string[] = [];
lines.push("// GENERATED FILE. Run `npm run db:queries:generate` to rebuild this from");
lines.push("// db/queries/*.sql instead of editing it by hand.");
lines.push("");

for (const file of files) {
  const sql = readFileSync(resolve(QUERIES_DIR, file), "utf8").trimEnd();
  const constName = toConstantName(file);
  lines.push(`export const ${constName} = \`${sql.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\`;`);
  lines.push("");
}

writeFileSync(OUT_PATH, lines.join("\n"));
console.log(`wrote ${files.length} queries to ${OUT_PATH}`);
