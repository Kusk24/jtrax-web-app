import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  ChevronRight,
  DoorOpen,
  MapPin,
  Users,
} from "lucide-react";
import { ongoingSessions } from "@/lib/teacher-data";

export default function OngoingClassesPage() {
  const t = useTranslations("ongoingPage");
  const tn = useTranslations("nav");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold text-navy">{t("title")}</h1>
        <p className="mt-0.5 text-sm text-muted">{t("subtitle")}</p>
      </header>

      {ongoingSessions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-line bg-card/70 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-navy-soft/60 text-navy">
            <DoorOpen className="size-7" />
          </span>
          <p className="font-bold text-ink">{t("empty")}</p>
          <p className="max-w-xs text-sm text-muted">{t("emptyHint")}</p>
          <Link
            href="/teacher/schedule"
            className="mt-1 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white shadow-clay hover:bg-navy-deep"
          >
            {t("goToSchedule")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ongoingSessions.map((session) => {
            const total = session.presentIds.length;
            const done = session.presentIds.filter(
              (id) => session.dismissedAt[id],
            ).length;
            const pct = total === 0 ? 0 : Math.round((done / total) * 100);
            return (
              <Link
                key={session.id}
                href={`/teacher/dismissal/${session.id}`}
                className="rounded-card border-2 border-l-4 border-navy/20 border-l-brick bg-card p-4 shadow-clay transition-colors hover:border-navy/50"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-brick-soft text-brick">
                    <DoorOpen className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-navy">
                        {session.course} ({session.section})
                      </h2>
                      <span className="rounded-full bg-peach px-2 py-0.5 text-[10px] font-bold text-peach-ink">
                        {tn("ongoing")}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5 text-navy" />
                        {session.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-navy" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5 text-navy" />
                        {t("dismissedOf", { done, total })}
                      </span>
                    </p>
                    <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-navy-soft/50">
                      <div
                        className="h-full rounded-full bg-olive transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="mt-3 size-5 shrink-0 text-navy" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
