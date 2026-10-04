"use client";

/**
 * A child on the parent's home: who they are, and every course they are in
 * with its own balance — a child in two courses has two, and one total hid
 * which one is running out. Compact, so two sit side by side on a phone.
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Flame, GraduationCap } from "lucide-react";
import { ChildFace } from "@/components/parent/ChildFace";
import { creditShare, creditTone } from "@/lib/credit-tone";
import type { ChildV2 } from "@/lib/parent-v2-data";

const BAR = { low: "bg-pp-danger", near: "bg-pp-amber", ok: "bg-pp-blue" };

/* One tone per level, for the child's own level only — the top band and the
   level badge. The courses below keep their own colours. Unset or
   unrecognised levels keep the blue the card always used, rather than
   picking a tone for a level the office never assigned. */
const LEVEL_TONE: Record<string, { band: string; text: string }> = {
  Beginner: { band: "bg-pp-green-soft", text: "text-pp-green" },
  Intermediate: { band: "bg-pp-soft", text: "text-pp-blue" },
  Advanced: { band: "bg-pp-purple-soft", text: "text-pp-purple" },
};
const DEFAULT_TONE = LEVEL_TONE.Intermediate;

export function ChildHomeCard({ child, lowCreditAt }: { child: ChildV2; lowCreditAt: number }) {
  const t = useTranslations("pv2");
  const levelTone = LEVEL_TONE[child.level] ?? DEFAULT_TONE;
  /* One course or none: the band and the course section split the card in
     two equal rows, so neither looks taller. More courses grow the bottom. */
  const even = child.courses.length <= 1;

  return (
    <Link
      href={`/parent/child/${child.key}`}
      className={`group min-w-0 overflow-hidden ${even ? "grid auto-rows-fr" : "flex flex-col"} rounded-2xl border-[1.5px] bg-pp-card shadow-[0_8px_22px_rgba(35,53,94,.08)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(35,53,94,.13)] border-pp-line`}
    >
      {/* Who: a flat band in the child's level colour, the face beside the
          name, the level and how many classes they have joined below it, and
          the streak on its own row under that. A flat tint and
          a hard edge below it (not a fade into the white section) is the
          "clear divider" the level colour is there to set up. */}
      <div className={`flex items-center gap-2.5 border-b border-pp-line px-3.5 py-3.5 ${levelTone.band}`}>
        <ChildFace
          name={child.name}
          photo={child.photo}
          tint={child.avBg}
          className="size-11 flex-none rounded-full ring-[2.5px] ring-pp-card shadow-[0_4px_12px_rgba(35,53,94,.18)]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="min-w-0 truncate text-[14px] font-bold leading-tight text-pp-ink">{child.name}</span>
          <div className="flex min-w-0 items-center gap-1.5">
            {child.level && (
              <span className={`flex-none rounded-full px-1.5 py-px text-[9px] font-bold ${levelTone.text} bg-pp-card`}>
                {child.level}
              </span>
            )}
            {/* Classes attended so far — lib/classes-attended.ts. An icon and
                the number, so it fits a phone's narrow card. */}
            <span
              className="flex flex-none items-center gap-0.5 text-[10.5px] font-semibold text-pp-sub"
              title={t("classesJoined", { count: child.attended })}
              aria-label={t("classesJoined", { count: child.attended })}
            >
              <GraduationCap className="size-3.5" strokeWidth={2} aria-hidden />
              <span aria-hidden>{child.attended}</span>
            </span>
          </div>
          {child.streak > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span
                className="flex items-center gap-0.5 rounded-full bg-pp-amber-soft px-1.5 py-0.5 text-pp-amber"
                title={t("dayStreak", { count: child.streak })}
              >
                <Flame className="size-3" strokeWidth={2.2} />
                {child.streak}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Each course's own balance, pure white: blue while healthy, amber
          when nearly low, red when low. */}
      <div className={`flex flex-1 flex-col gap-4 bg-pp-card px-3.5 py-3.5 ${even ? "justify-center" : ""}`}>
        {child.courses.length === 0 ? (
          <span className="text-center text-[11px] text-pp-muted">{t("noActiveCourse")}</span>
        ) : (
          child.courses.map((course) => {
            const tone = creditTone(course.credits, lowCreditAt);
            return (
              <div key={course.enrollmentId} className="flex min-w-0 flex-col gap-1.5">
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-pp-ink">
                    {course.name}
                  </span>
                  <span className="flex-none text-[11px] tabular-nums text-pp-muted">
                    <span className={`font-bold ${tone === "low" ? "text-pp-danger" : "text-pp-ink"}`}>
                      {course.credits}
                    </span>
                    {course.creditsOf !== null && <>/{course.creditsOf}</>}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-pp-soft">
                  <div
                    className={`h-full rounded-full ${BAR[tone]}`}
                    style={{ width: `${creditShare(course.credits, course.creditsOf)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Link>
  );
}
