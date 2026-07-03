import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ContactRound,
  Phone,
  Mail,
  Info,
  Settings,
  ChevronRight,
  Languages,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { parent, children } from "@/lib/parent-data";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function ParentProfilePage() {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-center text-2xl font-extrabold text-navy">{t("profile.myProfile")}</h1>

      <div className="flex items-center gap-4 rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <Avatar name={parent.name} colorClass={parent.avatarColor} sizeClass="size-14" />
        <div>
          <p className="font-bold text-ink">{parent.name}</p>
          <p className="text-xs text-muted">{t("common.idLabel", { id: parent.parentId })}</p>
          <p className="text-xs text-muted">{t("common.parentBadge")}</p>
        </div>
      </div>

      <section>
        <h2 className="font-extrabold text-ink">{t("home.myChildren")} ({children.length})</h2>
        <ul className="mt-3 flex flex-wrap gap-6">
          {children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/parent/profile/${child.id}`}
                className="flex flex-col items-center gap-1"
              >
                <Avatar name={child.name} colorClass={child.avatarColor} sizeClass="size-14" />
                <span className="text-sm font-bold text-ink">{child.name}</span>
                <span className="text-[10px] text-muted">ID: {child.studentId}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border-2 border-line bg-card p-4 shadow-clay">
        <h2 className="flex items-center gap-2 font-extrabold text-ink">
          <ContactRound className="size-5 text-navy" /> {t("profile.contactInfo")}
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-olive-soft">
              <Phone className="size-4 text-olive" />
            </span>
            <div>
              <p className="text-[11px] text-muted">{t("profile.phone")}</p>
              <p className="text-sm text-ink">{parent.phone}</p>
            </div>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-navy-soft">
              <Mail className="size-4 text-navy" />
            </span>
            <div>
              <p className="text-[11px] text-muted">{t("profile.email")}</p>
              <p className="text-sm text-ink">{parent.email}</p>
            </div>
          </li>
        </ul>
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
