import { describe, expect, it } from "vitest";
import { cardStateOf, shownOnHome } from "./tournament-card";

const base = { status: "Upcoming", registration: "open" as const, closesInDays: 5, resultsPublic: false, registered: false };

describe("a tournament card through the tournament's life", () => {
  it("registration open: Register Now, or Registered and View Registration", () => {
    expect(cardStateOf(base)).toEqual({ tag: { kind: "closesIn", days: 5 }, registered: false, action: "register", notRegisteredNote: false });
    expect(cardStateOf({ ...base, registered: true })).toMatchObject({ registered: true, action: "viewRegistration" });
  });

  it("registration closed: no button unless registered", () => {
    for (const registration of ["closed", "deadline"] as const) {
      expect(cardStateOf({ ...base, registration })).toMatchObject({ tag: { kind: "registrationClosed" }, action: null });
      expect(cardStateOf({ ...base, registration, registered: true })).toMatchObject({ registered: true, action: "viewRegistration" });
    }
  });

  it("ongoing: green, and View Results once they are up", () => {
    const on = { ...base, status: "Ongoing", registration: "deadline" as const };
    expect(cardStateOf({ ...on, resultsPublic: true, registered: true })).toMatchObject({ tag: { kind: "ongoing" }, registered: true, action: "viewResults" });
    expect(cardStateOf({ ...on, resultsPublic: true })).toMatchObject({ action: "viewResults", notRegisteredNote: true });
    expect(cardStateOf(on)).toMatchObject({ tag: { kind: "ongoing" }, action: null });
  });

  it("results published: Results Available, View Results, and the note if not entered", () => {
    const done = { ...base, status: "Completed", registration: "deadline" as const, resultsPublic: true };
    expect(cardStateOf({ ...done, registered: true })).toEqual({ tag: { kind: "results" }, registered: true, action: "viewResults", notRegisteredNote: false });
    expect(cardStateOf(done)).toMatchObject({ action: "viewResults", notRegisteredNote: true });
  });

  it("never offers Register Now once registration has closed", () => {
    for (const status of ["Upcoming", "Ongoing", "Completed"]) {
      for (const registration of ["closed", "deadline"] as const) {
        expect(cardStateOf({ ...base, status, registration }).action).not.toBe("register");
      }
    }
  });
});

describe("which tournaments get a card", () => {
  const t = (id: string, status: string, startISO: string, resultsPublic = false, endISO = "") => ({ id, status, startISO, endISO, resultsPublic });
  it("upcoming, ongoing, and finished with results for two weeks; live first", () => {
    const list = [
      t("later", "Upcoming", "2026-11-20"),
      t("soon", "Upcoming", "2026-10-20"),
      t("now", "Ongoing", "2026-10-05"),
      t("done", "Completed", "2026-09-28", true, "2026-09-29"),
      t("old", "Completed", "2026-08-01", true, "2026-08-02"),
      t("quiet", "Completed", "2026-10-01", false, "2026-10-02"),
    ];
    expect(shownOnHome(list, "2026-10-06").map((x) => x.id)).toEqual(["now", "soon", "later", "done"]);
  });
});
