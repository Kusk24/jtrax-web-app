import { describe, expect, it } from "vitest";
import { progressPct } from "./certificates";

describe("certificate figures", () => {
  it("caps progress at the requirement", () => {
    expect(progressPct(25, 50)).toBe(50);
    expect(progressPct(61, 50)).toBe(100);
    expect(progressPct(10, 0)).toBe(0);
  });
});
