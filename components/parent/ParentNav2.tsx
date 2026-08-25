"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClipboardCheck, Home, LogOut, Settings, UserRound, type LucideIcon } from "lucide-react";
import { ParentAvatar } from "@/components/parent/ParentAvatar";
import { useParentData } from "@/components/parent/ParentData";
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
    labelKey: "navAttendances",
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
  const { parent, parentId } = useParentData();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] flex-none flex-col gap-1 border-r border-pp-line px-4 pb-5 pt-6 lg:flex">
      <div className="flex items-center gap-2.5 px-2.5 pb-4">
        <Image src="/parent/jca-logo.png" alt="JCA Chess Academy" width={30} height={30} />
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-[.14em] text-pp-ink">
            JCA Chess
          </span>
          <span className="text-[9.5px] tracking-[.1em] text-pp-faint">
            JTRAX · {t("roleParent")}
          </span>
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
      <Link
        href="/parent/profile"
        className="flex w-full items-center gap-2.5 rounded-xl bg-pp-plum-soft px-3 py-2.5"
      >
        <ParentAvatar className="size-8 flex-none rounded-full text-sm" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] font-semibold text-pp-ink">{parent.name}</span>
          <span className="truncate text-[10px] text-pp-muted">{t("roleParent")} · {parentId}</span>
        </span>
      </Link>
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
