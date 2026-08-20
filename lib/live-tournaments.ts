/* The portals' one question about tournaments: is there one to follow right
   now? Answered by the backend's public list — published, unfinished events
   only — so a card can appear while it matters and disappear when it is over. */

export type LiveTournament = { tournamentId: string; name: string; status: string };

export async function fetchLiveTournaments(): Promise<LiveTournament[]> {
  try {
    const res = await fetch("/api/public/live-tournaments", { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as LiveTournament[];
  } catch {
    // A cold backend hides the card rather than breaking the screen.
    return [];
  }
}
