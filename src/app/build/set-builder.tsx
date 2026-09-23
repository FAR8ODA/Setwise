"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Track, TrackSuggestion, TransitionRow } from "@/lib/types";
import { KeyBadge, RelationBadge, EnergyBar } from "@/components/badges";
import {
  getChainAnalysis,
  getSuggestions,
  saveBuiltSet,
  searchStartingTracks,
} from "./actions";

export function SetBuilder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [chain, setChain] = useState<Track[]>([]);
  const [suggestions, setSuggestions] = useState<TrackSuggestion[]>([]);
  const [analysis, setAnalysis] = useState<TransitionRow[]>([]);
  const [djName, setDjName] = useState("");
  const [setName, setSetName] = useState("");
  const [savedSetId, setSavedSetId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refreshDownstream(nextChain: Track[]) {
    startTransition(async () => {
      const ids = nextChain.map((t) => t.trackId);
      const [nextAnalysis, nextSuggestions] = await Promise.all([
        getChainAnalysis(ids),
        nextChain.length ? getSuggestions(nextChain.at(-1)!.trackId, ids) : Promise.resolve([]),
      ]);
      setAnalysis(nextAnalysis);
      setSuggestions(nextSuggestions);
    });
  }

  function handleSearch(value: string) {
    setQuery(value);
    setError(null);
    startTransition(async () => {
      const hits = await searchStartingTracks(value);
      setResults(hits);
    });
  }

  function addTrack(track: Track | TrackSuggestion) {
    const nextChain = [...chain, track];
    setChain(nextChain);
    setResults([]);
    setQuery("");
    setSavedSetId(null);
    refreshDownstream(nextChain);
  }

  function removeLast() {
    const nextChain = chain.slice(0, -1);
    setChain(nextChain);
    setSavedSetId(null);
    refreshDownstream(nextChain);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const setId = await saveBuiltSet(djName, setName, chain.map((t) => t.trackId));
        setSavedSetId(setId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save this set.");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <h2 className="text-sm font-medium text-paper-dim">Your chain</h2>
        {chain.length === 0 ? (
          <p className="mt-3 rounded-sm border border-dashed border-line px-4 py-6 text-sm text-paper-dim">
            Search for a track on the right to start a chain.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-sm border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-paper-dim">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Track</th>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Transition</th>
                  <th className="px-4 py-3 font-medium">BPM \u0394</th>
                  <th className="px-4 py-3 font-medium">Energy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {analysis.map((r) => (
                  <tr key={r.position}>
                    <td className="px-4 py-3 font-data text-paper-dim">{r.position}</td>
                    <td className="px-4 py-3">
                      <div>{r.title}</div>
                      <div className="text-xs text-paper-dim">{r.artist}</div>
                    </td>
                    <td className="px-4 py-3">
                      <KeyBadge camelotKey={r.camelotKey} />
                    </td>
                    <td className="px-4 py-3">
                      <RelationBadge relation={r.transitionQuality} />
                    </td>
                    <td className="px-4 py-3 font-data">
                      {r.bpmDelta === null ? "\u2014" : `${r.bpmDelta > 0 ? "+" : ""}${r.bpmDelta}`}
                    </td>
                    <td className="px-4 py-3">
                      <EnergyBar energy={r.energy} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {chain.length > 0 && (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <button
              onClick={removeLast}
              className="rounded-sm border border-line px-3 py-2 text-xs text-paper-dim hover:border-paper-dim"
            >
              Remove last track
            </button>
            <div className="flex-1" />
            <input
              value={djName}
              onChange={(e) => setDjName(e.target.value)}
              placeholder="DJ name"
              className="w-32 rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-paper-dim focus:border-teal"
            />
            <input
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="Set name"
              className="w-40 rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-paper-dim focus:border-teal"
            />
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-sm bg-amber px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Save this set
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-sm text-clash">{error}</p>}
        {savedSetId && (
          <p className="mt-2 text-sm text-teal">
            Saved.{" "}
            <Link href={`/sets/${savedSetId}`} className="underline">
              View it, and its audit trail
            </Link>
            .
          </p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-paper-dim">
          {chain.length === 0 ? "Search for a starting track" : "Suggested next tracks"}
        </h2>
        {chain.length === 0 ? (
          <>
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search title or artist\u2026"
              className="mt-3 w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-paper-dim focus:border-teal"
            />
            <ul className="mt-3 divide-y divide-line rounded-sm border border-line">
              {results.map((t) => (
                <li key={t.trackId}>
                  <button
                    onClick={() => addTrack(t)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-surface"
                  >
                    <span>
                      {t.title}
                      <span className="ml-1.5 text-xs text-paper-dim">{t.artist}</span>
                    </span>
                    <KeyBadge camelotKey={t.camelotKey} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-paper-dim">
            Ranked by a <code className="font-data">LATERAL</code> join against
            the precomputed compatibility view, closest tempo first.
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {suggestions.map((s) => (
            <li key={s.trackId}>
              <button
                onClick={() => addTrack(s)}
                className="flex w-full items-center justify-between rounded-sm border border-line px-3 py-2.5 text-left text-sm hover:border-teal"
              >
                <span>
                  <div>{s.title}</div>
                  <div className="text-xs text-paper-dim">{s.artist}</div>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <RelationBadge relation={s.keyRelation} />
                  <span className="font-data text-xs text-paper-dim">
                    {s.bpm} BPM \u00b7 \u0394{s.bpmDelta}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {chain.length > 0 && suggestions.length === 0 && !isPending && (
            <li className="rounded-sm border border-dashed border-line px-3 py-4 text-center text-xs text-paper-dim">
              No compatible tracks left unused in the catalog.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
