"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Nfc } from "lucide-react";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, upcomingClass } from "@/lib/teacher-data";

type Scan = { studentId: string; at: number };

type AgoT = (key: string, values?: Record<string, number>) => string;

function ago(at: number, now: number, t: AgoT) {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 2) return t("justNow");
  if (s < 60) return t("secondsAgo", { s });
  return t("minutesAgo", { m: Math.floor(s / 60) });
}

/**
 * Mock scan flow: students "scan in" one by one on a timer until the backend
 * provides a real device event stream.
 */
export default function ScanCheckinPage() {
  const t = useTranslations("checkin");
  const [scans, setScans] = useState<Scan[]>([
    { studentId: "kat", at: Date.now() - 3000 },
    { studentId: "uri", at: Date.now() },
  ]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const feed = setInterval(() => {
      setScans((prev) => {
        const scanned = new Set(prev.map((s) => s.studentId));
        const next = roster.find((s) => !scanned.has(s.id));
        if (!next) return prev;
        return [...prev, { studentId: next.id, at: Date.now() }];
      });
    }, 5000);
    return () => {
      clearInterval(tick);
      clearInterval(feed);
    };
  }, []);

  const recent = [...scans].sort((a, b) => b.at - a.at);

  return (
    <div className="flex flex-col gap-4">
      <CheckinHeader
        subtitle={t("classSubtitle", { course: upcomingClass.course, section: upcomingClass.section.replace("Sec ", "") })}
      />

      <div className="flex justify-center py-4">
        <span className="relative flex size-40 items-center justify-center rounded-full bg-olive-soft">
          <span className="absolute inset-0 animate-ping rounded-full bg-olive-soft opacity-60" />
          <span className="relative flex size-28 items-center justify-center rounded-full bg-olive text-white">
            <Nfc className="size-12" />
          </span>
        </span>
      </div>

      <SessionProgress
        labelKey="checkin.scannedIn"
        count={scans.length}
        total={roster.length}
      />

      <section>
        <h2 className="text-sm font-extrabold text-ink">{t("recentScans")}</h2>
        <div className="mt-2 flex flex-col gap-2.5">
          {recent.slice(0, 6).map((scan) => {
            const student = roster.find((s) => s.id === scan.studentId)!;
            return (
              <RosterRow
                key={scan.studentId}
                student={student}
                action={
                  <span className="text-xs font-semibold text-olive">
                    {ago(scan.at, now, t)}
                  </span>
                }
              />
            );
          })}
        </div>
      </section>

      <Link
        href="/teacher/dismissal/may10-sec101"
        className="sticky bottom-20 z-10 mt-2 rounded-2xl bg-navy py-3 text-center font-bold text-white shadow-clay-lg hover:bg-navy-deep lg:bottom-6"
      >
        {t("finish")}
      </Link>
    </div>
  );
}
