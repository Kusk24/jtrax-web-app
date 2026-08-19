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
  fee: number;
  /** What one of the academy's own students pays. */
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
};

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
