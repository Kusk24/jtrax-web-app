import { CalendarDays, CircleAlert, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";

/** Remaining credits + validity side by side, with an explicit expiry note —
    the date has to be as obvious as the number. */
export function CreditSummaryCard({
  remaining,
  total,
  validUntil,
  daysLeft,
  low,
}: {
  remaining: number;
  total: number;
  validUntil: string;
  daysLeft: number;
  low: boolean;
}) {
  const t = useTranslations("profile");
  const label = low ? "text-brick" : "text-muted";
  const value = low ? "text-brick" : "text-ink";
  const icon = low ? "bg-card text-brick" : "bg-card text-olive";

  return (
    <div
      className={`rounded-xl border-2 p-3.5 ${
        low ? "border-brick/40 bg-brick-soft/60" : "border-olive/40 bg-olive-soft/60"
      }`}
    >
      <div
        className={`grid grid-cols-2 divide-x ${
          low ? "divide-brick/20" : "divide-olive/30"
        }`}
      >
        <div className="flex items-center gap-2.5 pr-3">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-full ${icon}`}
          >
            <Ticket className="size-4" />
          </span>
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${label}`}
            >
              {t("remainingCredits")}
            </p>
            <p className={`font-extrabold ${value}`}>
              <span className="text-xl">{remaining}</span>
              <span className="text-xs"> /{total}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 pl-3">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-full ${icon}`}
          >
            <CalendarDays className="size-4" />
          </span>
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-wide ${label}`}
            >
              {t("validUntilLabel")}
            </p>
            <p className={`text-sm font-extrabold ${value}`}>{validUntil}</p>
            <span
              className={`mt-0.5 inline-block rounded-full bg-card px-2 py-0.5 text-[10px] font-bold ${value}`}
            >
              {t("daysLeft", { count: daysLeft })}
            </span>
          </div>
        </div>
      </div>
      <p
        className={`mt-2.5 flex items-start gap-1.5 border-t pt-2 text-[11px] ${
          low ? "border-brick/20 text-brick" : "border-olive/30 text-ink"
        }`}
      >
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
        {t("creditsExpireNote", { date: validUntil })}
      </p>
    </div>
  );
}
