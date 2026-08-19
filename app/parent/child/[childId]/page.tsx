"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Clock3, Flame } from "lucide-react";
import { PawnIcon } from "@/components/PawnIcon";
import { MAY, MONTHS, wdOfMonth } from "@/lib/parent-v2-data";
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
  const { children: kids, att: ATT } = useParentData();
  const [hover, setHover] = useState<number | null>(null);
  const ch = kids.find((c) => c.key === childId);
  if (!ch) notFound();

  const expSoon = ch.daysLeft <= 14;
  const low = ch.credits <= 2;
  const leftN = ch.total - ch.attended;

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

  const rec = ATT[ch.key][MAY];
  const histRows = [...rec.present]
    .sort((a, b) => b - a)
    .slice(0, 3)
    .map((d) => ({
      date: `${MONTHS[MAY].name.split(" ")[0].slice(0, 3)} ${d}, ${wdOfMonth(MAY, d)} · ${ch.time}`,
    }));

  return (
    <div className="grid content-start gap-5 px-4 pb-8 pt-5 sm:px-5 md:grid-cols-2 md:gap-x-5">
      <div className="flex items-center gap-3 md:col-span-2">
        <button
          onClick={() => router.back()}
          aria-label={t("back")}
          className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-white text-base text-pp-ink hover:bg-pp-soft"
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
            {ch.level} · {ch.age}
          </span>
        </div>
      </div>

      {/* Credits gradient card */}
      <div className="flex flex-col gap-3 rounded-[14px] bg-[linear-gradient(150deg,#234A9F,#1B3A73)] p-5 text-[#fbfff1] shadow-[0_12px_30px_rgba(27,58,115,.25)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[.12em] text-[#b4c5e4]">
            {t("remainingCredits")}
          </span>
          <span className="font-pp-display text-[34px] font-semibold leading-none">
            {ch.credits}
            <span className="text-lg text-[#b4c5e4]"> / 20</span>
          </span>
        </div>
        <div
          className="flex items-center justify-between gap-2.5 rounded-[13px] px-3.5 py-2.5"
          style={{ background: expSoon ? "#fdece0" : "rgba(251,255,241,.12)" }}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className="text-[12.5px] font-bold"
              style={{ color: expSoon ? "#C24B4B" : "#fbfff1" }}
            >
              {expSoon ? t("expiresSoon") : t("validUntil")}
            </span>
            <span className="text-[11px]" style={{ color: expSoon ? "#C97A2E" : "#b4c5e4" }}>
              {ch.valid}
            </span>
          </div>
          <span
            className="flex-none font-pp-display text-[19px] font-semibold"
            style={{ color: expSoon ? "#C24B4B" : "#fbfff1" }}
          >
            {t("daysLeftShort", { count: ch.daysLeft })}
          </span>
        </div>
        <span className="text-[10.5px] leading-relaxed text-[#b4c5e4]">
          {t("creditsExpireNote", { date: ch.valid })}
        </span>
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
        <div className="flex flex-col gap-2.5 rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <span className="text-[11px] font-bold uppercase tracking-[.08em] text-pp-faint">
            {t("thisWeek")}
          </span>
          <div className="relative h-16 w-full">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-16 w-full overflow-visible">
              <defs>
                <linearGradient id="chGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E5CB8" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2E5CB8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#chGrad)" />
              <path d={line} fill="none" stroke="#2E5CB8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
                            <circle cx="11" cy="11" r="9" fill="none" stroke="#F3E6D8" strokeWidth="3" />
                            <circle cx="11" cy="11" r="9" fill="none" stroke="#E38A3E" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${((circ * pct) / 100).toFixed(1)} ${circ.toFixed(1)}`} />
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
        <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <div className="flex items-center gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-pp-mist text-pp-ink">
              <PawnIcon className="size-[17px]" />
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">{ch.clsTitle}</span>
              <span className="flex items-center gap-1 text-[11.5px] text-pp-muted">
                <Clock3 className="size-3" strokeWidth={2} />
                {ch.sched} · {ch.time}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5">
            {(
              [
                [t("branch"), ch.branch, false],
                [t("room"), ch.room.replace("Bangkok · ", ""), false],
                [t("scheduleLabel"), `${ch.sched} · ${ch.time}`, false],
                [t("creditsExpire"), ch.valid, expSoon],
              ] as const
            ).map(([k, v, danger]) => (
              <div key={k} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[.1em] text-pp-faint">{k}</span>
                <span className={`text-[12.5px] font-semibold ${danger ? "text-pp-danger" : "text-pp-ink"}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-[7px] overflow-hidden rounded-full bg-[#e8edf8]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((ch.credits / 20) * 100)}%`,
                  background: low ? "#e3a45e" : "#2E5CB8",
                }}
              />
            </div>
            <div className="flex justify-between text-[11.5px] text-pp-muted">
              <span>{t("creditsRemaining")}</span>
              <span className={`font-bold ${low ? "text-pp-amber" : "text-pp-ink"}`}>
                {ch.credits} / 20
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3.5 rounded-[13px] border-[1.5px] border-pp-soft bg-pp-mist px-3.5 py-3">
            <div className="flex min-w-[78px] flex-none flex-col">
              <span className="font-pp-display text-[32px] font-bold leading-none text-pp-deep">
                {leftN}
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[.08em] text-pp-blue">
                {t("classesLeft")}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex justify-between text-[11px] text-pp-muted">
                <span>{t("attendedOf", { attended: ch.attended, total: ch.total })}</span>
                <span>{t("remainingOf", { count: leftN })}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-pp-soft">
                <div
                  className="h-full rounded-full bg-pp-blue"
                  style={{ width: `${Math.round((ch.attended / ch.total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-[#e8edf8] pt-3.5">
            <span className="size-[38px] flex-none overflow-hidden rounded-full bg-pp-soft">
              <Image src="/parent/teacher-avatar.jpeg" alt={ch.teacher} width={38} height={38} className="size-full object-cover" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13px] font-semibold">{ch.teacher}</span>
              <span className="text-[10.5px] text-pp-muted">{t("teacher")}</span>
            </div>
            <a
              href="tel:+66123456789"
              className="flex-none rounded-xl border-[1.5px] border-pp-line bg-white px-3.5 py-2 text-xs font-bold text-pp-blue hover:bg-pp-soft"
            >
              ✆ {t("contactTeacher")}
            </a>
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
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          {histRows.map((h, i) => (
            <div key={i} className="flex items-center justify-between gap-2.5 border-b border-[#e8edf8] px-4 py-3.5 last:border-0">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[12.5px] font-semibold">{ch.clsTitle}</span>
                <span className="text-[11px] text-pp-muted">{h.date}</span>
              </div>
              <span className="flex-none rounded-full bg-pp-green-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.08em] text-pp-green">
                {t("present")}
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
