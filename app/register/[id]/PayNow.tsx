"use client";

/* The "Pay now" button for a public entry, used on the screen right after
 * registering and on the page the confirmation email links to.
 *
 * It asks the backend for the entry's Stripe page and sends the browser there.
 * The price is whatever the entry says on the server; nothing here decides it.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { EntryError, payForPublicEntry } from "@/lib/registration";

export function PayNow({ entry, code, label }: { entry: string; code: string; label: string }) {
  const t = useTranslations("register");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setBusy(true);
    setError("");
    try {
      window.location.assign(await payForPublicEntry(entry, code));
      // Left busy: the browser is on its way to Stripe.
    } catch (err) {
      setError(
        err instanceof EntryError && err.status === 409
          ? t("payAlreadyDone")
          : err instanceof EntryError && err.status === 503
            ? t("payCardOff")
            : t("payFailed"),
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void pay()}
        disabled={busy}
        className="flex min-h-[48px] w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-xl bg-pp-blue px-6 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(46,92,184,.2)] transition-colors duration-150 hover:bg-pp-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue disabled:cursor-wait disabled:opacity-60"
      >
        <CreditCard className="size-4" aria-hidden />
        {busy ? t("payOpening") : label}
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-pp-red-soft px-3 py-2 text-[13px] font-semibold text-pp-danger">
          {error}
        </p>
      )}
    </div>
  );
}
