"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check, Clock3, DoorOpen, type LucideIcon } from "lucide-react";
import type { NotifKind } from "@/lib/parent-v2-data";
import { useParentData } from "@/components/parent/ParentData";

/* Each kind of real event gets a face; the mock list drew emoji glyphs for
   events that had never happened. */
const KIND_STYLE: Record<NotifKind, { icon: LucideIcon; color: string; bg: string }> = {
  checkin: { icon: Check, color: "var(--color-pp-green)", bg: "#E6F4EC" },
  pickup: { icon: DoorOpen, color: "var(--color-pp-blue)", bg: "var(--color-pp-soft)" },
  credits: { icon: Clock3, color: "var(--color-pp-amber)", bg: "#FBEEDF" },
};

export default function ParentNotificationsV2() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const router = useRouter();
  const { notifs, unreadNotifs, isNotifRead, markNotifRead, markAllNotifsRead } = useParentData();
  const [tab, setTab] = useState<"all" | "unread">("all");

  const shown = notifs.filter((n) => tab === "all" || !isNotifRead(n.id));

  /* A credits notification carries a date, not a moment — formatting its
     midnight stamp as a clock time invented "07:00" out of the timezone. */
  const whenLabel = (iso: string, dateOnly: boolean) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
      day: "numeric", month: "short",
      ...(dateOnly ? {} : { hour: "2-digit", minute: "2-digit" } as const),
    }).format(d);
  };

  const timeOf = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
  };

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 pb-10 pt-5 sm:px-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-white text-base text-pp-ink hover:bg-pp-soft"
        >
          ←
        </button>
        <div className="flex flex-1 flex-col">
          <span className="font-pp-display text-2xl font-semibold leading-tight">
            {t("notificationsTitle")}
          </span>
          <span className="text-[12.5px] text-pp-muted">
            {unreadNotifs > 0 ? t("unreadCount", { count: unreadNotifs }) : t("allCaughtUp")}
          </span>
        </div>
        <button
          onClick={markAllNotifsRead}
          className="flex-none cursor-pointer text-xs font-bold text-pp-blue"
        >
          {t("markAllRead")}
        </button>
      </div>

      <div className="flex gap-1 self-start rounded-full bg-[#e8edf8] p-[3px]">
        {(["all", "unread"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold ${
              tab === k ? "bg-pp-deep text-[#fbfff1]" : "text-pp-muted"
            }`}
          >
            {k === "all" ? t("tabAll") : t("tabUnread")}
            {k === "unread" && unreadNotifs > 0 ? ` (${unreadNotifs})` : ""}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <div className="rounded-xl border-[1.5px] border-dashed border-[#d5cdbd] p-6 text-center text-[12.5px] text-pp-muted">
          ♞ {t("caughtUpBody")}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {shown.map((n) => {
          const isUnread = !isNotifRead(n.id);
          const ks = KIND_STYLE[n.kind];
          const Icon = ks.icon;
          const title =
            n.kind === "checkin" ? t("notifCheckinTitle", { name: n.name })
            : n.kind === "pickup" ? t("notifPickupTitle", { name: n.name })
            : t("notifCreditsTitle", { name: n.name });
          const body =
            n.kind === "checkin" ? t("notifCheckinBody", { name: n.name, cls: n.cls, time: timeOf(n.at) })
            : n.kind === "pickup" ? t("notifPickupBody", { name: n.name, cls: n.cls, time: timeOf(n.at) })
            : t("notifCreditsBody", { date: n.date ?? "—", days: n.days ?? 0 });
          return (
            <button
              key={n.id}
              onClick={() => {
                markNotifRead(n.id);
                router.push(n.href);
              }}
              className="flex w-full cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-4 text-left shadow-[0_6px_18px_rgba(35,53,94,.07)]"
              style={{
                background: isUnread ? "var(--color-pp-mist)" : "#ffffff",
                borderColor: isUnread ? "var(--color-pp-soft)" : "var(--color-pp-line)",
              }}
            >
              <span
                className="flex size-10 flex-none items-center justify-center rounded-[13px]"
                style={{ background: ks.bg }}
              >
                <Icon className="size-[18px]" style={{ color: ks.color }} strokeWidth={2.2} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13.5px] font-bold text-pp-ink">{title}</span>
                  {isUnread && <span className="size-[7px] flex-none rounded-full bg-pp-blue" />}
                </div>
                <span className="text-[12.5px] leading-relaxed text-pp-muted">{body}</span>
                <span className="text-[10.5px] text-pp-faint">{whenLabel(n.at, n.kind === "credits")}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
