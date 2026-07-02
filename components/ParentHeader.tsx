import Link from "next/link";
import { Bell } from "lucide-react";
import { Avatar } from "./Avatar";
import { parent, notifications } from "@/lib/parent-data";

export function ParentHeader() {
  const hasUnread = notifications.some((n) => n.unread);
  return (
    <header className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-navy">Hi, {parent.firstName} !</h1>
          <span className="rounded-full bg-maroon px-2.5 py-0.5 text-[10px] font-semibold text-white">
            {parent.role}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">Thursday 12 May 2026</p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/parent/notifications"
          aria-label="Notifications"
          className="relative rounded-full p-1.5 text-navy hover:bg-navy-soft/40"
        >
          <Bell className="size-6 fill-navy" />
          {hasUnread && (
            <span className="absolute right-1 top-1 size-2.5 rounded-full bg-brick ring-2 ring-cream" />
          )}
        </Link>
        <Link href="/parent/profile" aria-label="My profile">
          <Avatar name={parent.name} colorClass={parent.avatarColor} sizeClass="size-11" />
        </Link>
      </div>
    </header>
  );
}
