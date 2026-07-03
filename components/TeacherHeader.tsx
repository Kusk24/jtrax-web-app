import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar } from "./Avatar";
import { teacher } from "@/lib/teacher-data";

export function TeacherHeader({ classCount }: { classCount: number }) {
  const t = useTranslations();
  return (
    <header className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-navy">
            {t("common.hi", { name: teacher.name })}
          </h1>
          <span className="rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {t("common.teacherBadge")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {t("home.classesToday", { count: classCount })}
        </p>
      </div>
      <Link href="/teacher/profile" aria-label={t("common.myProfile")}>
        <Avatar name={teacher.name} colorClass={teacher.avatarColor} sizeClass="size-11" />
      </Link>
    </header>
  );
}
