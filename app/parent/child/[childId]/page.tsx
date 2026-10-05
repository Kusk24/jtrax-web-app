"use client";

import { CourseCard } from "@/components/parent/CourseCard";
import { AttendanceRow } from "@/components/parent/AttendanceRow";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Flame, Star } from "lucide-react";
import { ChildFace } from "@/components/parent/ChildFace";
import { useParentData } from "@/components/parent/ParentData";
import { ChildLichess } from "@/components/parent/ChildLichess";
import { ChildAccount } from "@/components/parent/ChildAccount";
import { CopyId } from "@/components/parent/CopyId";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";

export default function ChildProfileV2({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const t = useTranslations("pv2");
  const router = useRouter();
  const { childId } = use(params);
  const { children: kids, hist } = useParentData();
  const [hover, setHover] = useState<number | null>(null);
  const ch = kids.find((c) => c.key === childId);
  if (!ch) notFound();

  /* This-week practice line chart */
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const vals = ch.practiceWeek;
  const goal = 30;
  const max = Math.max(...vals, 1);
  const W = 280, H = 64, P = 6;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * (W - P * 2) + P,
    H - P - (v / max) * (H - P * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  const weekMins = vals.reduce((a, b) => a + b, 0);

  /* The three most recent attendance rows, with each session's own times —
     not reconstructed from calendar dots and a fixed clock. */
  const histRows = hist.filter((h) => h.child === ch.key).slice(0, 3);

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
        <span className="font-pp-display text-2xl font-semibold">
          {t("childProfileTitle", { name: ch.name })}
        </span>
      </div>

      <div className="flex items-center gap-3.5 md:col-span-2">
        <ChildFace
          name={ch.name}
          photo={ch.photo}
          tint={ch.avBg}
          className="size-[62px] flex-none rounded-full"
          initialClassName="text-[24px]"
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-pp-display text-[22px] font-semibold">{ch.name}</span>
          <span className="flex items-center gap-1.5 text-xs text-pp-muted">
            {t("studentIdLabel")}
            <CopyId id={ch.id} />
          </span>
          <span className="text-[12.5px] font-semibold text-pp-ink">
            {ch.level || "—"}
            {ch.age > 0 ? ` · ${ch.age}` : ""}
          </span>
        </div>
      </div>

      {/* Practice progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={label}>{t("practiceProgress")}</span>
          <span className="flex items-center gap-1 text-[12.5px] font-bold text-pp-amber">
            <Flame className="size-3.5 fill-pp-amber" />
            {t("dayStreak", { count: ch.streak })}
          </span>
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <span className="text-[11px] font-bold uppercase tracking-[.08em] text-pp-faint">
            {t("thisWeek")}
          </span>
          <div className="relative h-16 w-full">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-16 w-full overflow-visible">
              <defs>
                <linearGradient id="chGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-pp-blue)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--color-pp-blue)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#chGrad)" />
              <path d={line} fill="none" stroke="var(--color-pp-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {pts.map((p, i) => {
              const mins = vals[i];
              const completed = mins >= goal;
              const pct = Math.max(4, Math.min(100, Math.round((mins / goal) * 100)));
              const circ = 2 * Math.PI * 9;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  className="absolute flex size-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
                  style={{ left: `${(p[0] / W) * 100}%`, top: `${(p[1] / H) * 100}%` }}
                >
                  <span className="block size-1.5 rounded-full bg-pp-blue" />
                  {hover === i && (
                    <div className="absolute bottom-[22px] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap rounded-[10px] bg-pp-ink px-2.5 py-2 text-white shadow-[0_8px_20px_rgba(28,25,40,.3)]">
                      <span className="text-[9.5px] font-bold uppercase tracking-[.06em] text-[#b4c5e4]">
                        {days[i]}
                      </span>
                      <span className="text-[12.5px] font-bold">{t("minsTip", { count: mins })}</span>
                      {completed ? (
                        <span className="flex size-[22px] items-center justify-center rounded-full bg-pp-green">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="relative flex size-[22px] items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 22 22" className="absolute inset-0 -rotate-90">
                            <circle cx="11" cy="11" r="9" fill="none" stroke="var(--color-pp-track)" strokeWidth="3" />
                            <circle cx="11" cy="11" r="9" fill="none" stroke="var(--color-pp-amber)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${((circ * pct) / 100).toFixed(1)} ${circ.toFixed(1)}`} />
                          </svg>
                          <Star className="relative size-2.5 fill-pp-amber text-pp-amber" strokeWidth={2} aria-hidden />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            {days.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-pp-faint">{d}</span>
            ))}
          </div>
          <span className="pt-0.5 text-[12.5px] font-semibold text-pp-ink">
            {t("weekTotal", { h: Math.floor(weekMins / 60), m: weekMins % 60 })}
          </span>
        </div>
      </div>

      {/* Enrolled classes: one card holding a row per course, each with its
          own credits, expiry and start date. */}
      <div className="flex flex-col gap-3 rounded-xl bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
        <div className="flex items-center justify-between px-0.5">
          <span className="font-pp-display text-[17px] font-bold text-pp-ink">{t("enrolledClasses")}</span>
          {ch.courses.length > 0 && (
            <span className="text-[12.5px] font-semibold text-pp-blue">
              {t("classesCount", { count: ch.courses.length })}
            </span>
          )}
        </div>
        {/* All time, across every course: what was bought and what classes used. */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-0.5 rounded-xl bg-pp-soft px-3.5 py-3">
            <span className="text-[10.5px] font-bold uppercase tracking-[.08em] text-pp-blue">{t("creditsBoughtTotal")}</span>
            <span className="font-pp-display text-[20px] font-bold leading-tight text-pp-ink">{ch.lifetime.bought}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-pp-mist px-3.5 py-3">
            <span className="text-[10.5px] font-bold uppercase tracking-[.08em] text-pp-muted">{t("creditsUsedTotal")}</span>
            <span className="font-pp-display text-[20px] font-bold leading-tight text-pp-ink">{ch.lifetime.used}</span>
          </div>
        </div>
        {ch.courses.length > 0 ? (
          ch.courses.map((course, i) => <CourseCard key={course.enrollmentId} course={course} index={i} />)
        ) : (
          <div className="rounded-xl border-[1.5px] border-dashed border-pp-dash p-4 text-center text-[12.5px] text-pp-muted">
            {t("noActiveCourse")}
          </div>
        )}
      </div>

      {/* Attendance history preview */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={label}>{t("attHistory")}</span>
          <Link href={`/parent/child/${ch.key}/history`} className="text-xs font-bold text-pp-blue">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl bg-pp-card shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          {histRows.length === 0 && (
            <div className="px-4 py-5 text-center text-[12.5px] text-pp-muted">{t("noSessions")}</div>
          )}
          {histRows.map((h, i) => (
            <AttendanceRow key={i} h={h} />
          ))}
        </div>
      </div>

      {/* What this child plays at home. Renders nothing when no account is
          linked, so a family that does not use Lichess never sees an empty
          card asking them to. */}
      <ChildLichess studentId={ch.key} />

      {/* How the child signs in, and a new password for one without email. */}
      <ChildAccount studentId={ch.id} name={ch.name} />
    </div>
  );
}
