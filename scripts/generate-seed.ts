// Produces db/seed.sql from a seeded PRNG, so the catalog is large and
// varied but regenerating it always gives the same result. This script
// does not touch a database: it mirrors camelot_relation()/bpm_compatible()
// in plain TypeScript (see mirrorCamelotRelation below) just well enough to
// assemble believable historical setlists, including a couple of
// deliberately bad transitions so the query gallery has something to show
// besides perfect data.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------- seeded PRNG (mulberry32) ----------
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260614);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const chance = (p: number) => rand() < p;
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// ---------- mirrors db/migrations/0004_compatibility_functions.sql ----------
function mirrorCamelotRelation(a: string, b: string): "identical" | "adjacent" | "relative" | "energy_boost" | "clash" {
  if (a === b) return "identical";
  const numA = Number(a.slice(0, -1));
  const numB = Number(b.slice(0, -1));
  const letterA = a.slice(-1);
  const letterB = b.slice(-1);
  const dist = Math.min(Math.abs(numA - numB), 12 - Math.abs(numA - numB));
  if (letterA === letterB && dist === 1) return "adjacent";
  if (numA === numB && letterA !== letterB) return "relative";
  if (letterA === letterB && dist === 2) return "energy_boost";
  return "clash";
}
function mirrorBpmCompatible(a: number, b: number, tol = 0.06): boolean {
  return (
    Math.abs(a - b) / a <= tol ||
    Math.abs(a - b * 2) / a <= tol ||
    Math.abs(a - b / 2) / a <= tol
  );
}

// ---------- word banks ----------
const ARTIST_FIRST = [
  "Nova", "Echo", "Iris", "Vantablack", "Midnight", "Solvane", "Kessler",
  "Gravity", "Parallel", "Obsidian", "Copper", "Halide", "Amber", "Static",
  "Violet", "Ashen", "Drift", "Nightshade", "Mono", "Ferro", "Cinder",
  "Marrow", "Quartz", "Delta", "Ultraviolet", "Basalt", "Lumen", "Foxglove",
] as const;
const ARTIST_SECOND = [
  "Ridge", "Valley", "Loom", "Current", "Well", "Bloom", "Fold", "Circuit",
  "Harbor", "Bureau", "Atlas", "Engine", "Season", "Tide", "Frequency",
  "Choir", "Radio", "Line", "Field", "Hollow", "Cartel", "Society", "Signal",
] as const;
const ARTIST_SOLO_SUFFIX = ["", "", "", "jr", "XL", "II"] as const;

const TITLE_WORDS = [
  "Afterglow", "Low Tide", "Parallel Lines", "Static Bloom", "Nocturne",
  "Halflight", "Open Water", "Long Exposure", "Slow Burn", "Zero Gravity",
  "Night Drive", "Faultline", "Signal Loss", "Undertow", "Departure",
  "Reentry", "Bloomfield", "Vantage", "Coastline", "Drift State",
  "Quiet Hours", "Wax and Wane", "Ultraviolet Sky", "Foxfire", "Glass Coast",
  "Loop Season", "Marrow Deep", "Second Skin", "Aftertaste", "Cold Front",
  "Analog Ghost", "Basalt", "Pale Harbor", "Interval", "No Fixed Address",
] as const;
const TITLE_SUFFIX = [
  "", "", "(Extended Mix)", "(Club Mix)", "(Original Mix)", "(Dub)",
  "(VIP Mix)", "(Late Night Version)",
] as const;

const CITIES = [
  ["Vancouver", "CA"], ["Berlin", "DE"], ["Montreal", "CA"],
  ["Amsterdam", "NL"], ["Detroit", "US"], ["Manchester", "GB"],
  ["Lisbon", "PT"], ["Tokyo", "JP"], ["Melbourne", "AU"], ["Glasgow", "GB"],
] as const;
const VENUE_NAME_FIRST = ["The", "Sub", "Hangar", "Basement", "Concrete", "Foundry", "Static"] as const;
const VENUE_NAME_SECOND = ["Yard", "Room", "Works", "Hall", "Loft", "Terminal", "Annex"] as const;

