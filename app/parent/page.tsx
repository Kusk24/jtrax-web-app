"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnnouncementModal } from "@/components/parent/AnnouncementModal";
import { AnnouncementCard } from "@/components/parent/AnnouncementCard";
import { ChildHomeCard } from "@/components/parent/ChildHomeCard";
import { TournamentBanner } from "@/components/public/TournamentBanner";
import { LiveTournamentCard } from "@/components/parent/LiveTournamentCard";
import type { AnnouncementV2 } from "@/lib/parent-v2-data";
import { homeAnnouncements } from "@/lib/home-announcements";
import { useParentData } from "@/components/parent/ParentData";
import { TapTip } from "@/components/parent/TapTip";
import { DAILY_PUZZLES } from "@/lib/today-activity";
import { ParentBell } from "@/components/parent/ParentNav2";


export default function ParentHomeV2() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const {
    announcements: announcementsV2, tournament,
    parent, isAnnRead, markAnnRead,
    children: childrenV2, todayActivity, lowCreditAt,
  } = useParentData();
  const [modalId, setModalId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  const modal = announcementsV2.find((a) => a.id === modalId);
  /* Recent only — the rest stay under View all. */
  const recent = homeAnnouncements(announcementsV2, new Date());
  const open = (a: AnnouncementV2) => {
    markAnnRead(a.id);
    setModalId(a.id);
  };

  /* The actual today — this used to be a fixed date in the message catalogue,
     ringing 10 May forever. th-TH gives the Buddhist year Thai readers use. */
  const todayLabel = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  return (
    <div className="grid content-start gap-8 md:grid-cols-2 md:gap-x-8">
      {/* The greeting reads like the console's dashboard header — left
          aligned, no colour band, with the bell on the same row. */}
      <div className="flex items-start justify-between gap-3 md:col-span-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">
            {t("hi", { name: parent.name.split(/\s+/)[0] || parent.name })}
          </h1>
          <span className="text-sm text-pp-muted">{todayLabel}</span>
        </div>
        <ParentBell />
      </div>

      {/* Announcements + tournament. One column now: announcements and
          tournaments are occasional, and a half-empty full-width block made
          the home read as "nothing is happening" — the children are what a
          parent opens this for, so they hold the other column. */}
      <div className="flex min-w-0 flex-col gap-3.5">
        {/* Only while there is something recent; the full list is on the
            Announcements page. */}
        {recent.length > 0 && (
          <>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
              {t("announcements")}
            </span>
            <Link href="/parent/announcements" className="text-xs font-bold text-pp-blue">
              {t("viewAll")} →
            </Link>
          </div>
          <div
            onScroll={(e) => {
              const el = e.currentTarget;
              setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
            }}
            className="flex w-full max-w-[520px] snap-x snap-mandatory gap-3 overflow-x-auto pb-0.5 [scrollbar-width:none]"
          >
            {recent.map((a) => (
              <AnnouncementCard
                key={a.id}
                a={a}
                unread={!isAnnRead(a.id)}
                onOpen={() => open(a)}
                className="w-full flex-none snap-start"
              />
            ))}
          </div>
          <div className="flex w-full max-w-[520px] justify-center gap-1.5 md:hidden">
            {recent.length > 1 && recent.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? "w-[18px] bg-pp-blue" : "w-1.5 bg-pp-soft"
                }`}
              />
            ))}
          </div>
          </>
        )}

        <LiveTournamentCard />

        {/* Only when an event is actually open — the mock card advertised the
            same tournament forever, whatever the academy was running. */}
        {tournament && (
          <>
            <span className="mt-2 text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
              {t("upcomingTournament")}
            </span>
            <div className="max-w-[520px] overflow-hidden rounded-2xl bg-pp-card shadow-[0_12px_32px_rgba(35,53,94,.12)]">
              <div className="relative">
                <TournamentBanner
                  name={tournament.name}
                  when={tournament.date}
                  venue={tournament.venue}
                  imageUrl={tournament.hasBanner ? `/api/tournaments/${tournament.id}/banner` : undefined}
                  className="h-[158px] w-full"
                />
                <div className="absolute right-4 top-2.5 flex size-16 flex-col items-center justify-center rounded-full border-[2.5px] border-white bg-pp-danger text-center text-white shadow-[0_6px_16px_rgba(0,0,0,.35)]">
                  {tournament.registration === "open" ? (
                    <>
                      <span className="text-[7.5px] font-bold uppercase leading-tight tracking-[.03em]">
                        {t("registerCloses")}
                      </span>
                      <span className="font-pp-display text-xl font-bold leading-none">
                        {tournament.closesInDays}
                      </span>
                      <span className="text-[8px] font-bold uppercase leading-none tracking-[.06em]">
                        {t("days")}
                      </span>
                    </>
                  ) : (
                    <span className="text-[9px] font-bold uppercase leading-tight tracking-[.04em]">
                      {t("registrationClosedShort")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 pb-4 pt-4">
                <span className="font-pp-display text-lg font-semibold leading-tight text-pp-ink">
                  {tournament.name}
                </span>
                <Link
                  href="/parent/tournament"
                  className="mt-1 rounded-xl bg-pp-navy py-3 text-center text-sm font-bold text-white"
                >
                  {t("registerNow")}
                </Link>
              </div>
            </div>
          </>
        )}
      </div>


      {/* The children, and what they did today — back from the previous
          design so the home answers something on the days the school has
          nothing to announce. */}
      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
            {t("myChildren", { count: childrenV2.length })}
          </span>
          <Link href="/parent/profile" className="text-xs font-bold text-pp-blue">
            {t("viewAll")} →
          </Link>
        </div>
        {/* Two to a row, even on a phone: a family with two children sees both at once. */}
        <div className="grid grid-cols-2 gap-2.5">
          {childrenV2.map((c) => (
            <ChildHomeCard key={c.key} child={c} lowCreditAt={lowCreditAt} />
          ))}
        </div>

        <span className="mt-2 text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
          {t("todaysActivity")}
        </span>
        <div className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-4">
          {todayActivity.length === 0 && (
            <span className="block py-3.5 text-[12.5px] text-pp-muted">{t("noPracticeToday")}</span>
          )}
          {todayActivity.map((r, i) => (
            <div
              key={r.child}
              className={`flex items-center gap-3 py-3.5 ${
                i < todayActivity.length - 1 ? "border-b border-pp-panel" : ""
              }`}
            >
              <TapTip tip={t("dailyPuzzlesDone", { count: r.daily })}>
                <PuzzleRing solved={r.daily} done={r.done} />
              </TapTip>
              <span className="flex-1 text-[13.5px] text-pp-ink">{r.child}</span>
              <TapTip tip={t("practiceTimeTip")}>
                <span className="text-[13px] font-semibold text-pp-muted">{t("minShort", { count: r.mins })}</span>
              </TapTip>
            </div>
          ))}
        </div>
      </div>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </div>
  );
}

/** A tiny donut of today's daily puzzles: a third per puzzle solved, full
    green once the whole set is done. */
function PuzzleRing({ solved, done }: { solved: number; done: boolean }) {
  const r = 8;
  const c = 2 * Math.PI * r;
  const share = solved / DAILY_PUZZLES;
  return (
    <svg viewBox="0 0 20 20" className="size-5 flex-none -rotate-90" aria-hidden="true">
      <circle cx="10" cy="10" r={r} fill="none" strokeWidth="3.5" className="stroke-pp-panel" />
      {solved > 0 && (
        <circle
          cx="10"
          cy="10"
          r={r}
          fill="none"
          strokeWidth="3.5"
          strokeDasharray={`${c * share} ${c}`}
          strokeLinecap={done ? "butt" : "round"}
          className="stroke-pp-green"
        />
      )}
    </svg>
  );
}
