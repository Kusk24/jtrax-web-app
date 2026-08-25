"use client";

/**
 * Who the parent is: their children and their contact details.
 *
 * Everything they can *change* — alerts, screen time, appearance, language —
 * is on the Settings tab. This screen was both, and the settings half sat
 * below the fold on a phone.
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import { ParentPageHeader } from "@/components/parent/ParentPageHeader";
import { ParentAvatar } from "@/components/parent/ParentAvatar";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const panel = "overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card";

export default function ParentProfileV2() {
  const t = useTranslations("pv2");
  const { children: childrenV2, parent } = useParentData();

  return (
    <div className="grid content-start gap-5 md:grid-cols-2 md:gap-x-6">
      <div className="md:col-span-2">
        <ParentPageHeader title={t("myProfile")} sub={t("profileSub")} />
      </div>
      {/* The avatar used to be tucked into a deep colour band; it sits on the
          page now, beside the name, the way the console's detail views do. */}
      <div className="flex items-center gap-4 md:col-span-2">
        <div className="size-[72px] flex-none overflow-hidden rounded-full border-[3px] border-pp-card shadow-[0_10px_24px_rgba(46,92,184,.32)]">
          <ParentAvatar className="size-full text-3xl" />
        </div>
        <span className="font-pp-display text-[20px] font-semibold">{parent.name}</span>
      </div>

      <div className="flex flex-col gap-3">
        <span className={label}>{t("myChildren", { count: childrenV2.length })}</span>
        <div className={panel}>
          {childrenV2.map((c) => (
            <Link
              key={c.key}
              href={`/parent/child/${c.key}`}
              className="flex w-full items-center gap-3 border-b border-pp-panel px-4 py-4 last:border-0 hover:bg-pp-mist"
            >
              <span
                aria-label={c.name}
                className="size-[42px] flex-none rounded-full bg-cover bg-center"
                style={{ backgroundColor: c.avBg, backgroundImage: `url('${c.photo}')` }}
              />
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-[11px] text-pp-faint">{t("idLabel", { id: c.id })}</span>
              </span>
              <ChevronRight className="size-4 flex-none text-pp-line" />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className={label}>{t("contactInfo")}</span>
        <div className={panel}>
          <div className="flex items-center justify-between border-b border-pp-panel px-4 py-4">
            <span className="text-[13px] text-pp-muted">{t("phone")}</span>
            <span className="text-[13.5px] font-semibold">{parent.phone || "—"}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-[13px] text-pp-muted">{t("email")}</span>
            <span className="truncate pl-3 text-[13.5px] font-semibold">{parent.email || "—"}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
