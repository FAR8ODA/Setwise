-- Window functions: replay a set track by track and show how BPM, energy,
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
ORDER BY st.position;
