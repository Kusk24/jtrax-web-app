"use client";

import { CreditLine } from "@/components/parent/AttendanceRow";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CURRENT, type ChildKey } from "@/lib/parent-v2-data";
import { ChildFace } from "@/components/parent/ChildFace";
import { useParentData } from "@/components/parent/ParentData";
import { ParentPageHeader } from "@/components/parent/ParentPageHeader";
import { CourseFilter, CreditsUsed, coursesOf, usedCredits } from "@/components/parent/CourseFilter";
import { FilterPicker } from "@/components/parent/FilterPicker";
import { Users } from "lucide-react";

const WD_KEYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export default function ParentAttendanceV2() {
  const t = useTranslations("pv2");
  const { children: childrenV2, att: ATT, hist: histV2, months } = useParentData();
  const [filter, setFilter] = useState<"all" | ChildKey>("all");
  const [month, setMonth] = useState(CURRENT);
  const [course, setCourse] = useState("");

  const M = months[month];
  /* The rows the child chip allows, then the course: the picker offers only
     courses these children have been to, and the total is theirs, all time. */
  const byChild = histV2.filter((h) => filter === "all" || h.child === filter);
  const courseList = coursesOf(byChild);
  const activeCourse = courseList.includes(course) ? course : "";
  const shown = byChild.filter((h) => !activeCourse || h.cls === activeCourse);
  const prefix = `${M.year}-${String(M.month + 1).padStart(2, "0")}`;
  const courseDays = new Set(
    shown.filter((h) => h.status === "Present" && h.iso.startsWith(prefix)).map((h) => Number(h.iso.slice(8, 10))),
  );
  const todayDate = new Date().getDate();
  const cells: { label: string; present: boolean; today: boolean }[] = [];
  for (let i = 0; i < M.offset; i++) cells.push({ label: "", present: false, today: false });
  for (let d = 1; d <= M.days; d++) {
    const keys: ChildKey[] = filter === "all" ? childrenV2.map((c) => c.key) : [filter];
    const present = activeCourse
      ? courseDays.has(d)
      : keys.some((k) => (ATT[k]?.[month] ?? { present: [] }).present.includes(d));
    cells.push({ label: String(d), present, today: month === CURRENT && d === todayDate });
  }

  const groups: { date: string; items: typeof histV2 }[] = [];
  shown.forEach((h) => {
    let g = groups.find((x) => x.date === h.date);
    if (!g) {
      g = { date: h.date, items: [] };
      groups.push(g);
    }
    g.items.push(h);
  });

  return (
    <div className="grid content-start gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start lg:gap-x-6">
      <div className="lg:col-span-2">
        <ParentPageHeader title={t("navAttendance")} sub={t("attendanceSub")} />
      </div>

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
      {/* Two dropdowns and the credits they add up to, on one row: long
          names shorten with "…" rather than wrap. */}
      <div className="flex min-w-0 items-center gap-1.5">
        <FilterPicker
          icon={Users}
          label={t("filterChild")}
          options={[{ k: "all", label: t("allChildren") }, ...childrenV2.map((c) => ({ k: c.key, label: c.name }))]}
          value={filter}
          onChange={(k) => setFilter(k as "all" | ChildKey)}
        />
        <CourseFilter courses={courseList} value={activeCourse} onChange={setCourse} />
        <span className="ml-auto flex-none pl-1">
          <CreditsUsed used={usedCredits(shown)} />
        </span>
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
                <ChildFace
                  name={c.name}
                  photo={c.photo}
                  tint={c.avBg}
                  className="size-[42px] flex-none rounded-full"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13.5px] font-semibold">
                    {c.name} · ♟ {h.cls}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-pp-muted">
                    <span>◷ {h.time}</span>
                    {/* Only an absence is tagged: being there is what a record means. */}
                    {h.status === "Absent" && (
                      <span className="rounded-full bg-pp-danger-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.06em] text-pp-danger">
                        {t("absent")}
                      </span>
                    )}
                  </span>
                </span>
                {/* What it cost, on the right and centred. */}
                <span className="flex-none">
                  <CreditLine credits={h.credits} />
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
