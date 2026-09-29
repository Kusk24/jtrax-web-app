"use client";

/* The student portal's navigation, built the same way as the parent portal's
 * (components/parent/ParentNav2.tsx): a sidebar on a wide screen, a tab bar
 * along the bottom below that, and the signed-in account in the top-right
 * corner. A family switching between the two accounts should find everything
 * in the same place, drawn the same way.
 *
 * Home, Puzzles and Profile are screens of one component under /student,
 * addressed by `?screen=`; Games is its own route, and holds the history of
 * games played too. So a tab is active by path *and* query. Challenging
 * another student lives inside Games, with every other way of playing someone.
 */
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Gamepad, Home, LogOut, Puzzle, UserRound, type LucideIcon } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

type Tab = { href: string; label: string; icon: LucideIcon; active: boolean };

function useTabs(): Tab[] {
  const pathname = usePathname();
  const screen = useSearchParams().get("screen");
  const t = useTranslations("sv2");
  const onStudent = pathname === "/student";
  return [
    { href: "/student", label: t("home"), icon: Home, active: onStudent && !screen },
    {
      href: "/student?screen=puzzles",
      label: t("puzzles"),
      icon: Puzzle,
      active: onStudent && (screen === "puzzles" || screen === "daily" || screen === "practice"),
    },
    /* Games holds every way to play, and the record of games played. */
    {
      href: "/student/play",
      label: t("games"),
      icon: Gamepad,
      active: ["/student/play", "/student/challenge", "/student/history"].some((p) => pathname.startsWith(p)),
    },
    { href: "/student?screen=profile", label: t("profile"), icon: UserRound, active: onStudent && screen === "profile" },
  ];
}

export function StudentSideNav() {
  const t = useTranslations("sv2");
  const tabs = useTabs();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] flex-none flex-col gap-1 border-r border-pp-line px-4 pb-5 pt-6 lg:flex">
      <div className="flex items-center gap-2.5 px-1 pb-4">
        <Image src="/parent/jca-logo.png" alt="" width={38} height={38} className="rounded-[9px] object-contain" />
        <div className="flex flex-col">
          <span className="text-[18px] font-bold leading-[1.15] text-pp-ink">JCA</span>
          <span className="text-[13px] font-medium text-pp-muted">{t("brandSub")}</span>
        </div>
      </div>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 ${tab.active ? "bg-pp-soft" : "hover:bg-pp-bg"}`}
          >
            <Icon className={`size-5 ${tab.active ? "text-pp-blue" : "text-pp-faint"}`} strokeWidth={1.8} />
            <span className={`text-[13px] font-semibold ${tab.active ? "text-pp-blue" : "text-pp-faint"}`}>{tab.label}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <SignOutButton className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-pp-muted hover:bg-pp-mist disabled:opacity-60">
        <LogOut className="size-5" strokeWidth={1.8} />
        {t("logOut")}
      </SignOutButton>
    </aside>
  );
}

export function StudentBottomNav() {
  const tabs = useTabs();
  /* The parent portal's bottom bar (ParentNav2), class for class. */
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-pp-line bg-[color-mix(in_srgb,var(--color-pp-bg)_92%,transparent)] px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 rounded-[13px] py-1.5 ${tab.active ? "bg-pp-soft" : ""}`}
          >
            <Icon className={`size-[22px] ${tab.active ? "text-pp-blue" : "text-pp-faint"}`} strokeWidth={1.8} />
            <span className={`text-[10px] font-bold ${tab.active ? "text-pp-blue" : "text-pp-faint"}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
