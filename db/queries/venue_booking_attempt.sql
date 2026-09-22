-- Not a read query: this is what the exclusion constraint in
-- 0003_sets_and_booking.sql looks like from the application side. Run it
-- against an overlapping slot and Postgres itself raises
-- "conflicting key value violates exclusion constraint", no manual
-- overlap-checking code required.
-- $1 = dj_name, $2 = venue_id, $3 = slot_start, $4 = slot_end

INSERT INTO sets (dj_name, venue_id, scheduled_slot)
VALUES ($1, $2, tstzrange($3, $4))
RETURNING set_id, dj_name, venue_id, scheduled_slot;
