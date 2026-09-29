import { describe, expect, it } from "vitest";
import { courseCredits } from "./course-credits";

const data = {
  enrollments: [
    { enrollment_id: "e1", student_id: "mini", class_id: "king", status: "Active", enrolled_date: "2026-08-01" },
    { enrollment_id: "e2", student_id: "mini", class_id: "master", status: "Active" },
    { enrollment_id: "e3", student_id: "mini", class_id: "old", status: "Withdrawn" },
    { enrollment_id: "e4", student_id: "uri", class_id: "king", status: "Active" },
  ],
  classes: [
    { class_id: "king", name: "King Slayer" },
    { class_id: "master", name: "Master" },
    { class_id: "old", name: "Old Club" },
  ],
  creditTransactions: [
    { enrollment_id: "e1", transaction_date: "2026-09-01", amount: 20, expiry_date: "2026-12-01" },
    { enrollment_id: "e1", transaction_date: "2026-09-05", amount: -2 },
    { enrollment_id: "e2", transaction_date: "2026-09-10", amount: 10, expiry_date: "2026-10-01" },
  ],
};

describe("courseCredits", () => {
  it("gives each active course its own balance, total and expiry", () => {
    const rows = courseCredits("mini", data, new Date("2026-09-29T00:00:00"));
    expect(rows.map((r) => [r.name, r.credits, r.creditsOf, r.expiry, r.daysLeft])).toEqual([
      ["King Slayer", 18, 20, "2026-12-01", 63],
      ["Master", 10, 10, "2026-10-01", 2],
    ]);
    expect(rows[0].enrolledOn).toBe("2026-08-01");
  });
});
