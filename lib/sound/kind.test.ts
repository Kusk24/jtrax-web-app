/**
 * Which sound a move makes. The rule is the chess sites' rule, so each case is
 * a real position rather than a hand-made flags string.
 */
import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { lastMoveOf, moveBetween, moveFrom, soundForMove } from "./kind";

const play = (fen: string, uci: string) => {
  const m = moveFrom(fen, uci);
  if (!m) throw new Error(`illegal: ${uci} in ${fen}`);
  return soundForMove(m);
};

const START = new Chess().fen();

describe("the sound of a move", () => {
  it("is a plain move for a quiet move", () => {
    expect(play(START, "e2e4")).toBe("move");
  });

  it("is a capture for a capture, en passant included", () => {
    expect(play("4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1", "e4d5")).toBe("capture");
    expect(play("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "e5d6")).toBe("capture");
  });

  it("is a castle on either side", () => {
    expect(play("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1")).toBe("castle");
    expect(play("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1c1")).toBe("castle");
  });

  it("is a promotion, even one that captures", () => {
    expect(play("7k/P7/8/8/8/8/8/K7 w - - 0 1", "a7a8n")).toBe("promote");
    expect(play("1r5k/P7/8/8/8/8/8/K7 w - - 0 1", "a7b8n")).toBe("promote");
  });

  it("is a check whenever the move gives check, over everything else", () => {
    expect(play("4k3/8/8/8/8/8/8/R3K3 w - - 0 1", "a1a8")).toBe("check");
    // Promoting to a queen on the back rank checks the king.
    expect(play("4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8q")).toBe("check");
    // Mate is a check too; the game-over chime is the result dialog's to play.
    expect(play("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", "a1a8")).toBe("check");
  });
});

describe("reading moves", () => {
  it("finds the last move of a game with history", () => {
    const g = new Chess();
    g.move("e4");
    g.move("d5");
    g.move("exd5");
    expect(lastMoveOf(g)?.san).toBe("exd5");
    expect(lastMoveOf(new Chess())).toBeUndefined();
  });

  it("refuses an illegal move rather than throwing", () => {
    expect(moveFrom(START, "e2e5")).toBeNull();
    expect(moveFrom("not a position", "e2e4")).toBeNull();
  });

  /* A puzzle's reply arrives as a position, so the reply's sound has to be
     worked out from the two positions either side of it. */
  it("recovers the move between two positions, whatever the counters say", () => {
    const before = "4k3/8/8/3p4/4P3/8/8/4K3 b - - 0 1";
    const after = "4k3/8/8/8/4p3/8/8/4K3 w - - 7 42"; // a different engine's counters
    const reply = moveBetween(before, after);
    expect(reply?.san).toBe("dxe4");
    expect(soundForMove(reply!)).toBe("capture");
  });

  it("finds nothing when no single move joins the positions", () => {
    expect(moveBetween(START, "4k3/8/8/8/8/8/8/4K3 w - - 0 1")).toBeNull();
  });
});
