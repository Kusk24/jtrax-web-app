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
  /** A Google Maps link for the venue, set by staff at creation. Absent for
      tournaments created before this existed. */
  venueMapUrl?: string;
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
  phone: string;
  dateOfBirth?: string;
  categoryId?: string;
  isStudent?: boolean;
  /** Required when isStudent: the discount is only given against an ID the
      academy can find. */
  studentId?: string;
  /** A photo of the player's Thai national ID card or passport, so staff can
      check a face at the board against who registered. Required — there is
      no version of this form that skips it. */
  idDocument: File;
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
};

/** Posts one entry. Throws with the server's own message, which is written to
    be shown to whoever is standing at the form. */
export async function registerForTournament(
  tournamentId: string,
  input: RegisterInput,
): Promise<RegisterResult> {
  // multipart/form-data, not JSON: the ID document has to ride along with
  // the rest of the entry. Leave Content-Type unset — the browser fills in
  // the multipart boundary itself.
  const body = new FormData();
  body.set("name", input.name);
  body.set("email", input.email);
  body.set("phone", input.phone);
  if (input.dateOfBirth) body.set("dateOfBirth", input.dateOfBirth);
  if (input.categoryId) body.set("categoryId", input.categoryId);
  if (input.isStudent) body.set("isStudent", "true");
  if (input.studentId) body.set("studentId", input.studentId);
  body.set("idDocument", input.idDocument);

  const res = await fetch(`/api/public/tournaments/${tournamentId}/register`, {
    method: "POST",
    body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "registration failed");
  }
  return data as RegisterResult;
}
