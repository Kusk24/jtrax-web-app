/* Today's Activity on the parent's Children screen: minutes practised and
   Daily Challenge puzzles solved today, per child, from `practice_activity`. */

/** The daily set's size — the server's `dailyCount`. */
export const DAILY_PUZZLES = 3;

/** One child's row in Today's Activity. */
export interface TodayActivity {
  child: string;
  /** Minutes practised today. */
  mins: number;
  /** Daily Challenge puzzles solved today — the Challenge column. */
  puzzles: number;
  /** Of today's daily set, how many are solved (0 to DAILY_PUZZLES): the ring. */
  daily: number;
  /** The whole daily set solved: the ring is full and green. */
  done: boolean;
}

/**
 * Today's Activity for one child, from their `practice_activity` row for today
 * (undefined when they have not practised).
 *
 * The Challenge column used to show `max(1, minutes / 10)`: a child who had not
 * opened the app still earned "+1". It is the puzzles the server graded today.
 */
export function todayActivityOf(child: string, row: Record<string, unknown> | undefined): TodayActivity {
  const mins = Number(row?.minutes_practiced ?? 0);
  const puzzles = Number(row?.puzzles_completed ?? 0);
  const daily = Math.max(0, Math.min(DAILY_PUZZLES, puzzles));
  return { child, mins, puzzles, daily, done: daily >= DAILY_PUZZLES };
}
