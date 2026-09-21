-- A "set" is one DJ performance: a dj name, an optional venue and time
-- slot, and an ordered list of tracks in set_tracks.

CREATE TABLE sets (
    set_id          serial PRIMARY KEY,
    dj_name         text NOT NULL,
    venue_id        integer REFERENCES venues(venue_id) ON DELETE SET NULL,
    set_name        text,
    performed_at    timestamptz,
    scheduled_slot  tstzrange,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),

    -- Two sets can't claim the same venue at overlapping times. This is
    -- enforced by Postgres itself, not application code: && is the range
    -- "overlaps" operator, and btree_gist (0001) is what lets an integer
    -- equality condition sit inside a GiST-backed EXCLUDE constraint.
    CONSTRAINT no_overlapping_venue_bookings
        EXCLUDE USING gist (
            venue_id WITH =,
            scheduled_slot WITH &&
        ) WHERE (scheduled_slot IS NOT NULL AND venue_id IS NOT NULL)
);

CREATE INDEX idx_sets_venue ON sets (venue_id);

CREATE TABLE set_tracks (
    set_id          integer NOT NULL REFERENCES sets(set_id) ON DELETE CASCADE,
    position        integer NOT NULL CHECK (position > 0),
    track_id        integer NOT NULL REFERENCES tracks(track_id) ON DELETE RESTRICT,
    played_at       timestamptz,
    crowd_response  smallint CHECK (crowd_response IS NULL OR crowd_response BETWEEN 1 AND 10),
    PRIMARY KEY (set_id, position),
    UNIQUE (set_id, track_id)
);

CREATE INDEX idx_set_tracks_track ON set_tracks (track_id);
