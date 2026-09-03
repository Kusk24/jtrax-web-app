"use client";

/* Sign-in card for the landing page — posts to the signIn server action,
   which redirects each role to its portal. */
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { signIn, type SignInState } from "@/app/actions/auth";

export function LoginForm() {
  const t = useTranslations("landing");
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form
      action={formAction}
      className="mt-8 flex w-full max-w-sm flex-col gap-3 rounded-card border-2 border-line bg-card p-6 shadow-clay"
    >
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        {t("signInId")}
        {/* Not `type="email"`. A student signs in with `stu_penny_ward`, and
            the browser refuses to submit that field at all — no request, no
            error from the server, just a tooltip about a missing @ that reads
            like the child typed their own ID wrong. `username` is also the
            right autocomplete hint for an identifier that is sometimes not an
            address, so a password manager still offers to fill it. */}
        <input
          name="email"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="rounded-xl border-2 border-line bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-navy/50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-bold text-ink">
        {t("password")}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className="rounded-xl border-2 border-line bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-navy/50"
        />
      </label>
      {state.error && (
        <p className="text-xs font-bold text-brick">
          {t(state.error === "missing" ? "errorMissing" : state.error === "unreachable" ? "errorUnreachable" : "errorInvalid")}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-navy py-3 text-sm font-bold text-card disabled:opacity-60"
      >
        {pending ? t("signingIn") : t("signIn")}
      </button>

      <Link href="/forgot-password" className="text-center text-xs font-bold text-navy">
        {t("forgot")}
      </Link>

      {/* The account carries the role, so there is nothing to pick here — a
          parent and a student each sign in with their own account and land in
          their own portal. */}
      <p className="mt-2 border-t border-line pt-3 text-xs text-muted">{t("accountHint")}</p>
    </form>
  );
}
