"use client";

/* The pay page's content: what the entry is, what it costs, and the button.
 *
 * Every state the entry can be in has its own sentence, because the person
 * reading it has no account and nowhere else to look: a link that does not
 * work, an entry already paid, nothing to pay, or card payments switched off.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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

export function PayEntry() {
  const t = useTranslations("register");
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
  return (
    <PublicCard>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[.12em] text-pp-muted">{entry.tournamentName}</p>
        <h2 className="font-pp-display text-xl font-bold text-pp-navy">{entry.participantName}</h2>
        {entry.category && <p className="text-sm text-pp-muted">{entry.category}</p>}
        {entry.fee > 0 && (
          <p className="text-sm font-semibold text-pp-ink">{t("doneFee", { fee: money(entry.fee) })}</p>
        )}

        {entry.state === "unpaid" && entry.cardPayments && (
          <div className="mt-2 flex w-full flex-col items-center gap-2">
            <PayNow entry={id} code={code} label={t("payNow", { fee: money(entry.fee) })} />
            <p className="max-w-sm text-[13px] text-pp-muted">{t("payLater")}</p>
          </div>
        )}
        {entry.state === "unpaid" && !entry.cardPayments && (
          <p className="max-w-sm text-[13px] text-pp-muted">{t("payAtDesk")}</p>
        )}
        {entry.state === "paid" && (
          <p className="rounded-xl bg-pp-green-soft px-3 py-2 text-[13.5px] font-semibold text-pp-ink">{t("payAlreadyDone")}</p>
        )}
        {entry.state === "free" && <p className="max-w-sm text-[13px] text-pp-muted">{t("payNothingDue")}</p>}
        {entry.state === "closed" && <p className="max-w-sm text-[13px] text-pp-muted">{t("payClosed")}</p>}
      </div>
    </PublicCard>
  );
}
