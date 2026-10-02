"use client";

/**
 * A compact dropdown filter: a pill showing the current choice, opening a
 * short list. Tinted while anything other than the first option is chosen.
 */
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

export type PickerOption = { k: string; label: string };

export function FilterPicker({
  icon: Icon,
  options,
  value,
  onChange,
  align = "left",
  label,
}: {
  icon: LucideIcon;
  /** The first option is "everything" — the resting state. */
  options: PickerOption[];
  value: string;
  onChange: (k: string) => void;
  /** Which edge the list opens from — "right" when the picker sits at the end of a row. */
  align?: "left" | "right";
  /** For screen readers: what this picker filters by. */
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

  const current = options.find((o) => o.k === value) ?? options[0];
  const narrowed = current !== options[0];

  return (
    <div ref={ref} className="relative min-w-0 shrink">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current.label}`}
        className={`flex max-w-[200px] min-w-0 cursor-pointer items-center gap-1 rounded-full border-[1.5px] px-2.5 py-1.5 text-[12px] font-bold ${
          narrowed ? "border-pp-blue bg-pp-soft text-pp-blue" : "border-pp-line bg-pp-card text-pp-ink hover:bg-pp-mist"
        }`}
      >
        <Icon className="size-3.5 flex-none" strokeWidth={2.2} />
        <span className="truncate">{current.label}</span>
        <ChevronDown className={`size-3.5 flex-none transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-[calc(100%+6px)] z-30 flex min-w-[190px] max-w-[280px] flex-col rounded-xl border-[1.5px] border-pp-line bg-pp-card p-1 shadow-[0_12px_28px_rgba(35,53,94,.16)]`}
        >
          {options.map((o) => (
            <button
              key={o.k || "all"}
              type="button"
              role="option"
              aria-selected={value === o.k}
              onClick={() => {
                onChange(o.k);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-semibold text-pp-ink hover:bg-pp-mist"
            >
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {value === o.k && <Check className="size-3.5 flex-none text-pp-blue" strokeWidth={2.4} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
