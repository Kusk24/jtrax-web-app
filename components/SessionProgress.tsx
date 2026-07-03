export function SessionProgress({
  label = "Session Progress",
  count,
  total,
}: {
  label?: string;
  count: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="rounded-card bg-navy-soft/40 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <span className="size-2 rounded-full bg-olive" /> {label}
        </p>
        <p className="text-sm text-muted">
          <span className="text-lg font-extrabold text-ink">{count}</span>/{total}
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card">
        <div
          className="h-full rounded-full bg-olive transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
