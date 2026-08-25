"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ParentAvatar } from "@/components/parent/ParentAvatar";
import { useParentData } from "@/components/parent/ParentData";
import { useTranslations } from "next-intl";
import { Bell, ClipboardCheck, Home, LogOut, Settings, UserRound, type LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

type Tab = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
  aliases?: string[];
};

const tabs: Tab[] = [
  {
    href: "/parent",
    labelKey: "navHome",
    icon: Home,
    exact: true,
    aliases: ["/parent/notifications", "/parent/announcements", "/parent/tournament"],
  },
  {
    href: "/parent/attendance",
    labelKey: "navChildren",
    icon: ClipboardCheck,
    aliases: ["/parent/child"],
  },
  { href: "/parent/profile", labelKey: "navProfile", icon: UserRound },
  { href: "/parent/settings", labelKey: "navSettings", icon: Settings },
];

function isActive(pathname: string, tab: Tab) {
  if (tab.aliases?.some((a) => pathname.startsWith(a))) return true;
  return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
}

export function ParentSideNav() {
  const pathname = usePathname();
  const t = useTranslations("pv2");
  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] flex-none flex-col gap-1 border-r border-pp-line px-4 pb-5 pt-6 lg:flex">
      {/* Same proportions as the console's brand block: 38px mark, an 18px
          name and a 13px subtitle, so the two apps read as one product. */}
      <div className="flex items-center gap-2.5 px-1 pb-4">
        <Image src="/parent/jca-logo.png" alt="" width={38} height={38} className="rounded-[9px] object-contain" />
        <div className="flex flex-col">
          <span className="text-[18px] font-bold leading-[1.15] text-pp-ink">JCA</span>
          <span className="text-[13px] font-medium text-pp-muted">{t("brandSub")}</span>
        </div>
      </div>
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 ${
              active ? "bg-pp-soft" : "hover:bg-pp-bg"
            }`}
          >
            <Icon
              className={`size-5 ${active ? "text-pp-blue" : "text-pp-faint"}`}
              strokeWidth={1.8}
            />
            <span
              className={`text-[13px] font-semibold ${active ? "text-pp-blue" : "text-pp-faint"}`}
            >
              {t(tab.labelKey)}
            </span>
          </Link>
        );
      })}
      <div className="flex-1" />
      {/* Bottom corner, where the console keeps it. On a phone there is no
          sidebar, so Settings carries it instead. */}
      <SignOutButton className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-pp-muted hover:bg-pp-mist disabled:opacity-60">
        <LogOut className="size-5" strokeWidth={1.8} />
        {t("logOut")}
      </SignOutButton>
    </aside>
  );
}

export function ParentBottomNav2() {
  const pathname = usePathname();
  const t = useTranslations("pv2");
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-pp-line bg-[color-mix(in_srgb,var(--color-pp-bg)_92%,transparent)] px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      {tabs.map((tab) => {
        const active = isActive(pathname, tab);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 rounded-[13px] py-1.5 ${
              active ? "bg-pp-soft" : ""
            }`}
          >
            <Icon
              className={`size-[22px] ${active ? "text-pp-blue" : "text-pp-faint"}`}
              strokeWidth={1.8}
            />
            <span
              className={`text-[10px] font-bold ${active ? "text-pp-blue" : "text-pp-faint"}`}
            >
              {t(tab.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** The signed-in parent, in the top-right corner — where the console puts its
    account chip. It was at the foot of the sidebar, which is where the console
    keeps Logout, so the two apps disagreed about what lives in that corner. */
export function ParentAccountChip() {
  const t = useTranslations("pv2");
  const { parent, parentId, unreadNotifs } = useParentData();
  return (
    <>
      <Link
        href="/parent/notifications"
        aria-label={t("notificationsTitle")}
        className="relative flex size-[38px] flex-none items-center justify-center rounded-full border-[1.5px] border-pp-line bg-pp-card hover:bg-pp-soft"
      >
        <Bell className="size-[18px] text-pp-ink" strokeWidth={1.8} />
        {unreadNotifs > 0 && (
          <span className="absolute right-2 top-2 size-[9px] rounded-full border-2 border-pp-card bg-pp-red" />
        )}
      </Link>
      <Link
        href="/parent/profile"
        className="flex items-center gap-2.5 rounded-full border-[1.5px] border-pp-line bg-pp-card py-1.5 pl-1.5 pr-3.5 hover:bg-pp-mist"
      >
        <ParentAvatar className="size-8 flex-none rounded-full text-sm" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] font-semibold text-pp-ink">{parent.name}</span>
          <span className="truncate text-[10px] text-pp-muted">{t("roleParent")} · {parentId}</span>
        </span>
      </Link>
    </>
  );
}
