import { test } from "node:test";
import assert from "node:assert/strict";
import { pool, withRollback } from "./db-helper.ts";
import { SETS_CONTAINING_ALL_TRACKS_SQL } from "../src/lib/queries/sql.generated.ts";

test("finds only the set that played every required track", async () => {
  await withRollback(async (client) => {
    const artist = await client.query(
      "INSERT INTO artists (name) VALUES ('Fixture Artist') RETURNING artist_id",
    );
    const artistId = artist.rows[0].artist_id;

    async function makeTrack(title: string, key: string) {
      const r = await client.query(
        `INSERT INTO tracks (artist_id, title, genre, bpm, camelot_key, energy, duration_seconds)
         VALUES ($1, $2, 'Test', 128, $3, 5, 300) RETURNING track_id`,
        [artistId, title, key],
      );
      return r.rows[0].track_id as number;
    }

    const trackA = await makeTrack("Fixture Track A", "8A");
    const trackB = await makeTrack("Fixture Track B", "8B");

    const setFull = await client.query(
      "INSERT INTO sets (dj_name, set_name) VALUES ('Fixture DJ', 'Played Both') RETURNING set_id",
    );
    const setFullId = setFull.rows[0].set_id;
    const setPartial = await client.query(
      "INSERT INTO sets (dj_name, set_name) VALUES ('Fixture DJ', 'Played One') RETURNING set_id",
    );
    const setPartialId = setPartial.rows[0].set_id;

    await client.query(
      "INSERT INTO set_tracks (set_id, position, track_id) VALUES ($1, 1, $2), ($1, 2, $3)",
      [setFullId, trackA, trackB],
    );
    await client.query(
      "INSERT INTO set_tracks (set_id, position, track_id) VALUES ($1, 1, $2)",
      [setPartialId, trackA],
    );

    const { rows } = await client.query(SETS_CONTAINING_ALL_TRACKS_SQL, [[trackA, trackB]]);
    const resultIds = rows.map((r) => r.set_id);

    assert.ok(resultIds.includes(setFullId), "the set that played both tracks should match");
    assert.ok(!resultIds.includes(setPartialId), "the set that played only one track should not match");
  });
});

test.after(() => pool.end());
