import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
import { CreditSummaryCard } from "@/components/CreditSummaryCard";
import { roster, studentDetail } from "@/lib/teacher-data";

export default async function TeacherStudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const t = await getTranslations();
  const { studentId } = await params;
  const student = roster.find((s) => s.id === studentId);
  if (!student) notFound();

  // Mock: detail data (parents, enrolment) is only modelled for one student.
  const detail = studentDetail;
  const cls = detail.enrolledClass;

  return (
    <div className="flex flex-col gap-4">
      <CheckinHeader titleKey="profile.studentProfile" subtitle="" backHref="/teacher/attendance" />

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} colorClass={student.avatarColor} sizeClass="size-14" />
          <div>
            <p className="font-bold text-ink">{student.name}</p>
            <p className="text-xs text-muted">{t("common.idLabel", { id: student.studentId })}</p>
            <p className="text-xs text-muted">
              {t("profile.levelAge", { level: detail.level, age: detail.age })}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <CreditSummaryCard
            remaining={student.creditsRemaining}
            total={student.sessionsTotal}
            validUntil={detail.credits.validUntil}
            daysLeft={12}
            low={student.lowCredits}
          />
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-bold text-navy">
          <ShieldAlert className="size-4" /> {t("profile.parentsContact")}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {detail.parents.map((parent) => (
            <div key={parent.name} className="flex items-center gap-3">
              <Avatar name={parent.name} colorClass={parent.avatarColor} sizeClass="size-10" textClass="text-base" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{parent.name}</p>
                <p className="text-xs text-muted">{t(`common.${parent.relationKey}`)}</p>
              </div>
              <a
                href={`tel:${parent.phone}`}
                aria-label={t("profile.callTo", { name: parent.name })}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Phone className="size-4 fill-navy" />
              </a>
              <a
                href={`mailto:${parent.email}`}
                aria-label={t("profile.emailTo", { name: parent.name })}
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
          <GraduationCap className="size-4" /> {t("profile.enrolledClasses")}
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
            {t("profile.classesOf", { attended: cls.attended, total: cls.of })}
          </p>
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-navy">
            <History className="size-4" /> {t("profile.attendanceHistory")}
          </h2>
          <Link
            href="/teacher/attendance"
            className="text-sm font-semibold text-navy hover:text-navy-deep"
          >
            {t("common.viewAll")}
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
          <span className="text-xs font-semibold text-olive">{t("common.present")}</span>
        </div>
      </section>
    </div>
  );
}
