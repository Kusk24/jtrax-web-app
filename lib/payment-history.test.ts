import { describe, expect, it } from "vitest";
import { receiptNumber, toPaymentHistory, visitCredits } from "./payment-history";

const data = {
  students: [{ student_id: "stu_penny", name: "Penny" }],
  enrollments: [{ enrollment_id: "enr_1", student_id: "stu_penny", class_id: "beg" }],
  classes: [{ class_id: "beg", name: "Beginner" }],
  creditTransactions: [
    { payment_id: "pay_a1b2c3d4", transaction_type: "purchase", amount: 20 },
    { payment_id: "pay_a1b2c3d4", transaction_type: "consumption", amount: -1.5 },
  ],
};

describe("toPaymentHistory", () => {
  it("says who, what, how much and what it bought, newest first", () => {
    const rows = toPaymentHistory(
      [
        { payment_id: "pay_a1b2c3d4", student_id: "stu_penny", enrollment_id: "enr_1", payment_date: "2026-09-01",
          amount: 12000, discount_amount: 1200, final_amount: 10800, payment_method: "Cash", status: "Paid" },
        { payment_id: "pay_tour0001", student_id: "stu_penny", tournament_registration_id: "treg_1",
          class_name: "Wellington Open", payment_date: "2026-09-10", amount: 500, final_amount: 500,
          payment_method: "PromptPay", status: "Paid", reference_number: "PP-778" },
        { payment_id: "pay_custom01", student_id: "stu_penny", enrollment_id: "enr_1", payment_date: "2026-08-15",
          credit_amount: 7, amount: 5000, final_amount: 5000, payment_method: "BankTransfer", status: "Paid" },
      ],
      data,
    );
    expect(rows.map((r) => r.id)).toEqual(["pay_tour0001", "pay_a1b2c3d4", "pay_custom01"]);
    expect(rows[0]).toMatchObject({ kind: "tournament", forWhat: "Wellington Open", credits: 0, reference: "PP-778" });
    expect(rows[1]).toMatchObject({ childName: "Penny", forWhat: "Beginner", paid: 10800, discount: 1200, credits: 20 });
    expect(rows[2].credits).toBe(7);
  });
});

describe("receiptNumber", () => {
  it("is short and stable", () => {
    expect(receiptNumber("pay_a1b2c3d4")).toBe("R-A1B2C3D4");
    expect(receiptNumber("pay_0123456789abcdef")).toBe("R-89ABCDEF");
  });
});


describe("visitCredits", () => {
  it("is what the visit cost, as a positive number", () => {
    const txs = [
      { attendance_id: "att_1", transaction_type: "consumption", amount: -1.5 },
      { attendance_id: "att_2", transaction_type: "consumption", amount: -2 },
      { attendance_id: "att_1", transaction_type: "purchase", amount: 10 },
    ];
    expect(visitCredits(txs, "att_1")).toBe(1.5);
    expect(visitCredits(txs, "att_9")).toBe(0);
  });
});
