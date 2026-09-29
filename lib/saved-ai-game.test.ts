import { describe, expect, it } from "vitest";
import { parseSavedAiGame } from "./saved-ai-game";

describe("a saved robot game", () => {
  it("is resumable with a known robot and at least one move", () => {
    const raw = JSON.stringify({ opponent: "strong", moves: ["e2e4", "e7e5"], startedAt: "2026-09-30 10:00:00", savedAt: "x" });
    expect(parseSavedAiGame(raw)).toEqual({ opponent: "strong", moves: ["e2e4", "e7e5"], startedAt: "2026-09-30 10:00:00", savedAt: "x" });
  });

  it("is nothing when missing, empty, unreadable or for an unknown robot", () => {
    expect(parseSavedAiGame(null)).toBeNull();
    expect(parseSavedAiGame("not json")).toBeNull();
    expect(parseSavedAiGame(JSON.stringify({ opponent: "novice", moves: [] }))).toBeNull();
    expect(parseSavedAiGame(JSON.stringify({ opponent: "grandmaster", moves: ["e2e4"] }))).toBeNull();
  });
});
