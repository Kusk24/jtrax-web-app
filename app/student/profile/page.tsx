import { useTranslations } from "next-intl";
import {
  Users,
  Phone,
  Mail,
  Info,
  ChevronRight,
  CalendarDays,
  MapPin,
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  Languages,
  Settings,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { PawnIcon } from "@/components/PawnIcon";
import { CreditSummaryCard } from "@/components/CreditSummaryCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  student,
  parentContacts,
  enrolledClasses,
  classStats,
} from "@/lib/student-data";

export default function StudentProfilePage() {
  const t = useTranslations();
  const low = student.lowCredits;
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-center text-2xl font-extrabold text-navy">
        {t("profile.myProfile")}
      </h1>

      <div className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} colorClass={student.avatarColor} sizeClass="size-14" />
          <div>
            <p className="font-bold text-ink">{student.name}</p>
            <p className="text-xs text-muted">
              {t("common.idLabel", { id: student.studentId })}
            </p>
            <p className="text-xs text-muted">
              {t("profile.levelAge", { level: student.level, age: student.age })}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <CreditSummaryCard
            remaining={student.credits.remaining}
            total={student.credits.total}
            validUntil={student.credits.validUntil}
            daysLeft={12}
            low={low}
          />
        </div>
      </div>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <Users className="size-5 text-navy" /> {t("profile.parentsContact")}
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {parentContacts.map((contact) => (
            <li key={contact.name} className="flex items-center gap-3">
              <Avatar name={contact.name} colorClass={contact.avatarColor} sizeClass="size-11" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy">{contact.name}</p>
                <p className="text-xs text-muted">{t(`common.${contact.relationKey}`)}</p>
              </div>
              <a
                href={`tel:${contact.phone}`}
                aria-label={t("profile.callTo", { name: contact.name })}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Phone className="size-5" />
              </a>
              <a
                href={`mailto:${contact.email}`}
                aria-label={t("profile.emailTo", { name: contact.name })}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Mail className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <GraduationCap className="size-5 text-navy" /> {t("profile.enrolledClasses")}
        </h2>
        {enrolledClasses.map((session) => (
          <div key={session.id} className="mt-4 flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-olive-soft text-olive">
              <PawnIcon className="size-8" />
            </span>
            <div>
              <p className="font-bold text-ink">
                {session.course} ({session.section})
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink">
                <CalendarDays className="size-3.5 text-navy" /> {session.day} {session.time}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink">
                <MapPin className="size-3.5 text-navy" /> {session.location}
              </p>
            </div>
          </div>
        ))}
        <div className="mt-4 grid grid-cols-2 divide-x divide-navy/20 rounded-xl bg-navy-soft/50 py-3">
          <div className="flex items-center justify-center gap-2 px-3">
            <CalendarCheck className="size-5 shrink-0 text-navy" />
            <p className="text-xs">
              <span className="font-bold text-ink">
                {classStats.attended}/{classStats.total}
              </span>
              <span className="block text-muted">{t("profile.classesAttended")}</span>
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 px-3">
            <ClipboardList className="size-5 shrink-0 text-navy" />
            <p className="text-xs">
              <span className="font-bold text-ink">{classStats.remaining}</span>
              <span className="block text-muted">{t("profile.classesRemaining")}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <Info className="size-5 text-navy" /> {t("profile.more")}
        </h2>
        <ul className="mt-2">
          <li className="flex items-center gap-3 px-1 py-2.5 text-sm text-ink">
            <Languages className="size-4 text-navy" /> {t("common.language")}
            <LanguageToggle className="ml-auto" />
          </li>
          <li>
            <button className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-sm text-ink hover:bg-cream">
              <Phone className="size-4 text-navy" /> {t("profile.contactSchool")}
              <ChevronRight className="ml-auto size-4 text-muted" />
            </button>
          </li>
          <li>
            <button className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-sm text-ink hover:bg-cream">
              <Settings className="size-4 text-navy" /> {t("profile.settings")}
              <ChevronRight className="ml-auto size-4 text-muted" />
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
