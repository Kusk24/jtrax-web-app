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
  /** Ledger balance. Fractional — an hour of class costs an hour of credit.
      The child screen shows this figure alone: a "total bought" beside it
      grows with every top-up and every balance moved in, so it reads as a
      quota when it is only history. */
  credits: number;
  /** Sum of everything ever added — the home card's bar proportion only,
      never shown as a number (see `credits` for why). */
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
  streak: number;
  practiceWeek: number[];
}

/** The academy awards a certificate after this many classes attended — the
    milestone the child screen counts toward. This is the fallback: the real
    figure is the academy's own, `certificate_sessions` in
    `system_configuration`, edited on the console's Settings screen. */
export const CERT_SESSIONS = 50;

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

/** The notification catalogue the backend sends, in the order Settings lists
    it. Low credit is the one opt-in: everything else defaults on. */
export const NOTIF_TYPES = [
  "check_in",
  "credit_deducted",
  "low_credit",
  "credit_expiry",
  "announcement",
  "payment_received",
] as const;
export type NotifType = (typeof NOTIF_TYPES)[number];

/** Which types a parent receives without touching Settings — mirrors the
    backend's notify.DefaultEnabled, which is what actually decides. */
export const NOTIF_DEFAULTS: Record<NotifType, boolean> = {
  check_in: true,
  credit_deducted: true,
  low_credit: false,
  credit_expiry: true,
  announcement: true,
  payment_received: true,
};

/** One inbox row from the backend's notification backbone. Title and body
    arrive already in the account's language — the sender picked. */
export interface InboxNotif {
  id: string;
  /** Usually one of NOTIF_TYPES, but the server catalogue can grow first. */
  type: string;
  title: string;
  body: string;
  /** ISO timestamp — ordering and the time label. */
  at: string;
  read: boolean;
  /** Where tapping it lands, derived from the payload. */
  href: string;
}

/** One of the family's children already signed up for the current tournament.
    `paid` is whether the payment against this registration has settled — by
    card through Stripe, or recorded by the front desk as paid at the counter. */
export interface TournamentEntryV2 {
  registrationId: string;
  studentId: string;
  name: string;
  status: string;
  paid: boolean;
}

export interface TournamentV2 {
  id: string;
  name: string;
  venue: string;
  date: string;
  regDeadline: string;
  day: string;
  fee: string;
  closesInDays: number;
}

/** One attendance row joined to its session, for the history lists. */
export interface HistRow {
  date: string;
  iso: string;
  child: ChildKey;
  status: "Present" | "Absent";
  time: string;
  /** The session's own class — not the child's current one, which would
      relabel every old row the day the child changes class. */
  cls: string;
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

/** How stale the most recent practice may be and still count as a live run.
    One day, so a child who has not practised *yet today* keeps the streak they
    earned yesterday — it breaks at the end of the day they miss, not at
    midnight of the day they are still in. */
const STREAK_GRACE_DAYS = 1;

/**
 * Consecutive days practised, ending today or yesterday.
 *
 * This is `currentStreak` in the backend's `internal/api/practice.go`, in
 * TypeScript. The pupil's own portal asks the server for its number, and the
 * two screens describe the same child — so the rule has to be the same rule,
 * not merely a similar one. The parent portal cannot call that endpoint: it
 * derives the whole of a child from the CRUD collections, and
 * `practice/summary` answers only for whoever is signed in.
 *
 * What it must not do is read `student.streak_count`. That column is a number
 * the browser used to post and nothing ever recomputed, so a child who had not
 * practised since May still showed twelve days. The backend stopped writing it
 * and made it un-writable — the comment on `practice-activities` in
 * `registry.go` says a stored number could only disagree with the truth — and
 * this screen was the last one still believing it.
 *
 * @param dates `activity_date` strings, any order, duplicates allowed.
 * @param today The day to count back from.
 */
export function streakFrom(dates: string[], today = new Date()): number {
  const todayStr = todayISO(today);
  /* Distinct, no later than today, newest first — the same shape as the
     backend's `SELECT DISTINCT ... ORDER BY activity_date DESC`. Lexical sort
     is date order for YYYY-MM-DD. */
  const days = [...new Set(dates.filter((d) => d && d <= todayStr))].sort().reverse();

  let streak = 0;
  /* The day the next entry has to be to continue the run. It starts at today
     and is allowed to slip once, by the grace, before the first hit. */
  let want = todayStr;
  let first = true;
  for (const day of days) {
    if (first) {
      if (dayGap(day, todayStr) > STREAK_GRACE_DAYS) return 0; // the run ended before today
      want = day;
      first = false;
    } else if (day !== want) {
      break; // a missing day ends it
    }
    streak++;
    want = shiftDay(want, -1);
  }
  return streak;
}

/** Whole days between two YYYY-MM-DD dates, `later - earlier`. Built from the
    date parts rather than `new Date(str)`, which parses a bare date as UTC and
    would put the boundary seven hours out in Bangkok. */
function dayGap(earlier: string, later: string): number {
  return Math.round((utcOf(later) - utcOf(earlier)) / 86400_000);
}

function shiftDay(day: string, by: number): string {
  const d = new Date(utcOf(day) + by * 86400_000);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Midnight UTC for a YYYY-MM-DD, used only to count days between two of
    them — never to display one, so the zone it lands in does not matter as
    long as both sides use the same one. */
function utcOf(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}
