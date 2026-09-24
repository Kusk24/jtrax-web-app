/**
 * The Challenge column in a parent's Today's Activity. It showed
 * `max(1, minutes / 10)`, so every child had "+1" whether or not they had
 * played; it is now the puzzles the server graded for them today.
 */
import { describe, expect, it } from "vitest";
import { todayActivityOf } from "./today-activity";

describe("today's activity for a child", () => {
  it("shows the puzzles solved, not a number made from minutes", () => {
    const row = { minutes_practiced: 12, puzzles_completed: 2 };
    expect(todayActivityOf("Penny", row)).toEqual({ child: "Penny", mins: 12, puzzles: 2, done: false });
  });

  it("is nothing at all for a child who has not practised today", () => {
    expect(todayActivityOf("Siri", undefined)).toEqual({ child: "Siri", mins: 0, puzzles: 0, done: false });
  });

  it("fills the ring at half an hour", () => {
    expect(todayActivityOf("Uri", { minutes_practiced: 30, puzzles_completed: 3 }).done).toBe(true);
  });
});
