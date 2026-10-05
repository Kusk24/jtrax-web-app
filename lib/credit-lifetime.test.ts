import { describe, expect, it } from "vitest";
import { creditLifetime } from "./credit-lifetime";

const tx = (student_id: string, transaction_type: string, amount: number) => ({ student_id, transaction_type, amount });

describe("a child's lifetime credits", () => {
  it("adds purchases across every course and counts class use as a positive number", () => {
    const rows = [
      tx("S1", "purchase", 20),
      tx("S1", "purchase", 10),
      tx("S1", "consumption", -2),
      tx("S1", "consumption", -1.5),
      tx("S2", "purchase", 50),
    ];
    expect(creditLifetime("S1", rows)).toEqual({ bought: 30, used: 3.5 });
  });

  it("leaves office adjustments out of both", () => {
    expect(creditLifetime("S1", [tx("S1", "manual_adjustment", 5)])).toEqual({ bought: 0, used: 0 });
  });

  it("is zero, not minus zero, with nothing on file", () => {
    expect(Object.is(creditLifetime("S1", []).used, 0)).toBe(true);
  });

  it("counts a class charge that names only the enrolment", () => {
    const rows = [
      { student_id: "S1", enrollment_id: "E1", transaction_type: "purchase", amount: 20 },
      { student_id: null, enrollment_id: "E1", transaction_type: "consumption", amount: -2 },
      { student_id: null, enrollment_id: "E9", transaction_type: "consumption", amount: -5 },
    ];
    const enrollments = [{ enrollment_id: "E1", student_id: "S1" }, { enrollment_id: "E9", student_id: "S2" }];
    expect(creditLifetime("S1", rows, enrollments)).toEqual({ bought: 20, used: 2 });
  });
});
