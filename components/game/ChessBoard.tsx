"use client";

/* The board every mode draws on — against the computer, against a friend, and
   the admin replay. It renders a position and reports the move a player tried;
   it owns no game state, so the same component serves a live game and a
   finished one being stepped through.

   Styling follows the puzzle board already in StudentGame: pale-blue tray,
   white mat, unicode glyphs. */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  isPromotion,
  movesFrom,
  pieceSrc,
  squareName,
  squareToRC,
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
  /** The last move, as a full UCI pair (`e2e4`). Both of its squares are
      highlighted and the arriving piece slides in from the first, so a move
      that appeared out of nowhere can now be seen happening. */
  lastMove?: string;
  size?: number;
};

const PROMOTION_CHOICES = ["q", "r", "b", "n"] as const;

/** Long enough to read as a move rather than a repaint, short enough that a
    child waiting for their turn is not waiting on an animation. */
const SLIDE_MS = 320;


export function ChessBoard({ game, orientation, canMove, onMove, lastMove, size = 328 }: Props) {
  const t = useTranslations("play");
  const [from, setFrom] = useState<string | null>(null);
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null);

  const grid: BoardGrid = toGrid(game);
  const legal = from ? movesFrom(game, from) : [];
  const square = size / 8;

  /* The arriving piece is drawn at the square it came *from* for one frame,
     then released to its real place — so the browser animates the gap rather
     than us moving anything. Two `requestAnimationFrame`s because one is not
     enough: the offset has to be painted before the transition is allowed, or
     the browser coalesces both into a single style and nothing moves. */
  const [slide, setSlide] = useState<{ to: string; dx: number; dy: number } | null>(null);
  useEffect(() => {
    if (!lastMove || lastMove.length < 4) {
      setSlide(null);
      return;
    }
    const [fr, fc] = squareToRC(lastMove.slice(0, 2));
    const [tr, tc] = squareToRC(lastMove.slice(2, 4));
    // A board turned round for Black moves pieces the other way on screen.
    const facing = orientation === "w" ? 1 : -1;
    setSlide({ to: lastMove.slice(2, 4), dx: (fc - tc) * square * facing, dy: (fr - tr) * square * facing });
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setSlide(null));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [lastMove, square, orientation]);

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
      <div className="rounded-[14px] bg-sv-cream p-2 shadow-[inset_0_0_0_1px_rgb(206,219,236)]">
        <div
          className="grid overflow-hidden rounded-lg shadow-[0_0_0_2px_rgb(70,96,140)]"
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
              /* Both ends of it. Highlighting only where the piece landed left
                 a child working out where it had come from. */
              const wasLast =
                !!lastMove && (lastMove.slice(0, 2) === name || lastMove.slice(2, 4) === name);
              const sliding = slide?.to === name;
              const bg = isFrom
                ? "rgb(220,232,248)"
                : wasLast
                  ? "var(--color-sv-board-last)"
                  : (r + c) % 2 === 0
                    ? "var(--color-sv-board-light)"
                    : "var(--color-sv-board-dark)";
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
                    /* eslint-disable-next-line @next/next/no-img-element --
                       a board redraws these every move and next/image adds a
                       loader round-trip per square for no benefit on a 45px
                       inline SVG. */
                    <img
                      src={pieceSrc(piece.color, piece.type)}
                      alt=""
                      draggable={false}
                      className="pointer-events-none select-none motion-reduce:!transition-none"
                      style={{
                        width: square * 0.86,
                        height: square * 0.86,
                        /* While sliding it sits where it came from with no
                           transition; the frame after, it is released. */
                        transform: sliding ? `translate(${slide.dx}px, ${slide.dy}px)` : undefined,
                        transition: sliding ? "none" : `transform ${SLIDE_MS}ms ease-out`,
                        /* Above the neighbouring squares it crosses. */
                        zIndex: sliding ? 2 : undefined,
                        position: "relative",
                      }}
                    />
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
                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-sv-gold shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pieceSrc(game.turn(), p)} alt="" className="size-8" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
