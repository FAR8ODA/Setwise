export type CamelotRelation = "identical" | "adjacent" | "relative" | "energy_boost" | "clash";

export type Track = {
  trackId: number;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  camelotKey: string;
  energy: number;
  durationSeconds: number;
};

export type TrackSuggestion = Track & {
  keyRelation: CamelotRelation;
  bpmDelta: number;
};

export type TransitionRow = {
  position: number;
  title: string;
  artist: string;
  bpm: number;
  energy: number;
  camelotKey: string;
  prevBpm: number | null;
  bpmDelta: number | null;
  prevEnergy: number | null;
  energyDelta: number | null;
  transitionQuality: CamelotRelation | null;
  runningDurationSeconds: number;
  energyMovingAvg: number;
};

export type TransitionBreakdown = {
  setId: number;
  setName: string | null;
  djName: string;
  identicalTransitions: number;
  adjacentTransitions: number;
  relativeTransitions: number;
  energyBoostTransitions: number;
  clashTransitions: number;
  totalTransitions: number;
};

export type PlayPercentileRow = {
  title: string;
  artist: string;
  genre: string;
  plays: number;
  percentile: number;
  quartile: number;
};

export type MixChain = {
  path: number[];
  depth: number;
};

export type SetSummary = {
  setId: number;
  setName: string | null;
  djName: string;
};
