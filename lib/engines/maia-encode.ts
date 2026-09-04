/* Maia-2's input encoding, ported from the installed Python package.

   Two implementations of one encoding is one too many, so the move vocabulary
   is generated rather than rewritten (public/models/maia-moves.json) and this
   file is tested against fixtures produced by the real thing —
   jtrax-ai/tools/export_web_assets.py. A subtly wrong encoding does not throw;
   it just plays nonsense, which is far more expensive to notice. */

import { Chess } from "chess.js";

export const CHANNELS = 18;
export const BOARD_FLOATS = CHANNELS * 64;

/* Channel layout, from maia2/utils.py:board_to_tensor —
     0-5    white pawn, knight, bishop, rook, queen, king
     6-11   the same for black
     12     side to move (all ones when White)
     13-16  castling rights: white king, white queen, black king, black queen
     17     en passant target square                                        */
const PIECES = "pnbrqk";
const TURN_CHANNEL = 12;
const CASTLING_CHANNEL = 13;
const EP_CHANNEL = 17;

/** python-chess numbers squares a1=0 … h8=63: row is the rank, col the file. */
function squareIndex(square: string): number {
  return (square.charCodeAt(1) - 49) * 8 + (square.charCodeAt(0) - 97);
}

function swapCase(text: string): string {
  return text.replace(/[a-z]/gi, (c) =>
    c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase(),
  );
}

/** Same file, opposite rank — a1 becomes a8. */
export function mirrorSquare(square: string): string {
  return square[0] + String(9 - Number(square[1]));
}

export function mirrorUci(uci: string): string {
  return mirrorSquare(uci.slice(0, 2)) + mirrorSquare(uci.slice(2, 4)) + uci.slice(4);
}

/** python-chess's Board.mirror(): flipped vertically with the colours swapped,
    so the position is the same one seen from the other side. Maia-2 only ever
    sees White to move, which is why this exists at all. */
export function mirrorFen(fen: string): string {
  const [board, turn, castling, ep, half, full] = fen.split(" ");
  const ranks = board.split("/").reverse().map(swapCase).join("/");
  // A white right becomes the matching black one, then back into KQkq order.
  const swapped =
    castling === "-"
      ? "-"
      : "KQkq"
          .split("")
          .filter((c) => castling.includes(swapCase(c)))
          .join("") || "-";
  return [
    ranks,
    turn === "w" ? "b" : "w",
    swapped,
    ep === "-" ? "-" : mirrorSquare(ep),
    half,
    full,
  ].join(" ");
}

/** The 18x8x8 input, flattened as the ONNX graph expects it.

    Castling is read from the FEN field rather than by checking where the king
    and rook stand. chess.js keeps that field honest, and any FEN reaching here
    came from a game it was playing. */
export function encodeBoard(fen: string): Float32Array {
  const out = new Float32Array(BOARD_FLOATS);
  const [board, turn, castling, ep] = fen.split(" ");

  let rank = 7; // FEN starts at rank 8 and counts down
  let file = 0;
  for (const ch of board) {
    if (ch === "/") {
      rank -= 1;
      file = 0;
    } else if (ch >= "1" && ch <= "8") {
      file += Number(ch);
    } else {
      const piece = PIECES.indexOf(ch.toLowerCase());
      const channel = piece + (ch === ch.toLowerCase() ? 6 : 0);
      out[channel * 64 + rank * 8 + file] = 1;
      file += 1;
    }
  }

  if (turn === "w") out.fill(1, TURN_CHANNEL * 64, (TURN_CHANNEL + 1) * 64);

  "KQkq".split("").forEach((right, i) => {
    if (castling.includes(right)) {
      out.fill(1, (CASTLING_CHANNEL + i) * 64, (CASTLING_CHANNEL + i + 1) * 64);
    }
  });

  if (ep !== "-") out[EP_CHANNEL * 64 + squareIndex(ep)] = 1;
  return out;
}

/** Rating bucket index. maia2/utils.py:map_to_category — 11 buckets, one below
    1100, one at 2000 and up, and 100-point steps in between. */
export function eloBucket(elo: number): number {
  if (elo < 1100) return 0;
  if (elo >= 2000) return 10;
  return Math.floor((elo - 1100) / 100) + 1;
}

/** UCI strings for every legal move, in the form the vocabulary uses. */
export function legalUcis(fen: string): string[] {
  return new Chess(fen)
    .moves({ verbose: true })
    .map((m) => m.from + m.to + (m.promotion ?? ""));
}

/** Everything the graph needs for one position, plus the mirror flag the
    caller must apply in reverse to whatever move comes back. */
export function prepare(fen: string, moveIndex: Map<string, number>) {
  const mirrored = fen.split(" ")[1] === "b";
  const modelFen = mirrored ? mirrorFen(fen) : fen;
  const legal = legalUcis(modelFen);
  const indices: number[] = [];
  for (const uci of legal) {
    const i = moveIndex.get(uci);
    // Maia's vocabulary covers every legal move, so a miss means the encoding
    // has drifted — better to know than to quietly play a worse move.
    if (i === undefined) throw new Error(`move outside Maia vocabulary: ${uci}`);
    indices.push(i);
  }
  return { board: encodeBoard(modelFen), legalIndices: indices, mirrored };
}
