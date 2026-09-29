"use client";

/* History: Games | Challenges.
 *
 * Two lists of meaningful chess, not a feed of every click. A game says who,
 * which side, how it ended and what it earned; a daily challenge says the day,
 * whether it was finished, and opens to show its three puzzles. */
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, CalendarCheck, ChessKnight } from "lucide-react";
import { ResultFilter } from "@/components/student/ResultFilter";
import { getHistory, isFinishedGame, outcomeOf, type HistoryEntry } from "@/lib/progress";
import { Card, EmptyState, primaryPill } from "@/components/student/kit";
import { ChallengeRow, GameRow } from "@/components/student/HistoryRows";
import { useStudentData } from "@/components/student/useStudentData";

type Tab = "games" | "challenges";
type Filter = "all" | "win" | "loss" | "draw";

/** The academy's calendar day, as the server writes it. */
function academyToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export function HistoryScreen() {
  const t = useTranslations("st");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "challenges" ? "challenges" : "games";
  const data = useStudentData();
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const today = academyToday();

  useEffect(() => {
    if (!data.studentId) return;
    let alive = true;
    getHistory(data.studentId)
      .then((h) => alive && setHistory(h))
      .catch(() => alive && setHistory([]));
    return () => {
      alive = false;
    };
  }, [data.studentId]);

  const games = useMemo(
    () => (history ?? []).filter(isFinishedGame).map((g) => ({ g, outcome: outcomeOf(g.result, g.side) })),
    [history],
  );
  const shown = filter === "all" ? games : games.filter((x) => x.outcome === filter);
  const dailyByDay = useMemo(() => {
    const m = new Map<string, HistoryEntry[]>();
    for (const e of history ?? []) {
      if (e.kind === "puzzle" && e.source === "daily") m.set(e.day, [...(m.get(e.day) ?? []), e]);
    }
    return m;
  }, [history]);
  const p = data.progress;

  const setTab = (next: Tab) => router.replace(next === "games" ? "/student/history" : "/student/history?tab=challenges", { scroll: false });

  return (
    <div className="st-enter flex flex-col gap-5">
      {/* History belongs to Games: back always goes there. */}
      <header className="flex items-center gap-2.5 px-0.5">
        <button
          type="button"
          onClick={() => router.push("/student/play")}
          aria-label={tc("back")}
          className="flex size-[38px] flex-none cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-pp-line bg-pp-card text-pp-ink hover:bg-pp-soft"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">{t("history")}</h1>
          <p className="mt-1 truncate text-sm text-pp-muted">{t("historySub")}</p>
        </div>
      </header>

      {/* The tabs, and on the Games tab the result filter beside them — one
          row, not a row of its own for one icon. */}
      <div className="flex items-center gap-2">
        <div className="flex w-full max-w-[420px] gap-1.5 rounded-full bg-pp-soft p-1" role="tablist" aria-label={t("history")}>
          {(["games", "challenges"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-none text-[14px] font-semibold transition-colors ${
                tab === k ? "bg-pp-card text-pp-blue shadow-[0_2px_8px_rgba(35,53,94,.10)]" : "bg-transparent text-pp-muted hover:text-pp-ink"
              }`}
            >
              {k === "games" ? <ChessKnight className="size-4" aria-hidden /> : <CalendarCheck className="size-4" aria-hidden />}
              {t(k === "games" ? "tabGames" : "tabChallenges")}
            </button>
          ))}
        </div>
        {tab === "games" && (
          <div className="ml-auto shrink-0">
            <ResultFilter
              value={filter}
              onChange={setFilter}
              label={t("filterResults")}
              labels={{ all: t("all"), win: t("outcome.win"), loss: t("outcome.loss"), draw: t("outcome.draw") }}
            />
          </div>
        )}
      </div>

      {tab === "games" ? (
        <>
          <Card>
            {history === null ? (
              <p className="py-8 text-center text-[13px] text-pp-muted">{t("loading")}</p>
            ) : shown.length === 0 ? (
              <EmptyState
                icon={ChessKnight}
                title={t("noGames")}
                body={t("noGamesBody")}
                action={
                  <button type="button" onClick={() => router.push("/student/play")} className={primaryPill}>
                    {t("goPlay")}
                  </button>
                }
              />
            ) : (
              <ul className="flex flex-col divide-y divide-pp-line">
                {shown.map(({ g, outcome }) => (
                  <GameRow key={`${g.kind}-${g.id}`} game={g} outcome={outcome} />
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card>
            {p === null ? (
              <p className="py-8 text-center text-[13px] text-pp-muted">{t("loading")}</p>
            ) : p.challenges.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title={t("noChallenges")}
                body={t("noChallengesBody")}
                action={
                  <button type="button" onClick={() => router.push("/student?screen=puzzles")} className={primaryPill}>
                    {t("startChallenge")}
                  </button>
                }
              />
            ) : (
              <ul className="flex flex-col divide-y divide-pp-line">
                {p.challenges.map((c) => (
                  <ChallengeRow key={c.date} day={c} puzzles={dailyByDay.get(c.date)} today={today} />
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
