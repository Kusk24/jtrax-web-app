"use client";

/* The phone frame the play screens share, matching StudentGame's 390×844 room.
   Kept separate from StudentGame because that component holds its screens in
   state, and a game deserves a URL — a player reloading mid-game should land
   back at the board, not at the home screen. */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { StudentBottomNav } from "./StudentBottomNav";

export const actionBtn =
  "cursor-pointer rounded-[20px] border-none bg-sv-primary font-bold text-white shadow-[inset_0_0_0_1.25px_rgb(27,50,96),0_0_0_1.25px_rgb(27,50,96)] disabled:opacity-60";

export function PlayShell({
  title,
  back = "/student",
  nav = false,
  children,
}: {
  title: string;
  back?: string;
  /** Show the portal's bottom bar. On a screen reached *from* that bar it has
      to stay — losing it strands a child on a page whose only way out is a
      small arrow in the corner. Mid-game screens leave it off on purpose. */
  nav?: boolean;
  children: React.ReactNode;
}) {
  const tCommon = useTranslations("common");
  return (
    <div className="sv-frame">
    <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden bg-sv-paper text-sv-ink sm:rounded-[36px] sm:shadow-[0_20px_60px_rgba(36,65,124,0.28)]">
      {/* The academy's own colours rather than a picture of a room. The cottage
          art was warm raster and no palette change could reach it. */}
      <div className="absolute inset-x-0 top-0 h-[190px] bg-[linear-gradient(180deg,#24417C_0%,#3A5DA5_58%,#F7FAFD_100%)]" />

      <header className="relative z-10 flex items-center gap-3 px-5 pt-[44px]">
        <Link
          href={back}
          aria-label={tCommon("back")}
          className="flex size-11 items-center justify-center rounded-full bg-sv-cream text-sv-ink shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.5} />
        </Link>
        {/* White, because the wash behind it is navy and the container's ink is
            too — the heading was navy-on-navy and simply invisible. axe did not
            catch it: it skips contrast checks against a CSS gradient. */}
        <h1 className="font-sv-display text-[28px] font-normal text-white">{title}</h1>
      </header>

      <div className={`relative z-10 flex flex-1 flex-col overflow-y-auto px-5 pt-4 ${nav ? "pb-[104px]" : "pb-6"}`}>
        {children}
      </div>
      {nav && <StudentBottomNav />}
    </div>
    </div>
  );
}

/* A soft card on the wooden floor — used for status, results and forms. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] bg-sv-cream p-4 shadow-[inset_0_0_0_1.5px_rgb(206,219,236)] ${className}`}
    >
      {children}
    </div>
  );
}
