"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarClock,
  CalendarDays,
  Check,
  CircleDollarSign,
  FileText,
  Layers,
  MapPin,
  Trophy,
  UserRound,
} from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import { TournamentBanner } from "@/components/parent/TournamentBanner";

/* "done" is a fee that has been settled; "held" is a place taken with the fee
   still owed — the screen used to show the first for both, and for the card
   path it showed it without charging anything at all. */
type Step = "detail" | "register" | "payment" | "done" | "held";

const inputCls =
  "w-full rounded-[13px] border-[1.5px] border-pp-line bg-pp-card px-3.5 py-3 text-[13px] text-pp-ink outline-none focus:border-pp-blue/60";

function Radio({ selected }: { selected: boolean }) {
  return (
    <span
      className="flex size-5 flex-none items-center justify-center rounded-full border-[1.5px]"
      style={{ borderColor: selected ? "var(--color-pp-blue)" : "var(--color-pp-line)" }}
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
        className="size-[38px] flex-none cursor-pointer rounded-xl border-[1.5px] border-pp-line bg-pp-card text-base text-pp-ink hover:bg-pp-soft"
      >
        ←
      </button>
      <span className="font-pp-display text-[22px] font-semibold leading-tight">{title}</span>
    </div>
  );
}

const card = "rounded-xl bg-pp-card p-4 shadow-[0_8px_24px_rgba(35,53,94,.10)]";
const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";
const cta =
  "cursor-pointer rounded-[14px] bg-pp-blue py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(46,92,184,.3)]";

