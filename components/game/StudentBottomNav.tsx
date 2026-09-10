"use client";

/* The portal's bottom bar, for screens that are routes rather than states.
 *
 * StudentGame keeps its screens in component state and draws its own copy of
 * this bar. The play and challenge screens are real routes, so they had no bar
 * at all — a child who tapped Challenge from the bar then found the bar gone,
 * with only a small arrow in the corner to get back.
 *
 * Items link to `/student?screen=…` rather than trying to reach into that
 * component's state. That also makes the screens addressable, which is worth
 * having on its own.
 */
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Gamepad2, Home, Puzzle, Swords, UserRound } from "lucide-react";

const item =
  "flex cursor-pointer flex-col items-center justify-center gap-1 text-[8.5px] font-semibold transition-colors duration-150";

export function StudentBottomNav() {
  const pathname = usePathname();
  /* The three state-held screens live under /student with a `screen` query, so
     the pathname alone cannot tell them apart — Home, Puzzles and Profile all
     passed `false` and could never light up. */
  const screen = useSearchParams().get("screen");
  const t = useTranslations("sv2");
  const tp = useTranslations("play");
  const tch = useTranslations("challenge");
  const onStudent = pathname === "/student";
  const on = (href: string) => pathname.startsWith(href);
  const ink = (active: boolean) => (active ? "text-[#2563eb]" : "text-[#91a2bc]");

  return (
    <nav
      /* z-20: the shell's scroll area is z-10 and reaches under this bar (its
         pb-[104px] reserves the space) — without a higher layer every nav item
         is visually present and completely unclickable. */
      className="absolute inset-x-0 bottom-0 z-20 grid h-[72px] grid-cols-5 border-t border-[#e1eaf6] bg-white px-2 pb-1 shadow-[0_-8px_24px_rgba(37,99,235,.04)]">
      <Link href="/student" aria-label={t("home")} className={`${item} ${ink(onStudent && !screen)}`}>
        <Home className="size-[18px]" strokeWidth={onStudent && !screen ? 2.6 : 2} />{t("home")}
      </Link>
      <Link href="/student?screen=puzzles" aria-label={t("puzzles")} className={`${item} ${ink(onStudent && screen === "puzzles")}`}>
        <Puzzle className="size-[18px]" strokeWidth={onStudent && screen === "puzzles" ? 2.6 : 2} />{t("puzzles")}
      </Link>
      <Link href="/student/challenge" aria-label={tch("title")} className={`${item} ${ink(on("/student/challenge"))}`}>
        <Swords className="size-[18px]" strokeWidth={on("/student/challenge") ? 2.6 : 2} />{tch("title")}
      </Link>
      <Link href="/student/play" aria-label={tp("title")} className={`${item} ${ink(on("/student/play"))}`}>
        <Gamepad2 className="size-[18px]" strokeWidth={on("/student/play") ? 2.6 : 2} />{tp("title")}
      </Link>
      <Link href="/student?screen=profile" aria-label={t("profile")} className={`${item} ${ink(onStudent && screen === "profile")}`}>
        <UserRound className="size-[18px]" strokeWidth={onStudent && screen === "profile" ? 2.6 : 2} />{t("profile")}
      </Link>
    </nav>
  );
}
