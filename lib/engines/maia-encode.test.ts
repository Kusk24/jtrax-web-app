import { describe, expect, it } from "vitest";
import moveVocab from "../../public/models/maia-moves.json";
import fixtures from "./__fixtures__/maia-encoding.json";
import {
  BOARD_FLOATS,
  eloBucket,
  encodeBoard,
  mirrorFen,
  mirrorUci,
  prepare,
} from "./maia-encode";

/* Every expectation here comes from running the real maia2 package, not from
   reading its source. The encoding is the one part of serving this model that
   fails silently: a wrong channel produces legal, plausible, bad moves. */

const moveIndex = new Map((moveVocab as string[]).map((m, i) => [m, i]));

describe("mirrorFen", () => {
  it("turns a black-to-move position into the equivalent white-to-move one", () => {
    // After 1.e4 it is Black to move. Seen from the other side that is White
    // to move against a black pawn on e5 — a normal position, not a flipped one.
    const black = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    expect(mirrorFen(black)).toBe(
      "rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 1",
    );
  });

  it("swaps castling rights between colours", () => {
    expect(mirrorFen("r3k2r/8/8/8/8/8/8/R3K2R w Kq - 0 1").split(" ")[2]).toBe("Qk");
  });

  it("is its own inverse", () => {
    const fen = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 6 5";
    expect(mirrorFen(mirrorFen(fen))).toBe(fen);
  });
});

describe("mirrorUci", () => {
  it("flips the rank and keeps the file", () => {
    expect(mirrorUci("e2e4")).toBe("e7e5");
  });

  it("keeps the promotion piece", () => {
    expect(mirrorUci("g2g1q")).toBe("g7g8q");
  });
});

describe("eloBucket", () => {
  it("matches maia2's 11 buckets", () => {
    expect(eloBucket(800)).toBe(0);
    expect(eloBucket(1099)).toBe(0);
    expect(eloBucket(1100)).toBe(1);
    expect(eloBucket(1500)).toBe(5);
    expect(eloBucket(1999)).toBe(9);
    expect(eloBucket(2600)).toBe(10);
  });
});

describe("encodeBoard against maia2 fixtures", () => {
  for (const c of fixtures.cases) {
    it(c.label, () => {
      // preprocessing() mirrors before encoding, so the fixture describes the
      // mirrored board whenever it was Black to move.
      const fen = c.turn === "b" ? mirrorFen(c.fen) : c.fen;
      const got = encodeBoard(fen);

      expect(got).toHaveLength(BOARD_FLOATS);
      const ones = [...got.entries()].filter(([, v]) => v === 1).map(([i]) => i);
      expect(ones).toEqual(c.ones);
    });
  }
});

describe("prepare", () => {
  for (const c of fixtures.cases) {
    it(`legal move indices — ${c.label}`, () => {
      const { legalIndices, mirrored } = prepare(c.fen, moveIndex);
      expect(mirrored).toBe(c.turn === "b");
      expect([...legalIndices].sort((a, b) => a - b)).toEqual(c.legalIndices);
    });
  }

  it("round-trips a move back onto the real board", () => {
    const c = fixtures.cases.find((x) => x.turn === "b")!;
    const { mirrored } = prepare(c.fen, moveIndex);
    const backOnBoard = mirrored
      ? mirrorUci(c.sampleMoveInModelSpace)
      : c.sampleMoveInModelSpace;
    expect(backOnBoard).toBe(c.sampleMoveOnRealBoard);
  });
});
