/* Today's Activity on the parent's Children screen: minutes practised and
   Daily Challenge puzzles solved today, per child, from `practice_activity`. */

/** One child's row in Today's Activity. */
export interface TodayActivity {
  child: string;
  /** Minutes practised today. */
  mins: number;
  /** Daily Challenge puzzles solved today — the Challenge column. */
  puzzles: number;
  /** Half an hour or more: the ring is full. */
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
  return { child, mins, puzzles: Number(row?.puzzles_completed ?? 0), done: mins >= 30 };
}
