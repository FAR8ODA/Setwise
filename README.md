# Setwise

Harmonic mixing intelligence for DJs, built to put real PostgreSQL to work.

Setwise models a DJ's track catalog, the Camelot wheel's key-compatibility
rules, venue bookings, and historical set performances, then answers
questions a database is actually good at: which tracks mix cleanly into
which others, what a set's energy curve looks like transition to
transition, and whether two bookings collide.

## Project status

Setwise is in its foundation phase. The repository currently contains the
application shell, tooling, and CI. The schema, query layer, and UI are
built out incrementally; see the commit history for the sequence.

## Why this project exists

It's a small, deliberately SQL-heavy portfolio piece: recursive CTEs,
window functions, `LATERAL` joins, relational division, range-type
exclusion constraints, a materialized view, and an audit trigger, all doing
real work against real data rather than illustrating a textbook example.
The `/queries` page in the app is a gallery that runs each technique
against the live catalog and shows the SQL next to its output.

## Tech stack

- Next.js (App Router) and TypeScript
- PostgreSQL, queried with hand-written parameterized SQL via `pg`
- Tailwind CSS
- Docker Compose for local Postgres
- GitHub Actions for CI

## Local setup

### Prerequisites

- Node.js 22+
- Docker Desktop or another PostgreSQL 16+ environment

### Install and configure

```
npm install
cp .env.example .env.local
```

### Start PostgreSQL

```
docker compose up -d database
```

### Start the app

```
npm run dev
```

Open http://localhost:3000.

## Available commands

- `npm run dev` starts the development server
- `npm run build` creates a production build
- `npm run start` runs the production build
- `npm run lint` runs ESLint
- `npm run typecheck` checks TypeScript without emitting files

Database commands (`db:migrate`, `db:seed`, `db:reset`) are documented in
`db/README.md` once the schema lands.

## License

MIT. See `LICENSE`.

## Ownership

Setwise is an independent portfolio project created and maintained by
Farbod Alikhanzadeh.
