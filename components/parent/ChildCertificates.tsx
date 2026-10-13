"use client";

/**
 * A child's certificates, read-only: each course's hours toward the
 * requirement and whether the academy has certified them. Only the office
 * certifies; the certificate can be opened once it is issued.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Award } from "lucide-react";
import { fetchCertificates, progressPct, type StudentCertificates } from "@/lib/certificates";
import { useHoursText } from "@/components/useHoursText";

export function ChildCertificates({ studentId, childKey, refreshKey }: { studentId: string; childKey: string; refreshKey: unknown }) {
  const t = useTranslations("pv2");
  const hoursText = useHoursText();
  const [data, setData] = useState<StudentCertificates | null>(null);

  /* Read again when the child's attendance changes. */
  useEffect(() => {
    let live = true;
    fetchCertificates(studentId).then((d) => live && setData(d)).catch(() => live && setData(null));
    return () => { live = false; };
  }, [studentId, refreshKey]);

  if (!data || data.courses.length === 0) return null;
  const required = data.required_hours;
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
      <span className="px-0.5 font-pp-display text-[17px] font-bold text-pp-ink">{t("certificates")}</span>
      {data.courses.map((c) => {
        const done = c.status === "certified";
        return (
          <div key={c.course} className="flex flex-col gap-2 rounded-xl border-[1.5px] border-pp-line px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-[13.5px] font-semibold text-pp-ink">{t(`certCourse_${c.course}`)}</span>
              <span
                className={`flex-none rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                  done ? "bg-pp-green-soft text-pp-green" : "bg-pp-soft text-pp-blue"
                }`}
              >
                {done ? t("certCertified") : t("certInProgress")}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={t(`certCourse_${c.course}`)}
              aria-valuemin={0}
              aria-valuemax={required}
              aria-valuenow={Math.min(c.hours, required)}
              className="h-1.5 overflow-hidden rounded-full bg-pp-soft"
            >
              <div
                className={`h-full rounded-full ${done ? "bg-pp-green" : "bg-pp-blue"}`}
                style={{ width: `${progressPct(c.hours, required)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] tabular-nums text-pp-muted">
                {t("certHoursOf", { hours: hoursText(c.hours), required: hoursText(required) })}
              </span>
              {done && (
                <Link
                  href={`/parent/child/${childKey}/certificate/${c.course}`}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-pp-blue"
                >
                  <Award className="size-3.5" strokeWidth={2.2} aria-hidden />
                  {t("certView")}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
