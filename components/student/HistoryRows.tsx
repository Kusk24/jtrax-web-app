"use client";

/* One game and one daily challenge, as a row — shared by Home's recent
   activity and the History page, so the two describe the same game the same
   way. */
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bot, Check, ChessKnight, ChevronDown, ChevronRight, DoorOpen, Minus, Puzzle, X } from "lucide-react";
import type { ChallengeDay, HistoryEntry } from "@/lib/progress";
import { FriendPawns } from "./FriendPawns";

/** A UTC stamp from the server ("2026-09-28 08:30:00") as a Date. */
export function stampDate(at: string): Date {
  return new Date(at.includes("T") ? at : at.replace(" ", "T") + "Z");
}

export function useWhen() {
  const locale = useLocale();
  const date = (d: Date) => d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  const time = (d: Date) => d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return { date, time, day: (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }) };
}

const OUTCOME = {
  win: { cls: "bg-pp-green-soft text-pp-green", icon: Check },
  loss: { cls: "bg-pp-red-soft text-pp-red", icon: X },
  draw: { cls: "bg-pp-neutral text-pp-muted", icon: Minus },
} as const;

export function OutcomeChip({ outcome }: { outcome: "win" | "loss" | "draw" }) {
  const t = useTranslations("st");
  const { cls, icon: Icon } = OUTCOME[outcome];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${cls}`}>
      <Icon className="size-3.5" strokeWidth={2.6} aria-hidden />
      {t(`outcome.${outcome}`)}
    </span>
  );
}

/* Each kind of game keeps the icon it has on the Games page. */
const GAME_KIND = {
  computer: { tile: "bg-pp-soft text-pp-blue", icon: <Bot className="size-5" strokeWidth={2} /> },
  challenge: { tile: "bg-st-orange-soft", icon: <FriendPawns size="size-5" /> },
  class: { tile: "bg-pp-green-soft text-pp-green", icon: <DoorOpen className="size-5" strokeWidth={2} /> },
} as const;

/** A finished game, plainly: who it was with, when, the result, and View. */
export function GameRow({
  game,
  outcome,
  compact = false,
}: {
  game: HistoryEntry;
  outcome: "win" | "loss" | "draw" | null;
  compact?: boolean;
}) {
  const t3 = useTranslations("sv3");
  const when = useWhen();
  const at = stampDate(game.at);
  const kind = GAME_KIND[game.gameType ?? "class"];
  const opponent = game.gameType === "computer" ? t3(`robotName.${game.opponent ?? "novice"}`) : game.opponent || "—";
  const href = `/student/history/game?kind=${game.kind}&id=${encodeURIComponent(game.id)}`;

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${kind.tile}`} aria-hidden>
        {kind.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-pp-ink">
          {t3("playWith")} <span className="font-bold text-pp-blue">{opponent}</span>
        </p>
        <p className="mt-0.5 text-[12px] text-pp-muted">
          {when.date(at)} · {when.time(at)}
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-2.5">
        {outcome && <OutcomeChip outcome={outcome} />}
        {!compact && (
          <Link href={href} className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-pp-ink hover:text-pp-blue hover:underline">
            {t3("view")}
            <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden />
          </Link>
        )}
      </span>
    </li>
  );
}

/** One day's daily challenge; on the History page it opens to show the day's puzzles. */
export function ChallengeRow({
  day,
  puzzles,
  today,
  compact = false,
}: {
  day: ChallengeDay;
  puzzles?: HistoryEntry[];
  today?: string;
  compact?: boolean;
}) {
  const t = useTranslations("st");
  const when = useWhen();
  const [open, setOpen] = useState(false);
  const isToday = today === day.date;
  const status = day.complete ? "complete" : isToday ? "inProgress" : "missed";
  const chip =
    status === "complete"
      ? "bg-pp-green-soft text-pp-green"
      : status === "inProgress"
        ? "bg-st-gold-soft text-st-gold"
        : "bg-pp-neutral text-pp-muted";

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${day.complete ? "bg-pp-green-soft text-pp-green" : "bg-st-gold-soft text-st-gold"}`}
          aria-hidden
        >
          {day.complete ? <Check className="size-5" strokeWidth={2.6} /> : <Puzzle className="size-5" strokeWidth={2} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14.5px] font-semibold text-pp-ink">{t("dailyChallengeOn", { date: when.day(day.date) })}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${chip}`}>{t(`challengeStatus.${status}`)}</span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-pp-muted">{t("puzzlesOf", { n: day.solved, total: day.total })}</p>
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {!compact &&
            (isToday && !day.complete ? (
              <Link href="/student?screen=puzzles" className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-pp-ink hover:text-pp-blue hover:underline">
                {t("continueChallenge")}
                <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="inline-flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-[12.5px] font-semibold text-pp-ink hover:text-pp-blue hover:underline"
              >
                {t("viewChallenge")}
                <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.4} aria-hidden />
              </button>
            ))}
        </span>
      </div>
      {open && (
        <ul className="st-enter mt-3 grid gap-2 pl-[52px] sm:grid-cols-3">
          {(puzzles ?? []).map((pz, i) => (
            <li key={pz.id} className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-pp-line bg-pp-bg px-3 py-2">
              <ChessKnight className="size-4 shrink-0 text-pp-blue" strokeWidth={2} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-pp-ink">{t("puzzleN", { n: i + 1 })}</span>
                <span className="block text-[11.5px] text-pp-muted">{t("rated", { n: pz.against })}</span>
              </span>
              {pz.result === "solved" ? (
                <Check className="size-4 text-pp-green" strokeWidth={3} aria-label={t("solved")} />
              ) : (
                <X className="size-4 text-pp-faint" strokeWidth={3} aria-label={t("notSolved")} />
              )}
            </li>
          ))}
          {(puzzles ?? []).length === 0 && <li className="text-[12.5px] text-pp-muted">{t("noPuzzleDetail")}</li>}
        </ul>
      )}
    </li>
  );
}
