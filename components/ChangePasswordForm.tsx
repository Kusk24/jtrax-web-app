"use client";

/* Changing your own password while signed in.

   There was no way to do this: a parent could only go through "forgot
   password" and a child could only ask the office. This asks for the current
   password — so a phone left unlocked cannot be used to take the account —
   and the new one twice. Other devices are signed out by the backend; this
   one stays signed in. */
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";
import { checkNewPassword } from "@/lib/password-rules";
import { PasswordInput } from "@/components/PasswordInput";

type Tone = "parent" | "student";

const STYLES: Record<Tone, { box: string; input: string; primary: string; secondary: string; label: string }> = {
  parent: {
    box: "overflow-hidden rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4",
    input: "w-full rounded-lg border-[1.5px] border-pp-line bg-pp-card px-3 py-2.5 text-sm outline-none focus:border-pp-blue",
    primary: "rounded-lg bg-pp-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60",
    secondary: "rounded-lg border-[1.5px] border-pp-line px-4 py-2.5 text-sm font-bold",
    label: "text-[12.5px] font-semibold text-pp-sub",
  },
  /* The admin console's design (jtrax-admin/DESIGN.md): flat 16px card, 40px
     fields, pill buttons. */
  student: {
    box: "rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-[18px]",
    input: "min-h-10 w-full rounded-[9px] border border-pp-line bg-pp-card px-3 text-[14.5px] text-pp-ink outline-none focus:border-pp-blue",
    primary: "min-h-10 rounded-full bg-pp-blue px-4 text-[14px] font-semibold text-white transition-colors hover:bg-pp-deep disabled:cursor-not-allowed disabled:bg-pp-faint",
    secondary: "min-h-10 rounded-full border border-pp-line bg-pp-card px-4 text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft",
    label: "text-[13.5px] font-semibold text-pp-muted",
  },
};

export function ChangePasswordForm({ tone }: { tone: Tone }) {
  const t = useTranslations("changePassword");
  const s = STYLES[tone];
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const problem = checkNewPassword(next, confirm);
    if (problem) {
      return setError(t(problem === "short" ? "errorShort" : problem === "weak" ? "errorWeak" : "errorMismatch"));
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        reset();
        setOpen(false);
        setDone(true);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        res.status === 429
          ? t("errorTooMany")
          : /current password/i.test(data.error ?? "")
            ? t("errorCurrent")
            : t("errorFailed"),
      );
    } catch {
      setError(t("errorFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className={s.box}>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
          className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold"
        >
          <span className="flex items-center gap-2">
            <KeyRound className="size-4" /> {t("title")}
          </span>
          <span className={s.label}>{t("open")}</span>
        </button>
        {done && (
          <p role="status" className="mt-2 text-[12.5px] font-semibold text-emerald-600">
            {t("done")}
          </p>
        )}
      </div>
    );
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className={s.label}>{label}</span>
      <PasswordInput
        id={id}
        value={value}
        onChange={(e) => set(e.target.value)}
        autoComplete={autoComplete}
        className={s.input}
        required
      />
    </label>
  );

  return (
    <form onSubmit={submit} className={`${s.box} flex flex-col gap-3`}>
      <p className="flex items-center gap-2 text-sm font-bold">
        <KeyRound className="size-4" /> {t("title")}
      </p>
      {field("cp-current", t("current"), current, setCurrent, "current-password")}
      {field("cp-new", t("new"), next, setNext, "new-password")}
      {field("cp-confirm", t("confirm"), confirm, setConfirm, "new-password")}
      <p className={s.label}>{t("rule")}</p>
      {error && (
        <p role="alert" className="text-[12.5px] font-semibold text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={s.primary}>
          {busy ? t("saving") : t("save")}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className={s.secondary}
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
