// GENERATED FILE. Run `npm run db:queries:generate` to rebuild this from
// db/queries/*.sql instead of editing it by hand.

export const ADHOC_CHAIN_ANALYSIS_SQL = `-- Same transition analysis as set_transition_analysis.sql, but for an
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
ORDER BY o.position;`;

export const CATALOG_SEARCH_SQL = `-- Full text search over title + artist name (see the trigger in
-- 0002_tracks.sql), ranked by relevance.
-- $1 = search query

SELECT
    t.track_id,
    t.title,
    ar.name AS artist,
    t.genre,
    t.bpm,
    t.camelot_key,
    t.energy,
    ts_rank(t.search_vector, websearch_to_tsquery('english', $1)) AS rank
FROM tracks t
JOIN artists ar ON ar.artist_id = t.artist_id
WHERE t.search_vector @@ websearch_to_tsquery('english', $1)
ORDER BY rank DESC, t.title
LIMIT 40;`;

export const NEXT_TRACK_SUGGESTIONS_SQL = `-- LATERAL join: for every track in a genre, find its top 3 closest-tempo
-- harmonic matches in one pass, instead of running a correlated subquery
-- per row or a window function over the whole cross product.
-- $1 = genre

SELECT
    t.track_id,
    t.title,
    suggestion.suggested_track_id,
    suggestion.suggested_title,
    suggestion.bpm,
    suggestion.key_relation,
    suggestion.bpm_delta
FROM tracks t
CROSS JOIN LATERAL (
    SELECT
        tr.track_id AS suggested_track_id,
        tr.title AS suggested_title,
        tr.bpm,
        tc.key_relation,
        tc.bpm_delta
    FROM track_compatibility tc
    JOIN tracks tr ON tr.track_id = tc.track_id_b
    WHERE tc.track_id_a = t.track_id
    ORDER BY tc.bpm_delta ASC
    LIMIT 3
) suggestion ON true
WHERE t.genre = $1
ORDER BY t.title, suggestion.bpm_delta;`;

export const NEXT_TRACK_SUGGESTIONS_FOR_TRACK_SQL = `-- Same LATERAL logic, narrowed to one starting track and an exclusion list.
-- This is what the set builder UI calls on every "add a track" step.
-- $1 = track_id, $2 = excluded track_ids (already in the set), $3 = limit

SELECT
    tr.track_id,
    tr.title,
    ar.name AS artist,
    tr.genre,
    tr.bpm,
    tr.camelot_key,
    tr.energy,
    tc.key_relation,
    tc.bpm_delta
FROM track_compatibility tc
JOIN tracks tr ON tr.track_id = tc.track_id_b
JOIN artists ar ON ar.artist_id = tr.artist_id
WHERE tc.track_id_a = $1
  AND tr.track_id <> ALL ($2::integer[])
ORDER BY tc.bpm_delta ASC, tr.energy DESC
LIMIT $3;`;

export const RECENT_AUDIT_ACTIVITY_SQL = `-- The most recent entries the audit trigger has written, across every set,
-- newest first. Demonstrates that the log fills itself in: nothing in the
-- application code ever inserts into set_audit_log directly.

SELECT
    l.audit_id,
    l.set_id,
    coalesce(l.new_data->>'set_name', l.old_data->>'set_name') AS set_name,
    l.action,
    l.changed_at
FROM set_audit_log l
ORDER BY l.changed_at DESC, l.audit_id DESC
LIMIT 8;`;

export const RECURSIVE_MIX_CHAIN_SQL = `-- Recursive CTE: starting from one track, walk the compatibility graph to
-- find chains of harmonically mixable tracks, never repeating a track.
-- $1 = starting track_id, $2 = max chain length

WITH RECURSIVE mix_paths AS (
    SELECT
        ARRAY[t.track_id] AS path,
        t.track_id AS current_track,
        1 AS depth

    FROM tracks t
    WHERE t.track_id = $1

    UNION ALL

    SELECT
        mp.path || tc.track_id_b,
        tc.track_id_b,
        mp.depth + 1
    FROM mix_paths mp
    JOIN track_compatibility tc ON tc.track_id_a = mp.current_track
    WHERE NOT tc.track_id_b = ANY (mp.path)  -- cycle guard
      AND mp.depth < $2
)
SELECT path, depth
FROM mix_paths
WHERE depth = $2
ORDER BY depth DESC
LIMIT 20;`;

