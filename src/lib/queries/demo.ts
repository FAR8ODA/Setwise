import { pool } from "@/lib/db";

// Proves the exclusion constraint from 0003_sets_and_booking.sql actually
// stops a double-booking, using a real Postgres error rather than an
// application-level check, without leaving any rows behind: everything
// runs inside one transaction that always rolls back.
//
// Note: sequences are not transactional in Postgres, so every call here
// still burns a few values from venues_venue_id_seq / sets_set_id_seq even
// though nothing is committed. That's expected and harmless (serial gaps
// are normal), not a bug.
export async function demoExclusionConstraint(): Promise<{
  firstBookingOk: boolean;
  secondBookingBlocked: boolean;
  postgresError: string | null;
}> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const venue = await client.query(
      "INSERT INTO venues (name, city) VALUES ('Demo Room', 'Demo City') RETURNING venue_id",
    );
    const venueId = venue.rows[0].venue_id as number;

    await client.query(
      `INSERT INTO sets (dj_name, venue_id, scheduled_slot)
       VALUES ('Demo DJ A', $1, tstzrange('2027-01-01 22:00+00', '2027-01-02 00:00+00'))`,
      [venueId],
    );

    let secondBookingBlocked = false;
    let postgresError: string | null = null;
    try {
      await client.query(
        `INSERT INTO sets (dj_name, venue_id, scheduled_slot)
         VALUES ('Demo DJ B', $1, tstzrange('2027-01-01 23:00+00', '2027-01-02 01:00+00'))`,
        [venueId],
      );
    } catch (err) {
      secondBookingBlocked = true;
      postgresError = err instanceof Error ? err.message : String(err);
    }

    return { firstBookingOk: true, secondBookingBlocked, postgresError };
  } finally {
    // Always roll back: this is a demo, not a real booking.
    await client.query("ROLLBACK").catch(() => {});
    client.release();
  }
}
