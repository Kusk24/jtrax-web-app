/**
 * A robot game left unfinished, kept in this browser so the pupil can pick
 * it up where they left off — from Home, or by opening the same robot again.
 *
 * Only the moves are kept: the position is rebuilt from them, as the game
 * screen always does. A finished game, or one started over, is cleared. It
 * lives in this browser only; storage that is off or full just means there
 * is nothing to resume.
 */
import type { Opponent } from "@/components/game/useAiOpponent";

const KEY = "jtrax.aiGame";

export type SavedAiGame = {
  opponent: Opponent;
  moves: string[];
  /** When the first move was made, for History once the game ends. */
  startedAt: string | null;
  savedAt: string;
};

const OPPONENTS: Opponent[] = ["novice", "strong", "expert"];

/** Whether stored JSON is a game this build can resume. */
export function parseSavedAiGame(raw: string | null): SavedAiGame | null {
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as Partial<SavedAiGame>;
    if (!g || !OPPONENTS.includes(g.opponent as Opponent)) return null;
    if (!Array.isArray(g.moves) || g.moves.length === 0 || !g.moves.every((m) => typeof m === "string")) return null;
    return { opponent: g.opponent as Opponent, moves: g.moves, startedAt: g.startedAt ?? null, savedAt: g.savedAt ?? "" };
  } catch {
    return null;
  }
}

export function loadSavedAiGame(): SavedAiGame | null {
  try {
    return parseSavedAiGame(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function saveAiGame(game: Omit<SavedAiGame, "savedAt">) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...game, savedAt: new Date().toISOString() }));
  } catch {
    /* Private window or storage off: nothing to resume later. */
  }
}

export function clearSavedAiGame() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* Nothing stored, nothing to clear. */
  }
}
