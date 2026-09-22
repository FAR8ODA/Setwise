-- Relational division: find sets that played every track in a required
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
);
