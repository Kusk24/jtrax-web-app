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
    <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden bg-[#f8fbff] text-[#10264d] sm:rounded-[32px] sm:shadow-[0_24px_70px_rgba(30,64,175,.22)]">
      <div className="pointer-events-none absolute -right-16 -top-12 size-[220px] rounded-full bg-[radial-gradient(circle,#dbeafe_0%,rgba(219,234,254,0)_70%)]" />
      <div className="absolute inset-x-0 top-0 flex h-[44px] items-end justify-center pb-1 text-[10px] font-semibold text-[#60779c]">JTrax — Student</div>

      <header className="relative z-10 flex items-center gap-3 px-4 pt-[48px]">
        <Link
          href={back}
          aria-label={tCommon("back")}
          className="flex size-9 items-center justify-center rounded-full border border-[#dce8f8] bg-white text-[#60779c] shadow-sm"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.5} />
        </Link>
        <h1 className="font-sv-display text-[27px] font-bold text-[#10264d]">{title}</h1>
      </header>

      <div className={`relative z-10 flex flex-1 flex-col overflow-y-auto px-4 pt-4 ${nav ? "pb-[88px]" : "pb-6"}`}>
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
      className={`rounded-[18px] border border-[#dce8f8] bg-white p-4 shadow-[0_7px_20px_rgba(37,99,235,.06)] ${className}`}
    >
      {children}
    </div>
  );
}
