"use client";

/* The page frame the play screens share: the portal's title row and the
   content under it. The navigation is the student layout's, so it is not
   drawn here. Kept separate from StudentGame because a game deserves a URL —
   a player reloading mid-game should land back at the board. */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { SoundToggle } from "./SoundToggle";

export const actionBtn =
  "cursor-pointer rounded-full border-none bg-pp-blue font-semibold text-white transition-colors hover:bg-pp-deep disabled:cursor-not-allowed disabled:bg-pp-faint";

export function PlayShell({
  title,
  back = "/student",
  nav = false,
  wide = false,
  children,
}: {
  title: string;
  back?: string;
  /** This screen is one of the portal's tabs. A tab is not somewhere you
      arrived from, so it gets no back arrow — the nav is how you leave. */
  nav?: boolean;
  /** Let the content use the page's width (a board beside its panels);
      otherwise it sits in a readable column. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const tCommon = useTranslations("common");
  return (
    <div className="flex flex-col gap-4">
      {/* The same header as every portal page: a left-aligned display title,
          with the back arrow only on a screen that was pushed. */}
      <header className="flex items-center gap-3">
        {!nav && (
          <Link
            href={back}
            aria-label={tCommon("back")}
            className="flex size-[38px] flex-none items-center justify-center rounded-xl border-[1.5px] border-pp-line bg-pp-card text-pp-ink hover:bg-pp-soft"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={2.2} />
          </Link>
        )}
        <h1 className="m-0 font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">{title}</h1>
        <SoundToggle className="ml-auto" />
      </header>
      <div className={`flex w-full flex-col gap-4 ${wide ? "" : "max-w-[640px]"}`}>{children}</div>
    </div>
  );
}

/* A card, as the parent portal draws one — used for status, results and forms. */
export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-[18px] ${className}`}
    >
      {children}
    </div>
  );
}
