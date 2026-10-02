/**
 * A family's payments, as the Profile's Payment History shows them: when, for
 * which child, for what (a course, or a tournament entry), how much, what
 * credits it bought, and the receipt number.
 */
type Row = Record<string, unknown>;
const s = (r: Row | undefined, k: string) => ((r?.[k] as string | null) ?? "") as string;
const n = (r: Row | undefined, k: string) => Number(r?.[k] ?? 0);

export type PaymentRecord = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  childName: string;
  /** The course, or the tournament for an entry fee. */
  forWhat: string;
  kind: "course" | "tournament";
  /** What was actually paid, after any discount. */
  paid: number;
  gross: number;
  discount: number;
  /** Credits the payment bought; 0 for a tournament fee. */
  credits: number;
  method: string;
  status: "Paid" | "Pending" | "Refunded";
  /** The receipt number the academy quotes — derived from the payment id. */
  receiptNo: string;
  /** The bank or transfer reference the office wrote down, if any. */
  reference: string;
};

/** "R-9F2C41AB": short, stable, and unique to the payment. */
export function receiptNumber(paymentId: string): string {
  const tail = paymentId.replace(/^pay_?/i, "").replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `R-${tail || paymentId.toUpperCase()}`;
}

export function toPaymentHistory(
  payments: Row[],
  data: { students: Row[]; enrollments: Row[]; classes: Row[]; creditTransactions: Row[] },
): PaymentRecord[] {
  return payments
    .map((p) => {
      const id = s(p, "payment_id");
      const student = data.students.find((st) => s(st, "student_id") === s(p, "student_id"));
      const enrolment = data.enrollments.find((e) => s(e, "enrollment_id") === s(p, "enrollment_id"));
      const cls = enrolment ? data.classes.find((c) => s(c, "class_id") === s(enrolment, "class_id")) : undefined;
      const tournament = s(p, "tournament_registration_id") !== "";
      /* The payment's own count first (a custom sale has no package), then
         the credit entries it wrote. */
      const fromTx = data.creditTransactions
        .filter((t) => s(t, "payment_id") === id && s(t, "transaction_type") === "purchase")
        .reduce((sum, t) => sum + n(t, "amount"), 0);
      const credits = tournament ? 0 : n(p, "credit_amount") > 0 ? n(p, "credit_amount") : fromTx;
      const status = (s(p, "status") || "Paid") as PaymentRecord["status"];
      return {
        id,
        date: s(p, "payment_date").slice(0, 10),
        childName: s(p, "student_name") || s(student, "name") || "—",
        forWhat: s(p, "class_name") || s(cls, "name") || "—",
        kind: tournament ? "tournament" : "course",
        paid: n(p, "final_amount"),
        gross: n(p, "amount"),
        discount: n(p, "discount_amount"),
        credits: Math.round(credits * 100) / 100,
        method: s(p, "payment_method"),
        status,
        receiptNo: receiptNumber(id),
        reference: s(p, "reference_number"),
      } satisfies PaymentRecord;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/** What one class visit cost, as a positive number of credits: the sum of its
    consumption entries (a refund on cancel removes them, so it reads 0). */
export function visitCredits(creditTransactions: Row[], attendanceId: string): number {
  const spent = creditTransactions
    .filter((t) => s(t, "attendance_id") === attendanceId && s(t, "transaction_type") === "consumption")
    .reduce((sum, t) => sum + n(t, "amount"), 0);
  return spent === 0 ? 0 : Math.round(-spent * 100) / 100;
}