type Genre = {
  name: string;
  bpm: [number, number];
  energy: [number, number];
  duration: [number, number];
};
const GENRES: Genre[] = [
  { name: "Deep House", bpm: [118, 123], energy: [3, 6], duration: [320, 440] },
  { name: "House", bpm: [122, 126], energy: [4, 7], duration: [300, 400] },
  { name: "Disco", bpm: [110, 118], energy: [3, 6], duration: [260, 360] },
  { name: "Melodic Techno", bpm: [122, 128], energy: [5, 8], duration: [340, 460] },
  { name: "Techno", bpm: [128, 134], energy: [6, 9], duration: [300, 400] },
  { name: "Trance", bpm: [136, 140], energy: [6, 9], duration: [320, 420] },
  { name: "Drum & Bass", bpm: [172, 176], energy: [7, 10], duration: [220, 300] },
];

const CAMELOT_KEYS = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((n) => [`${n}A`, `${n}B`]);

// ---------- generate artists ----------
type ArtistRow = { id: number; name: string };
const ARTIST_COUNT = 42;
const usedArtistNames = new Set<string>();
const artists: ArtistRow[] = [];
while (artists.length < ARTIST_COUNT) {
  let name: string;
  const style = rand();
  if (style < 0.55) {
    name = `${pick(ARTIST_FIRST)} ${pick(ARTIST_SECOND)}`;
  } else if (style < 0.75) {
    const suffix = pick(ARTIST_SOLO_SUFFIX);
    name = suffix ? `${pick(ARTIST_FIRST)} ${suffix}` : pick(ARTIST_FIRST);
  } else if (style < 0.9) {
    const first = pick(ARTIST_FIRST);
    let second = pick(ARTIST_FIRST);
    while (second === first) second = pick(ARTIST_FIRST);
    name = `${first} & ${second}`;
  } else {
    name = `The ${pick(ARTIST_SECOND)} Collective`;
  }
  if (usedArtistNames.has(name)) continue;
  usedArtistNames.add(name);
  artists.push({ id: artists.length + 1, name });
}

// ---------- generate tracks ----------
type TrackRow = {
  id: number;
  artistId: number;
  title: string;
  genre: string;
  bpm: number;
  camelotKey: string;
  energy: number;
  durationSeconds: number;
  releaseYear: number;
};
const tracks: TrackRow[] = [];
const usedTitlesPerArtist = new Map<number, Set<string>>();
const TRACKS_PER_GENRE = 16;
for (const genre of GENRES) {
  for (let i = 0; i < TRACKS_PER_GENRE; i++) {
    const artist = pick(artists);
    let title = `${pick(TITLE_WORDS)}${pick(TITLE_SUFFIX) ? " " + pick(TITLE_SUFFIX) : ""}`;
    const seen = usedTitlesPerArtist.get(artist.id) ?? new Set<string>();
    let guard = 0;
    while (seen.has(title) && guard < 10) {
      title = `${pick(TITLE_WORDS)}${pick(TITLE_SUFFIX) ? " " + pick(TITLE_SUFFIX) : ""}`;
      guard++;
    }
    seen.add(title);
    usedTitlesPerArtist.set(artist.id, seen);

    const bpm = Math.round((int(genre.bpm[0] * 10, genre.bpm[1] * 10) / 10) * 10) / 10;
    tracks.push({
      id: tracks.length + 1,
      artistId: artist.id,
      title,
      genre: genre.name,
      bpm,
      camelotKey: pick(CAMELOT_KEYS),
      energy: int(genre.energy[0], genre.energy[1]),
      durationSeconds: int(genre.duration[0], genre.duration[1]),
      releaseYear: int(2019, 2026),
    });
  }
}

// ---------- generate venues ----------
type VenueRow = { id: number; name: string; city: string; capacity: number | null };
const venues: VenueRow[] = CITIES.map(([city], i) => ({
  id: i + 1,
  name: `${pick(VENUE_NAME_FIRST)} ${pick(VENUE_NAME_SECOND)}`,
  city,
  capacity: chance(0.85) ? int(150, 2400) : null,
}));

// ---------- generate historical sets ----------
type SetRow = {
  id: number;
  djName: string;
  venueId: number | null;
  setName: string | null;
  performedAt: string | null;
  scheduledSlot: [string, string] | null;
  notes: string | null;
  trackIds: number[];
};

function tracksByGenre(genre: string) {
  return tracks.filter((t) => t.genre === genre);
}

