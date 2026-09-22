-- Window functions again, this time for ranking: how often has each track
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
LIMIT 25;
