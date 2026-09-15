/**
 * The streak the parent portal shows for a child.
 *
 * The pupil's own portal gets this number from the server; the parent portal
 * derives it, because `practice/summary` answers only for whoever is signed in
 * and the parent screens are built from the CRUD collections. Two screens
 * describing the same child have to agree, so these cases mirror
 * `practice_test.go` in jtrax-backend — the same day offsets, the same
 * answers — the way `registration.test.ts` mirrors `TestCategoryAgeRule`.
 *
 * What none of them may report is the old behaviour: `student.streak_count`,
 * a number the browser posted and nothing recomputed, which had Penny on
 * twelve days having last practised in May.
 */
import { describe, expect, it } from "vitest";
import { streakFrom, todayISO } from "./parent-v2-data";

/* A fixed "today" so the cases cannot drift with the calendar. A Wednesday,
   mid-month, so no case straddles a month or year boundary by accident —
   the ones that should are written to. */
const TODAY = new Date(2026, 8, 16); // 2026-09-16

/** The date `back` days before TODAY, as the rows store it. */
const daysAgo = (back: number) =>
  todayISO(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - back));

const streakOf = (...back: number[]) => streakFrom(back.map(daysAgo), TODAY);

describe("counting consecutive days ending today", () => {
  /* Mirrors TestStreakCountsConsecutiveDaysEndingToday: three days in a row,
     plus an older cluster the run must not reach. */
  it("counts the run and stops before an older cluster", () => {
    expect(streakOf(0, 1, 2, 9, 10)).toBe(3);
  });

  it("is zero when nothing has been practised", () => {
    expect(streakFrom([], TODAY)).toBe(0);
  });

  it("counts a single day today", () => {
    expect(streakOf(0)).toBe(1);
  });
});

describe("a missed day breaks it", () => {
  /* Mirrors TestAMissedDayBreaksTheStreak: practised for a week, but not for
     the last three days. This is the case the stored column could never see. */
  it("is zero when the last practice was three days ago", () => {
    expect(streakOf(3, 4, 5, 6, 7, 8, 9)).toBe(0);
  });

  it("stops at the gap rather than counting every row", () => {
    // Seven rows, but the run ending today is only two long.
    expect(streakOf(0, 1, 3, 4, 5, 6, 7)).toBe(2);
  });
});

describe("the grace of one day", () => {
  /* Mirrors TestYesterdayStillCountsButTheDayBeforeDoesNot. A child who has
     not opened the app *yet today* keeps what they earned yesterday. */
  it("still counts a run ending yesterday", () => {
    expect(streakOf(1, 2, 3)).toBe(3);
  });

  it("does not count a run ending the day before yesterday", () => {
    expect(streakOf(2, 3, 4)).toBe(0);
  });
});

describe("the shape of the rows it is given", () => {
  it("does not count one day twice", () => {
    /* `practice_activity` is unique per (student, date), but the rows arrive
       as a filtered list and a duplicate must not inflate the run — the
       backend's query says DISTINCT for the same reason. */
    expect(streakFrom([daysAgo(0), daysAgo(0), daysAgo(1)], TODAY)).toBe(2);
  });

  it("does not care what order they arrive in", () => {
    expect(streakFrom([daysAgo(2), daysAgo(0), daysAgo(1)], TODAY)).toBe(3);
  });

  it("ignores a date in the future", () => {
    /* Not reachable from the grader, but a hand-written row must not extend
       a run backwards from a day that has not happened. */
    expect(streakFrom([daysAgo(-1), daysAgo(0), daysAgo(1)], TODAY)).toBe(2);
  });

  it("ignores empty and malformed entries", () => {
    expect(streakFrom(["", daysAgo(0), daysAgo(1)], TODAY)).toBe(2);
  });
});

describe("boundaries the date arithmetic could get wrong", () => {
  /* Counting back with `new Date(str)` parses a bare date as UTC, which puts
     the day boundary seven hours out in Bangkok; counting with local dates
     breaks across a DST change. These run over the edges that would expose
     either mistake. */
  it("counts across the start of a month", () => {
    const sept2 = new Date(2026, 8, 2); // 2026-09-02
    const dates = ["2026-09-02", "2026-09-01", "2026-08-31", "2026-08-30"];
    expect(streakFrom(dates, sept2)).toBe(4);
  });

  it("counts across the start of a year", () => {
    const jan1 = new Date(2027, 0, 1);
    expect(streakFrom(["2027-01-01", "2026-12-31", "2026-12-30"], jan1)).toBe(3);
  });

  it("counts across the end of February in a leap year", () => {
    const mar1 = new Date(2028, 2, 1); // 2028 is a leap year
    expect(streakFrom(["2028-03-01", "2028-02-29", "2028-02-28"], mar1)).toBe(3);
  });

  it("is not thrown by an afternoon clock on today", () => {
    /* The caller passes `new Date()`, not midnight. A run ending today must
       count the same at 23:00 as at 00:01. */
    const evening = new Date(2026, 8, 16, 23, 0, 0);
    expect(streakFrom([daysAgo(0), daysAgo(1)], evening)).toBe(2);
  });
});
