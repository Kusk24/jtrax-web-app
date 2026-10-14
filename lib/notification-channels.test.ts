/**
 * The Email, Phone and Browser switches under a notification type: offered
 * only where the type can arrive that way, and on until the parent turns one
 * off — matching what the backend does.
 */
import { describe, expect, it } from "vitest";
import { channelOn, channelPrefsFrom, outsideChannels } from "./notification-channels";

const byType = {
  announcement: ["inapp", "email", "webpush", "mobile"],
  payment_received: ["inapp", "email", "webpush", "mobile"],
  check_in: ["inapp"],
};

describe("outsideChannels", () => {
  it("offers email, phone and browser only where the type can use them, in that order", () => {
    expect(outsideChannels(byType, "announcement")).toEqual(["email", "mobile", "webpush"]);
    expect(outsideChannels(byType, "check_in")).toEqual([]);
  });

  it("offers nothing when the server does not say", () => {
    expect(outsideChannels(undefined, "announcement")).toEqual([]);
  });
});

describe("channel choices", () => {
  const prefs = channelPrefsFrom([
    { type: "announcement", channel: "email", enabled: false },
    { type: "announcement", channel: "inapp", enabled: true },
  ]);

  it("keeps what the parent switched off, and leaves the type's own switch out", () => {
    expect(prefs).toEqual({ "announcement:email": false });
  });

  it("is on until switched off, as the backend treats it", () => {
    expect(channelOn(prefs, "announcement", "email")).toBe(false);
    expect(channelOn(prefs, "announcement", "mobile")).toBe(true);
    expect(channelOn(prefs, "payment_received", "email")).toBe(true);
  });
});
