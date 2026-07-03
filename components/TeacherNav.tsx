"use client";

import { Home, CalendarDays, History, User } from "lucide-react";
import { PortalBottomNav, PortalSideNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  { href: "/teacher", labelKey: "home", icon: Home, exact: true },
  {
    href: "/teacher/schedule",
    labelKey: "teacherSchedule",
    icon: CalendarDays,
    activeAliases: ["/teacher/checkin"],
  },
  {
    href: "/teacher/attendance",
    labelKey: "teacherAttendances",
    icon: History,
    activeAliases: ["/teacher/students"],
  },
  { href: "/teacher/profile", labelKey: "profile", icon: User },
];

export function TeacherBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}

export function TeacherSideNav() {
  return <PortalSideNav tabs={tabs} portalLabelKey="teacherPortal" />;
}
