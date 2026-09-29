"use client";

/**
 * The last three finished games on the Games tab, drawn with History's own
 * game row — the same card in both places — and the way into the full
 * history.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { getHistory, isFinishedGame, outcomeOf, type HistoryEntry } from "@/lib/progress";
import { Card } from "./kit";
import { GameRow } from "./HistoryRows";

export function RecentGames({ studentId }: { studentId: string }) {
  const t = useTranslations("sv3");
  const ts = useTranslations("st");
  const [games, setGames] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    let alive = true;
    getHistory(studentId)
      .then((h) => alive && setGames(h.filter(isFinishedGame).slice(0, 3)))
      .catch(() => alive && setGames([]));
    return () => {
      alive = false;
    };
  }, [studentId]);

  return (
    <section aria-labelledby="recent-games">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <h2 id="recent-games" className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">{t("recentGames")}</h2>
        <Link href="/student/history" className="flex items-center gap-0.5 text-[12px] font-semibold text-pp-blue hover:underline">
          {t("seeAllGames")}
          <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden />
        </Link>
      </div>
      <Card>
        {games === null ? (
          <p className="py-4 text-center text-[13px] text-pp-faint">{ts("loading")}</p>
        ) : games.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-pp-muted">{t("noGamesYet")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-pp-line">
            {games.map((g) => (
              <GameRow key={`${g.kind}-${g.id}`} game={g} outcome={outcomeOf(g.result, g.side)} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
