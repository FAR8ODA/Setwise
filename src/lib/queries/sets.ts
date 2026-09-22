import { pool } from "@/lib/db";
import type { SetSummary, TransitionBreakdown, TransitionRow } from "@/lib/types";
import {
  SET_TRANSITION_ANALYSIS_SQL,
  SET_TRANSITION_BREAKDOWN_SQL,
  SETS_CONTAINING_ALL_TRACKS_SQL,
} from "./sql.generated";

export async function listSets(): Promise<(SetSummary & { performedAt: string | null })[]> {
  const { rows } = await pool.query(
    `SELECT set_id, set_name, dj_name, performed_at
     FROM sets ORDER BY performed_at DESC NULLS LAST, set_id`,
  );
  return rows.map((r) => ({
    setId: r.set_id,
    setName: r.set_name,
    djName: r.dj_name,
    performedAt: r.performed_at,
  }));
}

export async function setTransitionAnalysis(setId: number): Promise<TransitionRow[]> {
  const { rows } = await pool.query(SET_TRANSITION_ANALYSIS_SQL, [setId]);
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

export async function setTransitionBreakdown(): Promise<TransitionBreakdown[]> {
  const { rows } = await pool.query(SET_TRANSITION_BREAKDOWN_SQL);
  return rows.map((r) => ({
    setId: r.set_id,
    setName: r.set_name,
    djName: r.dj_name,
    identicalTransitions: Number(r.identical_transitions),
    adjacentTransitions: Number(r.adjacent_transitions),
    relativeTransitions: Number(r.relative_transitions),
    energyBoostTransitions: Number(r.energy_boost_transitions),
    clashTransitions: Number(r.clash_transitions),
    totalTransitions: Number(r.total_transitions),
  }));
}

export async function setsContainingAllTracks(trackIds: number[]): Promise<SetSummary[]> {
  const { rows } = await pool.query(SETS_CONTAINING_ALL_TRACKS_SQL, [trackIds]);
  return rows.map((r) => ({ setId: r.set_id, setName: r.set_name, djName: r.dj_name }));
}

export async function getSet(setId: number): Promise<SetSummary | null> {
  const { rows } = await pool.query(
    "SELECT set_id, set_name, dj_name FROM sets WHERE set_id = $1",
    [setId],
  );
  if (!rows[0]) return null;
  return { setId: rows[0].set_id, setName: rows[0].set_name, djName: rows[0].dj_name };
}
