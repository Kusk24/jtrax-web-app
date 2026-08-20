"use client";

/* Finding a friend and asking them for a game.
 *
 * Two halves on one screen, in the order a child uses them: what is waiting for
 * you, then the search box for starting something new. Invitations come first
 * because somebody is on the other end of them.
 *
 * The rated toggle carries a warning rather than being hidden when it cannot
 * work. A pupil who cannot see the option cannot find out why — "you both need
 * a Lichess account" is a thing they can go and fix, and a greyed-out row that
 * says so teaches more than a row that is not there.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2, Search, Swords, X } from "lucide-react";
import { PlayShell, Panel, actionBtn } from "@/components/game/PlayShell";
import {
  CLOCKS, acceptChallenge, cancelChallenge, declineChallenge, listChallenges,
  searchPlayers, sendChallenge, type Challenge, type PlayerResult,
} from "@/lib/challenges";

export function ChallengeScreen({ myStudentId }: { myStudentId: string }) {
  const t = useTranslations("challenge");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rated, setRated] = useState(false);
  const [clock, setClock] = useState(2); // 15+10, the academy's usual
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setChallenges(await listChallenges());
    } catch {
      /* The empty state covers it. */
    }
  }, []);

  useEffect(() => {
    void reload();
    // Somebody else may answer while this screen is open, and a child staring
    // at "waiting…" should not have to know to pull down to refresh.
    const timer = setInterval(() => void reload(), 5000);
    return () => clearInterval(timer);
  }, [reload]);

  /* Debounced, because this endpoint names other children and should not be
     hit on every keystroke. */
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        setResults(await searchPlayers(q));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(null);
    }
  }

  const pending = challenges.filter((c) => c.status === "Pending");
  const accepted = challenges.filter((c) => c.status === "Accepted" && c.gameRoomId);

  return (
    <PlayShell title={t("title")} nav>
      <div className="flex flex-col gap-3.5">
        {error && (
          <p role="alert" className="rounded-2xl bg-[rgb(255,240,240)] px-3.5 py-2.5 text-[12.5px] font-bold text-[rgb(160,60,60)]">
            {error}
          </p>
        )}

        {/* ---- games that are ready to play ---- */}
        {accepted.map((c) => (
          <Panel key={c.challengeId} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[14.5px] font-bold">{t("gameReady", { name: c.opponentName })}</span>
              <span className="block text-[12px] text-sv-body">{c.rated ? t("rated") : t("friendly")}</span>
            </span>
            <button
              onClick={() => router.push(`/student/play/room/${c.gameRoomId}`)}
              className={`${actionBtn} min-h-[44px] px-4 text-[13.5px]`}
            >
              {t("openBoard")}
            </button>
          </Panel>
        ))}

        {/* ---- invitations ---- */}
        {pending.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className="px-1 text-[13px] font-bold text-sv-body">{t("waiting")}</h2>
            {pending.map((c) => (
              <Panel key={c.challengeId} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-bold">{c.opponentName}</span>
                  <span className="block text-[12px] text-sv-body">
                    {c.direction === "in" ? t("wantsToPlay") : t("waitingOnThem")}
                    {c.rated ? ` · ${t("rated")}` : ""}
                  </span>
                  {/* Said before they accept, not after the game turns out
                      unrated. */}
                  {c.rated && !c.bothCanPlayRated && (
                    <span className="mt-1 block text-[11.5px] font-bold text-[rgb(176,96,40)]">
                      {t("ratedNotPossible")}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 gap-2">
                  {c.direction === "in" ? (
                    <>
                      <button
                        aria-label={t("accept")}
                        disabled={busy === c.challengeId}
                        onClick={() =>
                          void run(c.challengeId, async () => {
                            const out = await acceptChallenge(c.challengeId);
                            router.push(`/student/play/room/${out.gameRoomId}`);
                          })
                        }
                        className="flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-sv-mint shadow-[inset_0_0_0_1.25px_rgb(143,191,168)] disabled:opacity-60"
                      >
                        <Check className="size-5 text-sv-mint-ink" strokeWidth={3} />
                      </button>
                      <button
                        aria-label={t("decline")}
                        disabled={busy === c.challengeId}
                        onClick={() => void run(c.challengeId, async () => {
                          await declineChallenge(c.challengeId);
                          await reload();
                        })}
                        className="flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-sv-paper shadow-[inset_0_0_0_1.25px_rgb(206,219,236)] disabled:opacity-60"
                      >
                        <X className="size-5" strokeWidth={3} />
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={busy === c.challengeId}
                      onClick={() => void run(c.challengeId, async () => {
                        await cancelChallenge(c.challengeId);
                        await reload();
                      })}
                      className="min-h-[44px] cursor-pointer rounded-[16px] border-none bg-sv-paper px-3.5 text-[12.5px] font-bold shadow-[inset_0_0_0_1.25px_rgb(206,219,236)] disabled: text-sv-body"
                    >
                      {t("cancel")}
                    </button>
                  )}
                </span>
              </Panel>
            ))}
          </section>
        )}

        {/* ---- find somebody ---- */}
        <section className="flex flex-col gap-2.5">
          <h2 className="px-1 text-[13px] font-bold text-sv-body">{t("findSomeone")}</h2>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 opacity-50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              autoCapitalize="off"
              autoComplete="off"
              className="min-h-[48px] w-full rounded-[20px] border-none bg-sv-cream pl-11 pr-4 text-[14px] font-bold text-sv-ink shadow-[inset_0_0_0_1.5px_rgb(206,219,236)] outline-none placeholder:font-normal placeholder: focus:shadow-[inset_0_0_0_2px_rgb(36,65,124)]"
            />
          </div>

          {/* Their own id, so it can be read out to a friend in another class —
              the exact-id search exists precisely so that works. */}
          <p className="px-1 text-[11.5px] text-sv-body">{t("yourId", { id: myStudentId })}</p>

          {/* ---- what kind of game ---- */}
          <Panel className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {CLOCKS.map((c, i) => (
                <button
                  key={c.label}
                  onClick={() => setClock(i)}
                  aria-pressed={clock === i}
                  className="min-h-[36px] cursor-pointer rounded-[14px] border-none px-3 text-[12.5px] font-bold"
                  style={{
                    background: clock === i ? "rgb(255,227,135)" : "transparent",
                    boxShadow: clock === i ? "inset 0 0 0 1.5px rgb(206,219,236)" : "inset 0 0 0 1px rgba(208,158,97,0.4)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={rated}
                onChange={(e) => setRated(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[rgb(36,65,124)]"
              />
              <span>
                <span className="block text-[13.5px] font-bold">{t("ratedLabel")}</span>
                <span className="block text-[11.5px] text-sv-body">{t("ratedHint")}</span>
              </span>
            </label>
          </Panel>

          {searching && (
            <p className="flex items-center gap-2 px-1 text-[12.5px] text-sv-body">
              <Loader2 className="size-4 animate-spin" /> {t("searching")}
            </p>
          )}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="px-1 text-[12.5px] text-sv-body">{t("noneFound")}</p>
          )}

          {results.map((p) => {
            const ratedImpossible = rated && !p.canPlayRated;
            return (
              <Panel key={p.studentId} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-bold">{p.name}</span>
                  <span className="block font-mono text-[11px] text-sv-body">{p.studentId}</span>
                  {ratedImpossible && (
                    <span className="mt-1 block text-[11.5px] font-bold text-[rgb(176,96,40)]">
                      {t("theyHaveNoLichess")}
                    </span>
                  )}
                </span>
                <button
                  disabled={busy === p.studentId}
                  onClick={() =>
                    void run(p.studentId, async () => {
                      await sendChallenge(p.studentId, rated, CLOCKS[clock].limit, CLOCKS[clock].increment);
                      setQuery("");
                      setResults([]);
                      await reload();
                    })
                  }
                  className={`${actionBtn} flex min-h-[44px] shrink-0 items-center gap-1.5 px-3.5 text-[13px]`}
                >
                  <Swords className="size-4" strokeWidth={2.5} />
                  {t("challenge")}
                </button>
              </Panel>
            );
          })}
        </section>
      </div>
    </PlayShell>
  );
}
