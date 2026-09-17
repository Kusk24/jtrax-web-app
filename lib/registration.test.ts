/**
 * The category age rule, as the registration form applies it.
 *
 * The backend is the authority — this copy only greys out what the server
 * would refuse — so the two have to agree. These cases mirror
 * `TestCategoryAgeRule` in jtrax-backend: the same names, the same dates,
 * the same answers.
 */
import { describe, expect, it } from "vitest";
import { ageFromDOB, ageOn, categoryAgeLimit, categoryAllows } from "./registration";

describe("categoryAgeLimit", () => {
  it("reads the age out of the name the organiser wrote", () => {
    expect(categoryAgeLimit("U8 Boys")).toBe(8);
    expect(categoryAgeLimit("Girls U12")).toBe(12);
    expect(categoryAgeLimit("u 10 mixed")).toBe(10);
  });

  it("treats a name with no age as open to everyone", () => {
    expect(categoryAgeLimit("Open")).toBe(0);
    expect(categoryAgeLimit("Championship")).toBe(0);
  });

  it("does not mistake a word containing U for an age limit", () => {
    // "Under" and "Round 12" have digits and a U near them; neither is a cap.
    expect(categoryAgeLimit("Rapid Round 12")).toBe(0);
    expect(categoryAgeLimit("Unrated")).toBe(0);
  });
});

describe("ageOn", () => {
  it("counts completed years on the day, not in the year", () => {
    // Born in June, measured in December: already had the birthday.
    expect(ageOn("2017-06-15", "2026-12-07")).toBe(9);
    // Measured in March: has not yet.
    expect(ageOn("2017-06-15", "2026-03-07")).toBe(8);
  });

  it("is null for a date it cannot read", () => {
    expect(ageOn("not-a-date", "2026-12-07")).toBeNull();
  });
});

describe("categoryAllows", () => {
  const start = "2026-12-01";

  it("lets a young enough player in", () => {
    expect(categoryAllows("U8 Boys", "2019-06-15", start)).toMatchObject({ allowed: true, limit: 8 });
  });

  it("keeps a player who is too old out", () => {
    expect(categoryAllows("U8 Boys", "2017-06-15", start)).toMatchObject({ allowed: false, limit: 8 });
  });

  it("is decided on the tournament's day, not today", () => {
    // Turns 8 on 15 June 2026, so: in for a tournament in May, out for one in July.
    expect(categoryAllows("U8", "2018-06-15", "2026-05-01").allowed).toBe(true);
    expect(categoryAllows("U8", "2018-06-15", "2026-07-01").allowed).toBe(false);
  });

  it("asks for a date of birth before judging an age category", () => {
    expect(categoryAllows("U10 Girls", "", start)).toMatchObject({ allowed: false, needsDob: true });
  });

  it("needs nothing at all for a category with no age", () => {
    expect(categoryAllows("Open", "", start)).toMatchObject({ allowed: true, needsDob: false });
  });
});

describe("ageFromDOB", () => {
  /* The age is derived from the card's date rather than read off it, because a
     card prints a date and never an age. */
  const on = new Date(2026, 9, 10); // 2026-10-10, the chessfest date

  it("counts whole years", () => {
    expect(ageFromDOB("2016-01-31", on)).toBe(10);
  });

  it("has not counted a birthday that has not happened yet this year", () => {
    // Born in December: on 10 October they are still 9.
    expect(ageFromDOB("2016-12-01", on)).toBe(9);
  });

  it("counts a birthday that is today", () => {
    expect(ageFromDOB("2016-10-10", on)).toBe(10);
  });

  it("is 0 for a date it cannot read, rather than NaN", () => {
    // NaN in a number input renders as an empty field that cannot be typed in.
    for (const bad of ["", "not a date", "2540-05-02-1"]) {
      expect(ageFromDOB(bad, on)).toBe(0);
    }
  });

  /* A card the sanitiser failed to convert would otherwise produce a negative
     age, which the form would then send and the backend would refuse for a
     reason nobody could act on. */
  it("never returns a negative age", () => {
    expect(ageFromDOB("2540-05-02", on)).toBe(0);
  });
});
