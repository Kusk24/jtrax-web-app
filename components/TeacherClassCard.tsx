import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, MapPin, Users, ClipboardCheck, Nfc } from "lucide-react";
import type { TeacherClass } from "@/lib/types";

/** Round manual + scan attendance launchers shown on today's class. */
export function AttendanceActions() {
  const t = useTranslations("schedule");
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Link
        href="/teacher/checkin/manual"
        aria-label={t("takeManually")}
        className="flex size-11 items-center justify-center rounded-full bg-navy text-white shadow-clay hover:bg-navy-deep"
      >
        <ClipboardCheck className="size-5" />
      </Link>
      <Link
        href="/teacher/checkin/scan"
        aria-label={t("takeByScan")}
        className="flex size-11 items-center justify-center rounded-full bg-peach text-peach-ink shadow-clay hover:brightness-95"
      >
        <Nfc className="size-5" />
      </Link>
    </div>
  );
}

/** Today's class with schedule details and attendance launchers. */
export function TeacherClassCard({
  session,
  withActions = false,
}: {
  session: TeacherClass;
  withActions?: boolean;
}) {
  const t = useTranslations("home");
  return (
    <div className="flex items-center gap-3 rounded-card border-2 border-navy/20 border-l-4 border-l-navy bg-card p-4 shadow-clay">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h3 className="font-bold text-navy">
          {session.course} ({session.section})
        </h3>
        <p className="flex items-center gap-2 text-sm text-ink">
          <CalendarDays className="size-4 shrink-0 text-navy" /> {session.time}
        </p>
        <p className="flex items-center gap-2 text-sm text-ink">
          <Users className="size-4 shrink-0 text-navy" />{" "}
          {t("studentsCount", { count: session.studentsEnrolled })}
        </p>
        <p className="flex items-center gap-2 text-sm text-ink">
          <MapPin className="size-4 shrink-0 text-navy" /> {session.location} - {session.room}
        </p>
      </div>
      {withActions && <AttendanceActions />}
    </div>
  );
}
