"use client";

/**
 * Everything a parent can change, split off the profile screen.
 *
 * Profile is who you are — your children, your contact details. This is what
 * you set: alerts, appearance, language. They were one long scroll, and the
 * settings half was below the fold on a phone.
 *
 * A "Daily Screen Time" picker used to sit here under Game Settings. It set
 * React state and nothing else — no request, no column, no check anywhere in
 * the student app — so it read as a parental control and enforced nothing, and
 * forgot the answer on reload. A limit a parent believes is running is worse
 * than no limit at all.
 */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import { ParentPageHeader } from "@/components/parent/ParentPageHeader";
import { SignOutButton } from "@/components/SignOutButton";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const panel = "overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card";

export default function ParentSettings() {
  const t = useTranslations("pv2");
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { prefs, schoolAllows, savePref } = useParentData();
  /* Initialised from the shell's data-theme (server-rendered from the
     account), so the picker shows the saved choice without a fetch. */
  const [theme, setTheme] = useState("system");
  /* A failed save used to raise a browser alert, in English, on a screen a
     Thai-reading parent may be using. It belongs next to the switch that
     failed. */
  const [prefError, setPrefError] = useState(false);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-theme]");
    if (el?.dataset.theme) setTheme(el.dataset.theme);
  }, []);

  function chooseTheme(k: string) {
    setTheme(k);
    const el = document.querySelector<HTMLElement>("[data-theme]");
    if (el) el.dataset.theme = k;
    const pref = k === "dark" ? "Dark" : k === "light" ? "Light" : "System";
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: pref }),
    }).catch(() => { /* applied on screen; the account catches up next visit */ });
  }

  const setLang = (code: string) => {
    if (code === locale) return;
    document.cookie = `locale=${code}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  /* The catalogue, one switch each, all on until the parent turns one off —
     but only the types the school sends. The school's switch (Admin →
     Settings → Notifications) is the master: a type it has off is not
     offered here at all, rather than shown as a switch that does nothing. */
  const allPrefDefs = [
    { k: "check_in" as const, label: t("prefCheckin") },
    { k: "credit_deducted" as const, label: t("prefDeducted") },
    { k: "low_credit" as const, label: t("prefLowCredit") },
    { k: "credit_expiry" as const, label: t("prefExpiry") },
    { k: "announcement" as const, label: t("prefNews") },
    { k: "payment_received" as const, label: t("prefPayment") },
    { k: "class_cancelled" as const, label: t("prefCancelled") },
  ];
  const prefDefs = allPrefDefs.filter((p) => schoolAllows[p.k]);
  /* Same order and wording as the console's pill: Auto first, because
     following the device is the default nobody has to think about. */
  const themeDefs = [
    { k: "system", label: t("themeSystem") },
    { k: "light", label: t("themeLight") },
    { k: "dark", label: t("themeDark") },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] content-start gap-5 md:grid-cols-2 md:gap-x-6">
      <div className="md:col-span-2">
        <ParentPageHeader title={t("settingsTitle")} sub={t("settingsSub")} />
      </div>

      <div className="contents min-w-0 flex-col gap-5 md:flex">
        <div className="flex flex-col gap-3">
          <span className={label}>{t("notifPrefs")}</span>
          <div className={panel}>
            {prefDefs.length === 0 && (
              <p className="px-4 py-3.5 text-[13px] text-pp-muted">{t("notifNoneFromSchool")}</p>
            )}
            {prefDefs.map((p) => (
              <div key={p.k} className="flex items-center justify-between gap-3 border-b border-pp-panel px-4 py-3.5 last:border-0">
                <span className="min-w-0 text-sm font-semibold">{p.label}</span>
                <button
                  onClick={() => {
                    setPrefError(false);
                    savePref(p.k, !prefs[p.k]).catch(() => setPrefError(true));
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
                    className="absolute top-[3px] size-[22px] rounded-full bg-pp-card shadow-[0_2px_6px_rgba(0,0,0,.2)] transition-all"
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

      </div>

      <div className="contents min-w-0 flex-col gap-5 md:flex">
        <div className="flex flex-col gap-3">
          <span className={label}>{t("appearance")}</span>
          <div className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card px-4 py-3">
            <span className="text-sm font-semibold">{t("theme")}</span>
            <div className="flex gap-1 rounded-full bg-pp-panel p-[3px]">
              {themeDefs.map((th) => (
                <button
                  key={th.k}
                  onClick={() => chooseTheme(th.k)}
                  aria-pressed={theme === th.k}
                  className="cursor-pointer rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{
                    background: theme === th.k ? "var(--color-pp-blue)" : "transparent",
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
          <span className={label}>{t("security")}</span>
          <ChangePasswordForm tone="parent" />
        </div>

        <div className="flex flex-col gap-3">
          <span className={label}>{t("more")}</span>
          <div className={panel}>
            <div className="flex items-center justify-between border-b border-pp-panel px-4 py-3.5">
              <span className="text-sm font-semibold">{t("language")}</span>
              <div className="flex gap-1 rounded-full bg-pp-panel p-[3px]">
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
                      background: locale === code ? "var(--color-pp-blue)" : "transparent",
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

        {/* Phone only: the sidebar carries Logout from `lg` up, where it sits
            in the bottom corner as it does in the console. */}
        <SignOutButton className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-pp-danger-line bg-pp-card p-3.5 text-center text-[13.5px] font-bold text-pp-danger transition-colors hover:bg-pp-danger-hover disabled:opacity-60 lg:hidden">
          <LogOut className="size-4" />
          {t("logOut")}
        </SignOutButton>
      </div>

    </div>
  );
}
