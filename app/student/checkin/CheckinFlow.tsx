"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, School, Check, QrCode } from "lucide-react";
import { attendanceSession } from "@/lib/student-data";

export type CheckinPhase = "enter-code" | "verifying" | "success" | "not-started";

const VERIFY_DURATION_MS = 3000;

const pieces = [
  { glyph: "♟", color: "text-navy", delay: "0ms" },
  { glyph: "♞", color: "text-amber-500", delay: "120ms" },
  { glyph: "♝", color: "text-orange-600", delay: "240ms" },
  { glyph: "♜", color: "text-teal-400", delay: "360ms" },
  { glyph: "♚", color: "text-emerald-600", delay: "480ms" },
];

export function CheckinFlow({ initialPhase }: { initialPhase: CheckinPhase }) {
  const t = useTranslations("checkin");
  const [phase, setPhase] = useState(initialPhase);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (phase !== "verifying") return;
    const timer = setTimeout(() => setPhase("success"), VERIFY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  function submitCode() {
    if (code === attendanceSession.code) {
      setError(false);
      setPhase("verifying");
    } else {
      setError(true);
    }
  }

  const notStarted = phase === "not-started";

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <header className="flex items-start gap-3">
        <Link
          href="/student"
          aria-label={t("backHome")}
          className="mt-0.5 rounded-full p-1 text-navy hover:bg-navy-soft/40"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-navy">
            {notStarted ? t("attendance") : t("selfTitle")}
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            {notStarted
              ? `${attendanceSession.course} - ${attendanceSession.section}`
              : t("selfSubtitle")}
          </p>
        </div>
      </header>

      {phase === "enter-code" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <span className="flex size-28 items-center justify-center rounded-full bg-navy-soft/70">
            <QrCode className="size-12 text-navy" />
          </span>
          <div className="w-full max-w-md text-center">
            <h2 className="font-bold text-ink">{t("enterCode")}</h2>
            <p className="mt-1 text-xs text-muted">
              {t("codeHint")}
            </p>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) submitCode();
              }}
              inputMode="numeric"
              autoFocus
              placeholder="••••••"
              aria-label={t("codeAria")}
              className={`mt-4 w-56 rounded-xl border-2 bg-card py-3 text-center text-2xl font-extrabold tracking-[0.4em] text-navy outline-none placeholder:text-line ${
                error ? "border-brick" : "border-navy/40 focus:border-navy"
              }`}
            />
            {error && (
              <p className="mt-2 text-xs font-semibold text-brick">
                {t("codeError")}
              </p>
            )}
            <button
              onClick={submitCode}
              disabled={code.length !== 6}
              className="mt-4 block w-full rounded-xl bg-navy py-3 font-semibold text-white shadow-clay hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("checkInBtn")}
            </button>
            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> {t("or")} <span className="h-px flex-1 bg-line" />
            </div>
            <button
              onClick={() => setPhase("verifying")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-navy/40 bg-card py-3 font-semibold text-navy hover:bg-navy-soft/30"
            >
              <QrCode className="size-5" /> {t("scanQr")}
            </button>
            <p className="mt-2 text-[10px] text-muted">
              {t("scanNote", { code: attendanceSession.code })}
            </p>
          </div>
        </div>
      )}

      {phase === "verifying" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-10">
          <span className="relative flex size-48 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-olive-soft" />
            <span className="absolute inset-0 rounded-full bg-olive-soft" />
            <span className="relative flex size-32 items-center justify-center rounded-full bg-olive">
              <School className="size-12 text-white" />
            </span>
          </span>
          <div className="flex flex-col items-center gap-6">
            <p className="font-semibold text-ink">{t("verifying")}</p>
            <div className="flex gap-4 text-2xl">
              {pieces.map((p, i) => (
                <span
                  key={i}
                  className={`animate-bounce ${p.color}`}
                  style={{ animationDelay: p.delay }}
                >
                  {p.glyph}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "success" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <span className="relative flex size-48 items-center justify-center rounded-full bg-olive-soft">
            <span className="flex size-32 items-center justify-center rounded-full bg-olive">
              <Check className="size-16 text-white" strokeWidth={3} />
            </span>
          </span>
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-ink">{t("successTitle")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("welcomeTo", { course: `${attendanceSession.course} ${attendanceSession.section}` })}
            </p>
          </div>
          <div className="flex w-full max-w-md items-center justify-between rounded-xl border border-olive/40 bg-olive-soft/60 px-4 py-3 text-sm">
            <span className="text-ink">{t("checkedInAt", { time: attendanceSession.checkinTime })}</span>
            <span className="font-bold text-brick">{t("minusCredit")}</span>
          </div>
        </div>
      )}

      {notStarted && (
        <div className="flex flex-1 items-center justify-center">
          <p className="max-w-xs text-center text-2xl font-semibold leading-relaxed text-navy">
            {t("notStarted")}
          </p>
        </div>
      )}

      {(phase === "success" || notStarted) && (
        <Link
          href="/student"
          className="mx-auto mb-2 block w-full max-w-md rounded-xl bg-navy py-3 text-center font-semibold text-white shadow-clay hover:bg-navy-deep"
        >
          {t("backHome")}
        </Link>
      )}
    </div>
  );
}
