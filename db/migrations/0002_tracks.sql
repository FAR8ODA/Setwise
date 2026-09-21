-- The catalog. camelot_key is the Camelot notation DJs already mix by:
-- a wheel position 1-12 plus A (minor) or B (major).

CREATE TABLE tracks (
    track_id          serial PRIMARY KEY,
    artist_id         integer NOT NULL REFERENCES artists(artist_id) ON DELETE RESTRICT,
    title             text NOT NULL,
    genre             text NOT NULL,
    bpm               numeric(5,1) NOT NULL CHECK (bpm > 0 AND bpm < 300),
    camelot_key       text NOT NULL CHECK (camelot_key ~ '^(1[0-2]|[1-9])[AB]$'),
    energy            smallint NOT NULL CHECK (energy BETWEEN 1 AND 10),
    duration_seconds  integer NOT NULL CHECK (duration_seconds > 0),
    release_year      integer CHECK (release_year IS NULL OR release_year BETWEEN 1970 AND 2100),
    search_vector     tsvector,
    created_at        timestamptz NOT NULL DEFAULT now(),
    UNIQUE (artist_id, title)
);

CREATE INDEX idx_tracks_artist ON tracks (artist_id);
CREATE INDEX idx_tracks_genre ON tracks (genre);
CREATE INDEX idx_tracks_camelot_key ON tracks (camelot_key);
CREATE INDEX idx_tracks_search ON tracks USING gin (search_vector);

-- search_vector can't be a generated column because it depends on the
-- artist's name, which lives in another table. A trigger keeps it in sync
-- on insert, on title/artist changes, and whenever the artist is renamed.

CREATE OR REPLACE FUNCTION tracks_refresh_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(
            to_tsvector(
                'english',
                coalesce((SELECT name FROM artists WHERE artist_id = NEW.artist_id), '')
            ),
            'B'
        );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tracks_search_vector
BEFORE INSERT OR UPDATE OF title, artist_id ON tracks
FOR EACH ROW
EXECUTE FUNCTION tracks_refresh_search_vector();

-- Renaming an artist should update every one of their tracks' search text.

CREATE OR REPLACE FUNCTION artists_cascade_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
        UPDATE tracks SET title = title WHERE artist_id = NEW.artist_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_artists_cascade_search_vector
AFTER UPDATE OF name ON artists
FOR EACH ROW
EXECUTE FUNCTION artists_cascade_search_vector();
