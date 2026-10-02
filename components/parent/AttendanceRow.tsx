"use client";

/**
 * One attendance record, laid out to scan: the date first and boldest, then
 * the course, then what it cost — with Present/Absent on the right.
 *
 *   28 Sep 2026
 *   ♟ Beginner                                     −1.5 credits
 *   ◷ 16:00 – 17:30
 */
import { useTranslations } from "next-intl";
import type { HistRow } from "@/lib/parent-v2-data";

export const fmtCredits = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

export function CreditLine({ credits }: { credits: number }) {
  const t = useTranslations("pv2");
  return credits > 0 ? (
    <span className="rounded-full bg-pp-amber-soft px-2 py-0.5 text-[10.5px] font-bold text-pp-amber">
      {t("creditsDeducted", { count: fmtCredits(credits), n: credits })}
    </span>
  ) : (
    <span className="text-[11px] text-pp-faint">{t("noCreditDeducted")}</span>
  );
}

/** Only an absence is tagged: being there is what a record means. */
export function StatusPill({ status }: { status: HistRow["status"] }) {
  const t = useTranslations("pv2");
  const present = status === "Present";
  if (present) return null;
  return (
    <span
      className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.08em]"
      style={{
        background: present ? "var(--color-pp-green-soft)" : "var(--color-pp-danger-soft)",
        color: present ? "var(--color-pp-green)" : "var(--color-pp-danger)",
      }}
    >
      {present ? t("present") : t("absent")}
    </span>
  );
}

export function AttendanceRow({ h }: { h: HistRow }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-pp-panel px-4 py-3.5 last:border-0">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-[13.5px] font-bold text-pp-ink">{h.date}</span>
        <span className="truncate text-[12.5px] font-semibold text-pp-sub">♟ {h.cls}</span>
        <span className="text-[11px] text-pp-faint">◷ {h.time}</span>
      </div>
      {/* What it cost, on the right and centred, beside Present/Absent. */}
      <div className="flex flex-none items-center gap-2">
        <CreditLine credits={h.credits} />
        <StatusPill status={h.status} />
      </div>
    </div>
  );
}
