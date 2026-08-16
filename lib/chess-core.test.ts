import { describe, expect, it } from "vitest";
import { capturedIn, gameFrom, materialBalance } from "./chess-core";

/** Replays UCI moves and fails loudly if the line is illegal — a test built on
    an impossible position proves nothing. */
function play(...uci: string[]) {
  const game = gameFrom(uci);
  if (!game) throw new Error(`illegal line: ${uci.join(" ")}`);
  return game;
}

describe("capturedIn", () => {
  it("starts empty and level", () => {
    const { byWhite, byBlack, advantage } = capturedIn(play());
    expect(byWhite).toEqual([]);
    expect(byBlack).toEqual([]);
    expect(advantage).toBe(0);
  });

  it("credits a capture to the side that made it", () => {
    // 1. e4 d5 2. exd5 — White takes a pawn.
    const { byWhite, byBlack, advantage } = capturedIn(play("e2e4", "d7d5", "e4d5"));
    expect(byWhite).toEqual(["p"]);
    expect(byBlack).toEqual([]);
    expect(advantage).toBe(1);
  });

  it("reads an advantage for Black as a negative number", () => {
    // 1. e4 d5 2. exd5 Qxd5 — the pawns come off, Black is a pawn up on the exchange.
    const { byWhite, byBlack, advantage } = capturedIn(play("e2e4", "d7d5", "e4d5", "d8d5"));
    expect(byWhite).toEqual(["p"]);
    expect(byBlack).toEqual(["p"]);
    expect(advantage).toBe(0);
  });

  /* The reason the lists come from the move history rather than from counting
     what is missing off the board: in an en passant capture the taken pawn is
     not on the square the capturing pawn lands on, so a position alone cannot
     say a capture happened there. */
  it("counts an en passant capture", () => {
    // 1. e4 a6 2. e5 d5 3. exd6 e.p.
    const game = play("e2e4", "a7a6", "e4e5", "d7d5", "e5d6");
    const { byWhite, advantage } = capturedIn(game);
    expect(byWhite).toEqual(["p"]);
    expect(advantage).toBe(1);
    // And the pawn really is gone: d5 is empty, the capturer sits on d6.
    expect(game.get("d5")).toBeFalsy();
    expect(game.get("d6")?.type).toBe("p");
  });

  /* The reason the advantage is measured on the board rather than summed from
     the capture lists: promoting is worth eight points and captures nothing. */
  it("counts the promotion itself, not just the piece captured on the way", () => {
    // The a-pawn eats its way to a7 and promotes by taking the knight on b8.
    const game = play(
      "a2a4", "b7b5", "a4b5", "a7a6", "b5a6", "g8f6", "a6a7", "f6g8", "a7b8q",
    );
    const { byWhite, byBlack, advantage } = capturedIn(game);
    expect(byWhite).toEqual(["p", "p", "n"]);
    expect(byBlack).toEqual([]);
    expect(game.get("b8")?.type).toBe("q");
    // Two pawns and a knight taken is +5. The advantage is 13, because the
    // pawn that promoted is now worth nine instead of one. A total summed from
    // the capture list alone would report 5 and be wrong by the whole queen.
    expect(byWhite.reduce((n, p) => n + { p: 1, n: 3 }[p as "p" | "n"], 0)).toBe(5);
    expect(advantage).toBe(13);
  });

  it("orders a tray cheapest first, whatever order things were taken in", () => {
    const { byWhite } = capturedIn(
      // White takes a knight, then a pawn; the tray still reads pawn, knight.
      play("e2e4", "b8c6", "d2d4", "c6d4", "d1d4", "e7e5", "d4e5"),
    );
    expect(byWhite).toEqual(["p", "n"]);
  });
});

describe("materialBalance", () => {
  it("is level at the start", () => {
    expect(materialBalance(play())).toBe(0);
  });

  it("is negative when Black is ahead", () => {
    // 1. d4 e5 2. Nf3 exd4 — Black is a pawn up.
    expect(materialBalance(play("d2d4", "e7e5", "g1f3", "e5d4"))).toBe(-1);
  });
});
