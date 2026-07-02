import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "./Avatar";
import { student, notifications, upcomingToday } from "@/lib/student-data";

export function StudentHeader() {
  const hasUnread = notifications.some((n) => n.unread);
  const classCount = upcomingToday ? 1 : 0;
  return (
    <header className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-navy">Hi, {student.name} !</h1>
          <span className="rounded-full bg-olive px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Student
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          You have {classCount === 1 ? "one class" : `${classCount} classes`} Today.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/student/notifications"
          aria-label="Notifications"
          className="relative rounded-full p-1.5 text-navy hover:bg-navy-soft/40"
        >
          <Bell className="size-6 fill-navy" />
          {hasUnread && (
            <span className="absolute right-1 top-1 size-2.5 rounded-full bg-brick ring-2 ring-cream" />
          )}
        </Link>
        <Link href="/student/profile" aria-label="My profile">
          <Avatar name={student.name} colorClass={student.avatarColor} sizeClass="size-11" />
        </Link>
      </div>
    </header>
  );
}
