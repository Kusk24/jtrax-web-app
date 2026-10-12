import { describe, expect, it } from "vitest";
import { fmtHours, progressPct } from "./certificates";

describe("certificate figures", () => {
  it("rounds hours to one place", () => {
    expect(fmtHours(35.4999)).toBe("35.5");
    expect(fmtHours(50)).toBe("50");
  });
  it("caps progress at the requirement", () => {
    expect(progressPct(25, 50)).toBe(50);
    expect(progressPct(61, 50)).toBe(100);
    expect(progressPct(10, 0)).toBe(0);
  });
});
