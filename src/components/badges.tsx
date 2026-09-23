import type { CamelotRelation } from "@/lib/types";

const RELATION_LABEL: Record<CamelotRelation, string> = {
  identical: "Identical",
  adjacent: "Adjacent",
  relative: "Relative",
  energy_boost: "Energy boost",
  clash: "Clash",
};

const RELATION_COLOR: Record<CamelotRelation, string> = {
  identical: "text-teal border-teal/40 bg-teal/10",
  adjacent: "text-teal border-teal/40 bg-teal/10",
  relative: "text-amber border-amber/40 bg-amber/10",
  energy_boost: "text-amber border-amber/40 bg-amber/10",
  clash: "text-clash border-clash/40 bg-clash/10",
};

export function RelationBadge({ relation }: { relation: CamelotRelation | null }) {
  if (!relation) {
    return <span className="text-xs text-paper-dim">first track</span>;
  }
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-data text-xs ${RELATION_COLOR[relation]}`}
    >
      {RELATION_LABEL[relation]}
    </span>
  );
}

export function KeyBadge({ camelotKey }: { camelotKey: string }) {
  const isMajor = camelotKey.endsWith("B");
  return (
    <span
      className={`inline-flex h-6 min-w-9 items-center justify-center rounded-full border px-1.5 font-data text-xs ${
        isMajor ? "border-amber/50 text-amber" : "border-teal/50 text-teal"
      }`}
    >
      {camelotKey}
    </span>
  );
}

export function EnergyBar({ energy }: { energy: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-amber"
          style={{ width: `${(energy / 10) * 100}%` }}
        />
      </div>
      <span className="font-data text-xs text-paper-dim">{energy}/10</span>
    </div>
  );
}
