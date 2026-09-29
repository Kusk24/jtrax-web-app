/**
 * A child's credits over all time, across every course: what was bought, and
 * what classes have used. Office adjustments are neither, so they are left
 * out; a cancelled visit's refund removes its consumption, so it is not "used".
 */
type Row = Record<string, unknown>;
const s = (r: Row, k: string) => ((r[k] as string | null) ?? "") as string;
const round = (v: number) => Math.round(v * 100) / 100;

export type CreditLifetime = { bought: number; used: number };

export function creditLifetime(studentId: string, creditTransactions: Row[]): CreditLifetime {
  let bought = 0;
  let used = 0;
  for (const t of creditTransactions) {
    if (s(t, "student_id") !== studentId) continue;
    const amount = Number(t.amount ?? 0);
    if (s(t, "transaction_type") === "purchase") bought += amount;
    else if (s(t, "transaction_type") === "consumption") used -= amount;
  }
  /* `|| 0` turns a -0 into 0. */
  return { bought: round(bought) || 0, used: round(used) || 0 };
}
