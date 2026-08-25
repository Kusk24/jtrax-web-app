"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { CURRENT, type ChildKey } from "@/lib/parent-v2-data";
import { useParentData } from "@/components/parent/ParentData";
import { ParentPageHeader } from "@/components/parent/ParentPageHeader";

const WD_KEYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export default function ParentAttendanceV2() {
  const t = useTranslations("pv2");
  const { children: childrenV2, att: ATT, hist: histV2, months, todayActivity } = useParentData();
  const [filter, setFilter] = useState<"all" | ChildKey>("all");
  const [month, setMonth] = useState(CURRENT);

  const M = months[month];
  const todayDate = new Date().getDate();
  const cells: { label: string; present: boolean; today: boolean }[] = [];
  for (let i = 0; i < M.offset; i++) cells.push({ label: "", present: false, today: false });
  for (let d = 1; d <= M.days; d++) {
    const keys: ChildKey[] = filter === "all" ? childrenV2.map((c) => c.key) : [filter];
    const present = keys.some((k) => (ATT[k]?.[month] ?? { present: [] }).present.includes(d));
    cells.push({ label: String(d), present, today: month === CURRENT && d === todayDate });
  }

  const groups: { date: string; items: typeof histV2 }[] = [];
  histV2
    .filter((h) => filter === "all" || h.child === filter)
    .forEach((h) => {
      let g = groups.find((x) => x.date === h.date);
      if (!g) {
        g = { date: h.date, items: [] };
        groups.push(g);
      }
      g.items.push(h);
    });

  const chips: { k: "all" | ChildKey; label: string }[] = [
    { k: "all", label: t("all") },
    ...childrenV2.map((c) => ({ k: c.key, label: c.name })),
  ];

  return (
    <div className="grid content-start gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start lg:gap-x-6">
      <div className="lg:col-span-2">
        <ParentPageHeader title={t("navChildren")} sub={t("childrenSub")} />
      </div>

      {/* The three views of a child that belong together: who they are, what
          they did today, and the record of every session. Two of these used to
          be on Home, above the announcements a parent reads once. */}
      <div className="flex flex-col gap-6 lg:col-span-2 lg:flex-row lg:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
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
                ? "linear-gradient(160deg,var(--color-pp-green-soft) 0%,var(--color-pp-card) 65%)"
                : "var(--color-pp-card)",
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
                    background: isBeg ? "var(--color-pp-green-soft)" : "var(--color-pp-amber-soft)",
                  }}
                >
                  {c.level}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <CheckSquare className="size-4 flex-none text-pp-muted" strokeWidth={1.8} />
                <span className="text-xs font-semibold text-pp-ink">
                  {t("completedClasses", {
                    label: `${c.attended} / ${c.heldSessions}`,
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-0.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-pp-bar-track">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${c.creditsBought > 0 ? Math.min(100, Math.round((c.credits / c.creditsBought) * 100)) : 0}%`,
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

        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
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
      {todayActivity.length === 0 && (
        <span className="px-0.5 py-3 text-[12.5px] text-pp-muted">{t("noPracticeToday")}</span>
      )}
      {todayActivity.map((r, i) => {
        const pct = Math.max(4, Math.min(100, Math.round((r.mins / 30) * 100)));
        const circ = 2 * Math.PI * 8.5;
        return (
          <div
            key={r.child}
            className={`flex items-center gap-5 px-0.5 py-3.5 ${
              i < todayActivity.length - 1 ? "border-b border-pp-neutral" : ""
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
                    <circle cx="10" cy="10" r="8.5" fill="none" stroke="var(--color-pp-track)" strokeWidth="3" />
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
        </div>
      </div>

      <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub lg:col-span-2">
        {t("attHistory")}
      </span>

      {/* Calendar keeps a phone-card width everywhere — full-bleed cells turn into giant circles. */}
      <div className="flex w-full max-w-[440px] flex-col gap-3 place-self-center rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)] lg:place-self-auto">
        <div className="flex items-center justify-between px-0.5">
          <button
            onClick={() => setMonth((m) => Math.max(0, m - 1))}
            className="size-[30px] cursor-pointer rounded-[10px] border-[1.5px] border-pp-line bg-pp-card text-sm text-pp-blue hover:bg-pp-soft"
          >
            ‹
          </button>
          <span className="font-pp-display text-[17px] font-semibold">{M.name}</span>
          <button
            onClick={() => setMonth((m) => Math.min(months.length - 1, m + 1))}
            className="size-[30px] cursor-pointer rounded-[10px] border-[1.5px] border-pp-line bg-pp-card text-sm text-pp-blue hover:bg-pp-soft"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WD_KEYS.map((d) => (
            <span key={d} className="py-1 text-center text-[10px] font-bold text-pp-faint">
              {d}
            </span>
          ))}
          {cells.map((c, i) => (
            <span
              key={i}
              className="flex aspect-square items-center justify-center rounded-full text-[12.5px]"
              style={{
                background: c.present ? "var(--color-pp-green-dot)" : "transparent",
                color: c.present ? "#fbfff1" : "var(--color-pp-ink)",
                fontWeight: c.present || c.today ? 700 : 400,
                border: c.today && !c.present ? "1.5px solid var(--color-pp-blue)" : "none",
              }}
            >
              {c.label}
            </span>
          ))}
        </div>
        <div className="flex justify-center gap-3.5 pt-0.5 text-[10.5px] text-pp-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-[9px] rounded-full bg-pp-green-dot" />
            {t("present")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-[9px] rounded-full border-[1.5px] border-pp-blue" />
            {t("today")}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {chips.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className="cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-xs font-bold"
            style={{
              background: filter === f.k ? "var(--color-pp-deep)" : "var(--color-pp-card)",
              color: filter === f.k ? "#fbfff1" : "var(--color-pp-muted)",
              borderColor: filter === f.k ? "var(--color-pp-deep)" : "var(--color-pp-line)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <div key={g.date} className="flex flex-col gap-2.5">
          <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
            {g.date}
          </span>
          {g.items.map((h, i) => {
            const c = childrenV2.find((x) => x.key === h.child)!;
            return (
              <Link
                key={i}
                href={`/parent/child/${c.key}`}
                className="flex w-full items-center gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4 text-left hover:bg-pp-mist"
              >
                <span
                  aria-label={c.name}
                  className="size-[42px] flex-none rounded-full bg-cover bg-center"
                  style={{ backgroundColor: c.avBg, backgroundImage: `url('${c.photo}')` }}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold">
                    {c.name} · ♟ {h.cls}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-pp-muted">
                    <span>◷ {h.time}</span>
                    {/* This slot used to show a branch name the backend does
                        not record; whether the child was there is what the
                        row actually knows. */}
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.06em]"
                      style={{
                        background: h.status === "Present" ? "var(--color-pp-green-soft)" : "var(--color-pp-danger-soft)",
                        color: h.status === "Present" ? "var(--color-pp-green)" : "var(--color-pp-danger)",
                      }}
                    >
                      {h.status === "Present" ? t("present") : t("absent")}
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ))}
      </div>
    </div>
  );
}
