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
import { usePathname } from "next/navigation";

const item =
  "flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-150";

export function StudentBottomNav() {
  const pathname = usePathname();
  const on = (href: string) => pathname.startsWith(href);
  const ink = (active: boolean) => (active ? "rgb(36,65,124)" : "rgb(53,85,117)");

  return (
    <nav
      /* z-20: the shell's scroll area is z-10 and reaches under this bar (its
         pb-[104px] reserves the space) — without a higher layer every nav item
         is visually present and completely unclickable. */
      className="absolute bottom-[24px] left-[25px] z-20 flex h-[70px] w-[340px] items-center justify-around rounded-[25px] bg-sv-cream shadow-[inset_0_0_0_1.25px_rgb(216,226,240),0_0_0_1.25px_rgb(216,226,240)]">
      <Link href="/student" aria-label="Home" className={item}>
        <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
          <path d="M13 1.5L2 10.5V22.5H10V15.5H16V22.5H24V10.5L13 1.5Z" fill={ink(false)} stroke={ink(false)} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </Link>
      <Link href="/student?screen=puzzles" aria-label="Puzzles" className={item}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M10 3a2 2 0 1 1 4 0v1h3a1 1 0 0 1 1 1v3h1a2 2 0 1 1 0 4h-1v3a1 1 0 0 1-1 1h-3v-1a2 2 0 1 0-4 0v1H6a1 1 0 0 1-1-1v-3H4a2 2 0 1 1 0-4h1V5a1 1 0 0 1 1-1h4V3Z" fill={ink(false)} />
        </svg>
      </Link>
      <Link href="/student/challenge" aria-label="Challenge" className={item}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ink(on("/student/challenge"))} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 14.5 21 21M21 3l-8 8M3 21l8-8M9.5 9.5 3 3" />
          <path d="M18 3h3v3M6 3H3v3" />
        </svg>
      </Link>
      <Link href="/student/play" aria-label="Play" className={item}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8 21h9v-1.6c0-4.2-1.5-5.6-3.4-7.1l1.1-2.2-2.4 1.1-1.6-1.9 3-2.6-1-2.2L9.6 6 8.2 4.3 7 6.6 5.4 9.9c-.5 1 .1 2.1 1.2 2.2l1.6.2-1.5 2.4c-.5.9-.7 1.9-.7 2.9V21z"
            fill={ink(on("/student/play"))} stroke={ink(on("/student/play"))} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </Link>
      <Link href="/student?screen=profile" aria-label="Profile" className={item}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10.5" stroke={ink(false)} strokeWidth="1.6" />
          <circle cx="12" cy="9.5" r="3.2" fill={ink(false)} />
          <path d="M4.5 19C5.8 15.8 8.6 14.5 12 14.5C15.4 14.5 18.2 15.8 19.5 19" stroke={ink(false)} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      </Link>
    </nav>
  );
}
