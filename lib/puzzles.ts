/**
 * The daily puzzle set, from the academy's own bank.
 *
 * Replaces three positions hard-coded in `student-game.ts` that were the same
 * for every pupil, every day, with their answers (`from`/`to`) sitting in the
 * browser. These come from the server matched to the pupil's rating, and the
 * solution stays there: a move is submitted and graded, never checked here.
 */

import { Chess } from "chess.js";

export type DailyPuzzle = {
  puzzleId: string;
  fen: string;
  rating: number;
  themes: string;
  /** Which colour the pupil plays, so the board can be turned round for them. */
  side: "White" | "Black";
  /** How many of the pupil's own moves the solution needs — enough to say
      "mate in 2" without saying which moves. */
  moveCount: number;
  solved: boolean;
  wrongMoves: number;
};

export type DailySet = {
  puzzles: DailyPuzzle[];
  /** Every puzzle in the bank has been set to this pupil before. Puzzles are
      never repeated, so there is genuinely nothing left to give. */
  exhausted: boolean;
  unseen: number;
};

export type Verdict = {
  correct: boolean;
  /** The whole puzzle is finished, not just this move. */
  solved: boolean;
  /** The opponent's reply, when the puzzle continues. */
  reply: string;
  /** The position after the move and any reply — the server's view, which is
      the one that counts. */
  fen: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}

export const getDailyPuzzles = () => call<DailySet>("puzzles/daily");

/** Submits one move. `played` is the pupil's own moves so far; the opponent's
    replies come from the server's copy of the solution, so it rebuilds the
    position rather than trusting whatever the board here happens to show. */
export const attemptMove = (puzzleId: string, move: string, played: string[]) =>
  call<Verdict>(`puzzles/${encodeURIComponent(puzzleId)}/attempt`, {
    method: "POST",
    body: JSON.stringify({ move, played }),
  });

export type PracticeDay = { date: string; solved: number; practised: boolean };

export type PracticeSummary = {
  /** Consecutive days ending today or yesterday. Derived on the server from
      the days actually practised — never a number this app decides. */
  streak: number;
  days: PracticeDay[];
  todaySolved: number;
  todayTotal: number;
};

export const getPracticeSummary = () => call<PracticeSummary>("practice/summary");

/** A game positioned at the puzzle, or null if the server sent a FEN this
    board cannot load — in which case the puzzle is skipped rather than drawn
    wrong. */
export function gameAt(fen: string): Chess | null {
  try {
    return new Chess(fen);
  } catch {
    return null;
  }
}

/** What to call the puzzle in one line: "Mate in 2", else the first theme. */
export function puzzleGoal(p: DailyPuzzle): { key: "mateIn" | "winIn"; count: number } {
  const mate = /\bmateIn\d?\b/i.test(p.themes) || /\bmate\b/i.test(p.themes);
  return { key: mate ? "mateIn" : "winIn", count: Math.max(1, p.moveCount) };
}
