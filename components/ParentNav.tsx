"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, History, User } from "lucide-react";

const tabs = [
  { href: "/parent", label: "Home", icon: Home },
  { href: "/parent/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/parent/attendance", label: "Attendances", icon: History },
  { href: "/parent/profile", label: "Profile", icon: User },
];

function isActive(pathname: string, href: string) {
  if (href === "/parent") return pathname === "/parent" || pathname === "/parent/notifications";
  return pathname.startsWith(href);
}

export function ParentBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-20 rounded-2xl border border-line bg-card px-2 py-1.5 shadow-lg md:hidden">
      <ul className="flex items-stretch justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] ${
                  active
                    ? "bg-navy-soft/50 font-semibold text-navy"
                    : "text-muted"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ParentSideNav() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-line bg-card px-4 py-6 md:flex">
      <Link href="/" className="mb-8 px-2">
        <span className="text-2xl font-extrabold tracking-tight text-navy">JTrax</span>
        <span className="mt-0.5 block text-xs text-muted">Parent portal</span>
      </Link>
      <ul className="flex flex-col gap-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  active
                    ? "bg-navy-soft/50 font-semibold text-navy"
                    : "text-muted hover:bg-cream hover:text-ink"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/"
        className="mt-auto rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-cream hover:text-ink"
      >
        Switch role
      </Link>
    </aside>
  );
}
