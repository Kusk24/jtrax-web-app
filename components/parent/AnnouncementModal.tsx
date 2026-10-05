"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Clock3, Megaphone, Paperclip, UserRound, X } from "lucide-react";
import type { AnnouncementV2 } from "@/lib/parent-v2-data";

export function AnnouncementModal({
  a,
  onClose,
}: {
  a: AnnouncementV2;
  onClose: () => void;
}) {
  const t = useTranslations("pv2");
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(28,25,40,.5)] p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[420px] flex-col gap-3 overflow-y-auto rounded-xl bg-pp-card p-6 shadow-[0_30px_70px_rgba(28,25,40,.3)]"
      >
        <div className="flex items-start justify-between gap-2.5">
          <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[.14em] text-pp-blue">
            <Megaphone className="size-3.5" strokeWidth={2} aria-hidden />
            {t("announcementLabel")}
          </span>
          <button
            onClick={onClose}
            aria-label={t("cancel")}
            className="flex size-[30px] flex-none cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card text-pp-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <span className="font-pp-display text-xl font-semibold leading-snug text-pp-ink">{a.title}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-pp-muted">
          <span>{t("fromSender", { name: a.senderName })}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3" strokeWidth={2} aria-hidden />
            {a.time}
          </span>
        </span>
        <div className="border-t border-pp-line" />
        <span className="whitespace-pre-line text-[13.5px] leading-relaxed text-pp-ink">{a.msg}</span>
        {a.attachmentImg && (
          <Image
            src={a.attachmentImg}
            alt=""
            width={420}
            height={280}
            className="w-full rounded-[14px]"
          />
        )}
        {(a.child || a.cls || a.attachment) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-pp-line pt-2 text-[11.5px] text-pp-muted">
            {a.child && (
              <span className="inline-flex items-center gap-1">
                <UserRound className="size-3" strokeWidth={2} aria-hidden />
                {t("forChild", { name: a.child })}
              </span>
            )}
            {a.cls && <span>{a.cls}</span>}
            {a.attachment && (
              <span className="inline-flex items-center gap-1 text-pp-blue">
                <Paperclip className="size-3" strokeWidth={2} aria-hidden />
                {t("oneAttachment")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
