/**
 * The class count on a child's card and on the pupil's own Profile.
 *
 * The card used to count every attendance row on file and set it over the
 * sessions the child's current class had finished, which printed "3 / 1
 * classes". The Profile read `last_attended_date` and could only say "0" or
 * "1+". Both now count what the attendance history lists as Present.
 */
import { describe, expect, it } from "vitest";
import { classesAttended } from "./classes-attended";

const sessions = new Set(["ses_mon", "ses_wed", "ses_fri"]);

describe("counting the classes a child has been to", () => {
  it("counts each checked-in row once", () => {
    const rows = [
      { session_id: "ses_mon", check_in_time: "2026-09-21T09:00:00Z" },
      { session_id: "ses_wed", check_in_time: "2026-09-23T09:00:00Z" },
    ];
    expect(classesAttended(rows, sessions)).toBe(2);
  });

  it("leaves out a row with no check-in, which the history calls Absent", () => {
    const rows = [
      { session_id: "ses_mon", check_in_time: "2026-09-21T09:00:00Z" },
      { session_id: "ses_wed", check_in_time: null },
      { session_id: "ses_fri", check_in_time: "" },
    ];
    expect(classesAttended(rows, sessions)).toBe(1);
  });

  it("leaves out a row whose session is no longer on the timetable", () => {
    const rows = [
      { session_id: "ses_mon", check_in_time: "2026-09-21T09:00:00Z" },
      { session_id: "ses_gone", check_in_time: "2026-09-22T09:00:00Z" },
    ];
    expect(classesAttended(rows, sessions)).toBe(1);
  });

  it("is zero for a child who has not been to a class", () => {
    expect(classesAttended([], sessions)).toBe(0);
  });
});
