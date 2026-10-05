import { describe, expect, it } from "vitest";
import { creditShare, creditTone } from "./credit-tone";

describe("credit tone", () => {
  it("is low at or below the academy's line", () => {
    expect(creditTone(3, 3)).toBe("low");
    expect(creditTone(-1, 3)).toBe("low");
  });
  it("warns up to twice the line, then is fine", () => {
    expect(creditTone(6, 3)).toBe("near");
    expect(creditTone(6.5, 3)).toBe("ok");
  });
});

describe("credit share", () => {
  it("is the share of the last top-up, kept between 0 and 100", () => {
    expect(creditShare(5, 20)).toBe(25);
    expect(creditShare(-2, 20)).toBe(0);
    expect(creditShare(30, 20)).toBe(100);
  });
  it("is full when there is no top-up to compare with", () => {
    expect(creditShare(4, null)).toBe(100);
    // Never topped up and nothing left: empty, not full.
    expect(creditShare(0, null)).toBe(0);
    expect(creditShare(-1, null)).toBe(0);
  });
});
