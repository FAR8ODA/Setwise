-- The rule set, written once and reused everywhere: the materialized view
-- in 0005, the recursive chain builder, and the set analytics queries all
-- call these same two functions instead of re-implementing the wheel.

CREATE OR REPLACE FUNCTION camelot_relation(key_a text, key_b text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    num_a integer := substring(key_a from '^[0-9]+')::integer;
    num_b integer := substring(key_b from '^[0-9]+')::integer;
    letter_a text := right(key_a, 1);
    letter_b text := right(key_b, 1);
    wheel_distance integer;
BEGIN
    IF key_a = key_b THEN
        RETURN 'identical';
    END IF;

    -- The wheel wraps at 12, so the true distance between two positions is
    -- the shorter of the direct gap and the gap going the other way around.
    wheel_distance := least(abs(num_a - num_b), 12 - abs(num_a - num_b));

    IF letter_a = letter_b AND wheel_distance = 1 THEN
        RETURN 'adjacent';       -- one step around the same ring, e.g. 8A -> 9A
    END IF;

    IF num_a = num_b AND letter_a <> letter_b THEN
        RETURN 'relative';       -- relative major/minor, e.g. 8A -> 8B
    END IF;

    IF letter_a = letter_b AND wheel_distance = 2 THEN
        RETURN 'energy_boost';   -- a bold two-step jump DJs use to lift energy
    END IF;

    RETURN 'clash';
END;
$$;

COMMENT ON FUNCTION camelot_relation IS
    'Classifies the harmonic relationship between two Camelot keys: identical, adjacent, relative, energy_boost, or clash.';

CREATE OR REPLACE FUNCTION bpm_compatible(bpm_a numeric, bpm_b numeric, tolerance numeric DEFAULT 0.06)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    -- Within +/-6% is mixable by ear or a small pitch shift. Half-time and
    -- double-time tracks (a 174 BPM drum & bass tune over a 87 BPM house
    -- tune) are also mixable, so both are checked.
    SELECT abs(bpm_a - bpm_b) / bpm_a <= tolerance
        OR abs(bpm_a - bpm_b * 2) / bpm_a <= tolerance
        OR abs(bpm_a - bpm_b / 2) / bpm_a <= tolerance;
$$;

COMMENT ON FUNCTION bpm_compatible IS
    'True when two BPMs are close enough to mix directly, or at half/double tempo.';
