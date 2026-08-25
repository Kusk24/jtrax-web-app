"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnnouncementModal } from "@/components/parent/AnnouncementModal";
import { TournamentBanner } from "@/components/parent/TournamentBanner";
import { LiveTournamentCard } from "@/components/parent/LiveTournamentCard";
import type { AnnouncementV2, SenderKind } from "@/lib/parent-v2-data";
import { useParentData } from "@/components/parent/ParentData";

const SENDER_STYLE: Record<SenderKind, { labelKey: string; c: string; bg: string }> = {
  teacher: { labelKey: "senderTeacher", c: "var(--color-pp-blue)", bg: "var(--color-pp-soft)" },
  branch: { labelKey: "senderBranch", c: "var(--color-pp-green)", bg: "var(--color-pp-green-soft)" },
  admin: { labelKey: "senderAdmin", c: "var(--color-pp-deep)", bg: "var(--color-pp-plum-soft)" },
};

export default function ParentHomeV2() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const {
    announcements: announcementsV2, tournament,
    parent, isAnnRead, markAnnRead,
  } = useParentData();
  const [modalId, setModalId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  const modal = announcementsV2.find((a) => a.id === modalId);
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
          aligned, no colour band. The bell and the avatar that used to sit
          here are in the shell's top bar now; keeping them meant two profile
          buttons in the same corner. */}
      <div className="flex flex-col gap-1 md:col-span-2">
        <div className="flex items-center gap-2">
          <h1 className="m-0 font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">
            {t("hi", { name: parent.name.split(/\s+/)[0] || parent.name })}
          </h1>
          <span className="rounded-full border-[1.5px] border-pp-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.12em] text-pp-blue">
            {t("roleParent")}
          </span>
        </div>
        <span className="text-sm text-pp-muted">{todayLabel}</span>
      </div>

      {/* Announcements + tournament */}
      <div className="flex min-w-0 flex-col gap-3.5 md:col-span-2">
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
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-0.5 [scrollbar-width:none]"
        >
          {announcementsV2.map((a) => {
            const ss = SENDER_STYLE[a.sender];
            return (
              <button
                key={a.id}
                onClick={() => open(a)}
                style={{ background: ss.bg }}
                className="flex w-full max-w-full flex-none snap-start cursor-pointer flex-col gap-1.5 rounded-xl p-4 text-left shadow-[0_6px_16px_rgba(35,53,94,.08)] md:max-w-[420px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 text-sm font-bold leading-snug text-pp-ink">
                    {a.title}
                  </span>
                  {!isAnnRead(a.id) && (
                    <span className="flex-none rounded-full bg-pp-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.06em] text-white">
                      {t("new")}
                    </span>
                  )}
                </div>
                <span className="line-clamp-2 text-xs leading-relaxed text-pp-sub">{a.msg}</span>
                <div className="flex items-center justify-between gap-2">
                  <span style={{ color: ss.c }} className="text-[11px] font-semibold">
                    {a.senderName}
                  </span>
                  <span className="text-[10.5px] text-pp-muted">{a.time}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-center gap-1.5 md:hidden">
          {announcementsV2.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-[18px] bg-pp-blue" : "w-1.5 bg-pp-soft"
              }`}
            />
          ))}
        </div>

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
                <TournamentBanner className="h-[158px] w-full" />
                <div className="absolute right-4 top-2.5 flex size-16 flex-col items-center justify-center rounded-full border-[2.5px] border-white bg-pp-danger text-center text-white shadow-[0_6px_16px_rgba(0,0,0,.35)]">
                  <span className="text-[7.5px] font-bold uppercase leading-tight tracking-[.03em]">
                    {t("registerCloses")}
                  </span>
                  <span className="font-pp-display text-xl font-bold leading-none">
                    {tournament.closesInDays}
                  </span>
                  <span className="text-[8px] font-bold uppercase leading-none tracking-[.06em]">
                    {t("days")}
                  </span>
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


      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </div>
  );
}
