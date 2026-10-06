"use client";

/* Invitations from friends to play: who, the clock, rated or not, and Accept /
   Decline. The list is shared by Play with Friend and the student home, so an
   invitation is seen wherever the child is — not only once they open Games. */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Timer, X } from "lucide-react";
import { Panel, actionBtn } from "@/components/game/PlayShell";
import { acceptChallenge, declineChallenge, listChallenges, type Challenge } from "@/lib/challenges";

function clockLabel(c: Challenge): string {
  return `${Math.round(c.clockLimit / 60)}+${c.clockIncrement}`;
}

/** The invitations, drawn; nothing when there are none. */
export function IncomingChallengeList({
  incoming,
  busy,
  onAccept,
  onDecline,
}: {
  incoming: Challenge[];
  busy: string | null;
  onAccept: (c: Challenge) => void;
  onDecline: (c: Challenge) => void;
}) {
  const t = useTranslations("challenge");
  if (incoming.length === 0) return null;
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="flex items-center gap-2 font-pp-display text-[16px] font-semibold text-pp-ink">
          <span className="size-2.5 rounded-full bg-pp-blue" aria-hidden />
          {t("incoming")}
        </h2>
        <span className="rounded-full bg-pp-blue px-2.5 py-[3px] text-[12.5px] font-semibold text-white">
          {t("newCount", { n: incoming.length })}
        </span>
      </div>
      {incoming.map((c) => (
        <Panel key={c.challengeId} className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pp-soft font-pp-display text-[18px] font-bold text-pp-blue"
            >
              {c.opponentName.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-pp-display text-[16px] font-semibold text-pp-ink">{c.opponentName}</span>
              <span className="block text-[13px] text-pp-muted">
                {clockLabel(c)} · {c.rated ? t("rated") : t("friendly")}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-pp-green-soft px-2.5 py-1 text-[12.5px] font-semibold text-pp-green">
              <Timer className="size-3.5" strokeWidth={2.4} aria-hidden />
              {t("minutes", { n: Math.round(c.clockLimit / 60) })}
            </span>
          </div>
          {/* Said before they accept, not after the game turns out unrated. */}
          {c.rated && !c.bothCanPlayRated && (
            <p className="text-[12.5px] font-semibold text-pp-amber">{t("ratedNotPossible")}</p>
          )}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              disabled={busy === c.challengeId}
              onClick={() => onAccept(c)}
              className={`${actionBtn} flex min-h-11 items-center justify-center gap-[7px] px-4 text-[14px]`}
            >
              <Check className="size-4" strokeWidth={2.6} aria-hidden />
              {t("accept")}
            </button>
            <button
              disabled={busy === c.challengeId}
              onClick={() => onDecline(c)}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-[7px] rounded-full border border-pp-line bg-pp-card px-4 text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-red hover:bg-pp-red-soft hover:text-pp-red disabled:cursor-not-allowed disabled:text-pp-faint"
            >
              <X className="size-4" strokeWidth={2.6} aria-hidden />
              {t("decline")}
            </button>
          </div>
        </Panel>
      ))}
    </section>
  );
}

/** The same, on its own: fetches and keeps checking, for the home screen.
    Accepting goes straight to the board, as it does from Games. */
export function IncomingChallenges() {
  const t = useTranslations("challenge");
  const router = useRouter();
  const [incoming, setIncoming] = useState<Challenge[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const all = await listChallenges();
      setIncoming(all.filter((c) => c.status === "Pending" && c.direction === "in"));
    } catch {
      /* A blip leaves what was shown; Games says when loading fails. */
    }
  }, []);

  useEffect(() => {
    /* First look straight away, then every few seconds, as Games does. */
    const first = setTimeout(() => void reload(), 0);
    const timer = setInterval(() => void reload(), 5000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [reload]);

  async function run(c: Challenge, fn: () => Promise<void>) {
    setBusy(c.challengeId);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(null);
    }
  }

  if (incoming.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p role="alert" className="rounded-2xl bg-pp-red-soft px-3.5 py-2.5 text-[12.5px] font-semibold text-pp-red">
          {error}
        </p>
      )}
      <IncomingChallengeList
        incoming={incoming}
        busy={busy}
        onAccept={(c) =>
          void run(c, async () => {
            const out = await acceptChallenge(c.challengeId);
            router.push(`/student/play/room/${out.gameRoomId}?from=play`);
          })
        }
        onDecline={(c) =>
          void run(c, async () => {
            await declineChallenge(c.challengeId);
            await reload();
          })
        }
      />
    </div>
  );
}
