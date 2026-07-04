"use client";

import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, CheckCircle2, Clock, Search } from "lucide-react";
import { CheckinHeader } from "@/components/CheckinHeader";
import { SessionProgress } from "@/components/SessionProgress";
import { RosterRow } from "@/components/RosterRow";
import { roster, sessionHistory } from "@/lib/teacher-data";

export default function DismissalPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const t = useTranslations("dismissal");
  const tck = useTranslations("checkin");
  const locale = useLocale();
  const { sessionId } = use(params);
  const session = sessionHistory.find((s) => s.id === sessionId);
  if (!session) notFound();

  const [dismissed, setDismissed] = useState<Record<string, string>>(
    session.dismissedAt,
  );
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const present = roster.filter((s) => session.presentIds.includes(s.id));
  const visible = present.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const dismissedCount = present.filter((s) => dismissed[s.id]).length;
  const allDismissed = dismissedCount === present.length;
  const remaining = present.length - dismissedCount;

  const pickupTime = () =>
    new Date().toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const toggle = (id: string) => {
    setDismissed((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = pickupTime();
      return next;
    });
  };

  if (done) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-24 animate-pop items-center justify-center rounded-full bg-olive text-white shadow-clay-lg">
          <Check className="size-12" strokeWidth={3} />
        </span>
        <h1 className="text-2xl font-extrabold text-navy">{t("doneTitle")}</h1>
        <p className="max-w-xs text-sm text-muted">
          {t("doneBody", { course: session.course, count: present.length })}
        </p>
        <div className="mt-2 flex flex-col items-stretch gap-2.5">
          <Link
            href="/teacher"
            className="rounded-2xl bg-navy px-8 py-3 text-center font-bold text-white shadow-clay hover:bg-navy-deep"
          >
            {tck("backHome")}
          </Link>
          <Link
            href={`/teacher/attendance/${session.id}`}
            className="rounded-2xl border-2 border-line bg-card px-8 py-3 text-center text-sm font-bold text-navy shadow-clay hover:border-navy/40"
          >
            {t("viewSummary")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CheckinHeader
        titleKey="dismissal.title"
        subtitle={tck("classSubtitle", { course: session.course, section: session.section.replace("Sec ", "") })}
        backHref="/teacher"
      />

      <SessionProgress
        labelKey="dismissal.progress"
        count={dismissedCount}
        total={present.length}
      />

      <label className="flex items-center gap-2 rounded-full border-2 border-line bg-card px-4 py-2.5 shadow-clay">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tck("searchStudents")}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </label>

      <button
        onClick={() => {
          const time = pickupTime();
          setDismissed((prev) => {
            const next = { ...prev };
            for (const s of present) if (!next[s.id]) next[s.id] = time;
            return next;
          });
        }}
        className="flex items-center justify-center gap-1.5 rounded-full bg-olive px-4 py-2 text-sm font-semibold text-white shadow-clay hover:brightness-110"
      >
        <CheckCircle2 className="size-4" /> {t("dismissAll")}
      </button>

      <div className="flex flex-col gap-2.5">
        {visible.map((student) => {
          const time = dismissed[student.id];
          return (
            <RosterRow
              key={student.id}
              student={student}
              action={
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => toggle(student.id)}
                    aria-label={
                      time
                        ? t("undoDismissed", { name: student.name })
                        : t("markDismissed", { name: student.name })
                    }
                    aria-pressed={Boolean(time)}
                    className={`flex size-11 items-center justify-center rounded-xl border-2 transition-colors ${
                      time
                        ? "border-navy bg-navy text-white"
                        : "border-line bg-card text-transparent hover:border-navy/40"
                    }`}
                  >
                    <Check className="size-5" strokeWidth={3} />
                  </button>
                  {time && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-olive">
                      <Clock className="size-3" />
                      {t("pickedUpAt", { time })}
                    </span>
                  )}
                </div>
              }
            />
          );
        })}
        {visible.length === 0 && (
          <p className="rounded-card bg-card/70 px-4 py-8 text-center text-sm text-muted">
            {tck("noMatch", { query })}
          </p>
        )}
      </div>

      <div className="sticky bottom-20 z-10 mt-2 flex flex-col gap-1.5 lg:bottom-6">
        {!allDismissed && (
          <p className="self-center rounded-full border-2 border-line bg-card px-3 py-1 text-center text-xs font-semibold text-muted shadow-clay">
            {t("remaining", { count: remaining })}
          </p>
        )}
        <button
          onClick={() => setConfirming(true)}
          disabled={!allDismissed}
          className={`rounded-2xl py-3 text-center font-bold shadow-clay-lg transition-colors ${
            allDismissed
              ? "bg-navy text-white hover:bg-navy-deep"
              : "cursor-not-allowed bg-line text-muted"
          }`}
        >
          {t("finishClass")}
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button
            aria-label={t("cancel")}
            onClick={() => setConfirming(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm animate-pop rounded-card border-2 border-line bg-card p-5 text-center shadow-clay-lg"
          >
            <h2 className="text-lg font-extrabold text-navy">
              {t("confirmTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {t("confirmBody", { count: present.length })}
            </p>
            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-2xl border-2 border-line bg-card py-2.5 text-sm font-bold text-ink hover:border-navy/40"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  setDone(true);
                }}
                className="flex-1 rounded-2xl bg-navy py-2.5 text-sm font-bold text-white shadow-clay hover:bg-navy-deep"
              >
                {t("finishClass")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
