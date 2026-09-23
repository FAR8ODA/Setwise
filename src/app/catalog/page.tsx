import { listCatalog, listGenres, searchCatalog } from "@/lib/queries/catalog";
import { KeyBadge, EnergyBar } from "@/components/badges";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number) {
  if (!seconds) return "\u2014";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string }>;
}) {
  const { q, genre } = await searchParams;
  const [genres, tracks] = await Promise.all([
    listGenres(),
    q ? searchCatalog(q) : listCatalog(genre),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
      <p className="mt-2 text-sm text-paper-dim">
        {tracks.length} tracks. Search runs a full text query against a
        trigger-maintained <code className="font-data">tsvector</code>{" "}
        combining title and artist.
      </p>

      <form className="mt-6 flex flex-wrap gap-3" action="/catalog">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search title or artist\u2026"
          className="w-64 rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-paper-dim focus:border-teal"
        />
        <select
          name="genre"
          defaultValue={genre ?? ""}
          className="rounded-sm border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-teal"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm bg-amber px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          Filter
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-sm border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-paper-dim">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Artist</th>
              <th className="px-4 py-3 font-medium">Genre</th>
              <th className="px-4 py-3 font-medium">BPM</th>
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Energy</th>
              <th className="px-4 py-3 font-medium">Length</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tracks.map((t) => (
              <tr key={t.trackId} className="hover:bg-surface">
                <td className="px-4 py-3">{t.title}</td>
                <td className="px-4 py-3 text-paper-dim">{t.artist}</td>
                <td className="px-4 py-3 text-paper-dim">{t.genre}</td>
                <td className="px-4 py-3 font-data">{t.bpm}</td>
                <td className="px-4 py-3">
                  <KeyBadge camelotKey={t.camelotKey} />
                </td>
                <td className="px-4 py-3">
                  <EnergyBar energy={t.energy} />
                </td>
                <td className="px-4 py-3 font-data text-paper-dim">
                  {formatDuration(t.durationSeconds)}
                </td>
              </tr>
            ))}
            {tracks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-paper-dim">
                  No tracks match that search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
