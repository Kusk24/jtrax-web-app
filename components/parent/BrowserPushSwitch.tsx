"use client";

/* The parent's switch for notifications on this browser (lib/browser-push).
   Left out entirely until the server has browser push set up; where the
   browser cannot have them, or the parent blocked them, it says so instead
   of offering a switch that would do nothing. */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  browserPushState,
  disableBrowserPush,
  enableBrowserPush,
  type BrowserPushState,
} from "@/lib/browser-push";

export function BrowserPushSwitch({ className }: { className?: string }) {
  const t = useTranslations("pv2");
  const [state, setState] = useState<BrowserPushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    browserPushState().then((s) => live && setState(s));
    return () => {
      live = false;
    };
  }, []);

  if (state === null || state === "unavailable") return null;

  const on = state === "on";
  async function toggle() {
    setBusy(true);
    setFailed(false);
    try {
      setState(on ? await disableBrowserPush() : await enableBrowserPush());
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-semibold">{t("browserNotif")}</span>
          <span className="text-[12px] text-pp-muted">
            {state === "blocked"
              ? t("browserNotifBlocked")
              : state === "unsupported"
                ? t("browserNotifUnsupported")
                : t("browserNotifHint")}
          </span>
        </div>
        {(state === "on" || state === "off") && (
          <button
            onClick={toggle}
            disabled={busy}
            role="switch"
            aria-checked={on}
            aria-label={t("browserNotif")}
            className="relative h-7 w-[46px] flex-none cursor-pointer rounded-full transition-colors disabled:opacity-60"
            style={{ background: on ? "var(--color-pp-green-dot)" : "var(--color-pp-faint)" }}
          >
            <span
              className="absolute top-[3px] size-[22px] rounded-full bg-pp-card shadow-[0_2px_6px_rgba(0,0,0,.2)] transition-all"
              style={{ left: on ? 21 : 3 }}
            />
          </button>
        )}
      </div>
      {failed && (
        <p role="alert" className="px-4 pb-3 text-[12px] font-semibold text-pp-danger">
          {t("browserNotifFailed")}
        </p>
      )}
    </div>
  );
}
