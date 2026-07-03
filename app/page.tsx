import Link from "next/link";
import { useTranslations } from "next-intl";
import { GraduationCap, Users, Presentation, ArrowRight } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";

const roles = [
  {
    href: "/student",
    labelKey: "studentLabel",
    descKey: "studentDesc",
    icon: GraduationCap,
    accent: "bg-olive-soft text-olive",
  },
  {
    href: "/parent",
    labelKey: "parentLabel",
    descKey: "parentDesc",
    icon: Users,
    accent: "bg-navy-soft text-navy",
  },
  {
    href: "/teacher",
    labelKey: "teacherLabel",
    descKey: "teacherDesc",
    icon: Presentation,
    accent: "bg-brick-soft text-brick",
  },
] as const;

export default function RoleSelectPage() {
  const t = useTranslations("landing");
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <LanguageToggle className="absolute right-4 top-4" />
      <h1 className="text-4xl font-extrabold tracking-tight text-navy">JTrax</h1>
      <p className="mt-2 text-center text-sm text-muted">{t("tagline")}</p>
      <div className="mt-10 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {roles.map(({ href, labelKey, descKey, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-card border-2 border-line bg-card p-5 shadow-clay transition hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md sm:flex-col sm:items-start sm:gap-3 sm:p-6"
          >
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
              <Icon className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-bold text-ink">
                {t(labelKey)}
                <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-navy" />
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                {t(descKey)}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted">{t("tempNote")}</p>
    </main>
  );
}
