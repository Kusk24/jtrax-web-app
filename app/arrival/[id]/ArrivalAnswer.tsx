"use client";

/* "Is your child coming?" — two buttons, and the answer so far.
 *
 * Nothing is recorded until a button is pressed, so a mail scanner that opens
 * the link cannot answer for the family. Answering again changes the answer,
 * until the tournament starts.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PublicCard } from "@/components/public/PublicShell";
import { answerArrival, EntryError, getArrival, readArrivalLink, type ArrivalEntry } from "@/lib/registration";

type View =
  | { kind: "loading" }
  | { kind: "broken" }
  | { kind: "failed" }
  | { kind: "entry"; entry: ArrivalEntry; id: string; code: string };

export function ArrivalAnswer() {
  const t = useTranslations("arrival");
  const [view, setView] = useState<View>({ kind: "loading" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const link = readArrivalLink(window.location.pathname, window.location.hash);
    (async () => {
      if (!link) {
        if (!cancelled) setView({ kind: "broken" });
        return;
      }
      try {
        const entry = await getArrival(link.entry, link.code);
        if (!cancelled) setView({ kind: "entry", entry, id: link.entry, code: link.code });
      } catch (err) {
        if (!cancelled) setView({ kind: err instanceof EntryError && err.status === 404 ? "broken" : "failed" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (view.kind === "loading") {
    return (
      <PublicCard>
        <p className="py-6 text-center text-sm text-pp-muted" aria-live="polite">{t("loading")}</p>
      </PublicCard>
    );
  }
  if (view.kind === "broken" || view.kind === "failed") {
    return (
      <PublicCard>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <h2 className="font-pp-display text-lg font-bold text-pp-navy">
            {t(view.kind === "broken" ? "brokenTitle" : "failedTitle")}
          </h2>
          <p className="max-w-sm text-sm text-pp-muted">{t(view.kind === "broken" ? "brokenBody" : "failedBody")}</p>
        </div>
      </PublicCard>
    );
  }

  const { entry, id, code } = view;
  async function answer(value: "Confirmed" | "NotAttending") {
    setSaving(true);
    setError(false);
    try {
      const next = await answerArrival(id, code, value);
      setView({ kind: "entry", entry: next, id, code });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const answered = entry.status !== "Pending";
  return (
    <PublicCard>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[.12em] text-pp-muted">{entry.tournamentName}</p>
        <h2 className="font-pp-display text-xl font-bold text-pp-navy">{entry.participantName}</h2>
        <p className="text-sm text-pp-muted">
          {entry.venue ? t("when", { date: entry.startDate, venue: entry.venue }) : t("whenNoVenue", { date: entry.startDate })}
        </p>

        {answered && (
          <p
            className={`rounded-xl px-3 py-2 text-[13.5px] font-semibold text-pp-ink ${
              entry.status === "Confirmed" ? "bg-pp-green-soft" : "bg-pp-soft"
            }`}
            aria-live="polite"
          >
            {t(entry.status === "Confirmed" ? "confirmedNote" : "notAttendingNote")}
          </p>
        )}

        {entry.open ? (
          <>
            <p className="text-sm font-semibold text-pp-ink">{answered ? t("changeQuestion") : t("question")}</p>
            <div className="flex w-full max-w-xs flex-col gap-2">
              <button
                type="button"
                disabled={saving || entry.status === "Confirmed"}
                onClick={() => answer("Confirmed")}
                className="rounded-xl bg-pp-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {t("yes")}
              </button>
              <button
                type="button"
                disabled={saving || entry.status === "NotAttending"}
                onClick={() => answer("NotAttending")}
                className="rounded-xl border border-pp-line px-4 py-2.5 text-sm font-bold text-pp-ink disabled:opacity-50"
              >
                {t("no")}
              </button>
            </div>
            {error && <p className="text-[13px] font-semibold text-pp-danger">{t("saveFailed")}</p>}
          </>
        ) : (
          <p className="max-w-sm text-[13px] text-pp-muted">{t("closed")}</p>
        )}
      </div>
    </PublicCard>
  );
}
