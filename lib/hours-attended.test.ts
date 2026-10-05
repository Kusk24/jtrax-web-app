import { describe, expect, it } from "vitest";
import { hoursAttended } from "./hours-attended";

const session = { session_id: "s1", session_date: "2026-10-05", start_time: "10:00", end_time: "12:00" };

describe("hoursAttended", () => {
  it("counts a full class as its length", () => {
    expect(hoursAttended([{ session_id: "s1", check_in_time: "2026-10-05T02:55:00Z", check_out_time: "2026-10-05T05:05:00Z" }], [session])).toBe(2);
  });

  it("counts only the time there for a late arrival or an early leave", () => {
    // 10:30 to 11:15 Bangkok time.
    expect(hoursAttended([{ session_id: "s1", check_in_time: "2026-10-05T03:30:00Z", check_out_time: "2026-10-05T04:15:00Z" }], [session])).toBe(0.75);
  });

  it("counts to the end while still checked in, and skips no-shows and deleted classes", () => {
    expect(hoursAttended([
      { session_id: "s1", check_in_time: "2026-10-05T11:00:00" },
      { session_id: "s1" },
      { session_id: "gone", check_in_time: "2026-10-05T10:00:00" },
    ], [session])).toBe(1);
  });
});
