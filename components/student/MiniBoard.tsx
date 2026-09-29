"use client";

/**
 * A puzzle's position as a small thumbnail — the Puzzles list shows each
 * puzzle's board rather than a stock picture. Turned round for a pupil
 * playing Black, as the real board is. Decorative: the row names the puzzle.
 */
import { gameAt } from "@/lib/puzzles";
import { pieceSrc, toGrid } from "@/lib/chess-core";

export function MiniBoard({ fen, flipped = false, className = "size-14" }: { fen: string; flipped?: boolean; className?: string }) {
  const game = gameAt(fen);
  if (!game) return <span className={`${className} rounded-md bg-pp-line`} aria-hidden />;
  const grid = toGrid(game);
  const rows = flipped ? [...grid].reverse().map((r) => [...r].reverse()) : grid;
  return (
    <span className={`${className} grid shrink-0 grid-cols-8 overflow-hidden rounded-md border border-pp-line`} aria-hidden>
      {rows.flatMap((row, r) =>
        row.map((sq, c) => (
          <span
            key={`${r}-${c}`}
            className="relative"
            /* The puzzle board's own blues, so the thumbnail looks like the board it opens. */
            style={{ background: (r + c) % 2 ? "var(--color-sv-board-dark)" : "var(--color-sv-board-light)" }}
          >
            {sq && (
              // eslint-disable-next-line @next/next/no-img-element -- tiny static SVGs, one per square
              <img src={pieceSrc(sq.color, sq.type)} alt="" className="absolute inset-0 size-full" draggable={false} />
            )}
          </span>
        )),
      )}
    </span>
  );
}
