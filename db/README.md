# Database

## Layout

- `migrations/` — forward-only, numbered SQL files. Nothing here is ever
  edited after it ships; a change becomes a new migration.
- `seed.sql` — generated demo data. Don't hand-edit it; regenerate it
  instead (see below).
- `queries/` — the query layer, one technique per file, heavily commented.
  These are the actual source of truth: `npm run db:queries:generate`
  bakes them into `src/lib/queries/sql.generated.ts` so the app and the
  `/queries` gallery page both run and display the exact same SQL.

## Commands

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Applies any migration not yet recorded in `schema_migrations`. Safe to run repeatedly. |
| `npm run db:seed` | Loads `db/seed.sql`. Skips itself if `tracks` already has rows. |
| `npm run db:reset` | Drops and recreates the `public` schema, then migrates and seeds from scratch. **Local development only.** |
| `npm run db:seed:generate` | Regenerates `db/seed.sql` from `scripts/generate-seed.ts`. Deterministic: same output every time unless the generator or the RNG seed changes. |
| `npm run db:queries:generate` | Regenerates `src/lib/queries/sql.generated.ts` from `db/queries/*.sql`. Run this after editing any file in `db/queries/`. |

## Schema summary

- `artists`, `venues` — reference tables.
- `tracks` — the catalog. `camelot_key` is checked against the Camelot
  notation with a regex; `search_vector` is kept in sync by a trigger
  because it depends on the artist's name in another table.
- `sets`, `set_tracks` — a DJ performance and its ordered tracklist. `sets`
  carries a range-type `EXCLUDE` constraint so two sets can't double-book
  the same venue at overlapping times.
- `camelot_relation()`, `bpm_compatible()` — the two functions everything
  else calls to decide if two tracks mix.
- `track_compatibility` — a materialized view of every non-clashing,
  tempo-compatible track pair. Refresh it with
  `SELECT refresh_track_compatibility();` after changing the catalog.
- `set_audit_log` — append-only history of every change to `sets`, written
  by a trigger, not application code.

## Working with a hosted Postgres (Neon, RDS, etc.)

Set `DATABASE_URL` to the connection string and `DATABASE_SSL=require` in
`.env.local`, then run `npm run db:migrate` and `npm run db:seed` as usual.
