import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

export function CheckinHeader({
  titleKey = "checkin.attendance",
  subtitle,
  backHref = "/teacher/schedule",
}: {
  titleKey?: string;
  subtitle: string;
  backHref?: string;
}) {
  const t = useTranslations();
  return (
    <header className="flex items-center gap-3">
      <Link
        href={backHref}
        aria-label={t("common.back")}
        className="rounded-full p-1.5 text-navy hover:bg-navy-soft/40"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <div>
        <h1 className="text-xl font-extrabold text-navy">{t(titleKey)}</h1>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
    </header>
  );
}
