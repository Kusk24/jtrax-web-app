/**
 * The student portal's points, level, streaks and history.
 *
 * Everything here is read from the server, which works the numbers out from
 * what was actually recorded (jtrax-backend internal/api/progress.go). The
 * browser never adds points itself: the "+5 points" a pupil sees after a
 * puzzle is the rule being shown, and the total is re-read afterwards.
 */

/** The academy's points rule — shown to pupils, applied by the server. */
export const POINTS = { puzzle: 5, game: 10, challenge: 10 } as const;

export type ChallengeDay = {
  date: string;
  solved: number;
  total: number;
  complete: boolean;
  points: number;
};

export type Progress = {
  points: { total: number; puzzles: number; games: number; challenges: number };
  level: { level: number; into: number; toNext: number; size: number };
  streak: { current: number; longest: number };
  gamesPlayed: number;
  gamesWon: number;
  puzzlesSolved: number;
  challengesCompleted: number;
  challenges: ChallengeDay[];
  practisedDays: string[];
};

export type HistoryEntry = {
  kind: "solo" | "room" | "puzzle";
  id: string;
  at: string;
  day: string;
  against: string;
  result?: string;
  reason?: string;
  moves?: number;
  startedAt?: string;
  source?: "daily" | "free";
  lichessGameId?: string;
  opponent?: string;
  side?: "white" | "black";
  timeControl?: string;
  gameType?: "computer" | "class" | "challenge";
  points?: number;
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

export const getProgress = () => call<Progress>("student/progress");

export const getHistory = (studentId: string) =>
  call<{ history: HistoryEntry[] }>(`students/${encodeURIComponent(studentId)}/history`).then((r) => r.history);

/** A finished game against the computer, so it counts and can be replayed. */
export const recordSoloGame = (game: { opponent: string; moves: string[]; result: string; reason: string; startedAt?: string }) =>
  call<{ recorded: boolean }>("games/solo", { method: "POST", body: JSON.stringify(game) });

export type SoloGame = {
  id: string;
  opponent: string;
  side: "white" | "black";
  moves: string[];
  result: string;
  reason: string;
  at: string;
};

export const getSoloGame = (id: string) => call<SoloGame>(`games/solo/${encodeURIComponent(id)}`);

/** Win, loss or draw, from the pupil's side of the board. */
export function outcomeOf(result: string | undefined, side: "white" | "black" | undefined): "win" | "loss" | "draw" | null {
  if (!result || !side) return null;
  if (result === "1/2-1/2") return "draw";
  const whiteWon = result === "1-0";
  return whiteWon === (side === "white") ? "win" : "loss";
}

/** A finished game, not one still on the board. */
export const isFinishedGame = (e: HistoryEntry) => (e.kind === "solo" || e.kind === "room") && !!e.result;
