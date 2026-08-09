"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarClock,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  FileText,
  Layers,
  MapPin,
  Trophy,
  UserRound,
} from "lucide-react";
import { childrenV2, tournamentV2 } from "@/lib/parent-v2-data";
import { TournamentBanner } from "@/components/parent/TournamentBanner";

type Step = "detail" | "register" | "payment" | "done";

const inputCls =
  "w-full rounded-[13px] border-[1.5px] border-pp-line bg-white px-3.5 py-3 text-[13px] text-pp-ink outline-none focus:border-pp-blue/60";

function Radio({ selected }: { selected: boolean }) {
  return (
    <span
      className="flex size-5 flex-none items-center justify-center rounded-full border-[1.5px]"
      style={{ borderColor: selected ? "#2E5CB8" : "#E7EBF3" }}
    >
      {selected && <span className="size-[11px] rounded-full bg-pp-blue" />}
    </span>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const t = useTranslations("pv2");
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        aria-label={t("back")}
        className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-white text-base text-pp-ink hover:bg-pp-soft"
      >
        ←
      </button>
      <span className="font-pp-display text-[22px] font-semibold leading-tight">{title}</span>
    </div>
  );
}

const card = "rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]";
const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const cta =
  "cursor-pointer rounded-[14px] bg-pp-blue py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(46,92,184,.3)]";

