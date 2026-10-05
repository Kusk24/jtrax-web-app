/* Hours of class a child has attended — what the certificate milestone counts
   (`certificate_hours`). Each visit counts the time they were in the class:
   from when they arrived (or the class began) to when they left (or the class
   ended), the same span a class is charged for. A visit with no check-out yet
   counts to the end of the class. */

type Visit = { session_id?: unknown; check_in_time?: unknown; check_out_time?: unknown };
type Session = { session_id?: unknown; session_date?: unknown; start_time?: unknown; end_time?: unknown };

/** A stored time as a moment: one with a zone as given, one without in Bangkok time. */
function moment(raw: unknown): number {
  const v = String(raw ?? "").trim().replace(" ", "T");
  if (!v) return NaN;
  const zoned = /([zZ]|[+-]\d{2}:?\d{2})$/.test(v);
  return new Date(zoned ? v : `${v}+07:00`).getTime();
}

/** The class's start or end on its day, in Bangkok time. */
function at(day: unknown, clock: unknown): number {
  const d = String(day ?? "").slice(0, 10);
  const c = String(clock ?? "").slice(0, 5);
  return d && c ? new Date(`${d}T${c}:00+07:00`).getTime() : NaN;
}

export function hoursAttended(visits: Visit[], sessions: Session[]): number {
  const byId = new Map(sessions.map((s) => [String(s.session_id), s]));
  let ms = 0;
  for (const v of visits) {
    if (!v.check_in_time) continue;
    const s = byId.get(String(v.session_id));
    if (!s) continue;
    const begin = at(s.session_date, s.start_time);
    const end = at(s.session_date, s.end_time);
    if (Number.isNaN(begin) || Number.isNaN(end) || end <= begin) continue;
    const arrived = moment(v.check_in_time);
    const left = moment(v.check_out_time);
    const from = Number.isNaN(arrived) ? begin : Math.max(begin, arrived);
    const to = Number.isNaN(left) ? end : Math.min(end, left);
    if (to > from) ms += to - from;
  }
  return Math.round((ms / 3_600_000) * 100) / 100;
}
