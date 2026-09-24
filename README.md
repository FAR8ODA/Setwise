# Setwise

Harmonic mixing intelligence for DJs, built to put real PostgreSQL to work.

Setwise models a DJ's track catalog, the Camelot wheel's key-compatibility
rules, venue bookings, and historical set performances, then answers
questions a database is actually good at: which tracks mix cleanly into
which others, what a set's energy curve looks like transition to
transition, and whether two bookings collide.

**[See the SQL run live →](#the-query-gallery)**

## Why this project exists

It's a small, deliberately SQL-heavy portfolio piece: recursive CTEs,
window functions, `LATERAL` joins, relational division, a range-type
`EXCLUDE` constraint, a materialized view, a JSONB audit trigger, and full
text search, all doing real work against real seeded data rather than
illustrating a textbook example. See `docs/queries.md` for a walkthrough
of each one.

## Tech stack

- Next.js (App Router) and TypeScript
- PostgreSQL, queried with hand-written parameterized SQL via `pg` (no ORM)
- Tailwind CSS
- Docker Compose for local Postgres
- GitHub Actions for CI, including a real Postgres service for integration tests

## The app

- **`/catalog`** — full text search and genre filtering over the track catalog.
- **`/build`** — pick a starting track, then add from `LATERAL`-ranked
  suggestions. A window-function query replays the growing chain's energy
  and BPM curve live. Save it and it's a real row, with a real audit trail.
- **`/sets/[id]`** — a recorded set's full transition analysis, plus its
  audit history straight out of `set_audit_log`.
- **`/queries`** — the query gallery. Nine techniques, each with its SQL
  on the left and live output from the seeded catalog on the right.

## Local setup

### Prerequisites

- Node.js 22+
- Docker Desktop or another PostgreSQL 16+ environment

### Install, configure, and start Postgres

```
npm install
cp .env.example .env.local
docker compose up -d database
```

### Set up the database and start the app

```
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Available commands

- `npm run dev` / `build` / `start` — the usual Next.js trio
- `npm run lint` / `typecheck` — ESLint and `tsc --noEmit`
- `npm test` — integration tests against a real Postgres (see `tests/README.md`)
- Database commands are documented in `db/README.md`

## Deploying

Setwise is a stock Next.js app: point it at a managed Postgres (this was
built and tested against [Neon](https://neon.tech)) and deploy to
[Vercel](https://vercel.com) or anywhere else that runs Next.js.

1. Create a Postgres database and copy its connection string.
2. Set `DATABASE_URL` (and `DATABASE_SSL=require` for most hosted
   providers) in your deployment's environment variables.
3. Run `npm run db:migrate` and `npm run db:seed` once, pointed at that
   database, from your machine or a one-off CI job.
4. Deploy. There's no build-time dependency on the database beyond the
   generated query constants already checked into the repo.

## License

MIT. See `LICENSE`.

## Ownership

Setwise is an independent portfolio project created and maintained by
Farbod Alikhanzadeh.
