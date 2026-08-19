"use client";

/* A student's Lichess account on their profile: link it, prove it is theirs,
 * then see the ratings the academy is tracking.
 *
 * The proof step is the interesting part. A typed username is a claim — nothing
 * stops a pupil entering a grandmaster's account and appearing at 3000 on a
 * screen their parents see — so the server issues a one-time code, the pupil
 * pastes it into their Lichess bio, and the server reads it back. A bio is
 * public to read and private to write, which is exactly what verification
 * needs, and it avoids an OAuth round trip and a stored token.
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, ExternalLink, Loader2, Swords } from "lucide-react";
import {
  getLichessPlayStatus, getMyLichess, linkLichess, sortRatings, startLichessOAuth,
  unlinkLichess, verifyLichess,
  type LichessLink, type LichessPlayStatus,
} from "@/lib/lichess";

export function LichessCard() {
  const t = useTranslations("lichess");

  const [link, setLink] = useState<LichessLink | null>(null);
  const [play, setPlay] = useState<LichessPlayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  /** Set by the OAuth callback on its way back here. */
  const [outcome, setOutcome] = useState("");

  const reload = useCallback(async () => {
    const [mine, status] = await Promise.all([getMyLichess(), getLichessPlayStatus()]);
    setLink(mine.linked ? mine.link : null);
    setPlay(status);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mine, status] = await Promise.all([getMyLichess(), getLichessPlayStatus()]);
        if (!cancelled) {
          setLink(mine.linked ? mine.link : null);
          setPlay(status);
        }
      } catch {
        /* The empty state covers it; a cold API is not worth an error here. */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The callback lands back here with ?lichess=… . It is read once and then
  // stripped, so a reload does not replay a message about something that
  // happened minutes ago.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const said = params.get("lichess");
    if (!said) return;
    setOutcome(said);
    params.delete("lichess");
    const rest = params.toString();
    window.history.replaceState(
      {}, "", window.location.pathname + (rest ? `?${rest}` : ""),
    );
  }, []);

  async function connectForPlay() {
    setBusy(true);
    setError("");
    try {
      // Come back to exactly this screen, so the pupil lands where they left.
      const url = await startLichessOAuth(window.location.origin + window.location.pathname);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
      setBusy(false);
    }
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setNotFound(false);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function submitLink() {
    const name = username.trim();
    if (!name) return;
    await run(() => linkLichess(name));
  }

  async function checkCode() {
    setBusy(true);
    setError("");
    setNotFound(false);
    try {
      const out = await verifyLichess();
      if (!out.verified) setNotFound(true);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!link?.verifyCode) return;
    try {
      await navigator.clipboard.writeText(link.verifyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard refused; the code is on screen anyway. */
    }
  }

  const card =
    "w-[352px] rounded-[20px] bg-sv-gold p-2.5 shadow-[inset_0_0_0_2px_rgb(208,158,97),0_2px_4px_rgba(118,83,50,0.58)]";
  const inner = "rounded-[16px] bg-sv-cream px-4 py-3.5 shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]";
  const field =
    "w-full rounded-xl border-none bg-sv-paper px-3 py-2.5 text-[14px] font-bold text-sv-brown shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.6)] outline-none placeholder:font-normal placeholder:opacity-40 focus:shadow-[inset_0_0_0_2px_rgb(192,120,98)]";
  const button =
    "cursor-pointer rounded-[16px] border-none bg-sv-peach px-4 py-2.5 text-[13.5px] font-bold text-sv-brown shadow-[inset_0_0_0_1.25px_rgb(192,120,98),0_0_0_1.25px_rgb(192,120,98)] disabled:opacity-60";

  if (loading) {
    return (
      <div className={card}>
        <div className={`${inner} flex items-center justify-center gap-2`}>
          <Loader2 className="size-4 animate-spin" />
          <span className="text-[13px] font-bold opacity-70">{t("loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={card}>
      <div className={inner}>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold">{t("title")}</span>
          {link?.verified && (
            <span className="flex items-center gap-1 rounded-[20px] bg-sv-mint px-2.5 py-[3px] text-[11px] text-sv-mint-ink shadow-[inset_0_0_0_0.5px_rgb(137,187,169)]">
              <Check className="size-3" strokeWidth={3} />
              {t("verified")}
            </span>
          )}
        </div>

        {/* The callback bounces back here with an outcome to show. */}
        {outcome && outcome !== "connected" && (
          <p className="mb-2.5 rounded-xl bg-[rgb(255,240,240)] px-3 py-2 text-[12px] font-bold text-[rgb(160,60,60)]">
            {t(`outcome.${outcome}`)}
          </p>
        )}

        {/* ---- not linked yet ---- */}
        {!link && (
          <>
            <p className="mb-2.5 text-[12.5px] leading-snug opacity-75">{t("intro")}</p>

            {/* The recommended path. It proves the account *and* unlocks rated
                games, so it is offered first and the bio-code route below is
                framed as the smaller ask it is. */}
            <button
              onClick={() => void connectForPlay()}
              disabled={busy}
              className={`${button} mb-3 flex w-full items-center justify-center gap-2`}
            >
              <Swords className="size-4" />
              {busy ? t("checking") : t("connectWithLichess")}
            </button>
            <p className="mb-2 text-center text-[11.5px] leading-snug opacity-60">{t("orTrackOnly")}</p>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submitLink()}
              placeholder={t("usernamePlaceholder")}
              aria-label={t("usernameLabel")}
              autoCapitalize="off"
              autoComplete="off"
              className={field}
            />
            <button
              onClick={() => void submitLink()}
              disabled={busy || !username.trim()}
              className={`${button} mt-2.5 w-full`}
            >
              {busy ? t("checking") : t("connect")}
            </button>
          </>
        )}

        {/* ---- linked, waiting on proof ---- */}
        {link && !link.verified && (
          <>
            <p className="text-[13px] font-bold">{link.username}</p>
            <p className="mt-1.5 text-[12.5px] leading-snug opacity-75">{t("proveHint")}</p>

            {link.verifyCode ? (
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-xl bg-sv-paper px-3 py-2 font-mono text-[13px] font-bold shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.6)]">
                  {link.verifyCode}
                </code>
                <button
                  onClick={() => void copyCode()}
                  aria-label={t("copyCode")}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none bg-sv-paper shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.6)]"
                >
                  {copied ? <Check className="size-4 text-sv-mint-ink" /> : <Copy className="size-4" />}
                </button>
              </div>
            ) : (
              /* A staff-created link has no code on this screen — staff cannot
                 edit a pupil's bio, so the pupil starts the proof themselves. */
              <p className="mt-2 text-[12.5px] leading-snug opacity-75">{t("addedByStaff")}</p>
            )}

            <a
              href={`${link.profileUrl}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-sv-brown underline opacity-80"
            >
              {t("openLichess")} <ExternalLink className="size-3.5" />
            </a>

            {notFound && (
              <p className="mt-2 rounded-xl bg-[rgb(255,240,240)] px-3 py-2 text-[12px] font-bold text-[rgb(160,60,60)]">
                {t("codeNotFound")}
              </p>
            )}

            <div className="mt-2.5 flex gap-2">
              <button onClick={() => void checkCode()} disabled={busy} className={`${button} flex-1`}>
                {busy ? t("checking") : t("checkNow")}
              </button>
              <button
                onClick={() => void run(unlinkLichess)}
                disabled={busy}
                className="cursor-pointer rounded-[16px] border-none bg-sv-paper px-4 py-2.5 text-[13.5px] font-bold text-sv-brown shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.6)] disabled:opacity-60"
              >
                {t("remove")}
              </button>
            </div>
          </>
        )}

        {/* ---- verified: the ratings ---- */}
        {link?.verified && (
          <>
            <a
              href={link.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] font-bold underline"
            >
              {link.username} <ExternalLink className="size-3.5" />
            </a>
            {link.ratings.length === 0 ? (
              <p className="mt-2 text-[12.5px] opacity-75">{t("noGamesYet")}</p>
            ) : (
              <div className="mt-2">
                {sortRatings(link.ratings).map((r, i) => (
                  <div
                    key={r.perf}
                    className="flex items-center justify-between gap-3 py-1.5"
                    style={{ borderTop: i === 0 ? "none" : "1px solid rgba(208,158,97,0.35)" }}
                  >
                    <span className="text-[13px] opacity-75">{t(`perf.${r.perf}`)}</span>
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[13px] font-bold">{r.rating}</span>
                      {/* A provisional rating swings wildly and is not an
                          achievement yet — saying so is kinder than a number
                          that drops 200 points tomorrow. */}
                      {r.provisional && <span className="text-[10.5px] opacity-60">{t("provisional")}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* ---- rated play ---- */}
            <div className="mt-3 rounded-xl bg-sv-paper px-3 py-2.5 shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.5)]">
              {play?.canPlay ? (
                <>
                  <p className="flex items-center gap-1.5 text-[12.5px] font-bold">
                    <Swords className="size-3.5" />
                    {t("ratedOn")}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-snug opacity-70">{t("ratedOnHint")}</p>
                  {/* A token cannot be refreshed, only granted again — so the
                      warning has to come before it dies, not after. */}
                  {play.expiringSoon && (
                    <p className="mt-1.5 text-[11.5px] font-bold leading-snug text-[rgb(160,90,40)]">
                      {t("expiringSoon")}
                    </p>
                  )}
                  {play.managed && (
                    <p className="mt-1.5 text-[11.5px] leading-snug opacity-70">{t("managedAccount")}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[12.5px] font-bold">{t("ratedOff")}</p>
                  <p className="mt-1 text-[11.5px] leading-snug opacity-70">{t("ratedOffHint")}</p>
                  <button
                    onClick={() => void connectForPlay()}
                    disabled={busy}
                    className={`${button} mt-2 flex w-full items-center justify-center gap-2`}
                  >
                    <Swords className="size-4" />
                    {busy ? t("checking") : t("enableRated")}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => void run(unlinkLichess)}
              disabled={busy}
              className="mt-2.5 cursor-pointer border-none bg-transparent text-[12px] font-bold underline opacity-60"
            >
              {t("remove")}
            </button>
          </>
        )}

        {error && (
          <p className="mt-2 rounded-xl bg-[rgb(255,240,240)] px-3 py-2 text-[12px] font-bold text-[rgb(160,60,60)]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
