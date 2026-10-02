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

export function ChildHomeCard({ child, lowCreditAt }: { child: ChildV2; lowCreditAt: number }) {
  const t = useTranslations("pv2");
  const anyLow = child.courses.some((c) => creditTone(c.credits, lowCreditAt) === "low");

  return (
    <Link
      href={`/parent/child/${child.key}`}
      className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border-[1.5px] bg-pp-card shadow-[0_8px_22px_rgba(35,53,94,.08)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(35,53,94,.13)] ${
        anyLow ? "border-pp-danger-line" : "border-pp-line"
      }`}
    >
      {/* Who: a soft band with the face beside the name and level, and two
          small counts under them — streak and classes attended. */}
      <div className="flex items-center gap-2.5 bg-linear-to-b from-pp-soft to-pp-card px-3.5 pb-3.5 pt-4">
        <ChildFace
          name={child.name}
          photo={child.photo}
          tint={child.avBg}
          className="size-11 flex-none rounded-full ring-[2.5px] ring-pp-card shadow-[0_4px_12px_rgba(35,53,94,.18)]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="min-w-0 truncate text-[14px] font-bold leading-tight text-pp-ink">{child.name}</span>
            {child.level && (
              <span className="flex-none rounded-full bg-pp-blue px-1.5 py-px text-[9px] font-bold text-white">
                {child.level}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold">
            {child.streak > 0 && (
              <span
                className="flex items-center gap-0.5 rounded-full bg-pp-amber-soft px-1.5 py-0.5 text-pp-amber"
                title={t("dayStreak", { count: child.streak })}
              >
                <Flame className="size-3" strokeWidth={2.2} />
                {child.streak}
              </span>
            )}
            <span
              className="flex items-center gap-0.5 rounded-full bg-pp-card px-1.5 py-0.5 text-pp-blue shadow-[0_0_0_1px_var(--color-pp-line)]"
              title={t("completedClasses", { count: child.attended })}
            >
              <GraduationCap className="size-3" strokeWidth={2.2} />
              {child.attended}
            </span>
          </div>
        </div>
      </div>

      {/* Each course's own balance. */}
      <div className="flex flex-1 flex-col gap-4 px-3.5 pb-4 pt-3.5">
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
