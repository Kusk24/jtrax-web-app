"use client";

/* Spends a reset token from the emailed link. The token rides in a hidden
   field rather than being re-read from the URL on submit, so a token that was
   present when the page rendered is the one that gets used. */
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { resetPassword, type ResetState } from "@/app/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("reset");
  const [state, formAction, pending] = useActionState<ResetState, FormData>(resetPassword, {});

  /* No token at all means the link was mangled in transit — worth saying
     plainly rather than showing a form that cannot succeed. */
  if (!token) {
    return (
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 rounded-card border-2 border-line bg-card p-6 text-center shadow-clay">
        <p className="text-sm font-bold text-brick">{t("noToken")}</p>
        <Link href="/forgot-password" className="mt-1 rounded-xl bg-navy py-3 text-sm font-bold text-card">
          {t("requestAnother")}
        </Link>
      </div>
    );
  }

  const errorKey =
    state.error === "missing"
      ? "errorMissing"
      : state.error === "short"
        ? "errorShort"
        : state.error === "mismatch"
          ? "errorMismatch"
          : state.error === "invalid"
            ? "errorInvalid"
            : "errorUnreachable";

  return (
    <form
      action={formAction}
      className="mt-8 flex w-full max-w-sm flex-col gap-3 rounded-card border-2 border-line bg-card p-6 shadow-clay"
    >
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        {t("newPassword")}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="rounded-xl border-2 border-line bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-navy/50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        {t("confirmPassword")}
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="rounded-xl border-2 border-line bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-navy/50"
        />
      </label>
      <p className="text-xs text-muted">{t("rule")}</p>
      {state.error && <p className="text-xs font-bold text-brick">{t(errorKey)}</p>}
      {state.error === "invalid" && (
        <Link href="/forgot-password" className="text-center text-xs font-bold text-navy">
          {t("requestAnother")}
        </Link>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-navy py-3 text-sm font-bold text-card disabled:opacity-60"
      >
        {pending ? t("saving") : t("setPassword")}
      </button>
    </form>
  );
}
