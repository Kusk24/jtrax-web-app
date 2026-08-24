"use client";

/* "There is a tournament on right now" — the parent portal's pointer to the
   public results page. Renders nothing when there is nothing live, so the
   home screen carries no dead card between events. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Trophy, ChevronRight } from "lucide-react";
import { fetchLiveTournaments, type LiveTournament } from "@/lib/live-tournaments";

export function LiveTournamentCard() {
  const t = useTranslations("pv2");
  const [live, setLive] = useState<LiveTournament[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchLiveTournaments().then((list) => {
      if (!cancelled) setLive(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (live.length === 0) return null;
  return (
    <div className="flex max-w-[520px] flex-col gap-2">
      <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
        {t("liveTournaments")}
      </span>
      {live.map((e) => (
        <Link
          key={e.tournamentId}
          href={`/t/${e.tournamentId}`}
          className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-pp-card px-4 py-3 shadow-[0_8px_24px_rgba(35,53,94,.10)] transition-colors hover:bg-pp-mist"
        >
          <span className="flex size-9 flex-none items-center justify-center rounded-full bg-pp-green-soft text-pp-green">
            <Trophy className="size-[18px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-pp-ink">{e.name}</span>
            <span className="text-[11.5px] text-pp-muted">
              {e.status === "Ongoing" ? t("liveFollow") : t("liveUpcoming")}
            </span>
          </span>
          <ChevronRight className="size-4 flex-none text-pp-faint" />
        </Link>
      ))}
    </div>
  );
}
