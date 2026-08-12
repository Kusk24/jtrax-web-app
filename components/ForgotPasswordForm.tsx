"use client";

/* Asks the backend to mail a reset link. The confirmation is deliberately
   vague about whether the address exists — the API answers the same way either
   way, and a friendlier message here would undo that. */
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { requestPasswordReset, type ResetRequestState } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("reset");
  const [state, formAction, pending] = useActionState<ResetRequestState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.status === "sent") {
    return (
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 rounded-card border-2 border-line bg-card p-6 text-center shadow-clay">
        <p className="text-sm font-bold text-ink">{t("sentTitle")}</p>
        <p className="text-xs text-muted">{t("sentBody")}</p>
        <Link href="/" className="mt-1 rounded-xl bg-navy py-3 text-sm font-bold text-card">
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-8 flex w-full max-w-sm flex-col gap-3 rounded-card border-2 border-line bg-card p-6 shadow-clay"
    >
      <p className="text-xs text-muted">{t("requestHint")}</p>
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        {t("email")}
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="rounded-xl border-2 border-line bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-navy/50"
        />
      </label>
      {state.error && (
        <p className="text-xs font-bold text-brick">
          {t(state.error === "missing" ? "errorMissing" : "errorUnreachable")}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-navy py-3 text-sm font-bold text-card disabled:opacity-60"
      >
        {pending ? t("sending") : t("sendLink")}
      </button>
      <Link href="/" className="text-center text-xs font-bold text-navy">
        {t("backToSignIn")}
      </Link>
    </form>
  );
}
