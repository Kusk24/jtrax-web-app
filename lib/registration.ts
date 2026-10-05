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
  /** The organiser uploaded a banner; without one the page draws its own. */
  hasBanner?: boolean;
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
  /** Whether Pay & Register can go on to Stripe. Without it the entry is saved
      and paid at the desk. */
  cardPayments?: boolean;
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
  /** The ID card check the scan returned. Required: the server takes the
      date of birth, and so the age group, from it. The card itself is not
      sent or kept. */
  idCheck: string;
  /** Printed on the pairing card and called across the hall. */
  nickname?: string;
  /** As claimed. The backend prefers the date of birth where there is one —
      that is what a card proves — and uses this only when there is not. */
  age?: number;
  /** The five conditions on the entry form. The backend refuses the entry
      without it rather than defaulting it: a record that can mean "we assumed
      yes" answers nothing three weeks later. */
  acceptTerms: boolean;
  /** As a Thai ID card prints it; a passport holder has none. */
  nameTh?: string;
  documentType?: "thai-id" | "passport";
  /** What the ID card scan read, kept beside what was submitted so staff can
      check an age group against the document. */
  scannedName?: string;
  scannedDateOfBirth?: string;
  /** "now" goes on to Stripe and is emailed once the payment settles or
      fails; "later" is emailed the pay link at once. Left out, it is "later". */
  payChoice?: "now" | "later";
};

/** The age a category name implies — "U8 Boys", "U08" and "Under 8" are
    under 8. Mirrors the
    backend's rule, which is the one that actually decides; this exists so the
    form can grey out what it would refuse rather than take an entry and then
    reject it. */
