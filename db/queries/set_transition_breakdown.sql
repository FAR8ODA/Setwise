-- Filtered aggregation + LATERAL: for every set, count how many of its
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
ORDER BY clash_transitions DESC, s.set_id;
