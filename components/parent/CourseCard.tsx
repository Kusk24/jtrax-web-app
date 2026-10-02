"use client";

/**
 * One enrolled course on the child's page: an icon, its name, a bar of what
 * is left out of the last top-up, and beside it when those credits expire and
 * when the child joined. A child in two courses gets two rows.
 */
import { useTranslations } from "next-intl";
import { CalendarCheck, CalendarDays, Crown, Infinity as InfinityIcon, Trophy } from "lucide-react";
import type { CourseCredit } from "@/lib/course-credits";
import { PawnIcon } from "@/components/PawnIcon";
import { useParentData } from "@/components/parent/ParentData";
import { creditShare, creditTone } from "@/lib/credit-tone";

function fmtDay(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

/* Courses cycle through three tiles so neighbouring rows tell apart at a glance. */
const TILES = [
  { Icon: PawnIcon, tile: "bg-pp-soft text-pp-blue" },
  { Icon: Crown, tile: "bg-pp-plum-soft text-pp-deep" },
  { Icon: Trophy, tile: "bg-pp-amber-soft text-pp-amber" },
];

export function CourseCard({ course, index = 0 }: { course: CourseCredit; index?: number }) {
  const t = useTranslations("pv2");
  const hasExpiry = course.expiry !== "";
  /* Three states: a date already passed is expired, not "expires soon". */
  const expired = hasExpiry && course.daysLeft < 0;
  const expSoon = hasExpiry && !expired && course.daysLeft <= 14;
  const date = fmtDay(course.expiry);
  const { Icon, tile } = TILES[index % TILES.length];
  /* Low is the academy's own line from Settings; twice that is a heads-up. */
  const { lowCreditAt } = useParentData();
  const tone = creditTone(course.credits, lowCreditAt);
  const low = tone === "low";
  const barColor = low ? "bg-pp-danger" : tone === "near" ? "bg-pp-amber" : "bg-pp-blue";
  const pct = creditShare(course.credits, course.creditsOf);

  return (
    <div className={`flex flex-col gap-3 rounded-xl border-[1.5px] ${low ? "border-pp-danger" : "border-pp-line"} bg-pp-card p-3.5 sm:flex-row sm:items-center sm:gap-4`}>
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className={`flex size-14 flex-none items-center justify-center rounded-xl ${tile}`}>
          <Icon className="size-6" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-[15px] font-bold text-pp-ink">{course.name}</span>
          <div className="h-2 overflow-hidden rounded-full bg-pp-soft">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[12.5px] text-pp-muted">
            <span className={`font-semibold ${low ? "text-pp-danger" : "text-pp-ink"}`}>{course.credits}</span>
            {course.creditsOf !== null && <> / {course.creditsOf}</>} {t("creditsUnit")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-pp-panel pt-3 sm:w-[170px] sm:flex-none sm:grid-cols-1 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        {hasExpiry ? (
          <Detail
            icon={<CalendarCheck className="size-4" strokeWidth={1.8} />}
            label={expired ? t("expiredLabel") : t("validUntil")}
            value={expSoon ? t("daysLeftShort", { date, count: course.daysLeft }) : date}
            danger={expired || expSoon}
          />
        ) : (
          <Detail icon={<InfinityIcon className="size-4" strokeWidth={1.8} />} value={t("noExpiry")} />
        )}
        <Detail
          icon={<CalendarDays className="size-4" strokeWidth={1.8} />}
          label={t("enrolledSince")}
          value={course.enrolledOn ? fmtDay(course.enrolledOn) : "—"}
        />
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: React.ReactNode;
  label?: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`mt-0.5 flex-none ${danger ? "text-pp-danger" : "text-pp-muted"}`}>{icon}</span>
      <div className="flex min-w-0 flex-col">
        {label && <span className="text-[11px] text-pp-muted">{label}</span>}
        <span className={`text-[12.5px] font-semibold ${danger ? "text-pp-danger" : "text-pp-ink"}`}>{value}</span>
      </div>
    </div>
  );
}
