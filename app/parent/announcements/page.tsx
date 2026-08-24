"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { GraduationCap, Paperclip, UserRound } from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import { AnnouncementModal, SENDER_STYLE } from "@/components/parent/AnnouncementModal";

export default function ParentAnnouncementsV2() {
  const t = useTranslations("pv2");
  const { announcements: announcementsV2, isAnnRead, markAnnRead } = useParentData();
  const router = useRouter();
  const [modalId, setModalId] = useState<string | null>(null);
  const modal = announcementsV2.find((a) => a.id === modalId);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 pb-10 pt-5 sm:px-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-pp-card text-base text-pp-ink hover:bg-pp-soft"
        >
          ←
        </button>
        <span className="font-pp-display text-2xl font-semibold leading-tight">
          {t("announcements")}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {announcementsV2.map((a) => {
          const ss = SENDER_STYLE[a.sender];
          const isUnread = !isAnnRead(a.id);
          return (
            <button
              key={a.id}
              onClick={() => {
                markAnnRead(a.id);
                setModalId(a.id);
              }}
              className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border-[1.5px] p-4 text-left shadow-[0_6px_18px_rgba(35,53,94,.07)]"
              style={{
                background: isUnread ? "var(--color-pp-mist)" : "var(--color-pp-card)",
                borderColor: isUnread ? "var(--color-pp-soft)" : "var(--color-pp-line)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 text-[14.5px] font-semibold text-pp-ink">
                  {a.title}
                </span>
                {isUnread && (
                  <span className="flex-none rounded-full bg-pp-blue px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.06em] text-white">
                    {t("new")}
                  </span>
                )}
              </div>
              <span className="line-clamp-2 text-[12.5px] leading-relaxed text-pp-muted">
                {a.msg}
              </span>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-pp-faint">
                {a.child && (
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3" strokeWidth={2} />
                    {a.child}
                  </span>
                )}
                {a.cls && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="size-3" strokeWidth={2} />
                    {a.cls}
                  </span>
                )}
                {a.attachment && (
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="size-3" strokeWidth={2} />
                    {t("attachmentWord")}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] text-pp-faint">{a.time}</span>
                <span
                  className="flex-none rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.06em]"
                  style={{ color: ss.c, background: ss.bg }}
                >
                  {t(ss.labelKey)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </div>
  );
}
