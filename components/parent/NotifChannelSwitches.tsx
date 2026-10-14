"use client";

/* The ways a notification type reaches a parent besides the bell — email, the
 * phone app, this kind of browser — each one a small switch under the type's
 * own. Only receipts and announcements leave the app, so only their rows have
 * these; the server says which (channelsByType). */
import { useTranslations } from "next-intl";
import { Check, Minus } from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import type { NotifType } from "@/lib/parent-v2-data";
import { channelOn, outsideChannels, type OutsideChannel } from "@/lib/notification-channels";

const LABEL_KEY: Record<OutsideChannel, string> = {
  email: "notifByEmail",
  mobile: "notifByPhone",
  webpush: "notifByBrowser",
};

export function NotifChannelSwitches({
  type, typeLabel, onError,
}: {
  type: NotifType;
  /** The type's own label, so each switch says which type it belongs to. */
  typeLabel: string;
  onError: () => void;
}) {
  const t = useTranslations("pv2");
  const { channelsByType, channelPrefs, saveChannelPref } = useParentData();
  const channels = outsideChannels(channelsByType, type);
  if (channels.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3.5">
      <span className="text-[12px] text-pp-muted">{t("notifAlsoBy")}</span>
      {channels.map((ch) => {
        const on = channelOn(channelPrefs, type, ch);
        const name = t(LABEL_KEY[ch]);
        return (
          <button
            key={ch}
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={`${typeLabel}: ${name}`}
            onClick={() => saveChannelPref(type, ch, !on).catch(onError)}
            className="inline-flex min-h-[32px] cursor-pointer items-center gap-1 rounded-full border-[1.5px] px-3 text-[12.5px] font-semibold transition-colors"
            style={{
              borderColor: on ? "var(--color-pp-green-dot)" : "var(--color-pp-line)",
              color: on ? "var(--color-pp-green-dot)" : "var(--color-pp-muted)",
            }}
          >
            {on ? <Check className="size-3.5" aria-hidden /> : <Minus className="size-3.5" aria-hidden />}
            {name}
          </button>
        );
      })}
    </div>
  );
}
