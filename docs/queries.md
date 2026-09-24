# The SQL, technique by technique

Every query below lives in `db/queries/`, gets baked into
`src/lib/queries/sql.generated.ts` by `npm run db:queries:generate`, and
runs live on the `/queries` page. This is a walkthrough of what each one
demonstrates and why it's written the way it is.

## Recursive CTE; `recursive_mix_chain.sql`

Starting from one track, walks the compatibility graph outward, adding a
track per iteration and refusing to revisit one already in the path. The
cycle guard is `NOT tc.track_id_b = ANY (mp.path)`: the path is carried
forward as an array, and array containment is cheaper to check than a join
back to the accumulated rows would be.

## LATERAL join; `next_track_suggestions.sql` / `next_track_suggestions_for_track.sql`

For every track, pull its top 3 (or top N) closest-tempo compatible
matches. Without `LATERAL`, this is either a correlated subquery per row
(slow) or a window function over the full cross product, then filtered
down (wasteful). `LATERAL` lets the subquery reference the outer row and
still run set-at-a-time.

## Window functions; `set_transition_analysis.sql` / `adhoc_chain_analysis.sql`

Replays a tracklist in order and compares each row to the one before it:
`LAG()` for the previous BPM/energy/key, a running `SUM()` for elapsed set
time, and a 3-track rolling `AVG()` for energy. `adhoc_chain_analysis.sql`
is the same logic applied to an in-memory array via
`unnest(...) WITH ORDINALITY`, which is what powers the live set builder
before anything is saved.

## Relational division; `sets_containing_all_tracks.sql`

"Which sets played every track on this list" is division, not a `JOIN`:
written as a double `NOT EXISTS` (no required track is missing from what
the set actually played), rather than counting matches and comparing to
`array_length`.

## Filtered aggregation; `set_transition_breakdown.sql`

One row per set with five `count(*) FILTER (WHERE ...)` columns, computed
in a single pass instead of five separate grouped queries unioned
together.

## Range exclusion constraint; enforced in `0003_sets_and_booking.sql`, exercised in `venue_booking_attempt.sql`

`EXCLUDE USING gist (venue_id WITH =, scheduled_slot WITH &&)` rejects a
second booking whose `tstzrange` overlaps an existing one at the same
venue, no application-side overlap check required. `btree_gist` is what
lets a plain integer sit inside a GiST index next to a range type.

## Audit trigger + JSONB; `0006_audit_log.sql`, read back in `set_audit_history.sql`

`AFTER INSERT OR UPDATE OR DELETE` on `sets` writes the whole row as JSONB
into `set_audit_log`. Nothing in the application ever calls this
directly; it's just there when you look.

## Full text search; trigger in `0002_tracks.sql`, read in `catalog_search.sql`

A `tsvector` weighted title-then-artist, kept current by a
`BEFORE INSERT OR UPDATE OF title, artist_id` trigger (and cascaded when an
artist is renamed), queried with `websearch_to_tsquery` and ranked with
`ts_rank`.

## Materialized view; `0005_compatibility_view.sql`

Every non-clashing, tempo-compatible track pair, precomputed instead of
recalculated per request. `refresh_track_compatibility()` wraps
`REFRESH MATERIALIZED VIEW CONCURRENTLY`, which needs the unique index the
same migration creates and can't run inside a transaction block.
