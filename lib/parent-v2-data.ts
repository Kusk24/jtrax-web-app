/* Display types for the parent portal, and the calendar months it shows.
   The shapes come from the JTrax Parent design port; the data behind them is
   real backend rows, joined in components/parent/ParentData.tsx. */

export type ChildKey = string;

export interface ChildV2 {
  /** student_id — doubles as the route segment under /parent/child. */
  key: ChildKey;
  name: string;
  id: string;
  /** current_level, or "" when the office has not set one. */
  level: string;
  /** Years old, or 0 when no date of birth is on file. */
  age: number;
  photo: string;
  avBg: string;
  /** The enrolled class's name, or "—" when the child is in none. */
  clsTitle: string;
  /** enrolled_date, formatted, or "" when the child is in no class. */
  enrolledSince: string;
  /** The class's next scheduled session. A class has no fixed hours — sessions
      are written one at a time by the desk — so this is the only honest
      "schedule" the data can produce. */
  nextSession: { dateISO: string; start: string; end: string } | null;
  /** Ledger balance. Fractional — an hour of class costs an hour of credit. */
  credits: number;
  /** Sum of everything ever added, the denominator of the progress bars. */
  creditsBought: number;
  /** Latest expiry date on the ledger, formatted, or "—" when none is set. */
  valid: string;
  daysLeft: number;
  /** False once the expiry date has passed — expired, not "expiring soon". */
  expiresAhead: boolean;
  /** Attendance rows on file for this child. */
  attended: number;
  /** Sessions the enrolled class has held up to today. */
  heldSessions: number;
  /** Sessions the class has scheduled after today. */
  upcomingSessions: number;
  streak: number;
  practiceWeek: number[];
}

export type SenderKind = "teacher" | "branch" | "admin";

export interface AnnouncementV2 {
  id: string;
  sender: SenderKind;
  senderName: string;
  title: string;
  msg: string;
  child: string | null;
  cls: string | null;
  attachment: boolean;
  attachmentImg?: string;
  time: string;
}

/** One thing that happened to a child, derived from real rows: an attendance
    check-in or pick-up, or a credit balance about to expire. */
export type NotifKind = "checkin" | "pickup" | "credits";

export interface NotifV2 {
  id: string;
  kind: NotifKind;
  /** ISO timestamp — ordering and the time label. */
  at: string;
  /** Where tapping it lands. */
  href: string;
  name: string;
  cls: string;
  /** credits only: days until the balance expires, and the date it does. */
  days?: number;
  date?: string;
}

export interface TournamentV2 {
  id: string;
  name: string;
  venue: string;
  date: string;
  regDeadline: string;
  day: string;
  fee: string;
  feeAmount: number;
  closesInDays: number;
}

/** One attendance row joined to its session, for the history lists. */
export interface HistRow {
  date: string;
  iso: string;
  child: ChildKey;
  status: "Present" | "Absent";
  time: string;
}

/* ---- calendar months ----

   The attendance calendars show the three most recent months, ending with the
   current one. They used to be a fixed Apr–Jun 2026 with "today" pinned to a
   hard-coded date, which read as live data long after those months had
   passed. */

export interface MonthDef {
  year: number;
  /** 0-11 */
  month: number;
  name: string;
  days: number;
  /** Weekday index of day 1, Monday-first. */
  offset: number;
}

/** Index of the current month inside recentMonths(). */
export const CURRENT = 2;

export function recentMonths(now = new Date()): MonthDef[] {
  return Array.from({ length: 3 }, (_, i) => {
    const first = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
    return {
      year: first.getFullYear(),
      month: first.getMonth(),
      name: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(first),
      days: new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(),
      offset: (first.getDay() + 6) % 7,
    };
  });
}

/** Local calendar day as YYYY-MM-DD. `toISOString` would shift Bangkok's
    first seven hours of every morning back to yesterday. */
export function todayISO(now = new Date()): string {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
