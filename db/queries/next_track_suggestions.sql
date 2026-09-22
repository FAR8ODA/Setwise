-- LATERAL join: for every track in a genre, find its top 3 closest-tempo
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
ORDER BY t.title, suggestion.bpm_delta;
