/* The public standings page for one tournament.
 *
 * One of two routes in this app with no sign-in. A results table only signed-in
 * parents can see is not a results table — the point is that a grandparent can
 * open the link, and that it can go up on a screen in the hall.
 *
 * Server-rendered and fetched straight from the backend rather than through
 * /api: that proxy exists to attach a session token, and this page has no
 * session to attach. The client half polls a refresh once a
 * minute, so a projector left open follows the round without anybody pressing
 * anything — and that same poll is what nudges the backend to re-read
 * chess-results while the event is live.
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
import { TournamentBanner } from "@/components/public/TournamentBanner";
import { SiteFooter } from "@/components/public/SiteFooter";
import { Bracket, knockoutRounds } from "./Bracket";
import { CategoryResults, type Category } from "./CategoryResults";
import { ResultsView } from "./ResultsView";

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

type Board = {
  board: number;
  white: string;
  whiteRating?: number;
  black?: string;
  blackRating?: number;
  result: string;
};
type Round = { round: number; date?: string; status: string; pairings: Board[] };

type Results = {
  tournament: {
    name: string;
    status: string;
    /* For the banner, the same one the registration page opens with. */
    startDate?: string;
    endDate?: string;
    venueName?: string;
    venueAddress?: string;
    hasBanner?: boolean;
  };
  rounds: Round[];
  standings: Standing[];
  /** "chess-results" when the arbiter's table is what is being shown. */
  source?: string;
  sourceUrl?: string;
  stage?: string;
  fetchedAt?: string;
  /** A tournament connected with one link: every chess-results category,
      each with its own table. When present, the page is these. */
  sections?: Category[];
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

  const categories = data.sections ?? [];
  const dates = [tournament.startDate, tournament.endDate].filter((d): d is string => !!d);
  const when =
    dates.length === 2 && dates[0] !== dates[1]
      ? `${formatDate(dates[0], locale)} – ${formatDate(dates[1], locale)}`
      : dates.length
        ? formatDate(dates[0], locale)
        : "";
  const hero = (
    <TournamentBanner
      name={tournament.name}
      when={when}
      venue={tournament.venueName || tournament.venueAddress}
      imageUrl={tournament.hasBanner ? `/api/tournaments/${id}/banner` : undefined}
      className="w-full rounded-2xl shadow-[0_12px_32px_rgba(35,53,94,.14)]"
    />
  );
  const subtitle = categories.length > 0
    ? t("liveFromSource")
    : external
    ? data.stage || t("liveFromSource")
    : started
      ? t("liveWithCount", { count: standings.length })
      : t("registeredCount", { count: standings.length });

  return (
    /* The tournament's banner across the top, as on its registration page.
       The banner carries the name, so the heading is for screen readers; the
       line saying where the table comes from is kept, under the banner. */
    <PublicShell footer={<SiteFooter />} title={tournament.name} subtitle={subtitle} hero={hero} titleHidden>
      <p className="mb-4 text-center text-sm text-pp-sub">{subtitle}</p>
      {categories.length > 0 ? (
        <div className="flex flex-col gap-4">
          <CategoryResults categories={categories} />
          <p className="text-center text-xs text-pp-sub">{t("updatesAutomatically")}</p>
        </div>
      ) : (
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
                  <span className="ml-1 text-pp-muted">
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

        {/* Search, round picker and tables live in a client component: finding a
            player and switching rounds are interactions, and the once-a-minute
            refresh that keeps a projector honest can only run in the browser. */}
        <ResultsView standings={standings} rounds={knockout ? [] : rounds} external={external} />

        <p className="text-center text-xs text-pp-sub">{t("updatesAutomatically")}</p>
      </div>
      )}
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

function formatDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}
