import { test } from "node:test";
import assert from "node:assert/strict";
import { pool } from "./db-helper.ts";
import {
  RECURSIVE_MIX_CHAIN_SQL,
  NEXT_TRACK_SUGGESTIONS_FOR_TRACK_SQL,
} from "../src/lib/queries/sql.generated.ts";

// These read the seeded catalog rather than fixtures: run `npm run
// db:seed` first. They check invariants that must hold no matter which
// track the chain happens to start from, instead of asserting on exact
// seed values that would break the moment the generator changes.

test("recursive mix chains never repeat a track and match the requested depth", async () => {
  const seedTrack = await pool.query(
    `SELECT track_id_a AS id FROM track_compatibility
     GROUP BY track_id_a ORDER BY count(*) DESC LIMIT 1`,
  );
  const trackId = seedTrack.rows[0]?.id;
  assert.ok(trackId, "seed data must be loaded for this test (run npm run db:seed)");

  const { rows } = await pool.query(RECURSIVE_MIX_CHAIN_SQL, [trackId, 5]);
  assert.ok(rows.length > 0, "expected at least one chain of the requested depth");
  for (const row of rows) {
    const path: number[] = row.path;
    assert.equal(new Set(path).size, path.length, "a chain must not repeat a track");
    assert.equal(path.length, row.depth);
    assert.equal(path.length, 5);
  }
});

test("suggested next tracks are always compatible and never the track itself", async () => {
  const seedTrack = await pool.query("SELECT track_id FROM tracks ORDER BY track_id LIMIT 1");
  const trackId = seedTrack.rows[0]?.track_id;
  assert.ok(trackId, "seed data must be loaded for this test (run npm run db:seed)");

  const { rows } = await pool.query(NEXT_TRACK_SUGGESTIONS_FOR_TRACK_SQL, [trackId, [-1], 10]);
  for (const row of rows) {
    assert.notEqual(row.track_id, trackId);
    assert.notEqual(row.key_relation, "clash");
  }
});

test.after(() => pool.end());
