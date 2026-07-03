import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Avatar } from "./Avatar";
import { student, notifications, upcomingToday } from "@/lib/student-data";

export function StudentHeader() {
  const t = useTranslations();
  const hasUnread = notifications.some((n) => n.unread);
  const classCount = upcomingToday ? 1 : 0;
  return (
    <header className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-navy">
            {t("common.hi", { name: student.name })}
          </h1>
          <span className="rounded-full bg-olive px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {t("common.studentBadge")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {t("home.classesToday", { count: classCount })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/student/notifications"
          aria-label={t("common.notifications")}
          className="relative rounded-full p-1.5 text-navy hover:bg-navy-soft/40"
        >
          <Bell className="size-6 fill-navy" />
          {hasUnread && (
            <span className="absolute right-1 top-1 size-2.5 rounded-full bg-brick ring-2 ring-cream" />
          )}
        </Link>
        <Link href="/student/profile" aria-label={t("common.myProfile")}>
          <Avatar name={student.name} colorClass={student.avatarColor} sizeClass="size-11" />
        </Link>
      </div>
    </header>
  );
}
