/**
 * A puzzle's name for the Puzzles list — "Knight Fork", "Mate in 2" — from
 * the themes Lichess tags it with. The most telling theme wins: a mate
 * first, then the tactic, then the phase of the game; a puzzle with none of
 * these is named by what it asks ("Win material").
 */

/** Themes worth naming a puzzle after, most telling first. */
const THEME_ORDER = [
  "backRankMate",
  "smotheredMate",
  "mateIn1",
  "mateIn2",
  "mateIn3",
  "mateIn4",
  "mateIn5",
  "doubleCheck",
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "xRayAttack",
  "hangingPiece",
  "sacrifice",
  "attraction",
  "deflection",
  "clearance",
  "intermezzo",
  "promotion",
  "advancedPawn",
  "quietMove",
  "defensiveMove",
  "kingsideAttack",
  "exposedKing",
  "pawnEndgame",
  "endgame",
] as const;

export type PuzzleTitleKey = (typeof THEME_ORDER)[number] | "mate" | "winMaterial";

export function puzzleTitleKey(themes: string): PuzzleTitleKey {
  const tags = new Set(themes.split(/[\s,]+/).filter(Boolean));
  const named = THEME_ORDER.find((k) => tags.has(k));
  if (named) return named;
  return tags.has("mate") ? "mate" : "winMaterial";
}
