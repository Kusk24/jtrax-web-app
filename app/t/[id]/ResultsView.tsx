"use client";

/* The interactive half of the public standings page.
 *
 * Split from the server page for three jobs the server cannot do:
 *
 * - **Find a player.** At a tournament the question is "where is my child" —
 *   typing a name filters the standings to them and lays out every game they
 *   have: round, board, colour, opponent, result. Matching is plain substring
 *   over the arbiter's spelling, because that spelling is what is on the wall.
 * - **One round at a time.** A nine-round Swiss as nine stacked cards is a
 *   scroll through history; a picker defaulting to the newest round shows the
 *   pairings people are actually standing in front of.
 * - **Actually following along.** The server page revalidates, but a page left
 *   open on a projector never reloads itself — this polls a refresh once a
 *   minute, which is also what nudges the backend to re-read chess-results.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PublicCard } from "@/components/public/PublicShell";

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

/** Points the way a chess score reads: 1, ½, 1½ — never 0.5. */
function points(value: number): string {
  const whole = Math.floor(value);
  const half = value - whole >= 0.5;
  if (whole === 0) return half ? "½" : "0";
  return half ? `${whole}½` : String(whole);
}

function boardResult(r: string): string {
  if (r === "1/2-1/2" || r === "½ - ½") return "½–½";
  if (r === "bye") return "bye";
  if (r === "Pending" || r === "") return "·";
  return r;
}

/** Both sources in one word: the console says "Completed", chess-results
    rounds arrive as "played"/"pending". */
