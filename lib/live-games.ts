/**
 * The parts of a class game that are about the game rather than the board:
 * how it ended, the clock, and which games are waiting for this pupil.
 *
 * Mirrors jtrax-admin's `lib/games.ts` so the console and the pupil describe a
 * game in the same words.
 */

export type GameClock = { whiteMs: number; blackMs: number; at: string };

/**
 * The message key for how a game ended, or "" when it is not one we name.
 *
 * Our own board records chess's terms ("Checkmate", "Resignation", and
 * "Agreement" for an agreed draw); a rated game Lichess ended records
 * "lichess:" and Lichess's status ("outoftime"). Both read the same.
 */
export function reasonKey(reason: string | undefined): string {
  if (!reason) return "";
  const lichess: Record<string, string> = {
    mate: "Checkmate",
    resign: "Resignation",
    stalemate: "Stalemate",
    outoftime: "TimeOut",
    timeout: "Abandoned",
    draw: "Agreement",
    aborted: "Aborted",
    noStart: "Aborted",
  };
  if (reason.startsWith("lichess:")) return lichess[reason.slice(8)] ?? "";
  return reason;
}

/**
 * A rated game's clock as it stands at `now`: the side to move has been
 * counting down since Lichess last reported; the other side is paused.
 */
export function clockAt(
  clock: GameClock | undefined,
  turn: "White" | "Black" | undefined,
  running: boolean,
  now: number,
): { white: number; black: number } | null {
  if (!clock) return null;
  let { whiteMs: white, blackMs: black } = clock;
  const since = Date.parse(clock.at);
  if (running && !Number.isNaN(since)) {
    const elapsed = Math.max(0, now - since);
    if (turn === "White") white -= elapsed;
    if (turn === "Black") black -= elapsed;
  }
  return { white: Math.max(0, white), black: Math.max(0, black) };
}

/** "4:07", or "0:09.4" under ten seconds, when a tenth matters. */
export function fmtClock(ms: number): string {
  const total = Math.max(0, ms) / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total - minutes * 60;
  if (total < 10) return `0:${seconds.toFixed(1).padStart(4, "0")}`;
  return `${minutes}:${String(Math.floor(seconds)).padStart(2, "0")}`;
}

/** "10+5" — minutes and increment seconds. */
export function timeControlLabel(tc: { limit: number; increment: number } | undefined): string {
  if (!tc) return "";
  const minutes = tc.limit / 60;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}+${tc.increment}`;
}

export type MyGame = {
  gameRoomId: string;
  status: "Open" | "Active" | "Finished" | "Cancelled";
  white: { userAccountId: string; displayName: string } | null;
  black: { userAccountId: string; displayName: string } | null;
  turn?: "White" | "Black";
  label?: string;
  timeControl?: { limit: number; increment: number };
  lichessRated: boolean;
  createdAt: string;
  /** Moves played so far — a waiting game that has some was paused and
      resumed, and is continued rather than started. */
  moveCount?: number;
  /** Whether each player has pressed Enter. A game the office sets up waits
      until both have. */
  whiteEntered?: boolean;
  blackEntered?: boolean;
  /** Paused by the office mid-game: nobody can move until it resumes it. */
  stopped?: boolean;
};

/** Where this pupil stands with one of their games. */
export type GameStep = "invited" | "waitingForOpponent" | "inPlay" | "onHold";

export function stepOf(
  game: Pick<MyGame, "status" | "white" | "whiteEntered" | "blackEntered" | "stopped">,
  myAccountId: string,
): GameStep {
  if (game.stopped) return "onHold";
  if (game.status === "Active") return "inPlay";
  const white = game.white?.userAccountId === myAccountId;
  const mine = white ? game.whiteEntered : game.blackEntered;
  return mine ? "waitingForOpponent" : "invited";
}

/**
 * The games this pupil is seated in and has not finished — a game the office
 * started for them, or one a friend accepted. The server lists only the
 * caller's own rooms, so nobody else's game can appear here.
 */
export function unfinished<G extends Pick<MyGame, "status">>(games: G[]): G[] {
  return games.filter((g) => g.status === "Active" || g.status === "Open");
}