// Build one setlist by walking real harmonic-compatibility rules, the same
// ones enforced in SQL, so the seed data isn't just plausible-looking, it's
// actually mostly mixable. `spoilAt` optionally forces a clash at a given
// position so the query gallery has a non-trivial "clash" example too.
function buildSetlist(genre: string, length: number, spoilAt?: number): number[] {
  const pool = shuffle(tracksByGenre(genre));
  const chain: TrackRow[] = [pool[0]!];
  for (let i = 1; i < length; i++) {
    if (spoilAt === i) {
      const bad = pool.find(
        (t) => !chain.includes(t) && mirrorCamelotRelation(chain[i - 1]!.camelotKey, t.camelotKey) === "clash",
      );
      if (bad) {
        chain.push(bad);
        continue;
      }
    }
    const candidate = pool.find(
      (t) =>
        !chain.includes(t) &&
        mirrorCamelotRelation(chain[i - 1]!.camelotKey, t.camelotKey) !== "clash" &&
        mirrorBpmCompatible(chain[i - 1]!.bpm, t.bpm),
    );
    if (candidate) {
      chain.push(candidate);
    } else {
      const fallback = pool.find((t) => !chain.includes(t));
      if (fallback) chain.push(fallback);
    }
  }
  return chain.map((t) => t.id);
}

const DJ_NAMES = [
  "Reya Coast", "DJ Ferrous", "Iman Vale", "Kojo Static", "Lune Basalt",
  "Priya Loom", "Otis Marrow", "Yara Fold", "Denny Halide", "Coen Ashen",
] as const;
const SET_NAME_WORDS = [
  "Late Signal", "Concrete Bloom", "Low Tide Set", "After Hours", "First Light",
  "Terminal", "Open Frequency", "Vantage Point", "Quiet Hours", "No Fixed Address",
] as const;

const sets: SetRow[] = [];
let nextSetId = 1;
const genrePlan: { genre: string; count: number; length: number; spoil?: number }[] = [
  { genre: "House", count: 2, length: 9 },
  { genre: "Deep House", count: 2, length: 8 },
  { genre: "Techno", count: 2, length: 10, spoil: 5 },
  { genre: "Melodic Techno", count: 2, length: 9 },
  { genre: "Trance", count: 1, length: 8 },
  { genre: "Disco", count: 1, length: 7 },
  { genre: "Drum & Bass", count: 2, length: 8, spoil: 4 },
];

const usedSlots: { venueId: number; start: Date; end: Date }[] = [];
function nonOverlappingSlot(venueId: number): [Date, Date] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const day = int(1, 200);
    const start = new Date(Date.UTC(2026, 0, 1, 20, 0, 0));
    start.setUTCDate(start.getUTCDate() + day);
    const end = new Date(start.getTime() + int(90, 180) * 60_000);
    const conflict = usedSlots.some(
      (s) => s.venueId === venueId && start < s.end && end > s.start,
    );
    if (!conflict) return [start, end];
  }
  throw new Error("could not place a non-overlapping slot");
}

for (const plan of genrePlan) {
  for (let i = 0; i < plan.count; i++) {
    const trackIds = buildSetlist(plan.genre, plan.length, plan.spoil);
    const withVenue = chance(0.6);
    let venueId: number | null = null;
    let scheduledSlot: [string, string] | null = null;
    let performedAt: string | null = null;
    if (withVenue) {
      venueId = pick(venues).id;
      const [start, end] = nonOverlappingSlot(venueId);
      usedSlots.push({ venueId, start, end });
      scheduledSlot = [start.toISOString(), end.toISOString()];
      performedAt = start.toISOString();
    } else {
      const day = int(1, 400);
      const d = new Date(Date.UTC(2024, 6, 1, 21, 0, 0));
      d.setUTCDate(d.getUTCDate() + day);
      performedAt = d.toISOString();
    }
    sets.push({
      id: nextSetId++,
      djName: pick(DJ_NAMES),
      venueId,
      setName: `${pick(SET_NAME_WORDS)}`,
      performedAt,
      scheduledSlot,
      notes: chance(0.3) ? "Recorded for the archive." : null,
      trackIds,
    });
  }
}

// ---------- emit SQL ----------
const lines: string[] = [];
lines.push("-- Generated by scripts/generate-seed.ts. Do not hand-edit; regenerate instead.");
lines.push("BEGIN;");
lines.push("");

lines.push("-- artists");
lines.push("INSERT INTO artists (artist_id, name) VALUES");
lines.push(
  artists.map((a, i) => `    (${a.id}, ${sqlString(a.name)})${i === artists.length - 1 ? "" : ","}`).join("\n"),
);
lines.push(";");
lines.push("");

