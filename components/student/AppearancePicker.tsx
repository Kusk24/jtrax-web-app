"use client";

/**
 * Appearance — Auto, Light or Dark — as the parent's Settings has it: the same
 * pill, the same three choices, saved to the account so it follows the pupil
 * to another device. The shell's data-theme changes at once; the account
 * catches up in the background.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function AppearancePicker() {
  const t = useTranslations("pv2");
  /* Read from the shell's data-theme (server-rendered from the account) after
     the first paint, so the picker shows the saved choice without a fetch. */
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const id = setTimeout(() => {
      const el = document.querySelector<HTMLElement>("[data-theme]");
      if (el?.dataset.theme) setTheme(el.dataset.theme);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function choose(k: string) {
    setTheme(k);
    const el = document.querySelector<HTMLElement>("[data-theme]");
    if (el) el.dataset.theme = k;
    const pref = k === "dark" ? "Dark" : k === "light" ? "Light" : "System";
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: pref }),
    }).catch(() => {
      /* Applied on screen; the account catches up next visit. */
    });
  }

  const defs = [
    { k: "system", label: t("themeSystem") },
    { k: "light", label: t("themeLight") },
    { k: "dark", label: t("themeDark") },
  ];
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card px-4 py-3">
      <span className="text-sm font-semibold">{t("theme")}</span>
      <div className="flex gap-1 rounded-full bg-pp-panel p-[3px]">
        {defs.map((th) => (
          <button
            key={th.k}
            type="button"
            onClick={() => choose(th.k)}
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
  );
}
