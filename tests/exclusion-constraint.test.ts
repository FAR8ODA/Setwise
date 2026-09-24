import { test } from "node:test";
import assert from "node:assert/strict";
import { pool, withRollback } from "./db-helper.ts";

test("overlapping bookings for the same venue are rejected by Postgres", async () => {
  await withRollback(async (client) => {
    const venue = await client.query(
      "INSERT INTO venues (name, city) VALUES ('Fixture Venue', 'Fixture City') RETURNING venue_id",
    );
    const venueId = venue.rows[0].venue_id;

    await client.query(
      `INSERT INTO sets (dj_name, venue_id, scheduled_slot)
       VALUES ('DJ A', $1, tstzrange('2027-05-01 22:00+00', '2027-05-02 00:00+00'))`,
      [venueId],
    );

    await assert.rejects(
      client.query(
        `INSERT INTO sets (dj_name, venue_id, scheduled_slot)
         VALUES ('DJ B', $1, tstzrange('2027-05-01 23:00+00', '2027-05-02 01:00+00'))`,
        [venueId],
      ),
      (err: unknown) => {
        assert.equal((err as { code?: string }).code, "23P01");
        return true;
      },
    );
  });
});

test("back-to-back bookings with no overlap are allowed", async () => {
  await withRollback(async (client) => {
    const venue = await client.query(
      "INSERT INTO venues (name, city) VALUES ('Fixture Venue', 'Fixture City') RETURNING venue_id",
    );
    const venueId = venue.rows[0].venue_id;

    await client.query(
      `INSERT INTO sets (dj_name, venue_id, scheduled_slot)
       VALUES ('DJ A', $1, tstzrange('2027-05-01 22:00+00', '2027-05-02 00:00+00'))`,
      [venueId],
    );
    await client.query(
      `INSERT INTO sets (dj_name, venue_id, scheduled_slot)
       VALUES ('DJ B', $1, tstzrange('2027-05-02 00:00+00', '2027-05-02 02:00+00'))`,
      [venueId],
    );

    const { rows } = await client.query(
      "SELECT count(*)::int AS n FROM sets WHERE venue_id = $1",
      [venueId],
    );
    assert.equal(rows[0].n, 2);
  });
});

test.after(() => pool.end());
