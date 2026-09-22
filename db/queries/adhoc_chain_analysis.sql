-- Same transition analysis as set_transition_analysis.sql, but for an
-- unsaved, in-progress chain of tracks instead of a persisted set_tracks
-- row. unnest(...) WITH ORDINALITY turns the incoming array into an
-- ordered rowset so the same LAG/SUM window logic applies unchanged.
-- $1 = ordered track_ids

WITH ordered AS (
    SELECT ord::integer AS position, track_id
    FROM unnest($1::integer[]) WITH ORDINALITY AS u(track_id, ord)
)
SELECT
    o.position,
    tr.title,
    ar.name AS artist,
    tr.bpm,
    tr.energy,
    tr.camelot_key,
    lag(tr.bpm) OVER w AS prev_bpm,
    round(tr.bpm - lag(tr.bpm) OVER w, 1) AS bpm_delta,
    lag(tr.energy) OVER w AS prev_energy,
    tr.energy - lag(tr.energy) OVER w AS energy_delta,
    camelot_relation(lag(tr.camelot_key) OVER w, tr.camelot_key) AS transition_quality,
    sum(tr.duration_seconds) OVER (w ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_duration_seconds,
    round(avg(tr.energy) OVER (w ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS energy_moving_avg
FROM ordered o
JOIN tracks tr ON tr.track_id = o.track_id
JOIN artists ar ON ar.artist_id = tr.artist_id
WINDOW w AS (ORDER BY o.position)
ORDER BY o.position;
