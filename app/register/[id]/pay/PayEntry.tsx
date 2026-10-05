"use client";

/* The entry page that every email about an entry links to — "Complete
 * Payment" while the fee is owed, "View Registration" once it is paid.
 *
 * It shows the whole entry, not only the price: the tournament, the player,
 * the category, the date and venue, where the payment stands, what it costs
 * today, and by when it has to be paid. Every state has its own sentence,
 * because the person reading it has no account and nowhere else to look: a
 * link that does not work, an entry already paid, nothing to pay, a place
 * released at closing, or card payments switched off.
 */
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PublicCard } from "@/components/public/PublicShell";
import { EntryError, getPublicEntry, readPayLink, type PublicEntry } from "@/lib/registration";
import { PayNow } from "../PayNow";

type View =
  | { kind: "loading" }
  | { kind: "broken" }
  | { kind: "failed" }
  | { kind: "entry"; entry: PublicEntry; id: string; code: string };

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    currencyDisplay: "code",
    // Same as the form's: "THB 300", with satang only when there are some.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "10 October 2026", in the reader's language. */
function longDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

const STATUS_TONE: Record<string, string> = {
  Paid: "bg-pp-green-soft text-pp-green-dot",
  Pending: "bg-pp-amber-soft text-pp-amber",
  Cancelled: "bg-pp-red-soft text-pp-red",
  Refunded: "bg-pp-soft text-pp-sub",
};

export function PayEntry() {
  const t = useTranslations("register");
  const locale = useLocale();
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const link = readPayLink(window.location.search, window.location.hash);
    (async () => {
      if (!link) {
        if (!cancelled) setView({ kind: "broken" });
        return;
      }
      try {
        const entry = await getPublicEntry(link.entry, link.code);
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
        <p className="py-6 text-center text-sm text-pp-muted" aria-live="polite">{t("payLoading")}</p>
      </PublicCard>
    );
  }
  if (view.kind === "broken" || view.kind === "failed") {
    return (
      <PublicCard>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <h2 className="font-pp-display text-lg font-bold text-pp-navy">
            {t(view.kind === "broken" ? "payBrokenTitle" : "payFailedTitle")}
          </h2>
          <p className="max-w-sm text-sm text-pp-muted">{t(view.kind === "broken" ? "payBrokenBody" : "payFailed")}</p>
        </div>
      </PublicCard>
    );
  }

  const { entry, id, code } = view;
  const date = (iso?: string) => (iso ? longDate(iso, locale) : "");
  const when =
    entry.startDate && entry.endDate && entry.endDate !== entry.startDate
      ? `${date(entry.startDate)} – ${date(entry.endDate)}`
      : date(entry.startDate);
  const status = entry.paymentStatus;

  const rows: Array<[string, React.ReactNode]> = [
    [t("entryTournament"), entry.tournamentName],
    [t("entryPlayer"), entry.participantName],
  ];
  if (entry.category) rows.push([t("entryCategory"), entry.category]);
  if (when) rows.push([t("entryDate"), when]);
  if (entry.venue) rows.push([t("entryVenue"), entry.venue]);
  if (status) {
    rows.push([
      t("entryPaymentStatus"),
      <span key="s" className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${STATUS_TONE[status] ?? ""}`}>
        {t(`entryStatus.${status}`)}
      </span>,
    ]);
  }
  if (entry.state === "paid" && entry.amountPaid) {
    rows.push([t("entryAmountPaid"), money(entry.amountPaid)]);
  }
  if (entry.state === "unpaid") {
    if (entry.earlyBirdUntil) {
      rows.push([t("entryEarlyBirdFee"), t("entryPayBy", { fee: money(entry.fee), date: date(entry.earlyBirdUntil) })]);
      if (entry.regularFee) {
        rows.push([t("entryRegularFee"), t("entryAfter", { fee: money(entry.regularFee), date: date(entry.earlyBirdUntil) })]);
      }
    } else if (entry.fee > 0) {
      rows.push([t("entryFeeNow"), money(entry.fee)]);
    }
    if (entry.registrationDeadline) rows.push([t("entryPaymentDeadline"), date(entry.registrationDeadline)]);
  }

  return (
    <PublicCard>
      <dl className="divide-y divide-pp-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-[14px]">
            <dt className="shrink-0 text-pp-muted">{label}</dt>
            <dd className="text-right font-semibold text-pp-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-col items-center gap-2 text-center">
        {entry.state === "unpaid" && entry.cardPayments && (
          <>
            <PayNow entry={id} code={code} label={t("payNow", { fee: money(entry.fee) })} />
            <p className="max-w-sm text-[13px] text-pp-muted">{t("payLater")}</p>
          </>
        )}
        {entry.state === "unpaid" && !entry.cardPayments && (
          <p className="max-w-sm text-[13px] text-pp-muted">{t("payAtDesk")}</p>
        )}
        {entry.state === "unpaid" && entry.registrationDeadline && (
          <p className="max-w-sm text-[12.5px] text-pp-sub">{t("entryReleaseWarning", { date: date(entry.registrationDeadline) })}</p>
        )}
        {entry.state === "paid" && (
          <p className="rounded-xl bg-pp-green-soft px-3 py-2 text-[13.5px] font-semibold text-pp-ink">{t("payAlreadyDone")}</p>
        )}
        {entry.state === "cancelled" && (
          <p className="rounded-xl bg-pp-red-soft px-3 py-2 text-[13.5px] font-semibold text-pp-ink">
            {entry.registrationDeadline
              ? t("entryCancelled", { date: date(entry.registrationDeadline) })
              : t("entryCancelledNoDate")}
          </p>
        )}
        {entry.state === "free" && <p className="max-w-sm text-[13px] text-pp-muted">{t("payNothingDue")}</p>}
        {entry.state === "closed" && <p className="max-w-sm text-[13px] text-pp-muted">{t("payClosed")}</p>}
      </div>
    </PublicCard>
  );
}
