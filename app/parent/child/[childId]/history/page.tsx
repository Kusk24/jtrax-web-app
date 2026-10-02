"use client";

import { AttendanceRow } from "@/components/parent/AttendanceRow";
import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CURRENT } from "@/lib/parent-v2-data";
import { useParentData } from "@/components/parent/ParentData";
import { CourseFilter, CreditsUsed, coursesOf, usedCredits } from "@/components/parent/CourseFilter";

const WD_KEYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

export default function ChildHistoryV2({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const t = useTranslations("pv2");
  const router = useRouter();
  const { childId } = use(params);
  const { children: kids, att: ATT, hist, months } = useParentData();
  const [month, setMonth] = useState(CURRENT);
  const [sel, setSel] = useState<{ m: number; d: number } | null>(null);
  const [course, setCourse] = useState("");
  const ch = kids.find((c) => c.key === childId);
  if (!ch) notFound();

  /* This child's rows, then the chosen course; the total is all time. */
  const mine = hist.filter((h) => h.child === ch.key);
  const courseList = coursesOf(mine);
  const activeCourse = courseList.includes(course) ? course : "";
  const shown = mine.filter((h) => !activeCourse || h.cls === activeCourse);

  const M = months[month];
  const rec = ATT[ch.key]?.[month] ?? { present: [], absent: [] };
  const todayDate = new Date().getDate();
  const prefix = `${M.year}-${String(M.month + 1).padStart(2, "0")}`;
  const courseDays = new Set(
    shown.filter((h) => h.status === "Present" && h.iso.startsWith(prefix)).map((h) => Number(h.iso.slice(8, 10))),
  );

  const cells: { d: number | null; present: boolean; today: boolean; selected: boolean }[] = [];
  for (let i = 0; i < M.offset; i++) cells.push({ d: null, present: false, today: false, selected: false });
  for (let d = 1; d <= M.days; d++) {
    cells.push({
      d,
      present: activeCourse ? courseDays.has(d) : rec.present.includes(d),
      today: month === CURRENT && d === todayDate,
      selected: sel?.m === month && sel?.d === d,
    });
  }

  /* The month's real attendance rows, each with its session's own times. */
  const rows = shown.filter((h) =>
    h.iso.startsWith(prefix)
    && (!sel || Number(h.iso.slice(8, 10)) === sel.d));

  return (
    <div className="grid content-start gap-5 md:grid-cols-2 md:gap-x-5">
      <div className="flex items-center gap-3 md:col-span-2">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-pp-card text-base text-pp-ink hover:bg-pp-soft"
        >
          ←
        </button>
        <div className="flex flex-col">
          <span className="font-pp-display text-2xl font-semibold leading-tight">
            {t("attHistory")}
          </span>
          <span className="text-[12.5px] text-pp-muted">
            {ch.name} · {M.name}
          </span>
        </div>
      </div>

      <div className="flex w-full max-w-[440px] flex-col gap-3.5 place-self-center md:place-self-auto">
        <div className="flex flex-col gap-2.5 rounded-[14px] bg-pp-card p-4 shadow-[0_10px_28px_rgba(35,53,94,.10)]">
          <div className="flex items-center justify-between px-0.5">
            <button
              onClick={() => { setMonth((m) => Math.max(0, m - 1)); setSel(null); }}
              className="size-[30px] cursor-pointer rounded-[10px] border-[1.5px] border-pp-line bg-pp-card text-sm text-pp-blue hover:bg-pp-soft"
            >
              ‹
            </button>
            <span className="font-pp-display text-[17px] font-semibold">{M.name}</span>
            <button
              onClick={() => { setMonth((m) => Math.min(months.length - 1, m + 1)); setSel(null); }}
              className="size-[30px] cursor-pointer rounded-[10px] border-[1.5px] border-pp-line bg-pp-card text-sm text-pp-blue hover:bg-pp-soft"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WD_KEYS.map((d) => (
              <span key={d} className="py-1 text-center text-[10px] font-bold text-pp-faint">{d}</span>
            ))}
            {cells.map((c, i) => (
              <button
                key={i}
                disabled={c.d === null}
                onClick={() =>
                  setSel((p) => (p && p.m === month && p.d === c.d ? null : { m: month, d: c.d! }))
                }
                className="flex aspect-square cursor-pointer items-center justify-center rounded-full p-0 text-[12.5px]"
                style={{
                  background: c.selected ? "var(--color-pp-blue)" : c.present ? "var(--color-pp-green-dot)" : "transparent",
                  color: c.selected || c.present ? "#fbfff1" : "var(--color-pp-ink)",
                  border: c.today && !c.selected && !c.present ? "1.5px solid #b4c5e4" : "none",
                  fontWeight: c.selected || c.present ? 700 : 400,
                }}
              >
                {c.d ?? ""}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-3.5 text-[10.5px] text-pp-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-[9px] rounded-full bg-pp-green-dot" />
              {t("present")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-[9px] rounded-full bg-pp-blue" />
              {t("selected")}
            </span>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex-none text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">
            {t("history")}
          </span>
          <span className="ml-auto flex min-w-0 items-center gap-2">
            <CreditsUsed used={usedCredits(shown)} />
            <CourseFilter courses={courseList} value={activeCourse} onChange={setCourse} align="right" />
          </span>
        </div>
        {rows.length === 0 && (
          <div className="rounded-xl border-[1.5px] border-dashed border-pp-dash p-5 text-center text-[12.5px] text-pp-muted">
            ♞ {t("noSessions")}
          </div>
        )}
        {rows.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-pp-card shadow-[0_8px_24px_rgba(35,53,94,.10)]">
            {rows.map((h, i) => (
              <AttendanceRow key={i} h={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
