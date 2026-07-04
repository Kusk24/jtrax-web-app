"use client";

import { Home, CalendarDays, DoorOpen, History, User } from "lucide-react";
import { PortalBottomNav, PortalSideNav, type PortalTab } from "./PortalNav";
import { ongoingSessions } from "@/lib/teacher-data";

/** "Ongoing" sits in the middle so it reads as the live-action tab. */
const tabs: PortalTab[] = [
  { href: "/teacher", labelKey: "home", icon: Home, exact: true },
  {
    href: "/teacher/schedule",
    labelKey: "teacherSchedule",
    icon: CalendarDays,
    activeAliases: ["/teacher/checkin"],
  },
  {
    href: "/teacher/ongoing",
    labelKey: "ongoing",
    icon: DoorOpen,
    activeAliases: ["/teacher/dismissal"],
    badgeCount: ongoingSessions.length,
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
