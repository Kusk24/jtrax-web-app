import {
  ClipboardList,
  Languages,
  Users,
  BarChart3,
  CircleDollarSign,
  BookMarked,
  Phone,
  Mail,
  MapPin,
  IdCard,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/Avatar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { teacher, monthlyOverview, branches } from "@/lib/teacher-data";

const overviewTiles = [
  {
    icon: ClipboardList,
    value: `${monthlyOverview.sessions}`,
    labelKey: "sessions",
    frame: "border-navy/50",
    iconColor: "text-navy",
  },
  {
    icon: Users,
    value: `${monthlyOverview.students}`,
    labelKey: "students",
    frame: "border-olive/60",
    iconColor: "text-olive",
  },
  {
    icon: BarChart3,
    value: `${monthlyOverview.attendancePct}%`,
    labelKey: "attendanceRate",
    frame: "border-teal-500/40",
    iconColor: "text-teal-600",
  },
  {
    icon: CircleDollarSign,
    value: `${monthlyOverview.creditsConsumed}`,
    labelKey: "creditConsumed",
    frame: "border-amber-400/60",
    iconColor: "text-amber-500",
  },
] as const;

export default function TeacherProfilePage() {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-center text-2xl font-extrabold text-navy">{t("profile.myProfile")}</h1>

      <section className="flex items-center gap-4 rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <Avatar name={teacher.name} colorClass={teacher.avatarColor} sizeClass="size-14" />
        <div>
          <p className="font-bold text-ink">{t("profile.msName", { name: teacher.name })}</p>
          <p className="text-xs text-muted">{t("common.idLabel", { id: teacher.teacherId })}</p>
          <p className="text-xs text-muted">
            {t("profile.teacherLine", { years: teacher.experienceYears })}
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-extrabold text-ink">{t("profile.monthlyOverview")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {overviewTiles.map(({ icon: Icon, value, labelKey, frame, iconColor }) => (
            <div
              key={labelKey}
              className={`flex items-center gap-3 rounded-card border-2 bg-card p-4 shadow-clay ${frame}`}
            >
              <Icon className={`size-6 shrink-0 ${iconColor}`} />
              <div>
                <p className="font-extrabold text-ink">{value}</p>
                <p className="text-[11px] leading-tight text-muted">{t(`profile.${labelKey}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-bold text-navy">
          <BookMarked className="size-4" /> {t("profile.assignedBranches")}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {branches.map((branch) => (
            <div key={branch.name} className="flex items-center gap-2">
              <p className="min-w-0 flex-1 text-sm text-ink">{branch.name}</p>
              <a
                href={`tel:${branch.phone}`}
                aria-label={t("profile.callTo", { name: branch.name })}
                className="rounded-full p-2 text-navy hover:bg-navy-soft/40"
              >
                <Phone className="size-4 fill-navy" />
              </a>
              <span className="rounded-full p-2 text-brick">
                <MapPin className="size-4" />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-bold text-navy">
          <IdCard className="size-4" /> {t("profile.contactInfo")}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-olive-soft text-olive">
              <Phone className="size-4" />
            </span>
            <div>
              <p className="text-[11px] text-muted">{t("profile.phone")}</p>
              <p className="text-sm text-ink">{teacher.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-navy-soft text-navy">
              <Mail className="size-4" />
            </span>
            <div>
              <p className="text-[11px] text-muted">{t("profile.email")}</p>
              <p className="text-sm text-ink">{teacher.email}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-navy">
            <Languages className="size-4" /> {t("common.language")}
          </h2>
          <LanguageToggle />
        </div>
      </section>
    </div>
  );
}
