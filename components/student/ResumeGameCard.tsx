"use client";

/**
 * Home's reminder of a robot game left unfinished: who it is against and how
 * far it got, one tap back to the board, and a ✕ to drop it instead. Draws
 * nothing when there is none.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bot, Play, X } from "lucide-react";
import { clearSavedAiGame, loadSavedAiGame, type SavedAiGame } from "@/lib/saved-ai-game";

export function ResumeGameCard() {
  const t3 = useTranslations("sv3");
  const [kept, setKept] = useState<SavedAiGame | null>(null);

  /* Read after the first paint: the server has no idea what this browser kept. */
  useEffect(() => {
    const id = setTimeout(() => setKept(loadSavedAiGame()), 0);
    return () => clearTimeout(id);
  }, []);

  if (!kept) return null;
  return (
    <div className="flex items-center rounded-xl border-[1.5px] border-pp-soft bg-pp-soft transition-colors hover:bg-pp-soft">
      <Link
        href={`/student/play/ai?opponent=${kept.opponent}`}
        className="group flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pp-card text-pp-blue" aria-hidden>
          <Bot className="size-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-pp-ink">{t3("resumeGame")}</span>
          <span className="block truncate text-[11.5px] text-pp-blue">
            {t3(`robotName.${kept.opponent}`)} · {t3("moveN", { n: Math.ceil(kept.moves.length / 2) })}
          </span>
        </span>
        {/* Resume, as a filled play button. */}
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pp-blue text-white shadow-sm transition-transform group-hover:scale-105"
          title={t3("resume")}
        >
          <Play className="ml-0.5 size-3.5 fill-current" strokeWidth={0} aria-hidden />
          <span className="sr-only">{t3("resume")}</span>
        </span>
      </Link>
      {/* Not interested: the unfinished game is dropped, nothing recorded. */}
      <button
        type="button"
        onClick={() => {
          clearSavedAiGame();
          setKept(null);
        }}
        aria-label={t3("dismissGame")}
        title={t3("dismissGame")}
        className="ml-2 mr-3 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-pp-red bg-pp-card text-pp-red transition-colors hover:border-pp-red hover:bg-pp-red-soft hover:text-pp-red"
      >
        <X className="size-3.5" strokeWidth={2.6} />
      </button>
    </div>
  );
}
