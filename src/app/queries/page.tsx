import { pool } from "@/lib/db";
import { QueryPanel } from "@/components/query-panel";
import { KeyBadge, RelationBadge } from "@/components/badges";
import { findMixChains, suggestNextTracks } from "@/lib/queries/compatibility";
import { setsContainingAllTracks, setTransitionBreakdown } from "@/lib/queries/sets";
import { trackPlayPercentiles } from "@/lib/queries/analytics";
import { searchCatalog, listCatalog } from "@/lib/queries/catalog";
import { demoExclusionConstraint } from "@/lib/queries/demo";
import { recentAuditActivity } from "@/lib/queries/audit";
import {
  RECURSIVE_MIX_CHAIN_SQL,
  NEXT_TRACK_SUGGESTIONS_FOR_TRACK_SQL,
  SETS_CONTAINING_ALL_TRACKS_SQL,
  TRACK_PLAY_PERCENTILE_SQL,
  SET_TRANSITION_BREAKDOWN_SQL,
  CATALOG_SEARCH_SQL,
  VENUE_BOOKING_ATTEMPT_SQL,
  SET_AUDIT_HISTORY_SQL,
} from "@/lib/queries/sql.generated";

export const dynamic = "force-dynamic";

async function mostConnectedTrack(): Promise<{ trackId: number; title: string } | null> {
  const { rows } = await pool.query(
    `SELECT tc.track_id_a, t.title, count(*) AS edges
     FROM track_compatibility tc
     JOIN tracks t ON t.track_id = tc.track_id_a
     GROUP BY tc.track_id_a, t.title
     ORDER BY edges DESC
     LIMIT 1`,
  );
  if (!rows[0]) return null;
  return { trackId: rows[0].track_id_a, title: rows[0].title };
}

