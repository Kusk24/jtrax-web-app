"use client";

/* What happened, said once, in front of the board rather than under it.
 *
 * The result used to be a line in a panel below the move list — the same panel
 * that says "Your move" and "Thinking…" the rest of the game. A child who had
 * just been checkmated saw the board stop responding and a sentence scroll past
 * in a place they had learned to ignore. Every chess app people already use
 * puts this in front of the board, because finishing a game is an event and not
 * a status.
 *
 * Two ways out and no more: play again, or go back and look at the position.
 * Deliberately not a "review" or a share — neither exists here, and a dialog
 * full of buttons that do nothing is worse than the line it replaced.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus, X } from "lucide-react";
import { playSound } from "@/lib/sound";
import { actionBtn } from "./PlayShell";

export function ResultDialog({
  title,
  detail,
  primaryLabel,
  onPrimary,
  onClose,
  outcome,
  facts,
}: {
  title: string;
  /** How it ended — "checkmate", "stalemate". Absent when the game was stopped
      rather than finished. */
  detail?: string;
  /** What "play again" means here. Against the computer it starts a new game;
      in a class game there is nothing to restart — a teacher opens those — so
      it goes back to the Play screen instead. */
  primaryLabel: string;
  onPrimary: () => void;
  onClose: () => void;
  /** The pupil's result, for the mark above the title. */
  outcome?: "win" | "loss" | "draw" | null;
  /** What the game was: opponent, side, time control, when. */
  facts?: { label: string; value: ReactNode }[];
}) {
  const t = useTranslations("play");
  const first = useRef<HTMLButtonElement>(null);

  /* The game-over chime, once, when the result appears. A beat after the
     final move's own sound rather than on top of it, which is the order a
     player expects: the move lands, then the game ends. */
  useEffect(() => {
    const later = setTimeout(() => playSound("game-end"), 250);
    return () => clearTimeout(later);
  }, []);

  useEffect(() => {
    /* Moving focus into the dialog is what makes Escape work and what stops a
       keyboard landing on the board behind it. */
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,38,77,0.55)] px-6"
      /* The backdrop dismisses, which is what everyone tries first. The panel
         stops the click so a tap inside does not close it. */
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        onClick={(e) => e.stopPropagation()}
        className="st-enter w-full max-w-[360px] rounded-2xl bg-pp-card p-[18px] text-center shadow-[0_24px_60px_rgba(20,33,58,.28)]"
      >
        {outcome && (
          <span
            className={`st-badge-reveal mx-auto mb-3 flex size-14 items-center justify-center rounded-full ${
              outcome === "win" ? "bg-pp-green-soft text-pp-green" : outcome === "loss" ? "bg-pp-red-soft text-pp-red" : "bg-pp-neutral text-pp-muted"
            }`}
            aria-hidden
          >
            {outcome === "win" ? <Check className="size-7" strokeWidth={2.6} /> : outcome === "loss" ? <X className="size-7" strokeWidth={2.6} /> : <Minus className="size-7" strokeWidth={2.6} />}
          </span>
        )}
        <h2 id="result-title" className="font-pp-display text-[23px] font-bold text-pp-ink">
          {title}
        </h2>
        {detail && <p className="mt-1.5 text-[13px] text-pp-muted">{detail}</p>}

        {facts && facts.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-xl bg-pp-bg p-3 text-left">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0">
                <dt className="text-[11.5px] text-pp-muted">{f.label}</dt>
                <dd className="truncate text-[13.5px] font-semibold text-pp-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <button
          ref={first}
          type="button"
          onClick={onPrimary}
          className={`${actionBtn} mt-5 min-h-11 w-full py-3 text-sm`}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 min-h-11 w-full cursor-pointer rounded-full border border-pp-line bg-pp-card text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft"
        >
          {t("viewBoard")}
        </button>
      </div>
    </div>
  );
}
