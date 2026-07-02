export function CreditBar({
  remaining,
  total,
  low,
  trackClass = "bg-gray-200",
}: {
  remaining: number;
  total: number;
  low: boolean;
  trackClass?: string;
}) {
  const pct = Math.max(4, Math.round((remaining / total) * 100));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full ${trackClass}`}>
      <div
        className={`h-full rounded-full ${low ? "bg-brick" : "bg-olive"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
