import { pool } from "@/lib/db";
import type { MixChain, Track, TrackSuggestion } from "@/lib/types";
import {
  NEXT_TRACK_SUGGESTIONS_FOR_TRACK_SQL,
  RECURSIVE_MIX_CHAIN_SQL,
} from "./sql.generated";

export async function suggestNextTracks(
  trackId: number,
  excludeIds: number[],
  limit = 5,
): Promise<TrackSuggestion[]> {
  const { rows } = await pool.query(NEXT_TRACK_SUGGESTIONS_FOR_TRACK_SQL, [
    trackId,
    excludeIds.length ? excludeIds : [-1],
    limit,
  ]);
  return rows.map((r) => ({
    trackId: r.track_id,
    title: r.title,
    artist: r.artist,
    genre: r.genre,
    bpm: Number(r.bpm),
    camelotKey: r.camelot_key,
    energy: r.energy,
    durationSeconds: 0,
    keyRelation: r.key_relation,
    bpmDelta: Number(r.bpm_delta),
  }));
}

export async function findMixChains(trackId: number, depth: number): Promise<MixChain[]> {
  const { rows } = await pool.query(RECURSIVE_MIX_CHAIN_SQL, [trackId, depth]);
  return rows.map((r) => ({ path: r.path, depth: r.depth }));
}

export async function trackById(trackId: number): Promise<Track | null> {
  const { rows } = await pool.query(
    `SELECT t.track_id, t.title, ar.name AS artist, t.genre, t.bpm,
            t.camelot_key, t.energy, t.duration_seconds
     FROM tracks t JOIN artists ar ON ar.artist_id = t.artist_id
     WHERE t.track_id = $1`,
    [trackId],
  );
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    trackId: r.track_id,
    title: r.title,
    artist: r.artist,
    genre: r.genre,
    bpm: Number(r.bpm),
    camelotKey: r.camelot_key,
    energy: r.energy,
    durationSeconds: r.duration_seconds,
  };
}

export async function tracksByIds(trackIds: number[]): Promise<Track[]> {
  if (trackIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT t.track_id, t.title, ar.name AS artist, t.genre, t.bpm,
            t.camelot_key, t.energy, t.duration_seconds
     FROM tracks t JOIN artists ar ON ar.artist_id = t.artist_id
     WHERE t.track_id = ANY ($1::integer[])`,
    [trackIds],
  );
  const byId = new Map(
    rows.map((r) => [
      r.track_id,
      {
        trackId: r.track_id,
        title: r.title,
        artist: r.artist,
        genre: r.genre,
        bpm: Number(r.bpm),
        camelotKey: r.camelot_key,
        energy: r.energy,
        durationSeconds: r.duration_seconds,
      } satisfies Track,
    ]),
  );
  return trackIds.map((id) => byId.get(id)).filter((t): t is Track => Boolean(t));
}
