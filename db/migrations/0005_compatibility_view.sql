-- Every mixable pair, precomputed. Recomputing camelot_relation() and
-- bpm_compatible() for the whole catalog on every page load doesn't scale;
-- a materialized view trades a bit of staleness for O(1) lookups, refreshed
-- with refresh_track_compatibility() whenever the catalog changes.

CREATE MATERIALIZED VIEW track_compatibility AS
SELECT
    a.track_id AS track_id_a,
    b.track_id AS track_id_b,
    camelot_relation(a.camelot_key, b.camelot_key) AS key_relation,
    round(abs(a.bpm - b.bpm), 1) AS bpm_delta
FROM tracks a
JOIN tracks b ON a.track_id <> b.track_id
WHERE camelot_relation(a.camelot_key, b.camelot_key) <> 'clash'
  AND bpm_compatible(a.bpm, b.bpm);

CREATE UNIQUE INDEX idx_track_compatibility_pk ON track_compatibility (track_id_a, track_id_b);
CREATE INDEX idx_track_compatibility_a ON track_compatibility (track_id_a);

CREATE OR REPLACE FUNCTION refresh_track_compatibility()
RETURNS void
LANGUAGE sql
AS $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY track_compatibility;
$$;
