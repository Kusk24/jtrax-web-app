"use client";

import { Home, CalendarDays, History, User } from "lucide-react";
import { PortalBottomNav, PortalSideNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  {
    href: "/parent",
    label: "Home",
    icon: Home,
    exact: true,
    activeAliases: ["/parent/notifications"],
  },
  { href: "/parent/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/parent/attendance", label: "Attendances", icon: History },
  { href: "/parent/profile", label: "Profile", icon: User },
];

export function ParentBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}

export function ParentSideNav() {
  return <PortalSideNav tabs={tabs} portalLabel="Parent portal" />;
}
