"use client";

/**
 * History's result filter as a single icon: tap the funnel, pick All, Win,
 * Loss or Draw from a small menu. The icon turns blue with a dot while a
 * result other than All is chosen, so a filtered list never looks complete.
 */
import { useEffect, useRef, useState } from "react";
import { Check, Filter } from "lucide-react";

export type ResultChoice = "all" | "win" | "loss" | "draw";

export function ResultFilter({
  value,
  onChange,
  labels,
  label,
}: {
  value: ResultChoice;
  onChange: (v: ResultChoice) => void;
  labels: Record<ResultChoice, string>;
  /** What the button is, for screen readers and the tooltip. */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const narrowed = value !== "all";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${labels[value]}`}
        title={label}
        className={`relative flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors ${
          narrowed ? "bg-pp-soft text-pp-blue" : "text-pp-muted hover:bg-pp-line hover:text-pp-ink"
        }`}
      >
        <Filter className="size-4" strokeWidth={2.2} />
        {narrowed && <span className="absolute right-1 top-1 size-2 rounded-full bg-pp-blue ring-2 ring-white" aria-hidden />}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+4px)] z-30 flex min-w-[140px] flex-col rounded-xl border-[1.5px] border-pp-line bg-pp-card p-1 shadow-[0_10px_24px_rgba(35,53,94,.14)]"
        >
          {(["all", "win", "loss", "draw"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={value === k}
              onClick={() => {
                onChange(k);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-pp-ink hover:bg-pp-mist"
            >
              <span className="flex-1">{labels[k]}</span>
              {value === k && <Check className="size-3.5 text-pp-blue" strokeWidth={2.6} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
