/**
 * A child's credits over all time, across every course: what was bought, and
 * what classes have used. Office adjustments are neither, so they are left
 * out; a cancelled visit's refund removes its consumption, so it is not "used".
 */
type Row = Record<string, unknown>;
const s = (r: Row, k: string) => ((r[k] as string | null) ?? "") as string;
const round = (v: number) => Math.round(v * 100) / 100;

export type CreditLifetime = { bought: number; used: number };

/**
 * A row is the child's when it names them, or when it names one of their
 * enrolments — class charges used to carry only the enrolment, so "used" read
 * 0 while the course balance had dropped.
 */
export function creditLifetime(studentId: string, creditTransactions: Row[], enrollments: Row[] = []): CreditLifetime {
  const mine = new Set(
    enrollments.filter((e) => s(e, "student_id") === studentId).map((e) => s(e, "enrollment_id")),
  );
  let bought = 0;
  let used = 0;
  for (const t of creditTransactions) {
    const forChild = s(t, "student_id") === studentId || (!s(t, "student_id") && mine.has(s(t, "enrollment_id")));
    if (!forChild) continue;
    const amount = Number(t.amount ?? 0);
    if (s(t, "transaction_type") === "purchase") bought += amount;
    else if (s(t, "transaction_type") === "consumption") used -= amount;
  }
  /* `|| 0` turns a -0 into 0. */
  return { bought: round(bought) || 0, used: round(used) || 0 };
}
