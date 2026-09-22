import { pool } from "@/lib/db";
import type { Track } from "@/lib/types";
import { CATALOG_SEARCH_SQL } from "./sql.generated";

export async function searchCatalog(query: string): Promise<Track[]> {
  const { rows } = await pool.query(CATALOG_SEARCH_SQL, [query]);
  return rows.map((r) => ({
    trackId: r.track_id,
    title: r.title,
    artist: r.artist,
    genre: r.genre,
    bpm: Number(r.bpm),
    camelotKey: r.camelot_key,
    energy: r.energy,
    durationSeconds: 0,
  }));
}

export async function listCatalog(genre?: string): Promise<Track[]> {
  const { rows } = await pool.query(
    `SELECT t.track_id, t.title, ar.name AS artist, t.genre, t.bpm,
            t.camelot_key, t.energy, t.duration_seconds
     FROM tracks t
     JOIN artists ar ON ar.artist_id = t.artist_id
     WHERE $1::text IS NULL OR t.genre = $1
     ORDER BY t.title
     LIMIT 200`,
    [genre ?? null],
  );
  return rows.map((r) => ({
    trackId: r.track_id,
    title: r.title,
    artist: r.artist,
    genre: r.genre,
    bpm: Number(r.bpm),
    camelotKey: r.camelot_key,
    energy: r.energy,
    durationSeconds: r.duration_seconds,
  }));
}

export async function listGenres(): Promise<string[]> {
  const { rows } = await pool.query<{ genre: string }>(
    "SELECT DISTINCT genre FROM tracks ORDER BY genre",
  );
  return rows.map((r) => r.genre);
}
