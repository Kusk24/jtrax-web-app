import { describe, expect, it } from "vitest";
import { whiteScore } from "./board-result";

/* The public page colours each board by who won, reading the result the way
   either source prints it. */
describe("reading a board's result", () => {
  it.each([
    ["1-0", 1], ["1 - 0", 1], ["+/-", 1], ["+ - -", 1],
    ["0-1", 0], ["0 - 1", 0], ["-/+", 0], ["- - +", 0],
    ["1/2-1/2", 0.5], ["½ - ½", 0.5],
    ["Pending", null], ["", null],
  ])("%s", (result, want) => {
    expect(whiteScore(result as string)).toBe(want);
  });
});
