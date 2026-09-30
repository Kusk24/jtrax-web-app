"use client";

/**
 * One way to play on the Games tab: a compact white row — a small flat icon
 * tile, the title, and a round arrow.
 * Tapping it opens what was under it before — the levels, the challenge
 * panel, the code form — so nothing moved to another page. A link to
 * `/student/play#<id>` (Home's tiles) opens that card on arrival.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

/* Flat colours, one per way to play: a tinted icon tile on the parent's
   bordered card. */
const TONE = {
  ai: { card: "hover:bg-pp-soft", tile: "bg-pp-soft", arrow: "bg-pp-soft text-pp-blue", hover: "group-hover:-rotate-[15deg] group-hover:scale-105" },
  friend: { card: "hover:bg-st-orange-soft/60", tile: "bg-st-orange-soft", arrow: "bg-st-orange-soft text-st-orange", hover: "group-hover:scale-110" },
  room: { card: "hover:bg-pp-green-soft", tile: "bg-pp-green-soft", arrow: "bg-pp-green-soft text-pp-green", hover: "origin-left group-hover:[transform:perspective(120px)_rotateY(-28deg)]" },
} as const;

export function GameModeCard({
  id,
  tone,
  art,
  title,
  children,
}: {
  id: string;
  tone: keyof typeof TONE;
  art: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const c = TONE[tone];

  useEffect(() => {
    const fromHash = () => {
      if (window.location.hash === `#${id}`) {
        setOpen(true);
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [id]);

  return (
    <section
      ref={ref}
      id={id}
      className={`scroll-mt-4 overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card transition-colors ${c.card}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="group flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left"
      >
        {/* The same hover as Home's tile: the robot tilts, the pawns grow, the door swings open. */}
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 ${c.tile} ${c.hover}`} aria-hidden>
          {art}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold leading-tight tracking-tight text-pp-ink">{title}</span>
        </span>
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${c.arrow}`} aria-hidden>
          <ChevronRight className={`size-4 transition-transform ${open ? "rotate-90" : ""}`} strokeWidth={2.5} />
        </span>
      </button>
      {open && (
        <div id={`${id}-panel`} className="border-t border-pp-line p-3">
          {children}
        </div>
      )}
    </section>
  );
}
