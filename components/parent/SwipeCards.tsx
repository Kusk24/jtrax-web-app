"use client";

/**
 * Cards one at a time: swipe on a phone, arrows on a wider screen, and dots
 * to say where you are. One card is shown as it is, with neither.
 */
import { Children, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SwipeCards({ children, label }: { children: ReactNode; label: string }) {
  const t = useTranslations("pv2");
  const items = Children.toArray(children);
  const row = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const many = items.length > 1;

  const go = (i: number) => {
    const el = row.current;
    if (!el) return;
    const next = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIdx(next);
  };

  const arrow = "absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-pp-line bg-pp-card text-pp-ink shadow-[0_4px_12px_rgba(35,53,94,.15)] disabled:opacity-0 md:flex";

  return (
    <div className="flex w-full flex-col gap-2" role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="relative">
        <div
          ref={row}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
          className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none]"
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="w-full flex-none snap-start"
              aria-hidden={many && i !== idx ? true : undefined}
              aria-label={many ? t("slideOf", { n: i + 1, total: items.length }) : undefined}
              role={many ? "group" : undefined}
            >
              {item}
            </div>
          ))}
        </div>
        {many && (
          <>
            <button type="button" className={`${arrow} -left-3`} disabled={idx === 0} onClick={() => go(idx - 1)} aria-label={t("previous")}>
              <ChevronLeft className="size-4" strokeWidth={2.4} />
            </button>
            <button type="button" className={`${arrow} -right-3`} disabled={idx === items.length - 1} onClick={() => go(idx + 1)} aria-label={t("next")}>
              <ChevronRight className="size-4" strokeWidth={2.4} />
            </button>
          </>
        )}
      </div>
      {many && (
        <div className="flex justify-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={t("slideOf", { n: i + 1, total: items.length })}
              aria-current={i === idx ? true : undefined}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-[18px] bg-pp-blue" : "w-1.5 bg-pp-soft"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
