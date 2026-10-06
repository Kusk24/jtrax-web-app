"use client";

/* One tournament on the parent home, for its whole life — registration, the
   day itself, its results. The card stays; its corner tag, the registered
   line, the note and the one button follow the tournament (lib/tournament-card). */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { TournamentBanner } from "@/components/public/TournamentBanner";
import type { TournamentCardV2 } from "@/components/parent/ParentData";

const TAG_BASE =
  "absolute right-4 top-2.5 flex size-16 flex-col items-center justify-center rounded-full border-[2.5px] border-white text-center text-white shadow-[0_6px_16px_rgba(0,0,0,.35)]";

export function TournamentHomeCard({ card }: { card: TournamentCardV2 }) {
  const t = useTranslations("pv2");
  const { tag, action, registered, notRegisteredNote } = card.state;

  const href = action === "viewResults" ? `/t/${card.id}` : "/parent/tournament";
  const label =
    action === "register" ? t("registerNow") : action === "viewRegistration" ? t("viewRegistration") : t("viewResults");

  return (
    <div className="max-w-[520px] overflow-hidden rounded-2xl bg-pp-card shadow-[0_12px_32px_rgba(35,53,94,.12)]">
      <div className="relative">
        <TournamentBanner
          name={card.name}
          when={card.date}
          venue={card.venue}
          imageUrl={card.hasBanner ? `/api/tournaments/${card.id}/banner` : undefined}
          className="h-[158px] w-full"
        />
        {tag.kind === "closesIn" ? (
          <div className={`${TAG_BASE} bg-pp-danger`}>
            <span className="text-[7.5px] font-bold uppercase leading-tight tracking-[.03em]">{t("registerCloses")}</span>
            <span className="font-pp-display text-xl font-bold leading-none">{tag.days}</span>
            <span className="text-[8px] font-bold uppercase leading-none tracking-[.06em]">{t("days")}</span>
          </div>
        ) : (
          <div
            className={`${TAG_BASE} ${
              tag.kind === "ongoing" ? "bg-pp-green" : tag.kind === "results" ? "bg-pp-blue" : tag.kind === "completed" ? "bg-pp-sub" : "bg-pp-danger"
            }`}
          >
            <span className="px-1 text-[9px] font-bold uppercase leading-tight tracking-[.04em]">
              {t(
                tag.kind === "ongoing"
                  ? "tagOngoing"
                  : tag.kind === "results"
                    ? "tagResults"
                    : tag.kind === "completed"
                      ? "tagCompleted"
                      : "tagRegistrationClosed",
              )}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4 pt-4">
        <span className="font-pp-display text-lg font-semibold leading-tight text-pp-ink">{card.name}</span>
        {registered && (
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-pp-green">
            <CheckCircle2 className="size-4" aria-hidden />
            {card.registeredNames.length > 0
              ? t("registeredNames", { names: card.registeredNames.join(", ") })
              : t("registeredShort")}
          </span>
        )}
        {notRegisteredNote && <span className="text-[12.5px] text-pp-muted">{t("notRegisteredNote")}</span>}
        {action && (
          <Link href={href} className="mt-1 rounded-xl bg-pp-navy py-3 text-center text-sm font-bold text-white">
            {label}
          </Link>
        )}
      </div>
    </div>
  );
}
