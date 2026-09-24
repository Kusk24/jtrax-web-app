/**
 * What a parent's Settings shows before they touch anything has to match what
 * the backend actually does (notify.DefaultEnabled). Since the office started
 * sending low credit by hand, every type defaults on — a switch showing "off"
 * for something that arrives anyway is a switch that lies.
 */
import { describe, expect, it } from "vitest";
import { NOTIF_DEFAULTS, NOTIF_TYPES } from "./parent-v2-data";

describe("notification defaults", () => {
  it("has every type on until the parent turns it off", () => {
    for (const type of NOTIF_TYPES) expect([type, NOTIF_DEFAULTS[type]]).toEqual([type, true]);
  });
});
