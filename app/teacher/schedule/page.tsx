"use client";

import { useState } from "react";
import { TeacherClassCard } from "@/components/TeacherClassCard";
import { scheduleWeek, scheduleByDate } from "@/lib/teacher-data";

export default function TeacherSchedulePage() {
  const [selected, setSelected] = useState(scheduleWeek.find((d) => d.isToday)!.date);
  const sessions = scheduleByDate[selected] ?? [];
  const isToday = scheduleWeek.find((d) => d.date === selected)?.isToday;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-2xl font-extrabold text-navy">My Schedule</h1>

      <div className="overflow-x-auto pb-1">
        <div className="mx-auto flex w-max gap-2 px-1 pt-3 sm:gap-3">
          {scheduleWeek.map((day) => {
            const active = day.date === selected;
            return (
              <button
                key={day.date}
                onClick={() => setSelected(day.date)}
                className={`relative flex w-14 shrink-0 flex-col items-center rounded-xl border px-2 pb-2 pt-3 sm:w-16 ${
                  active
                    ? "border-navy bg-card shadow-sm"
                    : "border-transparent bg-navy-soft/70"
                }`}
              >
                {day.isToday && (
                  <span className="absolute -top-2.5 rounded-md bg-navy px-2 py-0.5 text-[10px] font-semibold text-white">
                    Today
                  </span>
                )}
                <span className="text-lg font-extrabold text-navy">{day.date}</span>
                <span className="text-[11px] font-medium text-muted">{day.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section>
        <h2 className="text-lg font-extrabold text-ink">
          {isToday ? "Today Class" : "Classes"} ({sessions.length})
        </h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {sessions.map((session) => (
            <TeacherClassCard key={session.id} session={session} withActions />
          ))}
        </div>
        {sessions.length === 0 && (
          <p className="mt-6 rounded-card bg-card/70 px-4 py-10 text-center text-sm text-muted">
            No classes scheduled for this day.
          </p>
        )}
      </section>
    </div>
  );
}
