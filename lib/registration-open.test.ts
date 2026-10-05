import { describe, expect, it } from "vitest";
import { registrationState } from "./registration-open";

describe("registrationState", () => {
  it("is closed when the organiser closed registration, whatever the date", () => {
    expect(registrationState({ public_registration: 0, registration_deadline: "2026-10-06" }, "2026-10-05")).toBe("closed");
    expect(registrationState({ public_registration: false }, "2026-10-05")).toBe("closed");
  });

  it("closes the day after the closing date", () => {
    expect(registrationState({ public_registration: 1, registration_deadline: "2026-10-06" }, "2026-10-06")).toBe("open");
    expect(registrationState({ public_registration: 1, registration_deadline: "2026-10-06" }, "2026-10-07")).toBe("deadline");
  });

  it("is open with no closing date", () => {
    expect(registrationState({ public_registration: true }, "2026-10-05")).toBe("open");
  });
});
