import Link from "next/link";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  ChevronRight,
  Users,
  MapPin,
  Crown,
} from "lucide-react";
import { TeacherHeader } from "@/components/TeacherHeader";
import { TeacherClassCard } from "@/components/TeacherClassCard";
import { weeklyProgress, upcomingClass, myClasses } from "@/lib/teacher-data";

const weeklyStats = [
  { icon: CalendarDays, value: weeklyProgress.totalSessions, label: "Total Sessions" },
  { icon: Clock, value: weeklyProgress.remainingSessions, label: "Remaining Sessions" },
  { icon: CheckCircle2, value: weeklyProgress.hoursTaught, label: "Hours Taught" },
];

export default function TeacherHome() {
  return (
    <div className="flex flex-col gap-6">
      <TeacherHeader classCount={1} />

      <section className="rounded-card bg-peach/60 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">Weekly Progress</h2>
          <span className="text-sm font-extrabold text-navy">{weeklyProgress.pct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card">
          <div
            className="h-full rounded-full bg-navy"
            style={{ width: `${weeklyProgress.pct}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-line">
          {weeklyStats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center justify-center gap-2 px-2">
              <Icon className="size-4 shrink-0 text-navy" />
              <div>
                <p className="text-sm font-extrabold text-ink">{value}</p>
                <p className="text-[10px] leading-tight text-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-extrabold text-ink">Upcoming Class</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <TeacherClassCard session={upcomingClass} withActions />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">My Classes ({myClasses.length})</h2>
          <Link
            href="/teacher/schedule"
            className="flex items-center gap-0.5 text-sm font-semibold text-navy hover:text-navy-deep"
          >
            View All <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          {myClasses.map((cls) => (
            <div
              key={cls.id}
              className="overflow-hidden rounded-card border border-navy/30 bg-card shadow-sm"
            >
              <div className="flex h-24 items-center justify-center bg-gradient-to-br from-olive-soft to-peach">
                <Crown className="size-9 text-olive" />
              </div>
              <div className="flex flex-col gap-1.5 p-3">
                <h3 className="text-sm font-bold text-navy">
                  {cls.course} ({cls.section})
                </h3>
                <p className="flex items-center gap-1.5 text-xs text-ink">
                  <CalendarDays className="size-3.5 shrink-0 text-navy" /> {cls.day}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-ink">
                  <Users className="size-3.5 shrink-0 text-navy" /> {cls.studentsEnrolled}/
                  {cls.capacity} students
                </p>
                <p className="flex items-center gap-1.5 text-xs text-ink">
                  <MapPin className="size-3.5 shrink-0 text-navy" /> {cls.location} - {cls.room}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
