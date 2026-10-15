/**
 * The session cookie must not end before the backend session can — it is set
 * once at sign-in, so a shorter one signs out a family mid-use.
 */
import { describe, expect, it } from "vitest";
import { SESSION_MAX_AGE } from "./session";

describe("SESSION_MAX_AGE", () => {
  it("lasts as long as the backend's 90-day session cap", () => {
    expect(SESSION_MAX_AGE).toBe(90 * 24 * 60 * 60);
  });
});
