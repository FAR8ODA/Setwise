-- Same LATERAL logic, narrowed to one starting track and an exclusion list.
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
LIMIT $3;
