import { pool } from "@/lib/db";
import type { PlayPercentileRow } from "@/lib/types";
import { TRACK_PLAY_PERCENTILE_SQL } from "./sql.generated";

export async function trackPlayPercentiles(): Promise<PlayPercentileRow[]> {
  const { rows } = await pool.query(TRACK_PLAY_PERCENTILE_SQL);
  return rows.map((r) => ({
    title: r.title,
    artist: r.artist,
    genre: r.genre,
    plays: Number(r.plays),
    percentile: Number(r.percentile),
    quartile: Number(r.quartile),
  }));
}
