/**
 * What a tournament's card on the parent home says, at each point in its life.
 *
 * One tournament is one card, from the day registration opens to the day its
 * results are up; this decides the card's tag, whether a child is shown as
 * registered, the one action it offers, and any note — from the tournament's
 * own status, its registration state, whether its results are public, and
 * whether one of this family's children is entered.
 */
import type { RegistrationState } from "./registration-open";

export type CardTag =
  | { kind: "closesIn"; days: number }
  | { kind: "registrationClosed" }
  | { kind: "ongoing" }
  | { kind: "results" }
  | { kind: "completed" };

export type CardAction = "register" | "viewRegistration" | "viewResults" | null;

export type CardState = {
  tag: CardTag;
  /** Show "Registered" (and who). */
  registered: boolean;
  action: CardAction;
  /** "Your child was not registered for this tournament." */
  notRegisteredNote: boolean;
};

export function cardStateOf(t: {
  /** Upcoming, Ongoing or Completed — by its dates, or pinned by the office. */
  status: string;
  registration: RegistrationState;
  closesInDays: number;
  resultsPublic: boolean;
  registered: boolean;
}): CardState {
  const { registered, resultsPublic } = t;

  if (t.status === "Completed") {
    return {
      tag: resultsPublic ? { kind: "results" } : { kind: "completed" },
      registered,
      action: resultsPublic ? "viewResults" : registered ? "viewRegistration" : null,
      notRegisteredNote: resultsPublic && !registered,
    };
  }

  if (t.status === "Ongoing") {
    return {
      tag: { kind: "ongoing" },
      registered,
      /* Results once they are up; until then a registered child's entry. */
      action: resultsPublic ? "viewResults" : registered ? "viewRegistration" : null,
      notRegisteredNote: resultsPublic && !registered,
    };
  }

  /* Upcoming: registration open, or closed (by the office or by its date). */
  const open = t.registration === "open";
  return {
    tag: open ? { kind: "closesIn", days: t.closesInDays } : { kind: "registrationClosed" },
    registered,
    action: registered ? "viewRegistration" : open ? "register" : null,
    notRegisteredNote: false,
  };
}

/** Which tournaments get a card: upcoming and ongoing ones, and finished ones
    with results up, for two weeks after they end. Live first, then soonest. */
export function shownOnHome<T extends { status: string; resultsPublic: boolean; endISO: string; startISO: string }>(
  list: T[],
  todayISO: string,
  keepDays = 14,
): T[] {
  const cutoff = new Date(`${todayISO}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - keepDays);
  const since = cutoff.toISOString().slice(0, 10);
  const rank = (s: string) => (s === "Ongoing" ? 0 : s === "Upcoming" ? 1 : 2);
  return list
    .filter((t) =>
      t.status === "Upcoming" ||
      t.status === "Ongoing" ||
      (t.status === "Completed" && t.resultsPublic && (t.endISO || t.startISO) >= since),
    )
    .sort((a, b) => rank(a.status) - rank(b.status) || (rank(a.status) === 2 ? b.startISO.localeCompare(a.startISO) : a.startISO.localeCompare(b.startISO)));
}
