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
import { Loader2, Search, Swords, X } from "lucide-react";
import { Panel, actionBtn } from "@/components/game/PlayShell";
import { IncomingChallengeList } from "./IncomingChallenges";
import {
  CLOCKS, acceptChallenge, cancelChallenge, declineChallenge, dismissDecline, listChallenges,
  searchPlayers, sendChallenge, type Challenge, type PlayerResult,
} from "@/lib/challenges";

/** Challenging another student — shown inside Play, which is where every way
    of playing a person now lives. */
export function ChallengePanel({ myStudentId }: { myStudentId: string }) {
  const t = useTranslations("challenge");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rated, setRated] = useState(false);
  const [clock, setClock] = useState(2); // 15+10, the academy's usual
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  const reload = useCallback(async () => {
    try {
      setChallenges(await listChallenges());
      /* Cleared on success, so a single blip while polling does not leave a
         warning sitting on screen for the rest of the session. */
      setLoadFailed(false);
    } catch {
      /* Not "no invitations" — we do not know. A child told nobody wants to
         play them, when in fact a classmate is waiting, is the one thing this
         screen must not say. */
      setLoadFailed(true);
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
  /* Split by who has to act: an invitation is theirs to answer, so it gets
     its own section with full Accept / Decline buttons; one they sent only
     needs a Cancel. */
  const incoming = pending.filter((c) => c.direction === "in");
  const sent = pending.filter((c) => c.direction === "out");
  /* The backend only returns a decline to the one who asked, until they
     dismiss it — so their invitation is answered, not just gone. */
  const declined = challenges.filter((c) => c.status === "Declined" && c.direction === "out");
  const accepted = challenges.filter((c) => c.status === "Accepted" && c.gameRoomId);

  return (
    <div className="flex flex-col gap-3.5">
      {loadFailed && !error && (
        <p role="alert" className="rounded-2xl bg-pp-red-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-pp-red">
          {tCommon("loadFailed")}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-2xl bg-pp-red-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-pp-red">
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
            onClick={() => router.push(`/student/play/room/${c.gameRoomId}?from=play`)}
            className={`${actionBtn} min-h-[44px] px-4 text-[13.5px]`}
          >
            {t("openBoard")}
          </button>
        </Panel>
      ))}

      {/* ---- invitations to answer ---- */}
      <IncomingChallengeList
        incoming={incoming}
        busy={busy}
        onAccept={(c) =>
          void run(c.challengeId, async () => {
            const out = await acceptChallenge(c.challengeId);
            router.push(`/student/play/room/${out.gameRoomId}?from=play`);
          })
        }
        onDecline={(c) =>
          void run(c.challengeId, async () => {
            await declineChallenge(c.challengeId);
            await reload();
          })
        }
      />

      {/* ---- a "no" to one they sent ---- */}
      {declined.map((c) => (
        <Panel key={c.challengeId} className="flex items-center justify-between gap-3 !border-[#e7c9c9] !bg-pp-red-soft">
          <span role="status" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pp-card text-pp-red" aria-hidden>
              <X className="size-5" strokeWidth={2.6} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-bold text-pp-ink">{t("declinedTitle", { name: c.opponentName })}</span>
              <span className="block text-[12.5px] text-pp-muted">
                {clockLabel(c)} · {c.rated ? t("rated") : t("friendly")}
              </span>
            </span>
          </span>
          <button
            disabled={busy === c.challengeId}
            onClick={() => void run(c.challengeId, async () => {
              await dismissDecline(c.challengeId);
              await reload();
            })}
            className="min-h-11 shrink-0 cursor-pointer rounded-full border border-pp-line bg-pp-card px-4 text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft disabled:cursor-not-allowed disabled:text-pp-faint"
          >
            {t("ok")}
          </button>
        </Panel>
      ))}

      {/* ---- invitations they sent, waiting on the other player ---- */}
      {sent.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="px-1 font-pp-display text-[16px] font-semibold text-pp-ink">{t("sent")}</h2>
          {sent.map((c) => (
            <Panel key={c.challengeId} className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-bold">{c.opponentName}</span>
                <span className="block text-[12px] text-sv-body">
                  {t("waitingOnThem")} · {clockLabel(c)}
                  {c.rated ? ` · ${t("rated")}` : ""}
                </span>
                {c.rated && !c.bothCanPlayRated && (
                  <span className="mt-1 block text-[11.5px] font-bold text-pp-amber">
                    {t("ratedNotPossible")}
                  </span>
                )}
              </span>
              <button
                disabled={busy === c.challengeId}
                onClick={() => void run(c.challengeId, async () => {
                  await cancelChallenge(c.challengeId);
                  await reload();
                })}
                className="min-h-11 shrink-0 cursor-pointer rounded-full border border-pp-line bg-pp-card px-4 text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft disabled:cursor-not-allowed disabled:text-pp-faint"
              >
                {t("cancel")}
              </button>
            </Panel>
          ))}
        </section>
      )}

      {/* ---- find somebody ---- */}
      <section className="flex flex-col gap-2.5">
        <h3 className="px-1 text-[14px] font-semibold text-pp-ink">{t("findSomeone")}</h3>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 opacity-50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            autoCapitalize="off"
            autoComplete="off"
            className="min-h-11 w-full rounded-[9px] border border-pp-line bg-pp-card pl-11 pr-4 text-[14.5px] text-pp-ink outline-none placeholder: focus:border-pp-blue"
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
                className={`min-h-9 cursor-pointer rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                  clock === i ? "border border-pp-blue bg-pp-blue text-white" : "border border-pp-line bg-pp-card text-pp-ink hover:bg-pp-soft"
                }`}
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
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-pp-blue"
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
                  <span className="mt-1 block text-[11.5px] font-bold text-pp-amber">
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
  );
}

/** "5+0", "10+5" — the clock the challenger picked, as the picker shows it. */
function clockLabel(c: Challenge): string {
  return `${Math.round(c.clockLimit / 60)}+${c.clockIncrement}`;
}