export default function TournamentFlow() {
  const t = useTranslations("pv2");
  const router = useRouter();
  const {
    children: childrenV2, tournament: tournamentV2, tournamentEntries, parent,
    register, payCardFee,
  } = useParentData();
  const [submitting, setSubmitting] = useState(false);
  /* Whatever the server said stays in the console. A parent gets one sentence
     they can act on, in their own language, beside the button. */
  const [registerFailed, setRegisterFailed] = useState(false);
  /* Separate from registerFailed because they mean different things to a
     parent: one says the child has no place, the other says the child has a
     place and the fee is still owed. */
  const [payFailed, setPayFailed] = useState(false);
  const [step, setStep] = useState<Step>("detail");
  const [child, setChild] = useState(childrenV2[0]?.key ?? "");
  const [pay, setPay] = useState<"card" | "promptpay" | "bank">("card");
  /* Prefilled with the signed-in parent — it used to arrive filled in with a
     sample parent's details, and a family who did not notice registered their
     child under her email. Still editable: the contact for the day is not
     always the account holder. */
  /* Controlled, and sent. Both boxes used to be uncontrolled and read by
     nobody: a parent typing an allergy into them was telling the browser. */
  const [notes, setNotes] = useState({ medical: "", remarks: "" });
  const [contact, setContact] = useState({
    name: parent.name,
    phone: parent.phone,
    email: parent.email,
  });

  const participant = childrenV2.find((c) => c.key === child) ?? childrenV2[0];
  /* A child with a place cannot be registered again — the second attempt is
     refused by a unique index, which is what a family who had a card declined
     used to hit. They get the fee button instead. */
  const entered = new Set(tournamentEntries.map((e) => e.studentId));
  const available = childrenV2.filter((c) => !entered.has(c.key));

  /* No event open — nothing to register for. The home screen only links here
     while a tournament exists, but the URL can always be typed. */
  if (!tournamentV2) {
    return (
      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
        <BackHeader title={t("tournamentTitle")} onBack={() => router.push("/parent")} />
        <div className="rounded-xl border-[1.5px] border-dashed border-pp-dash p-6 text-center text-[12.5px] text-pp-muted">
          ♞ {t("noTournament")}
        </div>
      </div>
    );
  }

  if (step === "done" || step === "held") {
    const settled = step === "done";
    return (
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-[620px] flex-col items-center justify-center gap-4 px-5 text-center">
        <span
          className={`flex size-16 items-center justify-center rounded-full ${
            settled ? "bg-pp-green-soft text-pp-green" : "bg-pp-amber-soft text-pp-amber"
          }`}
        >
          {settled ? <Check className="size-[30px]" strokeWidth={2} />
            : <CalendarClock className="size-[30px]" strokeWidth={2} />}
        </span>
        <span className="font-pp-display text-[22px] font-semibold text-pp-ink">
          {settled ? t("regConfirmed") : t("placeHeld")}
        </span>
        <span className="text-[13.5px] leading-relaxed text-pp-sub">
          {settled
            ? t("regConfirmedBody", { name: participant.name, event: tournamentV2.name })
            : t("placeHeldBody", {
              name: participant.name,
              event: tournamentV2.name,
              fee: tournamentV2.fee,
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
      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
        <BackHeader title={t("registration")} onBack={() => setStep("detail")} />
        <div className="flex flex-col gap-2">
          <span className={label}>{t("selectChild")}</span>
          <div className="flex flex-col gap-2.5">
            {available.map((c) => (
              <button
                key={c.key}
                onClick={() => setChild(c.key)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] bg-pp-card p-4 text-left"
                style={{ borderColor: child === c.key ? "var(--color-pp-blue)" : "var(--color-pp-line)" }}
              >
                <Radio selected={child === c.key} />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-pp-ink">{c.name}</span>
                  <span className="text-[11.5px] text-pp-muted">
                    {c.clsTitle}
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
          <textarea
            rows={2}
            value={notes.medical}
            onChange={(e) => setNotes({ ...notes, medical: e.target.value })}
            maxLength={2000}
            placeholder={t("none")}
            className={`${inputCls} resize-none`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[.1em] text-pp-sub">
            {t("remarks")}
          </span>
          <textarea
            rows={2}
            value={notes.remarks}
            onChange={(e) => setNotes({ ...notes, remarks: e.target.value })}
            maxLength={2000}
            placeholder={t("remarksPh")}
            className={`${inputCls} resize-none`}
          />
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
      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
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
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] bg-pp-card px-4 py-3.5 text-left"
                style={{ borderColor: pay === k ? "var(--color-pp-blue)" : "var(--color-pp-line)" }}
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
        {registerFailed && (
          <p role="alert" className="text-[12.5px] font-semibold text-pp-danger">
            {t("registerFailed")}
          </p>
        )}
        {payFailed && (
          <p role="alert" className="text-[12.5px] font-semibold text-pp-danger">
            {t("payFailed")}
          </p>
        )}
        <button
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            setRegisterFailed(false);
            setPayFailed(false);
            let registrationId = "";
            try {
              registrationId = await register({
                tournamentId: tournamentV2.id,
                studentId: participant.id,
                contact: contact.phone,
                medicalNotes: notes.medical.trim(),
                remarks: notes.remarks.trim(),
              });
            } catch {
              setRegisterFailed(true);
              setSubmitting(false);
              return;
            }
            /* The place exists from here on, whatever happens to the money.
               PromptPay and bank transfer are taken at the front desk, so
               choosing either means exactly that and nothing is charged
               online — which is what the screen now says instead of claiming
               a payment went through. */
            if (pay !== "card") {
              setStep("held");
              setSubmitting(false);
              return;
            }
            try {
              const url = await payCardFee(registrationId);
              if (!url) {
                // Card payments are not switched on: the place is held and the
                // desk takes the fee.
                setStep("held");
                setSubmitting(false);
                return;
              }
              // Stripe hosts the card form; it sends the parent back to the
              // academy's thank-you page, and the webhook — not this browser —
              // is what marks the fee paid.
              window.location.href = url;
            } catch {
              setPayFailed(true);
              setSubmitting(false);
            }
          }}
          className={`${cta} ${submitting ? "opacity-70" : ""}`}
        >
          {submitting && pay === "card" ? t("openingPayment") : t("payNow")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
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
        {/* A time-of-day row sat here showing "9:00 AM – 5:00 PM" for every
            event; the backend records no such times. */}
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
        <div className="overflow-hidden rounded-xl bg-pp-card shadow-[0_8px_24px_rgba(35,53,94,.10)]">
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
      {tournamentEntries.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={label}>{t("yourEntries")}</span>
          <div className={`${card} flex flex-col gap-3`}>
            {tournamentEntries.map((e, i) => (
              <div key={e.registrationId} className="flex flex-col gap-2.5">
                {i > 0 && <div className="border-t border-pp-line" />}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-semibold text-pp-ink">{e.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      e.paid
                        ? "bg-pp-green-soft text-pp-green"
                        : "bg-pp-amber-soft text-pp-amber"
                    }`}
                  >
                    {e.paid ? t("feePaid") : t("feeUnpaid")}
                  </span>
                </div>
                {!e.paid && (
                  <button
                    disabled={submitting}
                    onClick={async () => {
                      setSubmitting(true);
                      setPayFailed(false);
                      try {
                        const url = await payCardFee(e.registrationId);
                        if (url) window.location.href = url;
                        else setPayFailed(true);
                      } catch {
                        setPayFailed(true);
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className={`${cta} ${submitting ? "opacity-70" : ""}`}
                  >
                    {submitting ? t("openingPayment") : t("payByCard")}
                  </button>
                )}
              </div>
            ))}
            {tournamentEntries.some((e) => !e.paid) && (
              <span className="text-[11.5px] leading-relaxed text-pp-muted">
                {t("paidAtDeskNote")}
              </span>
            )}
          </div>
          {payFailed && (
            <p role="alert" className="text-[12.5px] font-semibold text-pp-danger">
              {t("payFailed")}
            </p>
          )}
        </div>
      )}
      {available.length > 0 ? (
        <button
          onClick={() => {
            setChild(available[0].key);
            setStep("register");
          }}
          className={cta}
        >
          {tournamentEntries.length > 0 ? t("registerAnother") : t("registerMyChild")}
        </button>
      ) : (
        <p className="text-center text-[12.5px] text-pp-muted">{t("allChildrenEntered")}</p>
      )}
    </div>
  );
}
