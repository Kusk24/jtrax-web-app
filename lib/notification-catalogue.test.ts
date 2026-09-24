/**
 * The parent's list of notification switches has to name every type the
 * backend sends (notify.Type* in jtrax-backend), or a parent has no way to turn
 * one off.
 */
import { describe, expect, it } from "vitest";
import { NOTIF_DEFAULTS, NOTIF_TYPES } from "./parent-v2-data";

describe("the notification catalogue", () => {
  it("lists every type the backend sends to parents", () => {
    expect([...NOTIF_TYPES].sort()).toEqual(
      ["announcement", "check_in", "class_cancelled", "credit_deducted", "credit_expiry", "low_credit", "payment_received"],
    );
  });

  it("sends class cancellations unless the parent turns them off", () => {
    expect(NOTIF_DEFAULTS.class_cancelled).toBe(true);
  });
});
