"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ATT, childrenV2, histV2, MAY, MONTHS, type ChildKey } from "@/lib/parent-v2-data";

const WD_KEYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export default function ParentAttendanceV2() {
  const t = useTranslations("pv2");
  const [filter, setFilter] = useState<"all" | ChildKey>("all");
  const [month, setMonth] = useState(MAY);

  const M = MONTHS[month];
  const cells: { label: string; present: boolean; today: boolean }[] = [];
  for (let i = 0; i < M.offset; i++) cells.push({ label: "", present: false, today: false });
  for (let d = 1; d <= M.days; d++) {
    const keys: ChildKey[] = filter === "all" ? ["penny", "uri"] : [filter];
    const present = keys.some((k) => (ATT[k][month] ?? { present: [] }).present.includes(d));
    cells.push({ label: String(d), present, today: month === MAY && d === 20 });
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
    <div className="grid content-start gap-4 px-4 pb-8 pt-5 sm:px-5 lg:grid-cols-2 lg:gap-x-5">
      <div className="-mx-4 -mt-5 bg-pp-soft px-4 pb-[70px] pt-6 text-center font-pp-display text-2xl font-semibold sm:-mx-5 sm:px-5 lg:col-span-2">
        {t("attHistory")}
      </div>

      <div className="relative z-[1] -mt-[54px] flex flex-col gap-3 rounded-xl border-[1.5px] border-pp-line bg-white p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)] lg:col-span-2">
        <div className="flex items-center justify-between px-0.5">
          <button
            onClick={() => setMonth((m) => Math.max(0, m - 1))}
            className="size-[30px] cursor-pointer rounded-[10px] border-[1.5px] border-pp-line bg-white text-sm text-pp-blue hover:bg-pp-soft"
          >
            ‹
          </button>
          <span className="font-pp-display text-[17px] font-semibold">{M.name}</span>
          <button
            onClick={() => setMonth((m) => Math.min(MONTHS.length - 1, m + 1))}
            className="size-[30px] cursor-pointer rounded-[10px] border-[1.5px] border-pp-line bg-white text-sm text-pp-blue hover:bg-pp-soft"
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
                background: c.present ? "#4a9d6b" : "transparent",
                color: c.present ? "#fbfff1" : "#1A2B4A",
                fontWeight: c.present || c.today ? 700 : 400,
                border: c.today && !c.present ? "1.5px solid #2E5CB8" : "none",
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

      <div className="flex flex-wrap gap-2 lg:col-span-2">
        {chips.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className="cursor-pointer rounded-full border-[1.5px] px-4 py-2 text-xs font-bold"
            style={{
              background: filter === f.k ? "#234A9F" : "#ffffff",
              color: filter === f.k ? "#fbfff1" : "#64708C",
              borderColor: filter === f.k ? "#234A9F" : "#E7EBF3",
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
                className="flex w-full items-center gap-3 rounded-xl border-[1.5px] border-pp-line bg-white p-4 text-left hover:bg-pp-mist"
              >
                <span
                  aria-label={c.name}
                  className="size-[42px] flex-none rounded-full bg-cover bg-center"
                  style={{ backgroundColor: c.avBg, backgroundImage: `url('${c.photo}')` }}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold">
                    {c.name} · ♟ {c.clsTitle}
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-pp-muted">
                    <span>◷ {h.time}</span>
                    <span>⌂ {c.branch}</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
