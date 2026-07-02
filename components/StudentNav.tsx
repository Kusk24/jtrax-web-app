"use client";

import { Home, CalendarDays, History, User } from "lucide-react";
import { PortalBottomNav, PortalSideNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  {
    href: "/student",
    label: "Home",
    icon: Home,
    exact: true,
    activeAliases: ["/student/notifications"],
  },
  {
    href: "/student/schedule",
    label: "Schedule",
    icon: CalendarDays,
    activeAliases: ["/student/checkin"],
  },
  { href: "/student/attendance", label: "Attendances", icon: History },
  { href: "/student/profile", label: "Profile", icon: User },
];

export function StudentBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}

export function StudentSideNav() {
  return <PortalSideNav tabs={tabs} portalLabel="Student portal" />;
}
