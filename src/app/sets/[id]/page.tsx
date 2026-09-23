import Link from "next/link";
import { notFound } from "next/navigation";
import { getSet, setTransitionAnalysis } from "@/lib/queries/sets";
import { auditHistoryForSet } from "@/lib/queries/audit";
import { KeyBadge, RelationBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const setId = Number(id);
  if (!Number.isInteger(setId) || setId < 1) notFound();
  const set = await getSet(setId);
  if (!set) notFound();

  const rows = await setTransitionAnalysis(setId);
  const totalDuration = rows.at(-1)?.runningDurationSeconds ?? 0;
  const audit = await auditHistoryForSet(setId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/sets" className="text-xs text-paper-dim hover:text-paper">
        \u2190 all sets
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {set.setName ?? `Set ${set.setId}`}
      </h1>
      <p className="mt-1 text-sm text-paper-dim">
        {set.djName} \u00b7 {rows.length} tracks \u00b7 {formatDuration(totalDuration)} total
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-paper-dim">
        Every column past BPM comes from one window-function query: it
        replays the set in position order and compares each track to the one
        before it, with a running total and a 3-track rolling energy average
        layered on top.
      </p>

      <div className="mt-8 overflow-x-auto rounded-sm border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-paper-dim">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Track</th>
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Transition</th>
              <th className="px-4 py-3 font-medium">BPM \u0394</th>
              <th className="px-4 py-3 font-medium">Energy</th>
              <th className="px-4 py-3 font-medium">3-track avg</th>
              <th className="px-4 py-3 font-medium">Running time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.position} className="hover:bg-surface">
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
                  {r.bpmDelta === null
                    ? "\u2014"
                    : `${r.bpmDelta > 0 ? "+" : ""}${r.bpmDelta}`}
                </td>
                <td className="px-4 py-3 font-data">{r.energy}</td>
                <td className="px-4 py-3 font-data text-paper-dim">{r.energyMovingAvg}</td>
                <td className="px-4 py-3 font-data text-paper-dim">
                  {formatDuration(r.runningDurationSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {audit.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-paper-dim">Audit trail</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper-dim">
            An <code className="font-data">AFTER INSERT OR UPDATE OR DELETE</code>{" "}
            trigger writes here on every change to this row, storing the
            whole thing as JSONB. No application code produced this, the
            database did.
          </p>
          <div className="mt-4 space-y-3">
            {audit.map((entry, i) => (
              <details
                key={i}
                className="rounded-sm border border-line bg-surface px-4 py-3"
              >
                <summary className="cursor-pointer font-data text-xs text-teal">
                  {entry.action} \u2014{" "}
                  {new Date(entry.changedAt).toLocaleString()}
                </summary>
                <pre className="mt-3 overflow-x-auto font-data text-xs text-paper-dim">
                  {JSON.stringify(entry.newData ?? entry.oldData, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
