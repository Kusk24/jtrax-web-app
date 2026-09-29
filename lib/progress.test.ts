import { describe, expect, it } from "vitest";
import { isFinishedGame, outcomeOf } from "./progress";

describe("outcomeOf", () => {
  it("reads the result from the pupil's side of the board", () => {
    expect(outcomeOf("1-0", "white")).toBe("win");
    expect(outcomeOf("1-0", "black")).toBe("loss");
    expect(outcomeOf("0-1", "black")).toBe("win");
    expect(outcomeOf("1/2-1/2", "black")).toBe("draw");
  });

  it("says nothing about a game with no result", () => {
    expect(outcomeOf("", "white")).toBeNull();
    expect(outcomeOf(undefined, "white")).toBeNull();
  });
});

describe("isFinishedGame", () => {
  it("counts games with a result, not puzzles or games still on the board", () => {
    expect(isFinishedGame({ kind: "room", id: "a", at: "", day: "", against: "", result: "1-0" })).toBe(true);
    expect(isFinishedGame({ kind: "room", id: "b", at: "", day: "", against: "" })).toBe(false);
    expect(isFinishedGame({ kind: "puzzle", id: "c", at: "", day: "", against: "", result: "solved" })).toBe(false);
  });
});

