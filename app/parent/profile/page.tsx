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
import { BadgeCheck, ChevronRight, Mail, Pencil, Phone } from "lucide-react";
import { ChildFace } from "@/components/parent/ChildFace";
import { useParentData } from "@/components/parent/ParentData";
import { ParentPageHeader } from "@/components/parent/ParentPageHeader";
import { ParentAvatar } from "@/components/parent/ParentAvatar";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const panel = "overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card";

export default function ParentProfileV2() {
  const t = useTranslations("pv2");
  const { children: childrenV2, parent, parentId } = useParentData();

  return (
    <div className="grid content-start gap-5 md:grid-cols-2 md:gap-x-6">
      <div className="md:col-span-2">
        <ParentPageHeader title={t("myProfile")} sub={t("profileSub")} />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-3.5 shadow-[0_8px_24px_rgba(35,53,94,.08)] md:col-span-2">
        <div className="size-[58px] flex-none overflow-hidden rounded-[15px] border-[3px] border-pp-soft shadow-[0_8px_20px_rgba(46,92,184,.22)]">
          <ParentAvatar className="size-full text-2xl" />
        </div>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <strong className="truncate font-pp-display text-[18px] font-semibold">{parent.name}</strong>
            <span className="rounded-full bg-pp-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-pp-blue">{t("roleParent")}</span>
          </span>
          <span className="mt-1 truncate text-[10.5px] text-pp-faint">{t("idLabel", { id: parentId })}</span>
          <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-pp-green"><BadgeCheck className="size-3" />{t("verifiedAccount")}</span>
        </span>
        <Link href="/parent/settings" aria-label={t("navSettings")} className="flex size-9 flex-none items-center justify-center rounded-xl border border-pp-line text-pp-muted hover:bg-pp-mist"><Pencil className="size-4" /></Link>
      </div>

      <div className="flex flex-col gap-3">
        <span className={label}>{t("myChildren", { count: childrenV2.length })}</span>
        <div className={`${panel} shadow-[0_7px_20px_rgba(35,53,94,.06)]`}>
          {childrenV2.map((c) => (
            <Link
              key={c.key}
              href={`/parent/child/${c.key}`}
              className="flex w-full items-center gap-3 border-b border-pp-panel px-4 py-4 last:border-0 hover:bg-pp-mist"
            >
              <ChildFace
                name={c.name}
                photo={c.photo}
                tint={c.avBg}
                className="size-[42px] flex-none rounded-full"
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
        <div className={`${panel} shadow-[0_7px_20px_rgba(35,53,94,.06)]`}>
          <div className="flex items-center gap-3 border-b border-pp-panel px-4 py-3.5">
            <span className="flex size-8 flex-none items-center justify-center rounded-xl bg-pp-soft text-pp-blue"><Phone className="size-4" /></span>
            <span className="flex min-w-0 flex-1 flex-col"><span className="text-[10px] text-pp-muted">{t("phone")}</span><span className="truncate text-[13px] font-semibold">{parent.phone || "—"}</span></span>
            <ChevronRight className="size-4 text-pp-line" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex size-8 flex-none items-center justify-center rounded-xl bg-pp-soft text-pp-blue"><Mail className="size-4" /></span>
            <span className="flex min-w-0 flex-1 flex-col"><span className="text-[10px] text-pp-muted">{t("email")}</span><span className="truncate text-[13px] font-semibold">{parent.email || "—"}</span></span>
            <span className="rounded-full bg-pp-green-soft px-2 py-0.5 text-[9px] font-bold text-pp-green">{t("verified")}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
