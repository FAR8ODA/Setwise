-- Extensions and small reference tables that everything else hangs off of.

CREATE EXTENSION IF NOT EXISTS btree_gist;
-- btree_gist lets a GiST index (and therefore an EXCLUDE constraint) compare
-- plain scalar columns like integer with "=", not just geometric/range types.
-- We need that in 0003 to exclude overlapping venue bookings.

CREATE TABLE artists (
    artist_id   serial PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    country     text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE venues (
    venue_id    serial PRIMARY KEY,
    name        text NOT NULL,
    city        text NOT NULL,
    capacity    integer CHECK (capacity IS NULL OR capacity > 0),
    created_at  timestamptz NOT NULL DEFAULT now()
);
