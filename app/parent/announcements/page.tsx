"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useParentData } from "@/components/parent/ParentData";
import { AnnouncementModal } from "@/components/parent/AnnouncementModal";
import { AnnouncementCard } from "@/components/parent/AnnouncementCard";

export default function ParentAnnouncementsV2() {
  const t = useTranslations("pv2");
  const { announcements: announcementsV2, isAnnRead, markAnnRead } = useParentData();
  const router = useRouter();
  const [modalId, setModalId] = useState<string | null>(null);
  const modal = announcementsV2.find((a) => a.id === modalId);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
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
        {announcementsV2.map((a) => (
          <AnnouncementCard
            key={a.id}
            a={a}
            unread={!isAnnRead(a.id)}
            onOpen={() => {
              markAnnRead(a.id);
              setModalId(a.id);
            }}
            className="w-full"
            details
          />
        ))}
      </div>

      {modal && <AnnouncementModal a={modal} onClose={() => setModalId(null)} />}
    </div>
  );
}
