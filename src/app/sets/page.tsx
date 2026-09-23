import Link from "next/link";
import { listSets } from "@/lib/queries/sets";

export const dynamic = "force-dynamic";

export default async function SetsIndexPage() {
  const sets = await listSets();
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Recorded sets</h1>
      <p className="mt-2 text-sm text-paper-dim">
        Historical performances, each with a full tracklist to replay through
        the transition analysis.
      </p>
      <ul className="mt-8 divide-y divide-line rounded-sm border border-line">
        {sets.map((s) => (
          <li key={s.setId}>
            <Link
              href={`/sets/${s.setId}`}
              className="flex items-center justify-between px-4 py-3 text-sm hover:bg-surface"
            >
              <span>
                {s.setName ?? `Set ${s.setId}`}{" "}
                <span className="text-paper-dim">\u2014 {s.djName}</span>
              </span>
              <span className="font-data text-xs text-paper-dim">
                {s.performedAt ? new Date(s.performedAt).toLocaleDateString() : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
