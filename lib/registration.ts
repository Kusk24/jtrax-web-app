/**
 * The public tournament API, as a stranger sees it.
 *
 * Reads happen on the server so the page arrives filled in and shareable; the
 * write happens in the browser, through the same-origin proxy, because a form
 * submission needs to report back to the person who pressed the button.
 *
 * Nothing here carries a session. These are the only calls in this app that
 * deliberately have no identity behind them.
 */

export type PublicTournament = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  venueName: string;
  venueAddress: string;
  registrationDeadline: string;
  /** What an outside participant pays right now: the early-bird price while
      its window is open, the regular price after. */
  fee: number;
  regularFee: number;
  earlyBirdFee?: number;
  earlyBirdUntil?: string;
  earlyBirdActive: boolean;
  /** Whether the organiser's regulation document can be read. */
  hasRegulation: boolean;
  /** What one of the academy's own students pays — the discount comes off the
      regular fee, so it never stacks with early bird. */
  studentFee: number;
  studentDiscountPct: number;
  capacity: number | null;
  taken: number;
  spotsLeft: number | null;
  open: boolean;
  /** "deadline" or "full" — why it closed, when it has. */
  closedReason?: string;
};

export type PublicCategory = { id: string; name: string };

export type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  categoryId?: string;
  isStudent?: boolean;
  /** Required when isStudent: the discount is only given against an ID the
      academy can find. */
  studentId?: string;
  /** Printed on the pairing card and called across the hall. */
  nickname?: string;
  /** As claimed. The backend prefers the date of birth where there is one —
      that is what a card proves — and uses this only when there is not. */
  age?: number;
  /** The five conditions on the entry form. The backend refuses the entry
      without it rather than defaulting it: a record that can mean "we assumed
      yes" answers nothing three weeks later. */
  acceptTerms: boolean;
};

/** The age a category name implies — "U8 Boys" is under 8. Mirrors the
    backend's rule, which is the one that actually decides; this exists so the
    form can grey out what it would refuse rather than take an entry and then
    reject it. */
export function categoryAgeLimit(name: string): number {
  const m = /\bU\s?(\d{1,2})\b/i.exec(name);
  return m ? Number(m[1]) : 0;
}

/** Completed years on a date. The tournament's start day is the day the age
    matters, so that is what a category is checked against. */
export function ageOn(dateOfBirth: string, on: string): number | null {
  const dob = new Date(dateOfBirth);
  const day = new Date(on);
  if (isNaN(dob.getTime()) || isNaN(day.getTime())) return null;
  let years = day.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    day.getMonth() < dob.getMonth() ||
    (day.getMonth() === dob.getMonth() && day.getDate() < dob.getDate());
  if (beforeBirthday) years--;
  return years;
}

/** Whether a player of this date of birth may enter this category on this
    day. A category with no age in its name is open to everyone; a category
    that has one needs a date of birth before it can be judged. */
export function categoryAllows(
  categoryName: string,
  dateOfBirth: string,
  startDate: string,
): { allowed: boolean; limit: number; needsDob: boolean } {
  const limit = categoryAgeLimit(categoryName);
  if (limit === 0) return { allowed: true, limit: 0, needsDob: false };
  if (!dateOfBirth) return { allowed: false, limit, needsDob: true };
  const age = ageOn(dateOfBirth, startDate || new Date().toISOString().slice(0, 10));
  return { allowed: age !== null && age < limit, limit, needsDob: false };
}

export type RegisterResult = {
  registered: boolean;
  status: string;
  feeQuoted: number;
  needsApproval: boolean;
  /** The entry, and the secret that lets whoever holds it pay for it. Shown to
      this browser once; the confirmation email carries the same code. */
  registrationId?: string;
  payCode?: string;
  /** Whether "Pay now" can be offered: card payments are on and there is a fee. */
  cardPayments?: boolean;
  /** Whether the server can send email, so the screen only says "we've
      emailed you" when it could have. */
  emailed?: boolean;
};

