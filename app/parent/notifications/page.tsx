"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { notifsV2 } from "@/lib/parent-v2-data";

export default function ParentNotificationsV2() {
  const t = useTranslations("pv2");
  const router = useRouter();
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"all" | "unread">("all");

  const unread = notifsV2.filter((n) => !read[n.id]).length;
  const shown = notifsV2.filter((n) => tab === "all" || !read[n.id]);

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
            {unread > 0 ? t("unreadCount", { count: unread }) : t("allCaughtUp")}
          </span>
        </div>
        <button
          onClick={() => {
            const all: Record<string, boolean> = {};
            notifsV2.forEach((n) => (all[n.id] = true));
            setRead(all);
          }}
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
            {k === "unread" && unread > 0 ? ` (${unread})` : ""}
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
          const isUnread = !read[n.id];
          return (
            <button
              key={n.id}
              onClick={() => {
                setRead((p) => ({ ...p, [n.id]: true }));
                router.push(`/parent/child/${n.child}`);
              }}
              className="flex w-full cursor-pointer items-start gap-3 rounded-xl border-[1.5px] p-4 text-left shadow-[0_6px_18px_rgba(35,53,94,.07)]"
              style={{
                background: isUnread ? "var(--color-pp-mist)" : "#ffffff",
                borderColor: isUnread ? "var(--color-pp-soft)" : "var(--color-pp-line)",
              }}
            >
              <span
                className="flex size-10 flex-none items-center justify-center rounded-[13px] text-base"
                style={{ background: n.iconBg }}
              >
                {n.icon}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13.5px] font-bold text-pp-ink">{n.title}</span>
                  {isUnread && <span className="size-[7px] flex-none rounded-full bg-pp-blue" />}
                </div>
                <span className="text-[12.5px] leading-relaxed text-pp-muted">{n.body}</span>
                <span className="text-[10.5px] text-pp-faint">{n.time}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
