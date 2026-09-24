/* The class count a parent sees on each child's card and a pupil sees on their
   own Profile — one rule, so the two screens cannot disagree. */

/**
 * How many classes a child has been to: attendance rows with a check-in, on a
 * session that is still on the timetable.
 *
 * Both conditions are the ones the attendance history already applies — a row
 * without a check-in is listed there as Absent, and a row whose session is gone
 * is not listed at all — so the count and the list under it cannot disagree.
 * Counting every row on file put "3 / 1 classes" on a child's card. The pupil's
 * Profile uses the same count; it used to read `last_attended_date` and could
 * only ever say "0" or "1+".
 *
 * @param attendance One child's attendance rows.
 * @param sessionIds Every `session_id` on the timetable.
 */
export function classesAttended(
  attendance: { session_id?: unknown; check_in_time?: unknown }[],
  sessionIds: ReadonlySet<string>,
): number {
  return attendance.filter((a) => !!a.check_in_time && sessionIds.has(String(a.session_id))).length;
}
