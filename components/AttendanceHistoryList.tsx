import { useTranslations } from "next-intl";
import { CalendarDays, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { Avatar } from "./Avatar";
import type { AttendanceRecord } from "@/lib/types";

/** Date-grouped attendance record cards — shared by the student portal and the
    teacher's per-student history view. */
export function AttendanceHistoryList({
  records,
  name,
  avatarColor,
}: {
  records: AttendanceRecord[];
  name: string;
  avatarColor: string;
}) {
  const t = useTranslations();
  const byDate = new Map<string, AttendanceRecord[]>();
  for (const record of records) {
    const list = byDate.get(record.date) ?? [];
    list.push(record);
    byDate.set(record.date, list);
  }

  return (
    <>
      {[...byDate.entries()].map(([date, group]) => (
        <section key={date}>
          <h2 className="text-lg font-extrabold text-ink">{date}</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {group.map((record) => {
              const present = record.status === "present";
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-card border-2 border-navy/20 bg-card p-4 shadow-clay"
                >
                  <Avatar name={name} colorClass={avatarColor} sizeClass="size-11" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy">
                      {record.course} ({record.section})
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5 text-navy" /> {record.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-navy" /> {record.location}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        present ? "text-olive" : "text-brick"
                      }`}
                    >
                      {present ? (
                        <CheckCircle2 className="size-4 fill-olive text-card" />
                      ) : (
                        <XCircle className="size-4 fill-brick text-card" />
                      )}
                      {present ? t("common.present") : t("common.absent")}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        present ? "bg-olive-soft text-olive" : "bg-brick-soft text-brick"
                      }`}
                    >
                      {record.creditsAfter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
