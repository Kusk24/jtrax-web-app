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
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { actionBtn } from "./PlayShell";

export function ResultDialog({
  title,
  detail,
  primaryLabel,
  onPrimary,
  onClose,
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
}) {
  const t = useTranslations("play");
  const first = useRef<HTMLButtonElement>(null);

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
        className="w-full max-w-[320px] rounded-[22px] bg-white p-5 text-center shadow-[0_20px_50px_rgba(16,38,77,.35)]"
      >
        <h2 id="result-title" className="font-sv-display text-[22px] font-bold text-[#10264d]">
          {title}
        </h2>
        {detail && <p className="mt-1.5 text-[12.5px] text-[#7083a3]">{detail}</p>}

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
          className="mt-2 min-h-11 w-full cursor-pointer rounded-[20px] border-none bg-transparent text-[13px] font-bold text-[#60779c]"
        >
          {t("viewBoard")}
        </button>
      </div>
    </div>
  );
}
