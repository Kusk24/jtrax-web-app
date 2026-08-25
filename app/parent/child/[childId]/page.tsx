"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Flame } from "lucide-react";
import { PawnIcon } from "@/components/PawnIcon";
import { useParentData } from "@/components/parent/ParentData";
import { ChildLichess } from "@/components/parent/ChildLichess";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";

export default function ChildProfileV2({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const t = useTranslations("pv2");
  const router = useRouter();
  const { childId } = use(params);
  const { children: kids, hist, certSessions } = useParentData();
  const [hover, setHover] = useState<number | null>(null);
  const ch = kids.find((c) => c.key === childId);
  if (!ch) notFound();

  const hasExpiry = ch.valid !== "—";
  /* Three states, not two: a date that has already passed is expired, and
     saying "expires soon · 0 days" about it understates what happened. */
  const expired = hasExpiry && !ch.expiresAhead;
  const expSoon = hasExpiry && ch.expiresAhead && ch.daysLeft <= 14;
  /* Progress toward the certificate — the milestone is the academy's own,
     from Settings, not a number this app knows. */
  const toCert = Math.max(0, certSessions - ch.attended);

  /* This-week practice line chart */
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const vals = ch.practiceWeek;
  const goal = 30;
  const max = Math.max(...vals, 1);
  const W = 280, H = 64, P = 6;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * (W - P * 2) + P,
    H - P - (v / max) * (H - P * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`;
  const weekMins = vals.reduce((a, b) => a + b, 0);

  /* The three most recent attendance rows, with each session's own times —
     not reconstructed from calendar dots and a fixed clock. */
  const histRows = hist.filter((h) => h.child === ch.key).slice(0, 3);

  return (
    <div className="grid content-start gap-5 md:grid-cols-2 md:gap-x-5">
      <div className="flex items-center gap-3 md:col-span-2">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-pp-card text-base text-pp-ink hover:bg-pp-soft"
        >
          ←
        </button>
        <span className="font-pp-display text-2xl font-semibold">
          {t("childProfileTitle", { name: ch.name })}
        </span>
      </div>

      <div className="flex items-center gap-3.5 md:col-span-2">
        <span
          aria-label={ch.name}
          className="size-[62px] flex-none rounded-full bg-cover bg-center"
          style={{ backgroundColor: ch.avBg, backgroundImage: `url('${ch.photo}')` }}
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-pp-display text-[22px] font-semibold">{ch.name}</span>
          <span className="text-xs text-pp-muted">{t("idLabel", { id: ch.id })}</span>
          <span className="text-[12.5px] font-semibold text-pp-ink">
            {ch.level || "—"}
            {ch.age > 0 ? ` · ${ch.age}` : ""}
          </span>
        </div>
      </div>

      {/* Credits gradient card */}
      <div className="flex flex-col gap-3 rounded-[14px] bg-[linear-gradient(150deg,var(--color-pp-deep),#1B3A73)] p-5 text-[#fbfff1] shadow-[0_12px_30px_rgba(27,58,115,.25)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[.12em] text-[#b4c5e4]">
            {t("remainingCredits")}
          </span>
          {/* The balance alone. A "/ total bought" used to sit beside it, and
              it read as a quota when it is only history: every top-up and
              every balance moved in from another class made it grow, so the
              figure got bigger for ever and doubled after a class change. */}
          <span className="font-pp-display text-[34px] font-semibold leading-none">
            {ch.credits}
          </span>
        </div>
        <div
          className="flex items-center justify-between gap-2.5 rounded-[13px] px-3.5 py-2.5"
          style={{ background: expSoon || expired ? "var(--color-pp-danger-soft)" : "rgba(251,255,241,.12)" }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[12.5px] font-bold"
              style={{ color: expSoon || expired ? "var(--color-pp-danger)" : "#fbfff1" }}
            >
              {expired ? t("expired") : expSoon ? t("expiresSoon") : t("validUntil")}
            </span>
            <span className="text-[11px]" style={{ color: expSoon || expired ? "var(--color-pp-amber)" : "#b4c5e4" }}>
              {ch.valid}
            </span>
          </div>
          {hasExpiry && ch.expiresAhead && (
            <span
              className="flex-none font-pp-display text-[19px] font-semibold"
              style={{ color: expSoon ? "var(--color-pp-danger)" : "#fbfff1" }}
            >
              {t("daysLeftShort", { count: ch.daysLeft })}
            </span>
          )}
        </div>
        {hasExpiry && (
          <span className="text-[10.5px] leading-relaxed text-[#b4c5e4]">
            {t("creditsExpireNote", { date: ch.valid })}
          </span>
        )}
      </div>

      {/* Practice progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={label}>{t("practiceProgress")}</span>
          <span className="flex items-center gap-1 text-[12.5px] font-bold text-pp-amber">
            <Flame className="size-3.5 fill-pp-amber" />
            {t("dayStreak", { count: ch.streak })}
          </span>
        </div>
        <div className="flex flex-col gap-2.5 rounded-xl bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <span className="text-[11px] font-bold uppercase tracking-[.08em] text-pp-faint">
            {t("thisWeek")}
          </span>
          <div className="relative h-16 w-full">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-16 w-full overflow-visible">
              <defs>
                <linearGradient id="chGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-pp-blue)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--color-pp-blue)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#chGrad)" />
              <path d={line} fill="none" stroke="var(--color-pp-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {pts.map((p, i) => {
              const mins = vals[i];
              const completed = mins >= goal;
              const pct = Math.max(4, Math.min(100, Math.round((mins / goal) * 100)));
              const circ = 2 * Math.PI * 9;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  className="absolute flex size-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
                  style={{ left: `${(p[0] / W) * 100}%`, top: `${(p[1] / H) * 100}%` }}
                >
                  <span className="block size-1.5 rounded-full bg-pp-blue" />
                  {hover === i && (
                    <div className="absolute bottom-[22px] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap rounded-[10px] bg-pp-ink px-2.5 py-2 text-white shadow-[0_8px_20px_rgba(28,25,40,.3)]">
                      <span className="text-[9.5px] font-bold uppercase tracking-[.06em] text-[#b4c5e4]">
                        {days[i]}
                      </span>
                      <span className="text-[12.5px] font-bold">{t("minsTip", { count: mins })}</span>
                      {completed ? (
                        <span className="flex size-[22px] items-center justify-center rounded-full bg-pp-green">
                          <Check className="size-3 text-white" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="relative flex size-[22px] items-center justify-center">
                          <svg width="22" height="22" viewBox="0 0 22 22" className="absolute inset-0 -rotate-90">
                            <circle cx="11" cy="11" r="9" fill="none" stroke="var(--color-pp-track)" strokeWidth="3" />
                            <circle cx="11" cy="11" r="9" fill="none" stroke="var(--color-pp-amber)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${((circ * pct) / 100).toFixed(1)} ${circ.toFixed(1)}`} />
                          </svg>
                          <Image src="/shared/fish.png" alt="" width={10} height={10} className="relative" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between">
            {days.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-pp-faint">{d}</span>
            ))}
          </div>
          <span className="pt-0.5 text-[12.5px] font-semibold text-pp-ink">
            {t("weekTotal", { h: Math.floor(weekMins / 60), m: weekMins % 60 })}
          </span>
        </div>
      </div>

      {/* Enrolled classes */}
      <div className="flex flex-col gap-3">
        <span className={label}>{t("enrolledClasses")}</span>
        <div className="flex flex-col gap-4 rounded-xl bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <div className="flex items-center gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-pp-mist text-pp-ink">
              <PawnIcon className="size-[17px]" />
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">{ch.clsTitle}</span>
            </div>
          </div>
          {/* Branch, room, a teacher's name and an upcoming-session line all
              used to sit here. The first three were invented on the client —
              the backend has no room or branch column and no teacher-to-class
              link — and the schedule went too: sessions are written one at a
              time by the desk, so "the next class" is not a plan a parent can
              rely on. */}
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
            {(
              [
                [t("creditsExpire"), ch.valid, expSoon || expired],
                [t("levelLabel"), ch.level || "—", false],
                [t("enrolledSince"), ch.enrolledSince || "—", false],
              ] as const
            ).map(([k, v, danger]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[.1em] text-pp-faint">{k}</span>
                <span className={`text-[12.5px] font-semibold ${danger ? "text-pp-danger" : "text-pp-ink"}`}>{v}</span>
              </div>
            ))}
          </div>
          {/* Progress toward the 50-class certificate — a milestone that only
              moves forward, unlike the credit totals and session counts that
              used to be here and grew or shrank with every purchase. */}
          <div className="flex items-center gap-3.5 rounded-[13px] border-[1.5px] border-pp-soft bg-pp-mist px-3.5 py-3">
            <div className="flex min-w-[78px] flex-none flex-col">
              <span className="font-pp-display text-[32px] font-bold leading-none text-pp-blue">
                {ch.attended}
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[.08em] text-pp-blue">
                {t("classesAttended")}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-pp-muted">
                <span>{t("attendedOf", { attended: ch.attended, total: certSessions })}</span>
                <span>{t("remainingOf", { count: toCert })}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-pp-soft">
                <div
                  className="h-full rounded-full bg-pp-blue"
                  style={{ width: `${Math.min(100, Math.round((ch.attended / certSessions) * 100))}%` }}
                />
              </div>
              <span className="text-[10.5px] text-pp-faint">
                {t("certNote", { count: certSessions })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance history preview */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={label}>{t("attHistory")}</span>
          <Link href={`/parent/child/${ch.key}/history`} className="text-xs font-bold text-pp-blue">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl bg-pp-card shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          {histRows.length === 0 && (
            <div className="px-4 py-5 text-center text-[12.5px] text-pp-muted">{t("noSessions")}</div>
          )}
          {histRows.map((h, i) => (
            <div key={i} className="flex items-center justify-between gap-2.5 border-b border-pp-panel px-4 py-3.5 last:border-0">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12.5px] font-semibold">{h.cls}</span>
                <span className="text-[11px] text-pp-muted">{h.date} · {h.time}</span>
              </div>
              <span
                className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.08em]"
                style={{
                  background: h.status === "Present" ? "var(--color-pp-green-soft)" : "var(--color-pp-danger-soft)",
                  color: h.status === "Present" ? "var(--color-pp-green)" : "var(--color-pp-danger)",
                }}
              >
                {h.status === "Present" ? t("present") : t("absent")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* What this child plays at home. Renders nothing when no account is
          linked, so a family that does not use Lichess never sees an empty
          card asking them to. */}
      <ChildLichess studentId={ch.key} />
    </div>
  );
}
