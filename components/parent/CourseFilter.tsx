"use client";

/**
 * Pick one course to look at, with the credits that course has used so far
 * beside the picker. A child in three courses sees each on its own.
 */
import { useTranslations } from "next-intl";
import { Filter } from "lucide-react";
import { FilterPicker } from "@/components/parent/FilterPicker";

export function CourseFilter({
  courses,
  value,
  onChange,
  align = "left",
}: {
  courses: string[];
  /** "" for every course. */
  value: string;
  onChange: (course: string) => void;
  align?: "left" | "right";
}) {
  const t = useTranslations("pv2");
  return (
    <FilterPicker
      icon={Filter}
      label={t("filterCourse")}
      options={[{ k: "", label: t("allCourses") }, ...courses.map((c) => ({ k: c, label: c }))]}
      value={value}
      onChange={onChange}
      align={align}
    />
  );
}

/** "12 credits used" — what the filtered rows cost, all time. */
export function CreditsUsed({ used }: { used: number }) {
  const t = useTranslations("pv2");
  return (
    <span className="flex-none whitespace-nowrap text-[12px] text-pp-muted">
      <span className="font-bold text-pp-ink">{used}</span> {t("creditsUsedSuffix")}
    </span>
  );
}

/** Credits used by a set of attendance rows, rounded to cents. */
export function usedCredits(rows: { credits: number }[]): number {
  return Math.round(rows.reduce((sum, r) => sum + r.credits, 0) * 100) / 100 || 0;
}

/** The courses that appear in a set of attendance rows, A–Z. */
export function coursesOf(rows: { cls: string }[]): string[] {
  return [...new Set(rows.map((r) => r.cls).filter((c) => c && c !== "—"))].sort((a, b) => a.localeCompare(b));
}
