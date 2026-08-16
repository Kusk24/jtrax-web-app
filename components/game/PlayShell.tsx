"use client";

/* The phone frame the play screens share, matching StudentGame's 390×844 room.
   Kept separate from StudentGame because that component holds its screens in
   state, and a game deserves a URL — a player reloading mid-game should land
   back at the board, not at the home screen. */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const peachBtn =
  "cursor-pointer rounded-[20px] border-none bg-sv-peach font-bold text-sv-brown shadow-[inset_0_0_0_1.25px_rgb(192,120,98),0_0_0_1.25px_rgb(192,120,98)] disabled:opacity-60";

export function PlayShell({
  title,
  back = "/student",
  children,
}: {
  title: string;
  back?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-[844px] w-[390px] shrink-0 flex-col overflow-hidden bg-sv-paper text-sv-brown sm:rounded-[36px] sm:shadow-[0_20px_60px_rgba(80,50,30,0.35)]">
      <div
        className="absolute inset-x-0 top-0 h-[240px] bg-cover bg-top"
        style={{ backgroundImage: "url('/student/wall.png')" }}
      />
      <div className="absolute inset-x-0 bottom-0 top-[240px] bg-[rgb(233,213,181)]" />
      <div className="absolute inset-x-0 top-[236px] h-[6px] bg-[rgba(184,133,88,0.45)]" />

      <header className="relative z-10 flex items-center gap-3 px-5 pt-[44px]">
        <Link
          href={back}
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full bg-sv-cream shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.6)]"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.5} />
        </Link>
        <h1 className="font-sv-display text-[28px] font-normal">{title}</h1>
      </header>

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto px-5 pb-6 pt-4">{children}</div>
    </div>
  );
}

/* A soft card on the wooden floor — used for status, results and forms. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] bg-sv-cream p-4 shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.6)] ${className}`}
    >
      {children}
    </div>
  );
}
