import { pool } from "@/lib/db";
import type { TransitionRow } from "@/lib/types";
import { ADHOC_CHAIN_ANALYSIS_SQL } from "./sql.generated";

export async function analyzeChain(trackIds: number[]): Promise<TransitionRow[]> {
  if (trackIds.length === 0) return [];
  const { rows } = await pool.query(ADHOC_CHAIN_ANALYSIS_SQL, [trackIds]);
  return rows.map((r) => ({
    position: r.position,
    title: r.title,
    artist: r.artist,
    bpm: Number(r.bpm),
    energy: r.energy,
    camelotKey: r.camelot_key,
    prevBpm: r.prev_bpm === null ? null : Number(r.prev_bpm),
    bpmDelta: r.bpm_delta === null ? null : Number(r.bpm_delta),
    prevEnergy: r.prev_energy,
    energyDelta: r.energy_delta,
    transitionQuality: r.transition_quality,
    runningDurationSeconds: Number(r.running_duration_seconds),
    energyMovingAvg: Number(r.energy_moving_avg),
  }));
}

export async function saveSet(djName: string, setName: string, trackIds: number[]): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO sets (dj_name, set_name, performed_at) VALUES ($1, $2, now()) RETURNING set_id",
      [djName, setName],
    );
    const setId = rows[0].set_id as number;
    for (let i = 0; i < trackIds.length; i++) {
      await client.query(
        "INSERT INTO set_tracks (set_id, position, track_id) VALUES ($1, $2, $3)",
        [setId, i + 1, trackIds[i]],
      );
    }
    await client.query("COMMIT");
    return setId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