export const SET_AUDIT_HISTORY_SQL = `-- The audit trigger from 0006_audit_log.sql writes here on every INSERT,
-- UPDATE, and DELETE against sets. Nothing in the application had to
-- remember to call this; it's just there.
-- $1 = set_id

SELECT action, changed_at, old_data, new_data
FROM set_audit_log
WHERE set_id = $1
ORDER BY changed_at DESC;`;

export const SET_TRANSITION_ANALYSIS_SQL = `-- Window functions: replay a set track by track and show how BPM, energy,
-- and harmonic quality change from one transition to the next, plus a
-- running set duration and a 3-track rolling energy average.
-- $1 = set_id

SELECT
    st.position,
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
FROM set_tracks st
JOIN tracks tr ON tr.track_id = st.track_id
JOIN artists ar ON ar.artist_id = tr.artist_id
WHERE st.set_id = $1
WINDOW w AS (ORDER BY st.position)
ORDER BY st.position;`;

export const SET_TRANSITION_BREAKDOWN_SQL = `-- Filtered aggregation + LATERAL: for every set, count how many of its
-- transitions were identical/adjacent/relative/energy_boost/clash keys,
-- in one pass per set rather than one query per set.

SELECT
    s.set_id,
    s.set_name,
    s.dj_name,
    count(*) FILTER (WHERE tq.relation = 'identical')    AS identical_transitions,
    count(*) FILTER (WHERE tq.relation = 'adjacent')      AS adjacent_transitions,
    count(*) FILTER (WHERE tq.relation = 'relative')      AS relative_transitions,
    count(*) FILTER (WHERE tq.relation = 'energy_boost')  AS energy_boost_transitions,
    count(*) FILTER (WHERE tq.relation = 'clash')         AS clash_transitions,
    count(*) - 1 AS total_transitions
FROM sets s
JOIN LATERAL (
    SELECT camelot_relation(
        lag(tr.camelot_key) OVER (ORDER BY st.position),
        tr.camelot_key
    ) AS relation
    FROM set_tracks st
    JOIN tracks tr ON tr.track_id = st.track_id
    WHERE st.set_id = s.set_id
) tq ON true
GROUP BY s.set_id, s.set_name, s.dj_name
ORDER BY clash_transitions DESC, s.set_id;`;

export const SETS_CONTAINING_ALL_TRACKS_SQL = `-- Relational division: find sets that played every track in a required
-- list, not just some of them. Written as double NOT EXISTS: no set-track
-- pairing is missing from what was required.
-- $1 = required track_ids

SELECT s.set_id, s.set_name, s.dj_name
FROM sets s
WHERE NOT EXISTS (
    SELECT 1
    FROM unnest($1::integer[]) AS required(track_id)
    WHERE NOT EXISTS (
        SELECT 1
        FROM set_tracks st
        WHERE st.set_id = s.set_id
          AND st.track_id = required.track_id
    )
);`;

export const TRACK_PLAY_PERCENTILE_SQL = `-- Window functions again, this time for ranking: how often has each track
-- actually been played across every recorded set, and where does that
-- land it relative to the rest of the catalog.

WITH play_counts AS (
    SELECT track_id, count(*) AS plays
    FROM set_tracks
    GROUP BY track_id
)
SELECT
    tr.title,
    ar.name AS artist,
    tr.genre,
    pc.plays,
    round(percent_rank() OVER (ORDER BY pc.plays)::numeric, 3) AS percentile,
    ntile(4) OVER (ORDER BY pc.plays) AS quartile
FROM play_counts pc
JOIN tracks tr ON tr.track_id = pc.track_id
JOIN artists ar ON ar.artist_id = tr.artist_id
ORDER BY pc.plays DESC, tr.title
LIMIT 25;`;

export const VENUE_BOOKING_ATTEMPT_SQL = `-- Not a read query: this is what the exclusion constraint in
-- 0003_sets_and_booking.sql looks like from the application side. Run it
-- against an overlapping slot and Postgres itself raises
-- "conflicting key value violates exclusion constraint", no manual
-- overlap-checking code required.
-- $1 = dj_name, $2 = venue_id, $3 = slot_start, $4 = slot_end

INSERT INTO sets (dj_name, venue_id, scheduled_slot)
VALUES ($1, $2, tstzrange($3, $4))
RETURNING set_id, dj_name, venue_id, scheduled_slot;`;
