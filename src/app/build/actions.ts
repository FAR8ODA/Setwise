"use server";

import { searchCatalog } from "@/lib/queries/catalog";
import { suggestNextTracks, trackById } from "@/lib/queries/compatibility";
import { analyzeChain, saveSet } from "@/lib/queries/chain";
import type { Track, TrackSuggestion, TransitionRow } from "@/lib/types";

export async function searchStartingTracks(query: string): Promise<Track[]> {
  if (!query.trim()) return [];
  return searchCatalog(query);
}

export async function getSuggestions(
  trackId: number,
  excludeIds: number[],
): Promise<TrackSuggestion[]> {
  return suggestNextTracks(trackId, excludeIds, 5);
}

export async function getChainAnalysis(trackIds: number[]): Promise<TransitionRow[]> {
  return analyzeChain(trackIds);
}

export async function lookupTrack(trackId: number) {
  return trackById(trackId);
}

export async function saveBuiltSet(
  djName: string,
  setName: string,
  trackIds: number[],
): Promise<number> {
  if (trackIds.length === 0) throw new Error("Add at least one track first.");
  return saveSet(djName || "You", setName || "Untitled set", trackIds);
}
