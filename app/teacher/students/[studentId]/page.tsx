import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  GraduationCap,
  ShieldAlert,
  History,
  CheckCircle2,
  Crown,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { CheckinHeader } from "@/components/CheckinHeader";
import { roster, studentDetail } from "@/lib/teacher-data";

export default async function TeacherStudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = roster.find((s) => s.id === studentId);
  if (!student) notFound();

  // Mock: detail data (parents, enrolment) is only modelled for one student.
  const detail = studentDetail;
  const cls = detail.enrolledClass;

  return (
    <div className="flex flex-col gap-4">
      <CheckinHeader title="Student Profile" subtitle="" backHref="/teacher/attendance" />

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} colorClass={student.avatarColor} sizeClass="size-14" />
          <div>
            <p className="font-bold text-ink">{student.name}</p>
            <p className="text-xs text-muted">ID: {student.studentId}</p>
            <p className="text-xs text-muted">
              {detail.level} | {detail.age} years old
            </p>
          </div>
        </div>
        <div
          className={`mt-3 rounded-xl px-4 py-3 ${
            student.lowCredits ? "bg-brick-soft" : "bg-olive-soft"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-sm font-bold ${student.lowCredits ? "text-brick" : "text-olive"}`}
            >
              Remaining Credits
            </p>
            <p className={`font-extrabold ${student.lowCredits ? "text-brick" : "text-olive"}`}>
              {student.creditsRemaining}
              <span className="text-xs font-semibold">
                /{student.sessionsTotal} credits
              </span>
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted">Valid until {detail.credits.validUntil}</p>
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-bold text-navy">
          <ShieldAlert className="size-4" /> Parents Contact
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {detail.parents.map((parent) => (
            <div key={parent.name} className="flex items-center gap-3">
              <Avatar name={parent.name} colorClass={parent.avatarColor} sizeClass="size-10" textClass="text-base" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{parent.name}</p>
                <p className="text-xs text-muted">{parent.relation}</p>
              </div>
              <a
                href={`tel:${parent.phone}`}
                aria-label={`Call ${parent.name}`}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Phone className="size-4 fill-navy" />
              </a>
              <a
                href={`mailto:${parent.email}`}
                aria-label={`Email ${parent.name}`}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Mail className="size-4" />
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-bold text-navy">
          <GraduationCap className="size-4" /> Enrolled Classes
        </h2>
        <div className="mt-3 flex gap-3">
          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-olive-soft to-peach">
            <Crown className="size-7 text-olive" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-navy">
              {cls.course} ({cls.section})
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink">
              <CalendarDays className="size-3.5 shrink-0 text-navy" /> {cls.day}, {cls.time}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink">
              <MapPin className="size-3.5 shrink-0 text-navy" /> {cls.location}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-end text-xs font-semibold text-navy">{cls.pct}%</div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-navy" style={{ width: `${cls.pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {cls.attended}/{cls.of} classes
          </p>
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-navy">
            <History className="size-4" /> Attendance History
          </h2>
          <Link
            href="/teacher/attendance"
            className="text-sm font-semibold text-navy hover:text-navy-deep"
          >
            View All
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <CheckCircle2 className="size-5 shrink-0 fill-olive text-card" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              {detail.lastAttendance.course} ({detail.lastAttendance.section})
            </p>
            <p className="text-xs text-muted">{detail.lastAttendance.when}</p>
          </div>
          <span className="text-xs font-semibold text-olive">Present</span>
        </div>
      </section>
    </div>
  );
}
