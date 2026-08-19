"use client";

/* The board every mode draws on — against the computer, against a friend, and
   the admin replay. It renders a position and reports the move a player tried;
   it owns no game state, so the same component serves a live game and a
   finished one being stepped through.

   Styling follows the puzzle board already in StudentGame: gold tray, cream
   mat, unicode glyphs. */
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  PIECE_GLYPH,
  isPromotion,
  movesFrom,
  squareName,
  toGrid,
  type BoardGrid,
} from "@/lib/chess-core";
import type { Chess } from "chess.js";

type Props = {
  game: Chess;
  /** The colour this player controls, or null when only watching. */
  orientation: "w" | "b";
  canMove: boolean;
  onMove: (uci: string) => void;
  /** Highlights the last move played, so an arriving move is visible. */
  lastMove?: string;
  size?: number;
};

const PROMOTION_CHOICES = ["q", "r", "b", "n"] as const;

export function ChessBoard({ game, orientation, canMove, onMove, lastMove, size = 328 }: Props) {
  const t = useTranslations("play");
  const [from, setFrom] = useState<string | null>(null);
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);

  const grid: BoardGrid = toGrid(game);
  const legal = from ? movesFrom(game, from) : [];
  const square = size / 8;

  /* Black sits at the bottom for the player with black, which is how a real
     board works — asking a child to play upside down is a needless handicap. */
  const rows = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  function tap(name: string) {
    if (!canMove) return;
    const piece = game.get(name as never);

    // Tapping your own piece always re-aims rather than attempting a capture,
    // which is what a mis-tap usually means.
    if (piece && piece.color === game.turn()) {
      setFrom(name === from ? null : name);
      return;
    }
    if (!from) return;

    const target = legal.filter((uci) => uci.slice(2, 4) === name);
    if (target.length === 0) {
      setFrom(null);
      return;
    }
    if (isPromotion(game, from, name)) {
      setPending({ from, to: name });
      return;
    }
    onMove(target[0]);
    setFrom(null);
  }

  function choosePromotion(piece: string) {
    if (!pending) return;
    onMove(pending.from + pending.to + piece);
    setPending(null);
    setFrom(null);
  }

  return (
    <div className="relative rounded-[20px] bg-sv-gold p-2.5 shadow-[inset_0_0_0_2px_rgb(206,219,236),0_4px_10px_rgba(125,87,50,0.35)]">
      <div className="rounded-[14px] bg-sv-cream p-2 shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]">
        <div
          className="grid overflow-hidden rounded-lg shadow-[0_0_0_2px_rgb(116,84,44)]"
          style={{
            gridTemplateColumns: `repeat(8, ${square}px)`,
            gridTemplateRows: `repeat(8, ${square}px)`,
          }}
        >
          {rows.map((r) =>
            cols.map((c) => {
              const name = squareName(r, c);
              const piece = grid[r][c];
              const isFrom = from === name;
              const dest = legal.find((uci) => uci.slice(2, 4) === name);
              const isCapture = !!dest && !!piece;
              const wasLast = lastMove === name;
              const bg = isFrom
                ? "rgb(220,232,248)"
                : wasLast
                  ? "rgb(238,222,168)"
                  : (r + c) % 2 === 0
                    ? "rgb(248,246,235)"
                    : "rgb(196,165,165)";
              return (
                <button
                  key={name}
                  onClick={() => tap(name)}
                  disabled={!canMove}
                  aria-label={name}
                  className="relative flex items-center justify-center border-none p-0 disabled:cursor-default"
                  style={{ width: square, height: square, background: bg, cursor: canMove ? "pointer" : "default" }}
                >
                  {piece && (
                    <span
                      className="select-none leading-none"
                      style={{
                        fontSize: square * 0.72,
                        color: piece.color === "w" ? "rgb(255,251,240)" : "rgb(90,50,42)",
                        textShadow: piece.color === "w" ? "1px 1px 0 rgb(36,65,124)" : "none",
                      }}
                    >
                      {PIECE_GLYPH[piece.color + piece.type]}
                    </span>
                  )}
                  {dest &&
                    (isCapture ? (
                      <span className="absolute inset-0.5 rounded-md shadow-[inset_0_0_0_3px_rgba(207,132,40,0.85)]" />
                    ) : (
                      <span className="absolute size-[11px] rounded-full bg-[rgba(116,84,44,0.5)]" />
                    ))}
                </button>
              );
            }),
          )}
        </div>
      </div>

      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[20px] bg-[rgba(109,61,52,0.55)]">
          <div className="rounded-2xl bg-sv-cream p-4 text-center shadow-[inset_0_0_0_2px_rgb(206,219,236)]">
            <p className="mb-2 text-xs font-bold">{t("promote")}</p>
            <div className="flex gap-1.5">
              {PROMOTION_CHOICES.map((p) => (
                <button
                  key={p}
                  onClick={() => choosePromotion(p)}
                  aria-label={t(`piece.${p}`)}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-sv-gold text-3xl leading-none shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]"
                  style={{ color: game.turn() === "w" ? "rgb(255,251,240)" : "rgb(90,50,42)",
                           textShadow: game.turn() === "w" ? "1px 1px 0 rgb(36,65,124)" : "none" }}
                >
                  {PIECE_GLYPH[game.turn() + p]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
