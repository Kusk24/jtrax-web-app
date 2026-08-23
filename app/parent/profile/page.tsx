"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, LogOut } from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import { ParentAvatar } from "@/components/parent/ParentAvatar";
import { SignOutButton } from "@/components/SignOutButton";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const panel = "overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-white";

const MINUTE_OPTS = [0, 15, 30, 45];

export default function ParentProfileV2() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { children: childrenV2, parent, prefs, savePrefs } = useParentData();
  const [theme, setTheme] = useState("system");
  const [screenTime, setScreenTime] = useState({ h: 1, m: 30 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState({ h: 1, m: 30 });
  /* A failed save used to raise a browser alert, in English, on a screen a
     Thai-reading parent may be using. It belongs next to the switch that
     failed. */
  const [prefError, setPrefError] = useState(false);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const setLang = (code: string) => {
    if (code === locale) return;
    document.cookie = `locale=${code}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  const fmtTime = (h: number, m: number) => {
    const parts: string[] = [];
    if (h > 0) parts.push(`${h} ${t("hr")}`);
    if (m > 0 || h === 0) parts.push(`${m} ${t("min")}`);
    return parts.join(" ");
  };

  const openPicker = () => {
    setDraft(screenTime);
    setPickerOpen(true);
    setTimeout(() => {
      if (hoursRef.current) hoursRef.current.scrollTop = screenTime.h * 36;
      if (minutesRef.current)
        minutesRef.current.scrollTop = MINUTE_OPTS.indexOf(screenTime.m) * 36;
    }, 0);
  };

  const prefDefs = [
    { k: "checkin" as const, label: t("prefCheckin"), sub: t("prefCheckinSub") },
    { k: "credits" as const, label: t("prefCredits"), sub: t("prefCreditsSub") },
    { k: "news" as const, label: t("prefNews"), sub: t("prefNewsSub") },
  ];
  const themeDefs = [
    { k: "light", label: t("themeLight") },
    { k: "dark", label: t("themeDark") },
    { k: "system", label: t("themeSystem") },
  ];

  return (
    <div className="grid content-start gap-5 px-4 pb-8 pt-5 sm:px-5 md:grid-cols-2 md:gap-x-6">
      <div className="-mx-4 -mt-5 bg-pp-soft px-4 pb-[70px] pt-6 text-center font-pp-display text-2xl font-semibold sm:-mx-5 sm:px-5 md:col-span-2">
        {t("myProfile")}
      </div>
      <div className="relative z-[1] -mt-[54px] flex flex-col items-center gap-3 md:col-span-2">
        <div className="size-[102px] flex-none overflow-hidden rounded-full border-[3px] border-white shadow-[0_10px_24px_rgba(46,92,184,.32)]">
          <ParentAvatar className="size-full text-4xl" />
        </div>
        <span className="font-pp-display text-[22px] font-semibold">{parent.name}</span>
      </div>

      {/* Column 1 */}
      <div className="contents min-w-0 flex-col gap-5 md:flex">
        <div className="flex flex-col gap-3">
          <span className={label}>{t("myChildren", { count: childrenV2.length })}</span>
          <div className={panel}>
            {childrenV2.map((c) => (
              <Link
                key={c.key}
                href={`/parent/child/${c.key}`}
                className="flex w-full items-center gap-3 border-b border-[#e8edf8] px-4 py-4 last:border-0 hover:bg-pp-mist"
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
            <div className="flex items-center justify-between border-b border-[#e8edf8] px-4 py-4">
              <span className="text-[13px] text-pp-muted">{t("phone")}</span>
              <span className="text-[13.5px] font-semibold">{parent.phone || "—"}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-[13px] text-pp-muted">{t("email")}</span>
              <span className="truncate pl-3 text-[13.5px] font-semibold">{parent.email || "—"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className={label}>{t("notifPrefs")}</span>
          <div className={panel}>
            {prefDefs.map((p) => (
              <div key={p.k} className="flex items-center justify-between gap-3 border-b border-[#e8edf8] px-4 py-3.5 last:border-0">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className="text-[11px] text-pp-muted">{p.sub}</span>
                </div>
                <button
                  onClick={() => {
                    setPrefError(false);
                    savePrefs({ ...prefs, [p.k]: !prefs[p.k] }).catch(() => setPrefError(true));
                  }}
                  role="switch"
                  aria-checked={prefs[p.k]}
                  aria-label={p.label}
                  className="relative h-7 w-[46px] flex-none cursor-pointer rounded-full transition-colors"
                  style={{
                    background: prefs[p.k]
                      ? "var(--color-pp-green-dot)"
                      : "var(--color-pp-faint)",
                  }}
                >
                  <span
                    className="absolute top-[3px] size-[22px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.2)] transition-all"
                    style={{ left: prefs[p.k] ? 21 : 3 }}
                  />
                </button>
              </div>
            ))}
            {prefError && (
              <p role="alert" className="px-4 py-2.5 text-[12px] font-semibold text-pp-danger">
                {t("prefSaveFailed")}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className={label}>{t("gameSettings")}</span>
          <div className="rounded-xl border-[1.5px] border-pp-line bg-white p-1">
            <button
              onClick={openPicker}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[9px] p-3.5 text-left hover:bg-pp-bg"
            >
              <span className="text-sm font-semibold text-pp-ink">{t("dailyScreenTime")}</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-semibold text-pp-muted">
                  {fmtTime(screenTime.h, screenTime.m)}
                </span>
                <ChevronRight className="size-4 text-pp-faint" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Column 2 */}
      <div className="contents min-w-0 flex-col gap-5 md:flex">
        <div className="flex flex-col gap-3">
          <span className={label}>{t("appearance")}</span>
          <div className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-pp-line bg-white px-4 py-3">
            <span className="text-sm font-semibold">{t("theme")}</span>
            <div className="flex gap-1 rounded-full bg-[#e8edf8] p-[3px]">
              {themeDefs.map((th) => (
                <button
                  key={th.k}
                  onClick={() => setTheme(th.k)}
                  className="cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{
                    background: theme === th.k ? "var(--color-pp-deep)" : "transparent",
                    color: theme === th.k ? "#fbfff1" : "var(--color-pp-muted)",
                  }}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className={label}>{t("more")}</span>
          <div className={panel}>
            <div className="flex items-center justify-between border-b border-[#e8edf8] px-4 py-3.5">
              <span className="text-sm font-semibold">{t("language")}</span>
              <div className="flex gap-1 rounded-full bg-[#e8edf8] p-[3px]">
                {(
                  [
                    ["en", "EN"],
                    ["th", "ไทย"],
                  ] as const
                ).map(([code, lbl]) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    aria-pressed={locale === code}
                    className="cursor-pointer rounded-full px-3.5 py-1 text-xs font-bold"
                    style={{
                      background: locale === code ? "var(--color-pp-deep)" : "transparent",
                      color: locale === code ? "#fbfff1" : "var(--color-pp-muted)",
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <a href="tel:+66123456789" className="flex items-center justify-between px-4 py-4 text-pp-ink hover:bg-pp-mist">
              <span className="text-sm font-semibold">{t("contactSchool")}</span>
              <span className="text-[12.5px] font-semibold text-pp-blue">✆ {t("call")}</span>
            </a>
          </div>
        </div>

        {/* Was a Link to "/", which left the cookie in place — the landing page
            saw a live session and sent you straight back here. */}
        <SignOutButton className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#e7c9c9] bg-white p-3.5 text-center text-[13.5px] font-bold text-pp-danger transition-colors hover:bg-[#fdf3f3] disabled:opacity-60">
          <LogOut className="size-4" />
          {t("logOut")}
        </SignOutButton>
      </div>

      <div className="flex flex-col items-center gap-1 pb-1 pt-1.5 md:col-span-2">
        <Image src="/parent/jca-logo.png" alt="JCA Chess Academy" width={34} height={34} className="mb-0.5" />
        <span className="text-[11px] font-bold uppercase tracking-[.14em] text-pp-faint">
          JCA Chess Academy
        </span>
        <span className="text-center text-[10.5px] text-pp-faint">{t("academyFooter")}</span>
      </div>

      {/* Screen time picker */}
      {pickerOpen && (
        <div
          onClick={() => setPickerOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(28,25,40,.5)] p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-[380px] flex-col gap-4 rounded-[20px] bg-white px-5 pb-7 pt-4 shadow-[0_30px_70px_rgba(28,25,40,.3)]"
          >
            <div className="flex items-center justify-between">
              <button onClick={() => setPickerOpen(false)} className="cursor-pointer p-1 text-sm font-semibold text-pp-muted">
                {t("cancel")}
              </button>
              <span className="font-pp-display text-[15px] font-semibold text-pp-ink">
                {t("setDailyScreenTime")}
              </span>
              <button
                onClick={() => {
                  setScreenTime(draft);
                  setPickerOpen(false);
                }}
                className="cursor-pointer p-1 text-sm font-bold text-pp-blue"
              >
                {t("save")}
              </button>
            </div>
            <div className="relative flex items-center justify-center gap-2">
              <div className="pointer-events-none absolute left-2 right-2 top-9 h-9 border-y-[1.5px] border-pp-line" />
              <div
                ref={hoursRef}
                onScroll={(e) => {
                  const idx = Math.max(0, Math.min(12, Math.round(e.currentTarget.scrollTop / 36)));
                  if (idx !== draft.h) setDraft((p) => ({ ...p, h: idx }));
                }}
                className="h-[108px] w-[74px] snap-y snap-mandatory overflow-y-auto [scrollbar-width:none]"
              >
                <div className="h-9" />
                {Array.from({ length: 13 }, (_, h) => (
                  <div
                    key={h}
                    className="flex h-9 snap-center items-center justify-center font-pp-display"
                    style={{
                      fontSize: h === draft.h ? 20 : 16,
                      fontWeight: h === draft.h ? 700 : 400,
                      color: h === draft.h ? "var(--color-pp-ink)" : "var(--color-pp-faint)",
                    }}
                  >
                    {h}
                  </div>
                ))}
                <div className="h-9" />
              </div>
              <span className="text-sm font-semibold text-pp-faint">{t("hr")}</span>
              <div
                ref={minutesRef}
                onScroll={(e) => {
                  const idx = Math.max(
                    0,
                    Math.min(MINUTE_OPTS.length - 1, Math.round(e.currentTarget.scrollTop / 36)),
                  );
                  if (MINUTE_OPTS[idx] !== draft.m) setDraft((p) => ({ ...p, m: MINUTE_OPTS[idx] }));
                }}
                className="h-[108px] w-[74px] snap-y snap-mandatory overflow-y-auto [scrollbar-width:none]"
              >
                <div className="h-9" />
                {MINUTE_OPTS.map((m) => (
                  <div
                    key={m}
                    className="flex h-9 snap-center items-center justify-center font-pp-display"
                    style={{
                      fontSize: m === draft.m ? 20 : 16,
                      fontWeight: m === draft.m ? 700 : 400,
                      color: m === draft.m ? "var(--color-pp-ink)" : "var(--color-pp-faint)",
                    }}
                  >
                    {String(m).padStart(2, "0")}
                  </div>
                ))}
                <div className="h-9" />
              </div>
              <span className="text-sm font-semibold text-pp-faint">{t("min")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
