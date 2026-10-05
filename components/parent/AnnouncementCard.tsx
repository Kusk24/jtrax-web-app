"use client";

/* One announcement as a notice: white, a single navy edge, a megaphone and
   the word "Announcement" beside the date, the title, two lines of the
   message, and who it is from. The same card on the home and on the
   Announcements page — no colour per sender, so it reads as the academy
   speaking rather than a chat bubble. */
import { useTranslations } from "next-intl";
import { GraduationCap, Megaphone, Paperclip, UserRound } from "lucide-react";
import type { AnnouncementV2 } from "@/lib/parent-v2-data";

export function AnnouncementCard({
  a, unread, onOpen, className = "", details = false,
}: {
  a: AnnouncementV2;
  unread: boolean;
  onOpen: () => void;
  className?: string;
  /** The child, class and attachment line — the full list shows it. */
  details?: boolean;
}) {
  const t = useTranslations("pv2");
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex cursor-pointer flex-col gap-2 rounded-xl border border-l-[3px] border-pp-line border-l-pp-blue bg-pp-card px-4 py-3.5 text-left shadow-[0_4px_14px_rgba(35,53,94,.06)] transition-shadow hover:shadow-[0_8px_20px_rgba(35,53,94,.10)] ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-pp-blue">
          <Megaphone className="size-3.5" strokeWidth={2} aria-hidden />
          {t("announcementLabel")}
        </span>
        <span className="flex items-center gap-2">
          {unread && (
            <span className="rounded-full bg-pp-blue px-1.5 py-px text-[9px] font-bold uppercase tracking-[.06em] text-white">
              {t("new")}
            </span>
          )}
          <span className="text-[11px] text-pp-muted">{a.time}</span>
        </span>
      </div>
      <span className="text-[14.5px] font-bold leading-snug text-pp-ink">{a.title}</span>
      <span className="line-clamp-2 text-[12.5px] leading-relaxed text-pp-sub">{a.msg}</span>
      {details && (a.child || a.cls || a.attachment) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-pp-muted">
          {a.child && (
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3" strokeWidth={2} aria-hidden />
              {a.child}
            </span>
          )}
          {a.cls && (
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="size-3" strokeWidth={2} aria-hidden />
              {a.cls}
            </span>
          )}
          {a.attachment && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3" strokeWidth={2} aria-hidden />
              {t("attachmentWord")}
            </span>
          )}
        </div>
      )}
      <span className="border-t border-pp-line pt-2 text-[11.5px] text-pp-muted">
        {t("fromSender", { name: a.senderName })}
      </span>
    </button>
  );
}
