"use client";

/* "Is your child coming?" — two buttons per child, and each answer so far.
 *
 * One link can answer for several children: a parent with two children in a
 * tournament gets one email, and every child on it is listed here, each
 * answered on its own.
 *
 * Nothing is recorded until a button is pressed, so a mail scanner that opens
 * the link cannot answer for the family. Once a child is answered the buttons
 * go: a confirmed child gets where and when, and a family that needs to change
 * an answer contacts the academy (its details are under this card).
 */
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { TournamentBanner } from "@/components/public/TournamentBanner";
import { PublicCard } from "@/components/public/PublicShell";
import {
  answerArrival, EntryError, fetchArrivalBanner, getArrival, readArrivalLinks, readArrivalPick, type ArrivalEntry,
} from "@/lib/registration";

type Child = { entry: ArrivalEntry; id: string; code: string };
type Answer = "Confirmed" | "NotAttending";

type View =
  | { kind: "loading" }
  | { kind: "broken" }
  | { kind: "failed" }
  | { kind: "entries"; children: Child[]; pick: { entry: string; answer: Answer } | null };

/** "Tuesday 20 October 2026", in the reader's language and the academy's day. */
function longDate(iso: string, locale: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok",
  });
}

/** The venue as one line: its name and, when given, where it is. */
function venueLine(e: ArrivalEntry): string {
  return [e.venue, e.venueAddress].filter(Boolean).join(", ");
}

export function ArrivalAnswer() {
  const t = useTranslations("arrival");
  const locale = useLocale();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const links = readArrivalLinks(window.location.pathname, window.location.hash);
    /* The answer the email's button chose, to confirm rather than record. */
    const pick = readArrivalPick(window.location.hash);
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
        setView({ kind: "entries", children, pick });
        if (children[0].entry.hasBanner) {
          const url = await fetchArrivalBanner(children[0].id, children[0].code);
          if (!cancelled) setBanner(url);
        }
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
  const date = head.startDate ? longDate(head.startDate, locale) : "";
  return (
    <div className="flex flex-col gap-4">
      {/* The organiser's banner, or one drawn from the tournament. */}
      <TournamentBanner
        name={head.tournamentName}
        when={date || undefined}
        venue={venueLine(head) || undefined}
        imageUrl={banner ?? undefined}
        className="w-full rounded-2xl shadow-[0_12px_32px_rgba(35,53,94,.14)]"
      />
      <PublicCard>
        <div className="flex flex-col items-center gap-1 pt-2 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[.12em] text-pp-muted">{head.tournamentName}</p>
          <p className="text-sm text-pp-muted">
            {head.venue ? t("when", { date, venue: venueLine(head) }) : t("whenNoVenue", { date })}
          </p>
        </div>
        <div className="flex flex-col divide-y divide-pp-line">
          {view.children.map((c) => (
            <ChildAnswer key={c.id} initial={c} date={date} picked={view.pick?.entry === c.id ? view.pick.answer : null} />
          ))}
        </div>
      </PublicCard>
    </div>
  );
}

/** One child: their name, their answer so far, and the two buttons. */
function ChildAnswer({ initial, picked, date }: { initial: Child; picked: Answer | null; date: string }) {
  const t = useTranslations("arrival");
  const [entry, setEntry] = useState(initial.entry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  /* Chosen in the email, waiting for Confirm — unless it is already the answer. */
  const [pending, setPending] = useState<Answer | null>(
    picked && initial.entry.open && initial.entry.status !== picked ? picked : null,
  );

  async function answer(value: Answer) {
    setSaving(true);
    setError(false);
    try {
      setEntry(await answerArrival(initial.id, initial.code, value));
      setPending(null);
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

      {answered ? (
        entry.status === "Confirmed" ? (
          /* Confirmed: where and when, so the family arrives in time. */
          <div className="flex w-full max-w-sm flex-col items-center gap-1.5 rounded-xl bg-pp-green-soft px-4 py-3" aria-live="polite">
            <p className="text-[14.5px] font-bold text-pp-ink">{t("confirmedTitle", { name: entry.participantName })}</p>
            <p className="text-[13.5px] text-pp-ink">
              {entry.venue
                ? t("confirmedWhere", { venue: venueLine(entry), date })
                : t("confirmedWhereNoVenue", { date })}
            </p>
            <p className="text-[13.5px] font-semibold text-pp-ink">{t("arriveEarly")}</p>
            {entry.venueMapUrl && (
              <a
                href={entry.venueMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-pp-blue px-3.5 text-[13px] font-semibold text-pp-blue"
              >
                <MapPin className="size-4" aria-hidden /> {t("openMap")}
              </a>
            )}
          </div>
        ) : (
          <p className="rounded-xl bg-pp-soft px-3 py-2 text-[13.5px] font-semibold text-pp-ink" aria-live="polite">
            {t("notAttendingTitle", { name: entry.participantName })}
          </p>
        )
      ) : entry.open && pending ? (
        <div className="flex w-full max-w-xs flex-col gap-2 rounded-xl bg-pp-soft p-3">
          <p className="text-sm font-semibold text-pp-ink">
            {t(pending === "Confirmed" ? "confirmAttending" : "confirmNotAttending", { name: entry.participantName })}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => answer(pending)}
            className="rounded-xl bg-pp-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {t("confirm")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => setPending(null)}
            className="rounded-xl border border-pp-line px-4 py-2.5 text-sm font-bold text-pp-ink disabled:opacity-50"
          >
            {t("change")}
          </button>
          {error && <p className="text-[13px] font-semibold text-pp-danger">{t("saveFailed")}</p>}
        </div>
      ) : entry.open ? (
        <>
          <p className="text-sm font-semibold text-pp-ink">{t("question")}</p>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => answer("Confirmed")}
              className="rounded-xl bg-pp-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("yes")}
            </button>
            <button
              type="button"
              disabled={saving}
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
      {answered && entry.open && <p className="text-[12.5px] text-pp-muted">{t("changeHelp")}</p>}
    </section>
  );
}