function isPlayed(status: string): boolean {
  return status === "Completed" || status === "played";
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue";

export function ResultsView({
  standings,
  rounds,
  external,
}: {
  standings: Standing[];
  rounds: Round[];
  external: boolean;
}) {
  const t = useTranslations("results");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const started = standings.some((s) => (s.played ?? 0) > 0 || s.points > 0);

  /* The page a projector or a pocketed phone keeps open must follow the
     tournament by itself. One refresh a minute is enough — the backend's own
     read-triggered sync means this poll is also what keeps the mirror fresh. */
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(timer);
  }, [router]);

  /* Newest round is the default: those are the pairings people are standing
     in front of. */
  const [selected, setSelected] = useState(() =>
    rounds.length ? rounds[rounds.length - 1].round : 0,
  );
  const current = rounds.find((r) => r.round === selected);

  const q = query.trim().toLocaleLowerCase();
  const matches = useMemo(
    () => (q ? standings.filter((s) => s.name.toLocaleLowerCase().includes(q)) : standings),
    [q, standings],
  );
  /* Every game of every matched player, across all rounds — the "find my
     child" answer in one place. */
  const playerGames = useMemo(() => {
    if (!q) return [];
    return rounds.flatMap((r) =>
      r.pairings
        .filter(
          (b) =>
            b.white.toLocaleLowerCase().includes(q) ||
            (b.black ?? "").toLocaleLowerCase().includes(q),
        )
        .map((b) => ({ round: r.round, board: b })),
    );
  }, [q, rounds]);

  return (
    <>
      {rounds.length > 0 && (
        <PublicCard className="!py-3.5">
          <label className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-pp-muted" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.4-3.4" />
            </svg>
            <span className="sr-only">{t("findPlayer")}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("findPlayer")}
              className="min-h-[44px] w-full border-none bg-transparent text-[15px] text-pp-ink outline-none placeholder:text-pp-muted"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label={t("clearSearch")}
                className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-pp-muted transition-colors hover:bg-pp-mist hover:text-pp-ink ${focusRing}`}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </label>
        </PublicCard>
      )}

      {/* A searching parent gets their player's whole tournament first. */}
      {q && (
        <PublicCard className="!p-0 overflow-hidden">
          <h2 className="border-b border-pp-line px-5 py-3.5 font-pp-display text-[15px] font-bold text-pp-navy">
            {t("gamesOf", { query: query.trim() })}
          </h2>
          {playerGames.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-pp-muted">{t("noMatches")}</p>
          ) : (
            <ul>
              {playerGames.map(({ round, board }) => (
                <li key={`${round}-${board.board}`} className="flex items-center gap-3 border-t border-pp-line px-5 py-2.5 text-sm first:border-t-0">
                  <span className="w-14 shrink-0 text-xs text-pp-muted">
                    {t("roundShort", { n: round })}
                  </span>
                  <BoardLine board={board} query={q} byeLabel={t("bye")} boardLabel={t("boardShort", { n: board.board })} />
                </li>
              ))}
            </ul>
          )}
        </PublicCard>
      )}

      {rounds.length > 0 && !q && (
        <PublicCard className="!p-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-pp-line px-4 py-3">
            <h2 className="mr-1 font-pp-display text-[15px] font-bold text-pp-navy">{t("rounds")}</h2>
            {rounds.map((r) => (
              <button
                key={r.round}
                onClick={() => setSelected(r.round)}
                aria-pressed={selected === r.round}
                className={`min-h-[36px] min-w-[36px] cursor-pointer rounded-full px-3 text-[13px] font-bold transition-colors ${focusRing} ${
                  selected === r.round
                    ? "bg-pp-deep text-white"
                    : isPlayed(r.status)
                      ? "bg-pp-mist text-pp-sub hover:bg-pp-soft"
                      : "bg-pp-amber-soft text-pp-amber hover:brightness-95"
                }`}
              >
                {r.round}
              </button>
            ))}
          </div>
          {current && (
            <>
              <div className="flex items-center gap-2 px-5 py-3">
                <span className="text-sm font-semibold text-pp-ink">{t("round", { n: current.round })}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isPlayed(current.status)
                      ? "bg-pp-green-soft text-pp-green-dot"
                      : "bg-pp-amber-soft text-pp-amber"
                  }`}
                >
                  {isPlayed(current.status)
                    ? t("finished")
                    : current.status === "Playing"
                      ? t("playing")
                      : t("upcoming")}
                </span>
                {current.date && <span className="text-xs text-pp-muted">{current.date}</span>}
              </div>
              {current.pairings.length === 0 ? (
                <p className="px-5 pb-6 text-center text-sm text-pp-muted">{t("notPaired")}</p>
              ) : (
                <ul>
                  {current.pairings.map((b) => (
                    <li key={b.board} className="flex items-center gap-3 border-t border-pp-line px-5 py-2.5 text-sm">
                      <BoardLine board={b} query="" byeLabel={t("bye")} boardLabel={t("boardShort", { n: b.board })} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </PublicCard>
      )}

      <PublicCard className="!p-0 overflow-hidden">
        <h2 className="border-b border-pp-line px-5 py-3.5 font-pp-display text-[15px] font-bold text-pp-navy">
          {t("standings")}
        </h2>
        {matches.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-pp-muted">
            {q ? t("noMatches") : t("noPlayers")}
          </p>
        ) : (
          <div
            /* Focusable: the table scrolls sideways on a phone, and a keyboard
               needs a stop inside the scroller to reach the far columns. */
            className={`overflow-x-auto ${focusRing}`}
            tabIndex={0}
            role="region"
            aria-label={t("standings")}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-pp-mist text-[11px] uppercase tracking-wide text-pp-sub">
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold">#</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold">{t("player")}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t("points")}</th>
                  {external ? (
                    <>
                      <th scope="col" className="px-3 py-2.5 text-left font-semibold">{t("federation")}</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-semibold">{t("rating")}</th>
                    </>
                  ) : (
                    <th scope="col" className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">{t("wdl")}</th>
                  )}
                  {!external && (
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">{t("buchholz")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {matches.map((s, i) => (
                  <tr key={`${s.rank}-${s.name}-${i}`} className="border-t border-pp-line">
                    <td className={`px-4 py-2.5 font-bold ${s.rank === 1 && started && !q ? "text-pp-blue" : "text-pp-sub"}`}>
                      {s.rank}
                    </td>
                    <td className="px-4 py-2.5 text-pp-ink">
                      {s.name}
                      {s.category && <span className="ml-2 text-xs text-pp-muted">{s.category}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-pp-ink">{points(s.points)}</td>
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
    </>
  );
}

/** One board as a line of text: names, ratings muted, result in the middle —
    the order the wall chart prints it. */
function BoardLine({
  board,
  query,
  byeLabel,
  boardLabel,
}: {
  board: Board;
  query: string;
  byeLabel: string;
  boardLabel: string;
}) {
  const isBye = !board.black || board.black === "bye";
  return (
    <>
      <span className="w-9 shrink-0 text-xs text-pp-muted">{boardLabel}</span>
      <span className="min-w-0 flex-1 text-pp-ink">
        <Name text={board.white} query={query} />
        {board.whiteRating ? <span className="ml-1 text-xs text-pp-muted">{board.whiteRating}</span> : null}
        <span className="mx-1.5 whitespace-nowrap font-mono text-xs font-bold text-pp-sub">{boardResult(board.result)}</span>
        {isBye ? (
          <span className="text-pp-muted">{byeLabel}</span>
        ) : (
          <>
            <Name text={board.black!} query={query} />
            {board.blackRating ? <span className="ml-1 text-xs text-pp-muted">{board.blackRating}</span> : null}
          </>
        )}
      </span>
    </>
  );
}

/** Highlights the searched part of a name, so a long table scans fast. */
function Name({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const at = text.toLocaleLowerCase().indexOf(query);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded bg-pp-amber-soft px-0.5 text-pp-ink">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}
