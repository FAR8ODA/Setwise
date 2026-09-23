export function QueryPanel({
  title,
  technique,
  description,
  sql,
  children,
}: {
  title: string;
  technique: string;
  description: string;
  sql: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span className="font-data text-xs text-teal">{technique}</span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper-dim">
        {description}
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <pre className="overflow-x-auto rounded-sm border border-line bg-surface p-4 font-data text-xs leading-relaxed text-paper-dim">
          {sql}
        </pre>
        <div className="overflow-x-auto rounded-sm border border-line">{children}</div>
      </div>
    </section>
  );
}
