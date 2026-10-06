import { describe, expect, it } from "vitest";
import { dobTooYoung } from "./registration";

describe("a date of birth's minimum age", () => {
  const on = new Date(2026, 9, 6); // 6 Oct 2026, local
  it("refuses less than a year old and the future", () => {
    expect(dobTooYoung("2025-10-07", on)).toBe(true);
    expect(dobTooYoung("2027-01-01", on)).toBe(true);
  });
  it("accepts a year ago and older, and leaves an empty one to the required check", () => {
    expect(dobTooYoung("2025-10-06", on)).toBe(false);
    expect(dobTooYoung("2016-03-01", on)).toBe(false);
    expect(dobTooYoung("", on)).toBe(false);
  });
});
