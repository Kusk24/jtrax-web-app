import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, MapPin, ChevronRight } from "lucide-react";
import { sessionHistory } from "@/lib/teacher-data";

export default function TeacherAttendancePage() {
  const t = useTranslations();
  const byDate = new Map<string, typeof sessionHistory>();
  for (const session of sessionHistory) {
    const list = byDate.get(session.date) ?? [];
    list.push(session);
    byDate.set(session.date, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-2xl font-extrabold text-navy">
        {t("attendance.teacherHistoryTitle")}
      </h1>

      {[...byDate.entries()].map(([date, sessions]) => (
        <section key={date}>
          <h2 className="text-lg font-extrabold text-ink">{date}</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {sessions.map((session) => {
              const total = session.presentIds.length + session.absentIds.length;
              return (
                <Link
                  key={session.id}
                  href={`/teacher/attendance/${session.id}`}
                  className="flex items-center gap-3 rounded-card border-2 border-navy/20 bg-card p-4 shadow-clay transition-colors hover:border-navy/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy">
                      {session.course} ({session.section})
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5 text-navy" /> {session.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-navy" /> {session.location}
                      </span>
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-navy">
                    {t("attendance.presentOf", {
                      present: session.presentIds.length,
                      total,
                    })}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-navy" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
