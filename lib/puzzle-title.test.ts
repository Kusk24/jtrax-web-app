import { describe, expect, it } from "vitest";
import { puzzleTitleKey } from "./puzzle-title";

describe("a puzzle's name", () => {
  it("is named after its mate before its tactic", () => {
    expect(puzzleTitleKey("fork mateIn2 middlegame")).toBe("mateIn2");
    expect(puzzleTitleKey("backRankMate mateIn1")).toBe("backRankMate");
  });

  it("is named after the tactic, not the phase or length", () => {
    expect(puzzleTitleKey("endgame short fork crushing")).toBe("fork");
    expect(puzzleTitleKey("discoveredAttack advantage long")).toBe("discoveredAttack");
  });

  it("falls back to the phase, then to what it asks", () => {
    expect(puzzleTitleKey("endgame crushing")).toBe("endgame");
    expect(puzzleTitleKey("crushing short")).toBe("winMaterial");
    expect(puzzleTitleKey("")).toBe("winMaterial");
  });
});
