/**
 * Board helpers shared by every way of playing: against the computer, against
 * another student, and the admin console's replay.
 *
 * Rules come from chess.js, not from `student-game.ts` — that file is a
 * mate-in-1 puzzle toy with no castling, en passant, promotion or draws, which
 * is fine for a fixed puzzle and wrong for a real game. The backend grades
 * moves with its own engine regardless; this copy exists so the board can
 * highlight squares and reject obvious mistakes without a round trip.
 */
import { Chess, type Square as ChessSquare } from "chess.js";

export type Piece = { type: string; color: "w" | "b" };
/** Rank 8 first, so index [0][0] is a8 and the array reads like a diagram. */
export type BoardGrid = (Piece | null)[][];

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/** Unicode glyphs, matching the puzzle board's existing look. */
export const PIECE_GLYPH: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};

export function squareName(row: number, col: number): ChessSquare {
  return `${FILES[col]}${8 - row}` as ChessSquare;
}

export function squareToRC(square: string): [number, number] {
  return [8 - Number(square[1]), FILES.indexOf(square[0] as (typeof FILES)[number])];
}

/** Replays UCI moves into a game. Returns null if the history is impossible,
    which means the client is out of step with the server and should refetch. */
export function gameFrom(moves: string[]): Chess | null {
  const game = new Chess();
  for (const uci of moves) {
    try {
      if (!game.move(uciToMove(uci))) return null;
    } catch {
      return null;
    }
  }
  return game;
}

/** "e7e8q" -> the object form chess.js wants. */
export function uciToMove(uci: string) {
  return {
    from: uci.slice(0, 2) as ChessSquare,
    to: uci.slice(2, 4) as ChessSquare,
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

export function toGrid(game: Chess): BoardGrid {
  return game.board().map((row) => row.map((sq) => (sq ? { type: sq.type, color: sq.color } : null)));
}

/** Destination squares for a piece, as UCI strings so promotions stay distinct. */
export function movesFrom(game: Chess, from: string): string[] {
  try {
    return game.moves({ square: from as ChessSquare, verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ""));
  } catch {
    return [];
  }
}

/** True when the move needs a piece chosen — a pawn arriving on the far rank. */
export function isPromotion(game: Chess, from: string, to: string): boolean {
  const piece = game.get(from as ChessSquare);
  if (!piece || piece.type !== "p") return false;
  return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
}

export type Ending = { result: "1-0" | "0-1" | "1/2-1/2"; reason: string } | null;

/**
 * Reads the end of a game off the position.
 *
 * The server is the authority on results — it claims threefold and the
 * fifty-move rule too — but a board that waited for a round trip to say
 * "checkmate" would feel broken, so the client works it out as well.
 */
export function endingOf(game: Chess): Ending {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) {
    return { result: game.turn() === "w" ? "0-1" : "1-0", reason: "Checkmate" };
  }
  if (game.isStalemate()) return { result: "1/2-1/2", reason: "Stalemate" };
  if (game.isInsufficientMaterial()) return { result: "1/2-1/2", reason: "InsufficientMaterial" };
  if (game.isThreefoldRepetition()) return { result: "1/2-1/2", reason: "ThreefoldRepetition" };
  return { result: "1/2-1/2", reason: "FiftyMoveRule" };
}

/** Move list as numbered pairs, for the move panel and the admin replay. */
export function pairedMoves(sans: string[]): { no: number; white: string; black?: string }[] {
  const out: { no: number; white: string; black?: string }[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    out.push({ no: i / 2 + 1, white: sans[i], black: sans[i + 1] });
  }
  return out;
}
