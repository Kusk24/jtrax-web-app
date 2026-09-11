/**
 * The daily puzzle client.
 *
 * The thing worth pinning is what this does *not* do: it never decides whether
 * a move is right. The three puzzles it replaced carried their own answers in
 * the browser, so "solved" was whatever the page said. Here a move goes to the
 * server and the verdict comes back.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { attemptMove, gameAt, getDailyPuzzles, puzzleGoal, type DailyPuzzle } from "./puzzles";

const puzzle = (over: Partial<DailyPuzzle> = {}): DailyPuzzle => ({
  puzzleId: "001gi",
  fen: "N6r/1p1k1ppp/2np4/b3p3/4P1b1/N1Q5/P4PPP/R3KB1R b KQ - 0 18",
  rating: 819,
  themes: "hangingPiece mateIn1",
  side: "Black",
  moveCount: 1,
  solved: false,
  wrongMoves: 0,
  ...over,
});

function stubFetch(body: unknown, ok = true) {
  const spy = vi.fn().mockResolvedValue({ ok, json: async () => body, status: ok ? 200 : 500 });
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => vi.unstubAllGlobals());

describe("gameAt", () => {
  it("loads a real position from the bank", () => {
    const game = gameAt(puzzle().fen);
    expect(game).not.toBeNull();
    // Black to move, as the puzzle says — the board is turned round for them.
    expect(game!.turn()).toBe("b");
  });

  it("is null for a position it cannot load, so a bad puzzle is skipped rather than drawn wrong", () => {
    expect(gameAt("not a fen")).toBeNull();
    expect(gameAt("")).toBeNull();
  });
});

describe("puzzleGoal", () => {
  it("says mate when the themes say mate, and carries the move count", () => {
    expect(puzzleGoal(puzzle())).toEqual({ key: "mateIn", count: 1 });
    expect(puzzleGoal(puzzle({ themes: "mateIn2", moveCount: 2 }))).toEqual({ key: "mateIn", count: 2 });
  });

  it("asks for the best move when the puzzle is not a mate", () => {
    // The old header called every puzzle "mate in 1", which was true of the
    // three hard-coded ones and of almost nothing in a real bank.
    expect(puzzleGoal(puzzle({ themes: "skewer", moveCount: 2 })).key).toBe("winIn");
  });
});

describe("attemptMove", () => {
  it("sends the pupil's own moves and the one being tried — never a verdict", async () => {
    const spy = stubFetch({ correct: true, solved: true, reply: "", fen: "8/8/8/8/8/8/8/8 w - - 0 1" });
    await attemptMove("001gi", "a5c3", ["e2e4"]);

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("/api/puzzles/001gi/attempt");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toEqual({ move: "a5c3", played: ["e2e4"] });
    // Nothing about whether it was right: that is the server's to decide.
    expect(Object.keys(body)).not.toContain("correct");
    expect(Object.keys(body)).not.toContain("solved");
  });

  it("escapes the puzzle id rather than pasting it into the path", async () => {
    const spy = stubFetch({ correct: false, solved: false, reply: "", fen: "" });
    await attemptMove("a/../b", "e2e4", []);
    expect(spy.mock.calls[0][0]).toBe("/api/puzzles/a%2F..%2Fb/attempt");
  });

  it("throws when the server refuses, so the board can say so instead of pretending", async () => {
    stubFetch({}, false);
    await expect(attemptMove("001gi", "a5c3", [])).rejects.toThrow();
  });
});

describe("getDailyPuzzles", () => {
  it("carries the exhausted flag, so an empty day can be explained", async () => {
    stubFetch({ puzzles: [], exhausted: true, unseen: 0 });
    const set = await getDailyPuzzles();
    expect(set.exhausted).toBe(true);
    expect(set.puzzles).toEqual([]);
  });

  it("never receives the solution — the payload has no moves on it", async () => {
    stubFetch({ puzzles: [puzzle()], exhausted: false, unseen: 57 });
    const set = await getDailyPuzzles();
    expect(Object.keys(set.puzzles[0])).not.toContain("moves");
    expect(JSON.stringify(set)).not.toContain("a5c3");
  });
});
