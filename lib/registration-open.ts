/* Whether a tournament is taking entries from the parent portal — the same
   doors the backend checks (tournamententry.go entryClosed): the organiser's
   registration switch on the tournament's card, and the closing date. A full
   tournament is refused by the server; the page cannot count the places. */
export type RegistrationState = "open" | "closed" | "deadline";

export function registrationState(
  t: { public_registration?: unknown; registration_deadline?: unknown },
  todayISO: string,
): RegistrationState {
  const open = t.public_registration === true || t.public_registration === 1 || t.public_registration === "1";
  if (!open) return "closed";
  const deadline = String(t.registration_deadline ?? "").slice(0, 10);
  if (deadline && todayISO > deadline) return "deadline";
  return "open";
}
