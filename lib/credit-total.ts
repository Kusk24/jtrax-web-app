/**
 * The "of" in "18 / 20 credits": the balance right after the most recent
 * top-up. Not everything ever bought — that only grows, and doubles when a
 * balance moves in from another class — but the amount the family last had
 * in full, which is what the remaining credits are counting down from.
 *
 * Entries carry a day, not a time, so a top-up is taken to come before the
 * classes on the same day.
 */
type Row = Record<string, unknown>;

export function creditsSinceTopUp(txs: Row[]): number | null {
  const sorted = [...txs].sort((a, b) => {
    const day = String(a.transaction_date ?? "").localeCompare(String(b.transaction_date ?? ""));
    if (day !== 0) return day;
    return Number(b.amount ?? 0) - Number(a.amount ?? 0); // top-ups first
  });
  let balance = 0;
  let afterTopUp: number | null = null;
  for (const t of sorted) {
    const amount = Number(t.amount ?? 0);
    balance += amount;
    if (amount > 0) afterTopUp = balance;
  }
  return afterTopUp === null ? null : Math.round(afterTopUp * 100) / 100;
}
