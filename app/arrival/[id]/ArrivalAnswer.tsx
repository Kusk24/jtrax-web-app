"use client";

/* "Is your child coming?" — two buttons per child, and each answer so far.
 *
 * One link can answer for several children: a parent with two children in a
 * tournament gets one email, and every child on it is listed here, each
 * answered on its own.
 *
 * Nothing is recorded until a button is pressed, so a mail scanner that opens
 * the link cannot answer for the family. Answering again changes the answer,
 * until the tournament starts.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PublicCard } from "@/components/public/PublicShell";
import { answerArrival, EntryError, getArrival, readArrivalLinks, type ArrivalEntry } from "@/lib/registration";

type Child = { entry: ArrivalEntry; id: string; code: string };

type View =
  | { kind: "loading" }
  | { kind: "broken" }
  | { kind: "failed" }
  | { kind: "entries"; children: Child[] };

export function ArrivalAnswer() {
  const t = useTranslations("arrival");
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const links = readArrivalLinks(window.location.pathname, window.location.hash);
    (async () => {
      if (links.length === 0) {
        if (!cancelled) setView({ kind: "broken" });
        return;
      }
      const results = await Promise.allSettled(links.map((l) => getArrival(l.entry, l.code)));
      if (cancelled) return;
      const children = results.flatMap((r, i) =>
        r.status === "fulfilled" ? [{ entry: r.value, id: links[i].entry, code: links[i].code }] : [],
      );
      if (children.length > 0) {
        setView({ kind: "entries", children });
        return;
      }
      const first = results[0];
      const notFound = first.status === "rejected" && first.reason instanceof EntryError && first.reason.status === 404;
      setView({ kind: notFound ? "broken" : "failed" });
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

  const head = view.children[0].entry;
  return (
    <PublicCard>
      <div className="flex flex-col items-center gap-1 pt-2 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[.12em] text-pp-muted">{head.tournamentName}</p>
        <p className="text-sm text-pp-muted">
          {head.venue ? t("when", { date: head.startDate, venue: head.venue }) : t("whenNoVenue", { date: head.startDate })}
        </p>
      </div>
      <div className="flex flex-col divide-y divide-pp-line">
        {view.children.map((c) => (
          <ChildAnswer key={c.id} initial={c} />
        ))}
      </div>
    </PublicCard>
  );
}

/** One child: their name, their answer so far, and the two buttons. */
function ChildAnswer({ initial }: { initial: Child }) {
  const t = useTranslations("arrival");
  const [entry, setEntry] = useState(initial.entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function answer(value: "Confirmed" | "NotAttending") {
    setSaving(true);
    setError(false);
    try {
      setEntry(await answerArrival(initial.id, initial.code, value));
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const answered = entry.status !== "Pending";
  return (
    <section aria-label={entry.participantName} className="flex flex-col items-center gap-3 py-4 text-center">
      <h2 className="font-pp-display text-xl font-bold text-pp-navy">{entry.participantName}</h2>

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
    </section>
  );
}