export function categoryAgeLimit(name: string): number {
  const m = /\bU(?:nder)?[\s-]?(\d{1,2})\b/i.exec(name);
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

/** The first birth year an under-`limit` category takes at an event held in
    `year` — chess groups go by birth year, so U10 in 2026 is anybody born in
    2016 or later. */
export function earliestBirthYear(limit: number, year: number): number {
  return year - limit;
}

/** Whether a player of this date of birth may enter this category at an event
    starting on `startDate`. By birth year, as the backend decides it. A
    category with no age in its name is open to everyone; one that has an age
    needs a date of birth before it can be judged. `bornFrom` is the earliest
    birth year it takes, for the "born on or after" line. */
export function categoryAllows(
  categoryName: string,
  dateOfBirth: string,
  startDate: string,
): { allowed: boolean; limit: number; needsDob: boolean; bornFrom: number } {
  const limit = categoryAgeLimit(categoryName);
  const start = new Date(startDate || new Date().toISOString().slice(0, 10));
  const year = Number.isNaN(start.getTime()) ? new Date().getFullYear() : start.getFullYear();
  if (limit === 0) return { allowed: true, limit: 0, needsDob: false, bornFrom: 0 };
  const bornFrom = earliestBirthYear(limit, year);
  if (!dateOfBirth) return { allowed: false, limit, needsDob: true, bornFrom };
  const dob = new Date(dateOfBirth);
  return { allowed: !Number.isNaN(dob.getTime()) && dob.getFullYear() >= bornFrom, limit, needsDob: false, bornFrom };
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
  /** What the server recorded: "now", "later", or "" when there is nothing to pay. */
  payChoice?: string;
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
  // multipart/form-data, as the server reads it. Leave Content-Type unset —
  // the browser fills in the multipart boundary itself.
  const body = new FormData();
  body.set("name", input.name);
  body.set("email", input.email);
  body.set("phone", input.phone);
  if (input.dateOfBirth) body.set("dateOfBirth", input.dateOfBirth);
  if (input.categoryId) body.set("categoryId", input.categoryId);
  if (input.isStudent) body.set("isStudent", "true");
  if (input.studentId) body.set("studentId", input.studentId);
  if (input.nickname) body.set("nickname", input.nickname);
  if (input.age) body.set("age", String(input.age));
  body.set("acceptTerms", input.acceptTerms ? "true" : "false");
  if (input.nameTh) body.set("nameTh", input.nameTh);
  if (input.documentType) body.set("documentType", input.documentType);
  if (input.scannedName) body.set("scannedName", input.scannedName);
  if (input.scannedDateOfBirth) body.set("scannedDateOfBirth", input.scannedDateOfBirth);
  body.set("idCheck", input.idCheck);
  if (input.payChoice) body.set("payChoice", input.payChoice);

  const res = await fetch(`/api/public/tournaments/${tournamentId}/register`, {
    method: "POST",
    body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    /* With its status, so the form can put a refusal in the family's words. */
    throw new EntryError(res.status, (data as { error?: string }).error ?? "registration failed");
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
  /** What it costs today: the early-bird price while that holds, the regular after. */
  fee: number;
  /** "unpaid", "paid", "free" (nothing to pay), "cancelled" (registration closed
      unpaid, so the place was released) or "closed" (withdrawn or refunded). */
  state: "unpaid" | "paid" | "free" | "cancelled" | "closed";
  cardPayments: boolean;
  startDate?: string;
  endDate?: string;
  venue?: string;
  /** When registration closes: the last day to pay. */
  registrationDeadline?: string;
  /** The payment's own word. */
  paymentStatus?: "Pending" | "Paid" | "Cancelled";
  amountPaid?: number;
  /** While the early-bird price holds: until when, and the price after. */
  earlyBirdUntil?: string;
  regularFee?: number;
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
  /** The whole name in Thai script, off a Thai ID card. */
  thaiName?: ScannedField;
  /** "thai-id", "passport", or "" when the server would not classify it. */
  documentType: string;
};

/** What a scan answers: what the card said, and the check an entry names. */
export type IDCardScan = { fields: ScannedIDCard; checkId: string };

async function postCard(url: string, image: File): Promise<IDCardScan> {
  const body = new FormData();
  body.append("image", image);
  const res = await fetch(url, { method: "POST", body, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "could not read the card");
  }
  return data as IDCardScan;
}

/**
 * Read a Thai ID card or passport for the player's date of birth — the step
 * every entry takes. The server keeps what it read, not the photo, and the
 * entry's age group goes by that date.
 */
export const scanIDCard = (tournamentId: string, image: File) =>
  postCard(`/api/public/tournaments/${tournamentId}/scan-id`, image);

/** The same, from the parent portal, for one of the parent's children. */
export const scanChildIDCard = (tournamentId: string, studentId: string, image: File) =>
  postCard(`/api/tournaments/${tournamentId}/scan-id?student_id=${encodeURIComponent(studentId)}`, image);

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

/* ---- The arrival reminder: "are you coming?" ---- */

export type ArrivalStatus = "Pending" | "Confirmed" | "NotAttending";

export type ArrivalEntry = {
  tournamentName: string;
  participantName: string;
  startDate: string;
  venue?: string;
  status: ArrivalStatus;
  /** False once the tournament has started: the answer is then final. */
  open: boolean;
};

/** The entry is in the path, the code after the #, as the email writes it. */
export function readArrivalLink(pathname: string, hash: string): { entry: string; code: string } | null {
  const entry = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "");
  const code = new URLSearchParams(hash.replace(/^#/, "")).get("code") ?? "";
  if (!entry || entry === "arrival" || !/^[0-9a-f]{64}$/.test(code)) return null;
  return { entry, code };
}

/**
 * Every entry a family's link answers for: the one in the path, then each
 * `also=<entry>.<code>` after the # — one email for a parent with two
 * children in a tournament. A malformed extra is skipped; an empty list means
 * the link does not work.
 */
export function readArrivalLinks(pathname: string, hash: string): Array<{ entry: string; code: string }> {
  const first = readArrivalLink(pathname, hash);
  if (!first) return [];
  const also = new URLSearchParams(hash.replace(/^#/, "")).get("also") ?? "";
  const more = also
    .split(",")
    .map((pair) => {
      const dot = pair.lastIndexOf(".");
      return { entry: decodeURIComponent(pair.slice(0, dot)), code: pair.slice(dot + 1) };
    })
    .filter((x) => x.entry && /^[0-9a-f]{64}$/.test(x.code) && x.entry !== first.entry);
  return [first, ...more];
}

async function postArrival(entry: string, suffix: string, body: Record<string, string>): Promise<ArrivalEntry> {
  const res = await fetch(`/api/public/arrival/${encodeURIComponent(entry)}${suffix}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new EntryError(res.status, (data as { error?: string }).error ?? "request failed");
  return data as ArrivalEntry;
}

export const getArrival = (entry: string, code: string) => postArrival(entry, "", { code });
export const answerArrival = (entry: string, code: string, answer: "Confirmed" | "NotAttending") =>
  postArrival(entry, "/answer", { code, answer });
