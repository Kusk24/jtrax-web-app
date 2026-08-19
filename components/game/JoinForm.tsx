"use client";

/* Claiming a seat with the code the teacher read out. The code is upper-cased
   and stripped as it is typed, because it arrives from a whiteboard by way of
   a seven-year-old and arguing about case is not a lesson worth teaching. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Panel, peachBtn } from "./PlayShell";

const CODE_LENGTH = 6;

export function JoinForm() {
  const t = useTranslations("play");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/game-rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/student/play/room/${data.room.gameRoomId}`);
        return;
      }
      // The API distinguishes "no such code" from "that room is full"; both are
      // worth saying plainly, since the fix is different.
      setError(res.status === 409 ? "roomFull" : res.status === 403 ? "notAllowed" : "badCode");
    } catch {
      setError("unreachable");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3.5">
      <Panel>
        <label htmlFor="code" className="mb-2 block text-[13px] font-bold">
          {t("codeLabel")}
        </label>
        <input
          id="code"
          name="code"
          value={code}
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={CODE_LENGTH}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          placeholder="ABC123"
          className="w-full rounded-xl border-none bg-sv-paper px-3 py-3 text-center font-mono text-[26px] font-bold tracking-[0.35em] text-sv-ink shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.6)] outline-none placeholder:opacity-30 focus:shadow-[inset_0_0_0_2px_rgb(27,50,96)]"
        />
        <p className="mt-2 text-xs leading-snug opacity-70">{t("codeHint")}</p>
      </Panel>

      {error && (
        <p role="alert" className="rounded-2xl bg-[rgb(255,240,240)] px-3.5 py-2.5 text-xs font-bold text-[rgb(160,60,60)] shadow-[inset_0_0_0_1.5px_rgb(196,165,165)]">
          {t(`error.${error}`)}
        </p>
      )}

      <button type="submit" disabled={pending || code.length < CODE_LENGTH} className={`${peachBtn} py-3.5 text-[15px]`}>
        {pending ? t("joining") : t("join")}
      </button>
    </form>
  );
}