/** Posts one entry. Throws with the server's own message, which is written to
    be shown to whoever is standing at the form. */
export async function registerForTournament(
  tournamentId: string,
  input: RegisterInput,
): Promise<RegisterResult> {
  const res = await fetch(`/api/public/tournaments/${tournamentId}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "registration failed");
  }
  return data as RegisterResult;
}

/* ------------------------------------------------- paying for a public entry --- */

/** One public entry, as the holder of its pay link sees it. */
export type PublicEntry = {
  tournamentId: string;
  tournamentName: string;
  participantName: string;
  category?: string;
  fee: number;
  /** "unpaid", "paid", "free" (nothing to pay) or "closed" (withdrawn or refunded). */
  state: "unpaid" | "paid" | "free" | "closed";
  cardPayments: boolean;
};

/**
 * Reads the entry id and code out of the emailed pay link:
 * `/register/{tournament}/pay?entry={id}#code={code}`.
 *
 * The code sits after the `#` because a browser never sends that part to a
 * server, which keeps it out of the web host's request logs. It is then posted
 * in a body, never put in a URL.
 */
export function readPayLink(search: string, hash: string): { entry: string; code: string } | null {
  const entry = new URLSearchParams(search).get("entry") ?? "";
  const code = new URLSearchParams(hash.replace(/^#/, "")).get("code") ?? "";
  if (!entry || !/^[0-9a-f]{64}$/.test(code)) return null;
  return { entry, code };
}

async function postEntry<T>(entry: string, suffix: string, code: string): Promise<T> {
  const res = await fetch(`/api/public/tournament-registrations/${encodeURIComponent(entry)}${suffix}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new EntryError(res.status, (data as { error?: string }).error ?? "request failed");
  }
  return data as T;
}

/** Carries the status, so the page can tell "this link does not work" (404)
    from "already paid" (409) from "card payments are off" (503). */
export class EntryError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const getPublicEntry = (entry: string, code: string) => postEntry<PublicEntry>(entry, "", code);

/** Opens the Stripe page for the entry and returns its URL. Asking twice gives
    the same page, so a double tap cannot charge twice. */
export const payForPublicEntry = (entry: string, code: string) =>
  postEntry<{ url: string }>(entry, "/pay", code).then((r) => r.url);

/* ------------------------------------------------------ reading an ID card --- */

/** One value read off a document, with how sure the model was of it. */
export type ScannedField = { value: string; confidence: number };

export type ScannedIDCard = {
  firstName: ScannedField;
  lastName: ScannedField;
  /** YYYY-MM-DD, already converted out of the Buddhist era by the server. */
  dateOfBirth: ScannedField;
  /** "thai-id", "passport", or "" when the server would not classify it. */
  documentType: string;
};

/**
 * Read a Thai ID card or passport, to fill in the name and age.
 *
 * A convenience, never a requirement: the image is not stored, nothing is
 * submitted by this call, and an entrant who skips it or whose photo cannot be
 * read types their details exactly as before. So every failure here is
 * recoverable by ignoring it, which is why the form treats an error as a hint
 * rather than a blocked path.
 */
export async function scanIDCard(tournamentId: string, image: File): Promise<ScannedIDCard> {
  const body = new FormData();
  body.append("image", image);
  const res = await fetch(`/api/public/tournaments/${tournamentId}/scan-id`, {
    method: "POST",
    body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "could not read the card");
  }
  return (data as { fields: ScannedIDCard }).fields;
}

/** Whole years old on `on`, from a YYYY-MM-DD date of birth. 0 when unknown. */
export function ageFromDOB(dob: string, on = new Date()): number {
  if (!dob) return 0;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  let age = on.getFullYear() - d.getFullYear();
  const before =
    on.getMonth() < d.getMonth() ||
    (on.getMonth() === d.getMonth() && on.getDate() < d.getDate());
  if (before) age--;
  return Math.max(0, age);
}