lines.push("-- venues");
lines.push("INSERT INTO venues (venue_id, name, city, capacity) VALUES");
lines.push(
  venues
    .map(
      (v, i) =>
        `    (${v.id}, ${sqlString(v.name)}, ${sqlString(v.city)}, ${v.capacity ?? "NULL"})${i === venues.length - 1 ? "" : ","}`,
    )
    .join("\n"),
);
lines.push(";");
lines.push("");

lines.push("-- tracks");
lines.push(
  "INSERT INTO tracks (track_id, artist_id, title, genre, bpm, camelot_key, energy, duration_seconds, release_year) VALUES",
);
lines.push(
  tracks
    .map(
      (t, i) =>
        `    (${t.id}, ${t.artistId}, ${sqlString(t.title)}, ${sqlString(t.genre)}, ${t.bpm}, ${sqlString(t.camelotKey)}, ${t.energy}, ${t.durationSeconds}, ${t.releaseYear})${i === tracks.length - 1 ? "" : ","}`,
    )
    .join("\n"),
);
lines.push(";");
lines.push("");
lines.push("-- backfill search_vector for the bulk insert above (the trigger only");
lines.push("-- covers INSERT ... VALUES executed row by row through normal app code)");
lines.push("UPDATE tracks SET title = title;");
lines.push("");

lines.push("-- sets");
lines.push(
  "INSERT INTO sets (set_id, dj_name, venue_id, set_name, performed_at, scheduled_slot, notes) VALUES",
);
lines.push(
  sets
    .map((s, i) => {
      const slot = s.scheduledSlot
        ? `tstzrange('${s.scheduledSlot[0]}', '${s.scheduledSlot[1]}')`
        : "NULL";
      return `    (${s.id}, ${sqlString(s.djName)}, ${s.venueId ?? "NULL"}, ${sqlString(s.setName ?? "")}, ${s.performedAt ? `'${s.performedAt}'` : "NULL"}, ${slot}, ${s.notes ? sqlString(s.notes) : "NULL"})${i === sets.length - 1 ? "" : ","}`;
    })
    .join("\n"),
);
lines.push(";");
lines.push("");

lines.push("-- set_tracks (position order is the actual play order)");
lines.push("INSERT INTO set_tracks (set_id, position, track_id, played_at, crowd_response) VALUES");
const setTrackRows: string[] = [];
for (const s of sets) {
  let cursor = s.performedAt ? new Date(s.performedAt) : null;
  s.trackIds.forEach((trackId, idx) => {
    const track = tracks.find((t) => t.id === trackId)!;
    const playedAt = cursor ? cursor.toISOString() : null;
    if (cursor) cursor = new Date(cursor.getTime() + track.durationSeconds * 1000);
    const crowd = chance(0.85) ? int(4, 10) : "NULL";
    setTrackRows.push(
      `    (${s.id}, ${idx + 1}, ${trackId}, ${playedAt ? `'${playedAt}'` : "NULL"}, ${crowd})`,
    );
  });
}
lines.push(setTrackRows.join(",\n"));
lines.push(";");
lines.push("");

lines.push("REFRESH MATERIALIZED VIEW track_compatibility;");
lines.push("");
lines.push("-- explicit-id inserts above don't advance the serial sequences, so");
lines.push("-- anything the app inserts afterward (a saved set, a demo venue) needs");
lines.push("-- the sequences caught up to the highest id actually used.");
lines.push("SELECT setval(pg_get_serial_sequence('artists', 'artist_id'), (SELECT max(artist_id) FROM artists));");
lines.push("SELECT setval(pg_get_serial_sequence('venues', 'venue_id'), (SELECT max(venue_id) FROM venues));");
lines.push("SELECT setval(pg_get_serial_sequence('tracks', 'track_id'), (SELECT max(track_id) FROM tracks));");
lines.push("SELECT setval(pg_get_serial_sequence('sets', 'set_id'), (SELECT max(set_id) FROM sets));");
lines.push("");
lines.push("COMMIT;");
lines.push("");
lines.push(
  `-- generated ${artists.length} artists, ${tracks.length} tracks, ${venues.length} venues, ${sets.length} sets, ${setTrackRows.length} set_tracks rows`,
);

const outPath = resolve(import.meta.dirname, "..", "db", "seed.sql");
writeFileSync(outPath, lines.join("\n") + "\n");
console.log(`wrote ${outPath}`);
console.log(
  `${artists.length} artists, ${tracks.length} tracks, ${venues.length} venues, ${sets.length} sets, ${setTrackRows.length} set_tracks rows`,
);
