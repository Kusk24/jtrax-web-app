"use client";

/**
 * A small tooltip that opens on hover with a mouse and on tap on a phone,
 * where there is no hover. A tap elsewhere, or Escape, closes it.
 */
import { useEffect, useRef, useState } from "react";

export function TapTip({ tip, children }: { tip: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

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

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        type="button"
        aria-label={tip}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex cursor-pointer items-center rounded-md"
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg bg-pp-ink px-2.5 py-1.5 text-[11.5px] font-semibold text-pp-card shadow-[0_6px_16px_rgba(35,53,94,.2)]"
        >
          {tip}
        </span>
      )}
    </span>
  );
}
