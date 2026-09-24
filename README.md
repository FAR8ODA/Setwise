# Setwise

[![CI](https://github.com/FAR8ODA/Setwise/actions/workflows/ci.yml/badge.svg)](https://github.com/FAR8ODA/Setwise/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Setwise is a PostgreSQL-backed DJ set planner built around harmonic mixing.
It models tracks, Camelot-key compatibility, venue bookings, and performed
sets, then uses SQL to answer the questions that connect them: what mixes
cleanly, how a set's energy changes from track to track, and whether two
bookings overlap.

[Read the annotated SQL walkthrough →](docs/queries.md)

## What it demonstrates

The database is the center of the application, not just its storage layer.
Setwise uses hand-written, parameterized SQL through `pg`—there is no ORM.

| PostgreSQL feature | How Setwise uses it |
| --- | --- |
| Recursive CTE | Builds compatible mix chains without revisiting tracks |
| `LATERAL` join | Ranks the best next-track suggestions per source track |
| Window functions | Calculates BPM changes, energy curves, and play percentiles |
| Relational division | Finds sets containing every track in a requested list |
| Filtered aggregation | Summarizes transition types in one grouped query |
| Range exclusion constraint | Prevents overlapping bookings at the same venue |
| Trigger + JSONB | Records an audit trail for every change to a set |
| Full-text search | Searches weighted track titles and artist names |
| Materialized view | Precomputes compatible track pairs for fast reads |

The `/queries` gallery runs eight demonstrations against the seeded database
and displays the same SQL files used by the application. The compatibility
materialized view supports those queries and is documented separately in the
[SQL walkthrough](docs/queries.md).

## Application routes

| Route | Purpose |
| --- | --- |
| `/catalog` | Search and filter the track catalog |
| `/build` | Assemble a set from ranked, compatible suggestions |
| `/sets` | Browse saved performances |
| `/sets/[id]` | Inspect transitions and the database audit history |
| `/queries` | Explore eight SQL techniques with live seeded results |

## Tech stack

- Next.js App Router, React, and TypeScript
- PostgreSQL 16 with hand-written SQL via `pg`
- Tailwind CSS
- Docker Compose for local PostgreSQL
- GitHub Actions for linting, type checking, builds, and PostgreSQL integration tests

## Run locally

### Prerequisites

- Node.js 22 or later
- Docker Desktop, or another PostgreSQL 16+ instance

Install the locked dependencies:

```bash
npm ci
```

Copy the example environment file.

macOS or Linux:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Start PostgreSQL, apply the schema, load the deterministic demo data, and
launch the development server:

```bash
docker compose up -d database
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default local
connection in `.env.example` points to the Docker service on port `5433`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run integration tests against PostgreSQL |
| `npm run db:migrate` | Apply pending database migrations |
| `npm run db:seed` | Load the demo dataset if the catalog is empty |
| `npm run db:reset` | Recreate, migrate, and seed the local schema |

See [db/README.md](db/README.md) for the database workflow and
[tests/README.md](tests/README.md) for integration-test requirements.

## Continuous integration

The [CI workflow](.github/workflows/ci.yml) runs two independent jobs on
every push and pull request to `main`:

- `build` installs from the lockfile, lints, type-checks, and builds the app.
- `database` starts PostgreSQL 16, applies migrations, seeds the database,
  and runs the integration suite.

## Deployment

Deploy the Next.js application with a PostgreSQL 16+ database and set:

```text
DATABASE_URL=your-postgres-connection-string
DATABASE_SSL=require
```

Use `DATABASE_SSL=require` only when the provider requires TLS. Apply the
migrations and seed data once before serving the application. Next.js imports
the database module during its build, so `DATABASE_URL` must also be available
in the build environment; the database itself is not queried until runtime.

## License

[MIT](LICENSE) © 2026 Farbod Alikhanzadeh
