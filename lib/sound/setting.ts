/* Whether the board makes sound — one switch, remembered per browser.
 *
 * On unless turned off, as on every chess site. Kept in localStorage because it
 * is a preference about this device, not about the pupil: a phone in a quiet
 * classroom and a laptop at home can reasonably disagree. Every read and write
 * is guarded — storage is missing in a private window, and a sound setting that
 * cannot be saved must never break the board. */
import { useSyncExternalStore } from "react";

const KEY = "jtrax.sound";
const listeners = new Set<() => void>();
/* What the switch says when storage cannot hold it. */
let memory: boolean | null = null;

export function isSoundOn(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Unsaved, but still honoured for as long as this page is open.
  }
  memory = on;
  listeners.forEach((l) => l());
}

const current = () => memory ?? isSoundOn();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab flipping the switch flips it here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      memory = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The switch, as React state. The server has no storage, so it renders "on"
    and the real value arrives on the first client render. */
export function useSoundOn(): boolean {
  return useSyncExternalStore(subscribe, current, () => true);
}

/** Read by the player at the moment a sound would play. */
export const soundAllowed = current;
