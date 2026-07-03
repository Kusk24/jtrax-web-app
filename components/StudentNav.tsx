"use client";

import { Home, CalendarDays, History, User } from "lucide-react";
import { PortalBottomNav, PortalSideNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  {
    href: "/student",
    labelKey: "home",
    icon: Home,
    exact: true,
    activeAliases: ["/student/notifications"],
  },
  {
    href: "/student/schedule",
    labelKey: "schedule",
    icon: CalendarDays,
    activeAliases: ["/student/checkin"],
  },
  { href: "/student/attendance", labelKey: "attendances", icon: History },
  { href: "/student/profile", labelKey: "profile", icon: User },
];

export function StudentBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}

export function StudentSideNav() {
  return <PortalSideNav tabs={tabs} portalLabelKey="studentPortal" />;
}
