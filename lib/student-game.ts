/* Mate-in-1 chess engine and puzzle set, ported from JTrax Chess.dc.html. */

export type Board = (string | null)[][];
export type Square = [number, number];

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array<string | null>(8).fill(null));
}

export interface Puzzle {
  build: () => Board;
  from: Square;
  to: Square;
}

export const PUZZLES: Puzzle[] = [
  {
    build: () => {
      const b = emptyBoard();
      b[0][7] = "k"; b[1][6] = "p"; b[1][7] = "p"; b[7][0] = "R"; b[7][4] = "K";
      return b;
    },
    from: [7, 0],
    to: [0, 0],
  },
  {
    build: () => {
      const b = emptyBoard();
      b[0][7] = "k"; b[1][6] = "p"; b[1][7] = "p"; b[7][3] = "Q"; b[7][4] = "K";
      return b;
    },
    from: [7, 3],
    to: [0, 3],
  },
  {
    build: () => {
      const b = emptyBoard();
      b[0][0] = "k"; b[1][0] = "p"; b[1][1] = "p"; b[7][7] = "R"; b[7][4] = "K";
      return b;
    },
    from: [7, 7],
    to: [0, 7],
  },
];

export const PIECE_GLYPH: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
};

export function isWhite(p: string | null): boolean {
  return !!p && p === p.toUpperCase();
}

function inBounds(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function slideMoves(board: Board, r: number, c: number, dirs: number[][]): Square[] {
  const moves: Square[] = [];
  const piece = board[r][c];
  for (const [dr, dc] of dirs) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push([nr, nc]);
      } else {
        if (isWhite(target) !== isWhite(piece)) moves.push([nr, nc]);
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
  return moves;
}

export function legalMovesFor(board: Board, r: number, c: number): Square[] {
  const piece = board[r][c];
  if (!piece) return [];
  const type = piece.toUpperCase();
  if (type === "R") return slideMoves(board, r, c, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
  if (type === "B") return slideMoves(board, r, c, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  if (type === "Q")
    return slideMoves(board, r, c, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
  if (type === "N" || type === "K") {
    const deltas =
      type === "N"
        ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
        : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    return deltas
      .map(([dr, dc]) => [r + dr, c + dc] as Square)
      .filter(([nr, nc]) => inBounds(nr, nc) && (!board[nr][nc] || isWhite(board[nr][nc]) !== isWhite(piece)));
  }
  if (type === "P") {
    const dir = isWhite(piece) ? -1 : 1;
    const moves: Square[] = [];
    if (inBounds(r + dir, c) && !board[r + dir][c]) moves.push([r + dir, c]);
    for (const dc of [-1, 1]) {
      const nr = r + dir;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc] && isWhite(board[nr][nc]) !== isWhite(piece)) moves.push([nr, nc]);
    }
    return moves;
  }
  return [];
}
