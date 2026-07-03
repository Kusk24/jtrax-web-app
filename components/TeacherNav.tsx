"use client";

import { Home, CalendarDays, History, User } from "lucide-react";
import { PortalBottomNav, PortalSideNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  { href: "/teacher", label: "Home", icon: Home, exact: true },
  {
    href: "/teacher/schedule",
    label: "Schedule",
    icon: CalendarDays,
    activeAliases: ["/teacher/checkin"],
  },
  {
    href: "/teacher/attendance",
    label: "Attendances",
    icon: History,
    activeAliases: ["/teacher/students"],
  },
  { href: "/teacher/profile", label: "Profile", icon: User },
];

export function TeacherBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}

export function TeacherSideNav() {
  return <PortalSideNav tabs={tabs} portalLabel="Teacher portal" />;
}
