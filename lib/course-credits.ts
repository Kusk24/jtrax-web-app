/**
 * A child's credits per course. Each enrolment has its own balance and its own
 * expiry, so a child in two courses has two of each — one card per course,
 * never one number standing for both.
 */
import { creditsSinceTopUp } from "./credit-total";

type Row = Record<string, unknown>;
const s = (r: Row | undefined, k: string) => ((r?.[k] as string | null) ?? "") as string;

export type CourseCredit = {
  enrollmentId: string;
  name: string;
  /** Remaining now. */
  credits: number;
  /** Right after the latest top-up — the "of" in "18 / 20". */
  creditsOf: number | null;
  /** Latest expiry on the course's purchases, YYYY-MM-DD, or "". */
  expiry: string;
  /** Whole days until it, negative once past; 0 with no expiry. */
  daysLeft: number;
  /** When they joined this course, YYYY-MM-DD, or "". */
  enrolledOn: string;
};

export function courseCredits(
  studentId: string,
  data: { enrollments: Row[]; classes: Row[]; creditTransactions: Row[] },
  today: Date,
): CourseCredit[] {
  return data.enrollments
    .filter(
      (e) => s(e, "student_id") === studentId && (s(e, "status") || "Active") === "Active" && !s(e, "deleted_date"),
    )
    .map((e) => {
      const id = s(e, "enrollment_id");
      const txs = data.creditTransactions.filter((t) => s(t, "enrollment_id") === id);
      const credits = Math.round(txs.reduce((sum, t) => sum + Number(t.amount ?? 0), 0) * 100) / 100;
      const expiry = txs.map((t) => s(t, "expiry_date")).filter(Boolean).sort().at(-1) ?? "";
      const daysLeft = expiry ? Math.ceil((new Date(`${expiry}T00:00:00`).getTime() - today.getTime()) / 86_400_000) : 0;
      return {
        enrollmentId: id,
        name: s(data.classes.find((c) => s(c, "class_id") === s(e, "class_id")), "name") || "—",
        credits,
        creditsOf: creditsSinceTopUp(txs),
        expiry,
        daysLeft,
        enrolledOn: s(e, "enrolled_date").slice(0, 10),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
