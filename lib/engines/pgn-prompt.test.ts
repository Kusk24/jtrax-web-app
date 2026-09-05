import { describe, expect, it } from "vitest";
import { promptFrom } from "./pgn-prompt";

/* The format is copied from jtrax-ai/step3_probe.py, which is what produced
   the 0.9363 legal-move rate this model is quoted at. If the prompt drifts,
   that figure stops describing what the app actually plays. */
describe("promptFrom", () => {
  it("opens with the game delimiter and the first move number", () => {
    expect(promptFrom([])).toBe(";1.");
  });

  it("does not number a move until Black has replied", () => {
    expect(promptFrom(["e4"])).toBe(";1.e4 ");
  });

  it("writes the next number after Black's move", () => {
    expect(promptFrom(["e4", "e5"])).toBe(";1.e4 e5 2.");
    expect(promptFrom(["e4", "e5", "Nf3"])).toBe(";1.e4 e5 2.Nf3 ");
  });

  it("keeps numbering into double figures", () => {
    const twenty = Array.from({ length: 20 }, (_, i) => (i % 2 ? "Nf6" : "Nf3"));
    expect(promptFrom(twenty).endsWith("11.")).toBe(true);
  });
});
