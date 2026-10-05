"use client";

/* Account & Security on a child's profile: the username the child signs in
 * with, and — for a child without their own email — a way for the parent to
 * set a new password. A child with their own email resets it themselves, so
 * they get no button here. Renders nothing until the login is known.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, KeyRound, X } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import { checkNewPassword } from "@/lib/password-rules";

const inputCls =
  "w-full rounded-[13px] border-[1.5px] border-pp-line bg-pp-card px-3.5 py-3 text-[13px] text-pp-ink outline-none focus:border-pp-blue/60";

export function ChildAccount({ studentId, name }: { studentId: string; name: string }) {
  const t = useTranslations("pv2");
  const [login, setLogin] = useState<{ login: string; ownEmail: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/students/${encodeURIComponent(studentId)}/login`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => alive && v && setLogin(v))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [studentId]);

  if (!login) return null;

  return (
    <div className="flex flex-col gap-3 md:col-span-2">
      <span className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">{t("accountSecurity")}</span>
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[11.5px] text-pp-muted">{login.ownEmail ? t("signsInWithEmail") : t("loginUsername")}</span>
          <span className="flex items-center gap-2">
            <span className="truncate font-mono text-[14px] font-semibold text-pp-ink">{login.login}</span>
            <button
              type="button"
              aria-label={t("copyUsername")}
              onClick={() => {
                navigator.clipboard?.writeText(login.login).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }).catch(() => {});
              }}
              className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-pp-muted hover:bg-pp-soft hover:text-pp-ink"
            >
              {copied ? <Check className="size-3.5 text-pp-green" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            </button>
          </span>
          {login.ownEmail && <span className="text-[12px] text-pp-muted">{t("ownEmailResetHint", { name })}</span>}
          {done && (
            <span role="status" className="text-[12.5px] font-semibold text-pp-green">
              {t("childPasswordChanged", { name })}
            </span>
          )}
        </div>
        {!login.ownEmail && (
          <button
            type="button"
            onClick={() => {
              setDone(false);
              setOpen(true);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-pp-line bg-pp-card px-4 py-2.5 text-[13px] font-bold text-pp-blue hover:bg-pp-soft"
          >
            <KeyRound className="size-4" aria-hidden /> {t("resetPassword")}
          </button>
        )}
      </div>
      {open && (
        <ResetDialog
          studentId={studentId}
          name={name}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            setDone(true);
          }}
        />
      )}
    </div>
  );
}

function ResetDialog({
  studentId, name, onClose, onDone,
}: {
  studentId: string;
  name: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("pv2");
  const tp = useTranslations("changePassword");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = checkNewPassword(next, confirm);
    if (problem) {
      setError(tp(problem === "short" ? "errorShort" : problem === "weak" ? "errorWeak" : "errorMismatch"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onDone();
    } catch {
      setError(tp("errorFailed"));
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(28,25,40,.5)] p-5">
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-child-title"
        className="flex w-full max-w-[420px] flex-col gap-3.5 rounded-xl bg-pp-card p-6 shadow-[0_30px_70px_rgba(28,25,40,.3)]"
      >
        <div className="flex items-start justify-between gap-2.5">
          <span id="reset-child-title" className="font-pp-display text-xl font-semibold leading-snug text-pp-ink">
            {t("resetChildPasswordTitle", { name })}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cancel")}
            className="flex size-[30px] flex-none cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-pp-line bg-pp-card text-pp-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <span className="text-[13px] text-pp-sub">{t("resetChildPasswordBody", { name })}</span>
        <label className="flex flex-col gap-1.5 text-[12px] font-bold text-pp-sub">
          {t("newPassword")}
          <PasswordInput value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-bold text-pp-sub">
          {t("confirmNewPassword")}
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputCls} />
        </label>
        <span className="text-[11.5px] text-pp-muted">{t("passwordRuleHint")}</span>
        {error && (
          <p role="alert" className="text-[12.5px] font-semibold text-pp-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="cursor-pointer rounded-[14px] bg-pp-blue py-3 text-center text-sm font-bold text-white disabled:opacity-60"
        >
          {t("resetPassword")}
        </button>
      </form>
    </div>
  );
}
