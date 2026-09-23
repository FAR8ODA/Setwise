import { SetBuilder } from "./set-builder";

export default function BuildPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Set builder</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper-dim">
        Pick a starting track, then keep adding from the suggestions. Every
        suggestion and every row in the analysis table comes straight from
        Postgres: a <code className="font-data">LATERAL</code> join for
        what to play next, window functions for what the transition costs
        you.
      </p>
      <div className="mt-8">
        <SetBuilder />
      </div>
    </div>
  );
}
