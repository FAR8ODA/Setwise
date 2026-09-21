import Link from "next/link";
import { CamelotWheel } from "@/components/camelot-wheel";

const TECHNIQUES = [
  { label: "Recursive CTE", detail: "chains valid transitions across the whole catalog" },
  { label: "Window functions", detail: "tracks BPM and energy delta transition to transition" },
  { label: "LATERAL join", detail: "ranks the best next track per row, not per query" },
  { label: "Relational division", detail: "finds sets that cover every track on a required list" },
  { label: "Exclusion constraint", detail: "stops a venue slot from double-booking on overlap" },
  { label: "Audit trigger", detail: "logs every change to a set as JSONB, no app code involved" },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="grid grid-cols-1 items-center gap-12 py-20 md:grid-cols-[1fr_auto]">
        <div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Will this track mix into the next one? That&#39;s a query, not a guess.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-paper-dim">
            Setwise models a DJ&#39;s catalog, harmonic key relationships, and
            set history in PostgreSQL, then answers real questions with real
            SQL: what mixes with what, what a set&#39;s energy curve looks
            like, and what would happen if you booked two sets in the same
            room at the same time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/build"
              className="rounded-sm bg-amber px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              Build a set
            </Link>
            <Link
              href="/queries"
              className="rounded-sm border border-line px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:border-paper-dim"
            >
              See the SQL
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <CamelotWheel highlight="8A" />
        </div>
      </section>

      <section className="border-t border-line py-14">
        <h2 className="text-sm font-medium text-paper-dim">
          Six things the database is doing, not the application
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-sm bg-line sm:grid-cols-2 lg:grid-cols-3">
          {TECHNIQUES.map((t) => (
            <div key={t.label} className="bg-surface p-5">
              <p className="font-data text-sm text-teal">{t.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">
                {t.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-14">
        <h2 className="text-sm font-medium text-paper-dim">The rule set</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-paper-dim">
          Every key on the wheel is written as a number from 1 to 12 plus A
          for minor or B for major, the Camelot system DJs already mix by. Two
          tracks are compatible when they share a key, sit one step apart on
          the same ring, or sit on opposite rings at the same number. Setwise
          encodes that as a single PostgreSQL function and reuses it
          everywhere: the compatibility view, the recursive chain builder, and
          the set analytics all call the same rule.
        </p>
      </section>
    </div>
  );
}
