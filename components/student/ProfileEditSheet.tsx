"use client";

/**
 * Editing how the student panel shows the pupil: a display name, and an emoji
 * avatar — one of five, or any emoji typed from the keyboard. The name is
 * saved to the account (the office's official name is untouched); the emoji
 * is kept in this browser only.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, X } from "lucide-react";
import { DEFAULT_AVATARS, firstEmoji } from "@/lib/student-avatar";

export function ProfileEditSheet({
  name,
  studentId,
  avatar,
  onClose,
  onSave,
}: {
  name: string;
  /** Shown read-only, with a copy button — the ID the student signs in with. */
  studentId: string;
  avatar: string;
  onClose: () => void;
  /** Resolves false when the name could not be saved. */
  onSave: (next: { name: string; avatar: string }) => Promise<boolean>;
}) {
  const t3 = useTranslations("sv3");
  const [draftName, setDraftName] = useState(name);
  const [pick, setPick] = useState(avatar);
  const [own, setOwn] = useState(DEFAULT_AVATARS.includes(avatar as (typeof DEFAULT_AVATARS)[number]) ? "" : avatar);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(studentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard blocked: the ID is on screen to copy by hand. */
    }
  }

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const ownEmoji = firstEmoji(own);
  const canSave = draftName.trim().length > 0 && !saving;

  async function save() {
    setSaving(true);
    setFailed(false);
    const ok = await onSave({ name: draftName, avatar: pick });
    setSaving(false);
    if (ok) onClose();
    else setFailed(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,33,58,0.45)] px-5" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        onClick={(e) => e.stopPropagation()}
        className="st-enter w-full max-w-[420px] rounded-2xl bg-pp-card p-5 shadow-[0_24px_60px_rgba(20,33,58,.28)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="edit-profile-title" className="font-pp-display text-[18px] font-bold text-pp-ink">{t3("editProfile")}</h2>
          <button type="button" onClick={onClose} aria-label={t3("cancel")} className="flex size-8 cursor-pointer items-center justify-center rounded-full text-pp-muted hover:bg-pp-soft">
            <X className="size-4" strokeWidth={2.4} />
          </button>
        </div>

        {/* The avatar: the one chosen, big, above the choices. */}
        <div className="mt-4 flex justify-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-pp-soft text-[40px]" aria-hidden>
            {pick || <span className="font-pp-display text-[32px] font-bold text-pp-blue">{draftName.trim().charAt(0).toUpperCase() || "S"}</span>}
          </span>
        </div>

        <p className="mt-4 text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">{t3("avatarLabel")}</p>
        {/* The student's own emoji comes first, then the five defaults — one row. */}
        <div className="mt-2 flex items-center gap-2">
          <input
            value={own}
            onChange={(e) => {
              setOwn(e.target.value);
              const got = firstEmoji(e.target.value);
              if (got) setPick(got);
            }}
            maxLength={16}
            inputMode="text"
            placeholder="+"
            title={t3("ownEmoji")}
            aria-label={t3("ownEmoji")}
            className={`size-11 shrink-0 rounded-full border-[1.5px] border-dashed bg-pp-card p-0 text-center text-[22px] outline-none placeholder:text-[20px] placeholder:font-bold placeholder:text-pp-faint ${
              ownEmoji && pick === ownEmoji ? "border-solid border-pp-blue ring-2 ring-pp-blue" : "border-pp-line focus:border-pp-blue"
            }`}
          />
          {DEFAULT_AVATARS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setPick(e)}
              aria-pressed={pick === e}
              aria-label={e}
              className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[24px] transition-colors ${
                pick === e ? "bg-pp-soft ring-2 ring-pp-blue" : "bg-pp-mist hover:bg-pp-soft"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11.5px] text-pp-muted">{t3("ownEmojiHint")}</p>

        <p className="mt-5 text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">{t3("nameLabel")}</p>
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          maxLength={40}
          className="mt-2 w-full rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3.5 py-2.5 text-[15px] font-semibold text-pp-ink outline-none focus:border-pp-blue"
        />

        {/* The student ID: read-only — the office sets it — with a copy button. */}
        <p className="mt-5 text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">{t3("studentIdLabel")}</p>
        <div className="mt-2 flex items-center gap-2 rounded-xl border-[1.5px] border-pp-line bg-pp-mist py-1.5 pl-3.5 pr-1.5">
          <input
            value={studentId || "—"}
            readOnly
            aria-label={t3("studentIdLabel")}
            className="min-w-0 flex-1 bg-transparent py-1 font-mono text-[14px] font-semibold text-pp-muted outline-none"
          />
          <button
            type="button"
            onClick={copyId}
            disabled={!studentId}
            className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold transition-colors ${
              copied ? "bg-pp-green-soft text-pp-green" : "bg-pp-card text-pp-blue hover:bg-pp-soft"
            }`}
          >
            {copied ? <Check className="size-3.5" strokeWidth={2.8} aria-hidden /> : <Copy className="size-3.5" strokeWidth={2.4} aria-hidden />}
            {copied ? t3("copied") : t3("copy")}
          </button>
        </div>

        {failed && <p role="alert" className="mt-3 text-[12.5px] font-semibold text-pp-danger">{t3("saveFailed")}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-xl border-[1.5px] border-pp-line py-3 text-[14px] font-bold text-pp-ink hover:bg-pp-mist">
            {t3("cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="flex flex-[2] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-st-brand py-3 text-[14px] font-bold text-white hover:bg-st-brand-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="size-4" strokeWidth={2.6} aria-hidden /> {t3("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