export default async function QueriesPage() {
  const seed = await mostConnectedTrack();
  const catalog = await listCatalog();

  const [chains, suggestions, percentiles, breakdown, searchHits, exclusionDemo, auditRows] =
    await Promise.all([
      seed ? findMixChains(seed.trackId, 5) : Promise.resolve([]),
      catalog[0] ? suggestNextTracks(catalog[0].trackId, [], 5) : Promise.resolve([]),
      trackPlayPercentiles(),
      setTransitionBreakdown(),
      searchCatalog("night"),
      demoExclusionConstraint(),
      recentAuditActivity(),
    ]);

  const requiredIds = catalog.slice(0, 2).map((t) => t.trackId);
  const divisionResult = await setsContainingAllTracks(requiredIds);

  const chainTitlesById = new Map(catalog.map((t) => [t.trackId, t.title] as const));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Query gallery</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper-dim">
        Nine techniques, each run live against the seeded catalog when this
        page loads. The SQL on the left is read straight out of{" "}
        <code className="font-data">db/queries/</code>, the same files the
        rest of the app calls.
      </p>

      <QueryPanel
        title="Chain the whole catalog together"
        technique="Recursive CTE"
        description={`Starting from "${seed?.title ?? "a seed track"}", walk the compatibility graph five tracks deep without repeating a track. The cycle guard is a plain array containment check.`}
        sql={RECURSIVE_MIX_CHAIN_SQL}
      >
        <ul className="divide-y divide-line text-sm">
          {chains.slice(0, 5).map((c, i) => (
            <li key={i} className="px-4 py-3">
              {c.path.map((id) => chainTitlesById.get(id) ?? id).join("  \u2192  ")}
            </li>
          ))}
          {chains.length === 0 && <li className="px-4 py-6 text-paper-dim">No chain found.</li>}
        </ul>
      </QueryPanel>

      <QueryPanel
        title="What should play next"
        technique="LATERAL join"
        description={`Top matches for "${catalog[0]?.title}" ranked by tempo closeness, computed with one LATERAL subquery per row instead of a correlated subquery.`}
        sql={NEXT_TRACK_SUGGESTIONS_FOR_TRACK_SQL}
      >
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-line">
            {suggestions.map((s) => (
              <tr key={s.trackId}>
                <td className="px-4 py-3">{s.title}</td>
                <td className="px-4 py-3">
                  <RelationBadge relation={s.keyRelation} />
                </td>
                <td className="px-4 py-3 font-data text-paper-dim">\u0394{s.bpmDelta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </QueryPanel>

      <QueryPanel
        title="Which sets covered every required track"
        technique="Relational division"
        description={`Sets that played both "${chainTitlesById.get(requiredIds[0]!) ?? ""}" and "${chainTitlesById.get(requiredIds[1]!) ?? ""}", found with a double NOT EXISTS instead of counting and comparing.`}
        sql={SETS_CONTAINING_ALL_TRACKS_SQL}
      >
        <ul className="divide-y divide-line text-sm">
          {divisionResult.map((s) => (
            <li key={s.setId} className="px-4 py-3">
              {s.setName} \u2014 {s.djName}
            </li>
          ))}
          {divisionResult.length === 0 && (
            <li className="px-4 py-6 text-paper-dim">No set played both.</li>
          )}
        </ul>
      </QueryPanel>

      <QueryPanel
        title="Which tracks actually get played"
        technique="Window functions"
        description="Play counts ranked with PERCENT_RANK and split into quartiles with NTILE, both computed in the same pass as the aggregate."
        sql={TRACK_PLAY_PERCENTILE_SQL}
      >
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-line">
            {percentiles.slice(0, 8).map((p) => (
              <tr key={p.title}>
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3 font-data text-paper-dim">{p.plays} plays</td>
                <td className="px-4 py-3 font-data text-paper-dim">Q{p.quartile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </QueryPanel>

      <QueryPanel
        title="How clean was each set"
        technique="Filtered aggregation"
        description="One row per set, counting each transition type with count(*) FILTER instead of five separate grouped queries."
        sql={SET_TRANSITION_BREAKDOWN_SQL}
      >
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-paper-dim">
            <tr>
              <th className="px-3 py-2 font-medium">Set</th>
              <th className="px-3 py-2 font-medium">Clash</th>
              <th className="px-3 py-2 font-medium">Adjacent</th>
              <th className="px-3 py-2 font-medium">Relative</th>
              <th className="px-3 py-2 font-medium">Boost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {breakdown.slice(0, 6).map((b) => (
              <tr key={b.setId}>
                <td className="px-3 py-2">{b.setName}</td>
                <td className="px-3 py-2 font-data text-clash">{b.clashTransitions}</td>
                <td className="px-3 py-2 font-data text-teal">{b.adjacentTransitions}</td>
                <td className="px-3 py-2 font-data text-amber">{b.relativeTransitions}</td>
                <td className="px-3 py-2 font-data text-amber">{b.energyBoostTransitions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </QueryPanel>

      <QueryPanel
        title="Search the catalog"
        technique="Full text search"
        description={`Results for "night" against a trigger-maintained tsvector, ranked with ts_rank.`}
        sql={CATALOG_SEARCH_SQL}
      >
        <ul className="divide-y divide-line text-sm">
          {searchHits.map((t) => (
            <li key={t.trackId} className="flex items-center justify-between px-4 py-3">
              <span>
                {t.title} <span className="text-paper-dim">{t.artist}</span>
              </span>
              <KeyBadge camelotKey={t.camelotKey} />
            </li>
          ))}
          {searchHits.length === 0 && (
            <li className="px-4 py-6 text-paper-dim">No matches.</li>
          )}
        </ul>
      </QueryPanel>

      <QueryPanel
        title="Stop a double-booking before it happens"
        technique="Range exclusion constraint"
        description="Two bookings for the same room with overlapping times, inside a transaction that always rolls back. The second insert is rejected by Postgres itself."
        sql={VENUE_BOOKING_ATTEMPT_SQL}
      >
        <div className="p-4 text-sm">
          <p>
            First booking:{" "}
            <span className={exclusionDemo.firstBookingOk ? "text-teal" : "text-clash"}>
              {exclusionDemo.firstBookingOk ? "accepted" : "failed"}
            </span>
          </p>
          <p className="mt-2">
            Overlapping second booking:{" "}
            <span className={exclusionDemo.secondBookingBlocked ? "text-teal" : "text-clash"}>
              {exclusionDemo.secondBookingBlocked ? "blocked by Postgres" : "was NOT blocked"}
            </span>
          </p>
          {exclusionDemo.postgresError && (
            <pre className="mt-3 overflow-x-auto rounded-sm bg-ink p-3 font-data text-xs text-clash">
              {exclusionDemo.postgresError}
            </pre>
          )}
        </div>
      </QueryPanel>

      <QueryPanel
        title="Every change to a set, for free"
        technique="Audit trigger + JSONB"
        description="Recent rows written by the AFTER INSERT/UPDATE/DELETE trigger on sets. Every one of these came from seeding the catalog, not from calling this endpoint."
        sql={SET_AUDIT_HISTORY_SQL}
      >
        <ul className="divide-y divide-line text-sm">
          {auditRows.map((a) => (
            <li key={a.auditId} className="flex items-center justify-between px-4 py-3">
              <span>
                {a.action} \u2014 {a.setName ?? `set ${a.setId}`}
              </span>
              <span className="font-data text-xs text-paper-dim">
                {new Date(a.changedAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </QueryPanel>
    </div>
  );
}
