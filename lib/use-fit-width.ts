"use client";

/* How wide a box actually is, so a chess board can fill it.

   The boards used to be drawn at a fixed 328px, which was right inside the
   old 390px phone canvas and small everywhere else. Now the page is as wide
   as the screen, so a board measures the column it sits in and takes that,
   up to a cap — a board wider than a laptop screen is tall is a board you
   scroll past.

   A callback ref rather than an object one: the puzzle board is not on the
   page until a puzzle is opened, and an effect that ran at mount would have
   found nothing to measure and never looked again. */
import { useCallback, useEffect, useState } from "react";

export function useFitWidth<T extends HTMLElement>(fallback: number, max: number) {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(fallback);
  const ref = useCallback((node: T | null) => setEl(node), []);
  useEffect(() => {
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) setWidth(Math.min(max, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, max]);
  return [ref, width] as const;
}

/** A board size that divides into eight whole squares, so the grid lines land
    on pixels rather than blurring between them. `chrome` is the frame drawn
    around the squares. */
export function boardSize(width: number, chrome: number): number {
  return Math.max(8 * 28, Math.floor((width - chrome) / 8) * 8);
}
