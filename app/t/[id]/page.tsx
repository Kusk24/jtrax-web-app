/* The public standings page for one tournament.
 *
 * The only route in this app with no sign-in. A results table that only
 * signed-in parents can see is not a results table — the point is that a
 * grandparent can open the link, and that it can go up on a screen in the hall.
 *
 * Server-rendered and fetched straight from the backend rather than through
 * /api: that proxy exists to attach a session token, and this page has no
 * session to attach. It also revalidates on a short interval so a projector
 * left open follows the round without anybody pressing anything.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

/** Ten seconds: a board finishes every few minutes, and the page is likely to
    be open on a wall display for hours. */
export const revalidate = 10;

type Standing = {
  rank: number;
  name: string;
  category?: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  buchholz: number;
};

type Board = { board: number; white: string; black?: string; result: string };
type Round = { round: number; status: string; pairings: Board[] };

type Results = {
  tournament: { name: string; status: string };
  rounds: Round[];
  standings: Standing[];
};

async function fetchResults(id: string): Promise<Results | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/tournaments/${id}/results`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as Results;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchResults(id);
  // An unpublished tournament must not leak its name through a page title.
  if (!data) return { title: "JTrax" };
  return {
    title: `${data.tournament.name} — JCA Chess Academy`,
    description: `Live standings for ${data.tournament.name}.`,
  };
}

/** Points the way a chess score reads: 1, ½, 1½ — never 0.5. */
function points(value: number): string {
  const whole = Math.floor(value);
  const half = value - whole >= 0.5;
  if (whole === 0) return half ? "½" : "0";
  return half ? `${whole}½` : String(whole);
}

function boardResult(r: string): string {
  if (r === "1/2-1/2") return "½–½";
  if (r === "bye") return "bye";
  if (r === "Pending") return "·";
  return r;
}

export default async function PublicStandings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchResults(id);
  // Unpublished and non-existent are the same 404 here, exactly as the API
  // treats them — the page must not be a way to discover which ids are real.
  if (!data) notFound();

  const { tournament, standings, rounds } = data;
  const started = standings.some((s) => s.played > 0 || s.points > 0);

  return (
    <main className="min-h-dvh bg-cream px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">JCA Chess Academy</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            {tournament.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {started ? `Live standings · ${standings.length} players` : `${standings.length} players registered`}
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border-2 border-line bg-card">
          <h2 className="border-b-2 border-line px-4 py-3 text-sm font-bold text-ink">Standings</h2>
          {standings.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No players yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream text-xs text-muted">
                    <th className="px-3 py-2 text-left font-bold">#</th>
                    <th className="px-3 py-2 text-left font-bold">Player</th>
                    <th className="px-3 py-2 text-right font-bold">Pts</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right font-bold">W/D/L</th>
                    {/* The tiebreak is shown, not hidden: when two children
                        finish level this number is the reason one is ahead. */}
                    <th className="px-3 py-2 text-right font-bold">Buch.</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={`${s.rank}-${s.name}-${i}`} className="border-t border-line">
                      <td className={`px-3 py-2 font-bold ${s.rank === 1 && started ? "text-brick" : "text-ink"}`}>
                        {s.rank}
                      </td>
                      <td className="px-3 py-2 text-ink">
                        {s.name}
                        {s.category && <span className="ml-2 text-xs text-muted">{s.category}</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-ink">{points(s.points)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-muted">
                        {s.wins}/{s.draws}/{s.losses}
                      </td>
                      <td className="px-3 py-2 text-right text-muted">{points(s.buchholz)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {rounds.map((round) => (
          <section key={round.round} className="overflow-hidden rounded-2xl border-2 border-line bg-card">
            <h2 className="flex items-center gap-2 border-b-2 border-line px-4 py-3 text-sm font-bold text-ink">
              Round {round.round}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  round.status === "Completed" ? "bg-olive-soft text-ink" : "bg-navy-soft text-navy"
                }`}
              >
                {round.status === "Completed" ? "Finished" : round.status === "Playing" ? "Playing" : "Not started"}
              </span>
            </h2>
            {round.pairings.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-muted">Not paired yet.</p>
            ) : (
              <ul>
                {round.pairings.map((b) => (
                  <li key={b.board} className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
                    <span className="w-5 shrink-0 text-xs text-muted">{b.board}</span>
                    <span className="min-w-0 flex-1 text-ink">
                      {b.white}
                      {b.black ? <span className="text-muted"> vs </span> : <span className="text-muted"> — bye</span>}
                      {b.black}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-bold text-ink">{boardResult(b.result)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <footer className="pb-4 text-center text-xs text-muted">
          Updates automatically. Published by JCA Chess Academy.
        </footer>
      </div>
    </main>
  );
}
