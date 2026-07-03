"use client";

import { Home, CalendarDays, History, User } from "lucide-react";
import { PortalBottomNav, PortalSideNav, type PortalTab } from "./PortalNav";

const tabs: PortalTab[] = [
  {
    href: "/parent",
    labelKey: "home",
    icon: Home,
    exact: true,
    activeAliases: ["/parent/notifications"],
  },
  { href: "/parent/schedule", labelKey: "schedule", icon: CalendarDays },
  { href: "/parent/attendance", labelKey: "attendances", icon: History },
  { href: "/parent/profile", labelKey: "profile", icon: User },
];

export function ParentBottomNav() {
  return <PortalBottomNav tabs={tabs} />;
}

export function ParentSideNav() {
  return <PortalSideNav tabs={tabs} portalLabelKey="parentPortal" />;
}
