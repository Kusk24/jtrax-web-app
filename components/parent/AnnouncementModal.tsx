"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Clock3, Paperclip, UserRound, X } from "lucide-react";
import type { AnnouncementV2, SenderKind } from "@/lib/parent-v2-data";

export const SENDER_STYLE: Record<
  SenderKind,
  { labelKey: string; c: string; bg: string }
> = {
  teacher: { labelKey: "senderTeacher", c: "var(--color-pp-blue)", bg: "var(--color-pp-soft)" },
  branch: { labelKey: "senderBranch", c: "var(--color-pp-green)", bg: "var(--color-pp-green-soft)" },
  admin: { labelKey: "senderAdmin", c: "var(--color-pp-deep)", bg: "#efeefa" },
};

export function AnnouncementModal({
  a,
  onClose,
}: {
  a: AnnouncementV2;
  onClose: () => void;
}) {
  const t = useTranslations("pv2");
  const ss = SENDER_STYLE[a.sender];
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(28,25,40,.5)] p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[420px] flex-col gap-3 overflow-y-auto rounded-xl bg-white p-6 shadow-[0_30px_70px_rgba(28,25,40,.3)]"
      >
        <div className="flex items-center justify-between gap-2.5">
          <span className="min-w-0 flex-1 font-pp-display text-xl font-semibold leading-snug text-pp-ink">
            {a.title}
          </span>
          <button
            onClick={onClose}
            aria-label={t("cancel")}
            className="flex size-[30px] flex-none cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-white text-pp-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <span className="text-[13.5px] leading-relaxed text-pp-sub">{a.msg}</span>
        {a.attachmentImg && (
          <Image
            src={a.attachmentImg}
            alt=""
            width={420}
            height={280}
            className="w-full rounded-[14px]"
          />
        )}
        <div className="flex items-center gap-2 border-t border-pp-line pt-2">
          <span
            className="flex size-8 flex-none items-center justify-center rounded-full"
            style={{ background: ss.bg, color: ss.c }}
          >
            <UserRound className="size-[15px]" strokeWidth={2} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[13px] font-semibold text-pp-ink">{a.senderName}</span>
            <span className="text-[11px] text-pp-muted">
              {t(ss.labelKey)}
              {a.cls ? ` · ${a.cls}` : ""}
            </span>
          </div>
        </div>
        {a.child && (
          <span className="flex items-center gap-1.5 text-xs text-pp-muted">
            <UserRound className="size-[13px]" strokeWidth={2} />
            {t("forChild", { name: a.child })}
          </span>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-pp-faint">
            <Clock3 className="size-3" strokeWidth={2} />
            {a.time}
          </span>
          {a.attachment && (
            <span className="flex items-center gap-1.5 text-[11px] text-pp-blue">
              <Paperclip className="size-3" strokeWidth={2} />
              {t("oneAttachment")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
