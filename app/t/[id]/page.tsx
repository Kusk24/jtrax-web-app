/* The public standings page for one tournament.
 *
 * One of two routes in this app with no sign-in. A results table only signed-in
 * parents can see is not a results table — the point is that a grandparent can
 * open the link, and that it can go up on a screen in the hall.
 *
 * Server-rendered and fetched straight from the backend rather than through
 * /api: that proxy exists to attach a session token, and this page has no
 * session to attach. It also revalidates on a short interval so a projector left
 * open follows the round without anybody pressing anything.
 *
 * # Two possible sources
 *
 * When the tournament is linked to a chess-results.com event, the backend serves
 * that table instead of ours and says so. The arbiter's upload is what players
 * and federations treat as true, so the page shows it, states when it was read,
 * and links back to the source. Unlinked events keep the console's own rounds
 * and Buchholz tiebreaks.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PublicShell, PublicCard } from "@/components/public/PublicShell";
import { Bracket, knockoutRounds } from "./Bracket";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

/** Ten seconds: a board finishes every few minutes, and the page is likely to
    be open on a wall display for hours. */
export const revalidate = 10;

type Standing = {
  rank: number;
  name: string;
  category?: string;
  points: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  buchholz?: number;
  /* Present only on a chess-results table. */
  federation?: string;
  rating?: number;
  club?: string;
};

type Board = { board: number; white: string; black?: string; result: string };
type Round = { round: number; status: string; pairings: Board[] };

type Results = {
  tournament: { name: string; status: string };
  rounds: Round[];
  standings: Standing[];
  /** "chess-results" when the arbiter's table is what is being shown. */
  source?: string;
  sourceUrl?: string;
  stage?: string;
  fetchedAt?: string;
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

  const t = await getTranslations("results");
  const locale = await getLocale();
  const { tournament, standings, rounds } = data;
  const external = data.source === "chess-results";
  const started = standings.some((s) => (s.played ?? 0) > 0 || s.points > 0);
  /* When the rounds genuinely form a knockout — each one half the size of the
     last, everyone advancing from it — the bracket is the truthful picture and
     the round list would be noise. Swiss events keep the list. */
  const knockout = knockoutRounds(rounds);

  const subtitle = external
    ? data.stage || t("liveFromSource")
    : started
      ? t("liveWithCount", { count: standings.length })
      : t("registeredCount", { count: standings.length });

  return (
    <PublicShell title={tournament.name} subtitle={subtitle}>
      <div className="flex flex-col gap-4">
        {/* A page served from a cache of somebody else's site has to say so, and
            link back — a parent reading a stale table deserves to know where it
            came from and how to check it. */}
        {external && data.sourceUrl && (
          <PublicCard className="!py-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-pp-muted">
                {t("sourceNote")}
                {data.fetchedAt && (
                  <span className="ml-1 text-pp-faint">
                    {t("fetchedAt", { when: formatTime(data.fetchedAt, locale) })}
                  </span>
                )}
              </p>
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-pp-blue transition-colors duration-150 hover:text-pp-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue"
              >
                {t("openSource")}
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
                </svg>
              </a>
            </div>
          </PublicCard>
        )}

        {knockout && (
          <Bracket
            rounds={knockout}
            title={t("bracket")}
            championLabel={t("champion")}
            labels={{
              final: t("final"),
              semifinals: t("semifinals"),
              quarterfinals: t("quarterfinals"),
              round: (n: number) => t("round", { n }),
            }}
          />
        )}

        <PublicCard className="!p-0 overflow-hidden">
          <h2 className="border-b border-pp-line px-5 py-3.5 font-pp-display text-[15px] font-bold text-pp-navy">
            {t("standings")}
          </h2>
          {standings.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-pp-muted">{t("noPlayers")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-pp-mist text-[11px] uppercase tracking-wide text-pp-faint">
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold">#</th>
                    <th scope="col" className="px-4 py-2.5 text-left font-semibold">{t("player")}</th>
                    {external ? (
                      <>
                        <th scope="col" className="px-3 py-2.5 text-left font-semibold">{t("federation")}</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("rating")}</th>
                      </>
                    ) : (
                      <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">{t("wdl")}</th>
                    )}
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t("points")}</th>
                    {/* The tiebreak is shown, not hidden: when two children
                        finish level this number is the reason one is ahead. */}
                    {!external && (
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t("buchholz")}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, i) => (
                    <tr key={`${s.rank}-${s.name}-${i}`} className="border-t border-pp-line">
                      <td className={`px-4 py-2.5 font-bold ${s.rank === 1 && started ? "text-pp-blue" : "text-pp-sub"}`}>
                        {s.rank}
                      </td>
                      <td className="px-4 py-2.5 text-pp-ink">
                        {s.name}
                        {s.category && <span className="ml-2 text-xs text-pp-muted">{s.category}</span>}
                      </td>
                      {external ? (
                        <>
                          <td className="px-3 py-2.5 text-pp-muted">{s.federation || "—"}</td>
                          <td className="px-3 py-2.5 text-right text-pp-muted">{s.rating || "—"}</td>
                        </>
                      ) : (
                        <td className="whitespace-nowrap px-3 py-2.5 text-right text-pp-muted">
                          {s.wins ?? 0}/{s.draws ?? 0}/{s.losses ?? 0}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right font-bold text-pp-ink">{points(s.points)}</td>
                      {!external && (
                        <td className="px-4 py-2.5 text-right text-pp-muted">{points(s.buchholz ?? 0)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PublicCard>

        {!knockout && rounds.map((round) => (
          <PublicCard key={round.round} className="!p-0 overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-pp-line px-5 py-3.5 font-pp-display text-[15px] font-bold text-pp-navy">
              {t("round", { n: round.round })}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  round.status === "Completed"
                    ? "bg-pp-green-soft text-pp-green-dot"
                    : "bg-pp-soft text-pp-blue"
                }`}
              >
                {round.status === "Completed"
                  ? t("finished")
                  : round.status === "Playing"
                    ? t("playing")
                    : t("notStarted")}
              </span>
            </h2>
            {round.pairings.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-pp-muted">{t("notPaired")}</p>
            ) : (
              <ul>
                {round.pairings.map((b) => (
                  <li key={b.board} className="flex items-center gap-3 border-t border-pp-line px-5 py-2.5 text-sm first:border-t-0">
                    <span className="w-5 shrink-0 text-xs text-pp-faint">{b.board}</span>
                    <span className="min-w-0 flex-1 text-pp-ink">
                      {b.white}
                      {b.black ? <span className="text-pp-muted"> vs </span> : <span className="text-pp-muted"> — {t("bye")}</span>}
                      {b.black}
                    </span>
                    <span className="shrink-0 font-mono text-xs font-bold text-pp-sub">{boardResult(b.result)}</span>
                  </li>
                ))}
              </ul>
            )}
          </PublicCard>
        ))}

        <p className="text-center text-xs text-pp-faint">{t("updatesAutomatically")}</p>
      </div>
    </PublicShell>
  );
}

/** Through Intl, like every other date and number in this product. */
function formatTime(iso: string, locale: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(d);
}
