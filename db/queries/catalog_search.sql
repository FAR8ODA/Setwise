-- Full text search over title + artist name (see the trigger in
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
LIMIT 40;
