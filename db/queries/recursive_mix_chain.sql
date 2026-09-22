-- Recursive CTE: starting from one track, walk the compatibility graph to
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
LIMIT 20;
