/**
 * URL state — where a person is on a screen (tab, step, filter, page, the item
 * they opened) lives in the address bar, so refresh, Back and a shared link all
 * land on the same screen instead of its start.
 *
 * Moving somewhere (a tab, a step, opening an item) pushes a history entry so
 * Back retraces it; refining what is shown (a filter, a search) replaces the
 * current one so Back is not spent undoing chips. What a person has typed is
 * never put in the address — it is personal data, and addresses end up in
 * logs and history — it waits in sessionStorage for this tab instead.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** `value` if it is one of `allowed`, otherwise `fallback`. */
export function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * The query string with `key` set to `value` — or removed when it is the
 * screen's default, so the plain address stays the plain address. Returns
 * "" or "?…".
 */
export function withParam(search: string, key: string, value: string, fallback = ""): string {
  const params = new URLSearchParams(search);
  if (value === fallback || value === "") params.delete(key);
  else params.set(key, value);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export type Move = "push" | "replace";

/**
 * One query parameter as state, as the raw string — for values whose valid set
 * comes from data (a child, a course), which the screen checks itself. Must
 * render under a Suspense boundary, as anything reading the search params does.
 *
 * The setter pushes by default; pass "replace" for filters and searches. The
 * third value is an on-screen back arrow: it retraces entries this screen
 * pushed since it mounted, like the browser's Back, and after a reload or a
 * shared link steps back in place instead of leaving the site.
 */
export function useUrlValue(
  key: string,
  fallback = "",
): [string, (next: string, move?: Move) => void, (previous: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get(key) ?? fallback;
  const pushed = useRef(0);
  const set = useCallback(
    (next: string, move: Move = "push") => {
      const href = pathname + withParam(window.location.search, key, next, fallback);
      if (move === "push") {
        pushed.current += 1;
        router.push(href, { scroll: false });
      } else router.replace(href, { scroll: false });
    },
    [router, pathname, key, fallback],
  );
  const back = useCallback(
    (previous: string) => {
      if (pushed.current > 0) {
        pushed.current -= 1;
        router.back();
      } else set(previous, "replace");
    },
    [router, set],
  );
  return [value, set, back];
}

/** useUrlValue for a fixed set of values; anything else reads as `fallback`. */
export function useUrlParam<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T, move?: Move) => void, (previous: T) => void] {
  const [raw, set, back] = useUrlValue(key, fallback);
  return [pick(raw, allowed, fallback), set, back];
}

/** Reads a stored draft, or null for anything missing or unreadable. */
export function readDraft<T>(raw: string | null, isDraft: (v: unknown) => v is T): T | null {
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return isDraft(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * useState that survives a reload of this tab. Storage can be missing or
 * refuse (private windows), in which case it is plain useState. The first
 * render uses `initial` so server and client agree; the stored draft is
 * restored straight after.
 */
export function useSessionDraft<T>(
  storageKey: string,
  initial: T,
  isDraft: (v: unknown) => v is T,
): [T, (next: T | ((previous: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    let stored: T | null = null;
    try {
      stored = readDraft(window.sessionStorage.getItem(storageKey), isDraft);
    } catch {}
    // Restored after hydration on purpose: reading storage during render
    // would make the server's HTML and the client's first render disagree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(stored ?? initial);
    // `initial` and `isDraft` are fixed per screen; only the key moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  const set = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(previous) : next;
        try {
          window.sessionStorage.setItem(storageKey, JSON.stringify(value));
        } catch {}
        return value;
      });
    },
    [storageKey],
  );
  const clear = useCallback(() => {
    setValue(initial);
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  return [value, set, clear];
}
