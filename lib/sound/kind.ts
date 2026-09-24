/* Which sound a move makes.
 *
 * Kept apart from playback so it can be tested: this is plain chess, and the
 * rest is browser audio. The rule is the one every chess site follows — a check
 * outranks everything, then a promotion, a castle, a capture, and otherwise the
 * plain sound of a piece being set down. */
import { Chess, type Move } from "chess.js";

export type SoundName = "move" | "capture" | "castle" | "check" | "promote" | "game-end" | "wrong";

export const ALL_SOUNDS: readonly SoundName[] = [
  "move", "capture", "castle", "check", "promote", "game-end", "wrong",
];

/** The sound for one move. `san` carries check (`+`) and mate (`#`); `flags`
    carries the rest — `c` capture, `e` en passant, `k`/`q` castling, `p`
    promotion. */
export function soundForMove(move: Pick<Move, "san" | "flags">): SoundName {
  if (/[+#]$/.test(move.san)) return "check";
  if (move.flags.includes("p")) return "promote";
  if (move.flags.includes("k") || move.flags.includes("q")) return "castle";
  if (move.flags.includes("c") || move.flags.includes("e")) return "capture";
  return "move";
}

/** The last move of a game that still has its history. */
export function lastMoveOf(game: Chess): Move | undefined {
  const history = game.history({ verbose: true });
  return history[history.length - 1];
}

/** A UCI move (`e7e8q`) played from a position, or null when it is not legal
    there. */
export function moveFrom(fen: string, uci: string): Move | null {
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  } catch {
    return null;
  }
}

/* The move that turns one position into the next, when only the two
   positions are known — a puzzle's reply arrives as the position after it,
   not as the move. Compared on placement and side to move only: the counters
   and the en-passant field are written differently by different engines, and
   no two legal moves from one position leave the same pieces on the same
   squares. */
export function moveBetween(beforeFen: string, afterFen: string): Move | null {
  const key = (fen: string) => fen.split(" ").slice(0, 2).join(" ");
  let game: Chess;
  try {
    game = new Chess(beforeFen);
  } catch {
    return null;
  }
  const target = key(afterFen);
  return game.moves({ verbose: true }).find((m) => key(m.after) === target) ?? null;
}
