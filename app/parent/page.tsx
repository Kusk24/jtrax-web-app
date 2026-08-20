"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Bell, CheckSquare } from "lucide-react";
import { AnnouncementModal } from "@/components/parent/AnnouncementModal";
import { TournamentBanner } from "@/components/parent/TournamentBanner";
import { LiveTournamentCard } from "@/components/parent/LiveTournamentCard";
import { ParentAvatar } from "@/components/parent/ParentAvatar";
import { todayActivityV2, type AnnouncementV2, type SenderKind } from "@/lib/parent-v2-data";
import { useParentData } from "@/components/parent/ParentData";

const SENDER_STYLE: Record<SenderKind, { labelKey: string; c: string; bg: string }> = {
  teacher: { labelKey: "senderTeacher", c: "var(--color-pp-blue)", bg: "var(--color-pp-soft)" },
  branch: { labelKey: "senderBranch", c: "var(--color-pp-green)", bg: "var(--color-pp-green-soft)" },
  admin: { labelKey: "senderAdmin", c: "var(--color-pp-deep)", bg: "#efeefa" },
};

export default function ParentHomeV2() {
  const t = useTranslations("pv2");
  const { children: childrenV2, announcements: announcementsV2, tournament: tournamentV2 } = useParentData();
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [modalId, setModalId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  const modal = announcementsV2.find((a) => a.id === modalId);
  const open = (a: AnnouncementV2) => {
    setRead((p) => ({ ...p, [a.id]: true }));
    setModalId(a.id);
  };

  return (
    <div className="grid content-start gap-9 px-4 pb-8 pt-5 sm:px-5 md:grid-cols-2 md:gap-x-8">
      {/* Header band */}
      <div className="-mx-4 -mt-5 flex items-center justify-between gap-3 bg-pp-soft px-4 pb-4 pt-5 sm:-mx-5 sm:px-5 md:col-span-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-pp-display text-2xl font-semibold leading-tight">
              {t("hi", { name: "Sandy" })}
            </span>
            <span className="rounded-full border-[1.5px] border-pp-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.12em] text-pp-navy">
              {t("roleParent")}
            </span>
          </div>
          <span className="text-[13px] text-pp-muted">{t("todayDate")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/parent/notifications"
            aria-label={t("notificationsTitle")}
            className="relative flex size-[42px] flex-none items-center justify-center rounded-full border-[1.5px] border-pp-line bg-white hover:bg-pp-soft"
          >
            <Bell className="size-[19px] text-pp-ink" strokeWidth={1.8} />
            <span className="absolute right-2 top-2 size-[9px] rounded-full border-2 border-white bg-pp-red" />
          </Link>
          <Link
            href="/parent/profile"
            aria-label={t("myProfile")}
            className="size-[42px] flex-none overflow-hidden rounded-full shadow-[0_6px_16px_rgba(46,92,184,.35)]"
          >
            <ParentAvatar className="size-full text-lg" />
          </Link>
        </div>
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
                  {!read[a.id] && (
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

        <span className="mt-2 text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
          {t("upcomingTournament")}
        </span>
        <div className="max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(35,53,94,.12)]">
          <div className="relative">
            <TournamentBanner className="h-[158px] w-full" />
            <div className="absolute right-4 top-2.5 flex size-16 flex-col items-center justify-center rounded-full border-[2.5px] border-white bg-pp-danger text-center text-white shadow-[0_6px_16px_rgba(0,0,0,.35)]">
              <span className="text-[7.5px] font-bold uppercase leading-tight tracking-[.03em]">
                {t("registerCloses")}
              </span>
              <span className="font-pp-display text-xl font-bold leading-none">
                {tournamentV2.closesInDays}
              </span>
              <span className="text-[8px] font-bold uppercase leading-none tracking-[.06em]">
                {t("days")}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4 pb-4 pt-4">
            <span className="font-pp-display text-lg font-semibold leading-tight text-pp-ink">
              {tournamentV2.name}
            </span>
            <Link
              href="/parent/tournament"
              className="mt-1 rounded-xl bg-pp-navy py-3 text-center text-sm font-bold text-white"
            >
              {t("registerNow")}
            </Link>
          </div>
        </div>
      </div>

      {/* My children */}
      <div className="flex flex-col gap-4">
        <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
          {t("myChildren", { count: childrenV2.length })}
        </span>
        <div className="grid grid-cols-2 gap-4">
          {childrenV2.map((c) => {
            const low = c.credits <= 2;
            const isBeg = c.level === "Beginner";
            return (
              <Link
                key={c.key}
                href={`/parent/child/${c.key}`}
                className="flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-pp-line text-left"
                style={{
                  background: isBeg
                    ? "linear-gradient(160deg,#EAF7EF 0%,#ffffff 65%)"
                    : "#ffffff",
                }}
              >
                <div
                  aria-label={c.name}
                  className="aspect-[1.3] w-full bg-cover bg-center"
                  style={{ backgroundColor: c.avBg, backgroundImage: `url('${c.photo}')` }}
                />
                <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-semibold text-pp-ink">{c.name}</span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9.5px] font-bold"
                      style={{
                        color: isBeg ? "var(--color-pp-green)" : "var(--color-pp-amber)",
                        background: isBeg ? "var(--color-pp-green-soft)" : "#F0E6DC",
                      }}
                    >
                      {c.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <CheckSquare className="size-4 flex-none text-pp-muted" strokeWidth={1.8} />
                    <span className="text-xs font-semibold text-pp-ink">
                      {t("completedClasses", {
                        label: `${c.completedSessions} / ${c.totalSessions}`,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pt-0.5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#dbe6f7]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((c.credits / 20) * 100)}%`,
                          background: low ? "var(--color-pp-amber)" : "var(--color-pp-blue)",
                        }}
                      />
                    </div>
                    <span className="text-[10.5px] text-pp-muted">
                      {t("creditsLeftLabel", { count: c.credits })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today's activity */}
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center gap-2">
          <Image src="/shared/fish.png" alt="" width={16} height={16} />
          <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
            {t("todaysActivity")}
          </span>
        </div>
        <div className="flex flex-col">
          <div className="mr-5 flex items-center gap-2.5 px-0.5 pb-2">
            <span className="flex-1" />
            <span className="w-14 text-right text-[10px] font-bold uppercase tracking-[.06em] text-pp-faint">
              {t("practice")}
            </span>
            <span className="w-14 text-right text-[10px] font-bold uppercase tracking-[.06em] text-pp-faint">
              {t("challenge")}
            </span>
          </div>
          {todayActivityV2.map((r, i) => {
            const pct = Math.max(4, Math.min(100, Math.round((r.mins / 30) * 100)));
            const circ = 2 * Math.PI * 8.5;
            return (
              <div
                key={r.child}
                className={`flex items-center gap-5 px-0.5 py-3.5 ${
                  i < todayActivityV2.length - 1 ? "border-b border-[#EEF1F7]" : ""
                }`}
              >
                <span className="relative flex size-5 flex-none items-center justify-center rounded-full">
                  {r.done ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-pp-green text-[11px] font-bold text-white">
                      ✓
                    </span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" className="absolute inset-0 -rotate-90">
                        <circle cx="10" cy="10" r="8.5" fill="none" stroke="#F3E6D8" strokeWidth="3" />
                        <circle
                          cx="10"
                          cy="10"
                          r="8.5"
                          fill="none"
                          stroke="var(--color-pp-amber)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${((circ * pct) / 100).toFixed(1)} ${circ.toFixed(1)}`}
                        />
                      </svg>
                      <Image src="/shared/fish.png" alt="" width={9} height={9} className="relative" />
                    </>
                  )}
                </span>
                <span className="flex-1 text-[13.5px] text-pp-ink">{r.child}</span>
                <span className="w-14 text-right text-[13px] font-semibold text-pp-muted">
                  {t("minShort", { count: r.mins })}
                </span>
                <span className="flex w-14 items-center justify-end gap-1 text-[13px] font-bold text-pp-blue">
                  +{Math.max(1, Math.round(r.mins / 10))}
                  <Image src="/shared/fish.png" alt="" width={15} height={15} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </div>
  );
}