export default function TournamentFlow() {
  const t = useTranslations("pv2");
  const router = useRouter();
  const [step, setStep] = useState<Step>("detail");
  const [child, setChild] = useState("penny");
  const [pay, setPay] = useState("card");
  const [contact, setContact] = useState({
    name: "Sandy Jones",
    phone: "081-234-5678",
    email: "sandy.jones@email.com",
  });

  const participant = childrenV2.find((c) => c.key === child) ?? childrenV2[0];

  if (step === "done") {
    return (
      <div className="flex min-h-[70dvh] max-w-[620px] flex-col items-center justify-center gap-4 px-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-pp-green-soft text-pp-green">
          <Check className="size-[30px]" strokeWidth={2} />
        </span>
        <span className="font-pp-display text-[22px] font-semibold text-pp-ink">
          {t("regConfirmed")}
        </span>
        <span className="text-[13.5px] leading-relaxed text-pp-sub">
          {t("regConfirmedBody", {
            name: participant.name,
            event: tournamentV2.name,
            email: contact.email,
          })}
        </span>
        <button onClick={() => router.push("/parent")} className={`${cta} px-7`}>
          {t("done")}
        </button>
      </div>
    );
  }

  if (step === "register") {
    return (
      <div className="flex max-w-[620px] flex-col gap-4 px-4 pb-10 pt-5 sm:px-5">
        <BackHeader title={t("registration")} onBack={() => setStep("detail")} />
        <div className="flex flex-col gap-2">
          <span className={label}>{t("selectChild")}</span>
          <div className="flex flex-col gap-2.5">
            {childrenV2.map((c) => (
              <button
                key={c.key}
                onClick={() => setChild(c.key)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] bg-white p-4 text-left"
                style={{ borderColor: child === c.key ? "#2E5CB8" : "#E7EBF3" }}
              >
                <Radio selected={child === c.key} />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-pp-ink">{c.name}</span>
                  <span className="text-[11.5px] text-pp-muted">
                    {c.clsTitle.replace(" (Sec 101)", "")}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[.1em] text-pp-sub">
            {t("medicalNotes")}
          </span>
          <textarea rows={2} placeholder={t("none")} className={`${inputCls} resize-none`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[.1em] text-pp-sub">
            {t("remarks")}
          </span>
          <textarea rows={2} placeholder={t("remarksPh")} className={`${inputCls} resize-none`} />
        </label>
        <div className="flex flex-col gap-2.5">
          <span className={label}>{t("contactInfo")}</span>
          <input
            value={contact.name}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            placeholder={t("fullName")}
            className={inputCls}
          />
          <input
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
            placeholder={t("phoneNumber")}
            className={inputCls}
          />
          <input
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            placeholder={t("emailAddress")}
            className={inputCls}
          />
        </div>
        <button onClick={() => setStep("payment")} className={cta}>
          {t("continuePayment")}
        </button>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="flex max-w-[620px] flex-col gap-4 px-4 pb-10 pt-5 sm:px-5">
        <BackHeader title={t("payment")} onBack={() => setStep("register")} />
        <div className={`${card} flex flex-col gap-3.5`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-[.1em] text-pp-faint">
              {t("tournamentTitle")}
            </span>
            <span className="text-sm font-semibold text-pp-ink">{tournamentV2.name}</span>
          </div>
          <div className="border-t border-pp-line" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold uppercase tracking-[.1em] text-pp-faint">
              {t("participant")}
            </span>
            <span className="text-sm font-semibold text-pp-ink">{participant.name}</span>
          </div>
          <div className="border-t border-pp-line" />
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-pp-muted">{t("tournamentFee")}</span>
            <span className="text-[13px] font-bold text-pp-ink">{tournamentV2.fee}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={label}>{t("paymentMethod")}</span>
          <div className="flex flex-col gap-2.5">
            {(
              [
                ["card", t("creditCard")],
                ["promptpay", t("promptpay")],
                ["bank", t("bankTransfer")],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setPay(k)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] bg-white px-4 py-3.5 text-left"
                style={{ borderColor: pay === k ? "#2E5CB8" : "#E7EBF3" }}
              >
                <Radio selected={pay === k} />
                <span className="text-[13.5px] font-semibold text-pp-ink">{lbl}</span>
              </button>
            ))}
          </div>
        </div>
        <div className={`${card} flex items-center justify-between`}>
          <span className="text-[13px] font-bold text-pp-ink">{t("total")}</span>
          <span className="font-pp-display text-[19px] font-semibold text-pp-blue">
            {tournamentV2.fee}
          </span>
        </div>
        <button onClick={() => setStep("done")} className={cta}>
          {t("payNow")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex max-w-[620px] flex-col gap-4 px-4 pb-10 pt-5 sm:px-5">
      <BackHeader title={t("tournamentTitle")} onBack={() => router.push("/parent")} />
      <TournamentBanner className="h-[200px] w-full rounded-xl shadow-[0_8px_24px_rgba(35,53,94,.10)]" />
      <span className="font-pp-display text-xl font-semibold leading-snug text-pp-ink">
        {tournamentV2.name}
      </span>
      <div className={`${card} flex flex-col gap-3`}>
        <div className="flex items-center gap-2.5">
          <MapPin className="size-4 flex-none text-pp-blue" strokeWidth={1.8} />
          <span className="text-[13px] text-pp-ink">{tournamentV2.venue}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CalendarDays className="size-4 flex-none text-pp-blue" strokeWidth={1.8} />
          <span className="text-[13px] text-pp-ink">{tournamentV2.date}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock3 className="size-4 flex-none text-pp-blue" strokeWidth={1.8} />
          <span className="text-[13px] text-pp-ink">{tournamentV2.timeRange}</span>
        </div>
        <div className="flex items-center justify-between gap-2.5 border-t border-pp-line pt-3">
          <span className="flex items-center gap-2 text-[12.5px] font-bold text-pp-amber">
            <CalendarClock className="size-[15px]" strokeWidth={1.8} />
            {t("regCloses")}
          </span>
          <span className="text-[12.5px] font-bold text-pp-amber">
            {tournamentV2.regDeadline}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className={label}>{t("eventInfo")}</span>
        <div className={`${card} grid grid-cols-2 gap-3.5`}>
          <div className="flex flex-col gap-1">
            <Layers className="size-[18px] text-pp-blue" strokeWidth={1.8} />
            <span className="text-[12.5px] text-pp-ink">{t("swiss")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <Trophy className="size-[18px] text-pp-blue" strokeWidth={1.8} />
            <span className="text-[12.5px] text-pp-ink">{t("trophyMedal")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <UserRound className="size-[18px] text-pp-blue" strokeWidth={1.8} />
            <span className="text-[12.5px] text-pp-ink">{t("openTo")}</span>
          </div>
          <div className="flex flex-col gap-1">
            <CircleDollarSign className="size-[18px] text-pp-blue" strokeWidth={1.8} />
            <span className="text-[12.5px] text-pp-ink">
              {t("entryFee")}
              <br />
              <span className="font-bold">{tournamentV2.fee}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className={label}>{t("importantDates")}</span>
        <div className={`${card} flex flex-col gap-2.5`}>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-pp-muted">{t("regDeadline")}</span>
            <span className="text-[12.5px] font-bold text-pp-ink">
              {tournamentV2.regDeadline}
            </span>
          </div>
          <div className="border-t border-pp-line" />
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-pp-muted">{t("tournamentDay")}</span>
            <span className="text-[12.5px] font-bold text-pp-ink">{tournamentV2.day}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className={label}>{t("viewDetailsOn")}</span>
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <a href="#" className="flex items-center gap-3 border-b border-pp-line px-4 py-3.5">
            <FileText className="size-[17px] flex-none text-pp-blue" strokeWidth={1.8} />
            <span className="flex-1 text-[13px] text-pp-ink">{t("regulationsPdf")}</span>
            <span className="text-pp-line">→</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3.5">
            <MapPin className="size-[17px] flex-none text-pp-blue" strokeWidth={1.8} />
            <span className="flex-1 text-[13px] text-pp-ink">{t("venueMap")}</span>
            <span className="text-pp-line">→</span>
          </a>
        </div>
      </div>
      <button onClick={() => setStep("register")} className={cta}>
        {t("registerMyChild")}
      </button>
    </div>
  );
}
