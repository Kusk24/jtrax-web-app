/* Which announcements the parent home shows: the recent ones only. Every
   announcement stays on the Announcements page; the home is for what is new,
   so it would otherwise fill up with everything the office ever posted. */

/** How far back the home looks. */
export const HOME_ANNOUNCEMENT_DAYS = 30;
/** How many the home shows at most. */
export const HOME_ANNOUNCEMENT_MAX = 3;

/**
 * The announcements posted in the last `days` days, newest first, at most
 * `max`. One with no readable posted date is left to the full list.
 */
export function homeAnnouncements<T extends { postedAt: string }>(
  all: T[],
  now: Date,
  days = HOME_ANNOUNCEMENT_DAYS,
  max = HOME_ANNOUNCEMENT_MAX,
): T[] {
  const from = now.getTime() - days * 86_400_000;
  return all
    .map((a) => ({ a, at: new Date(a.postedAt).getTime() }))
    .filter(({ at }) => !Number.isNaN(at) && at >= from)
    .sort((x, y) => y.at - x.at)
    .slice(0, max)
    .map(({ a }) => a);
}
