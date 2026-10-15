"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarClock,
  CalendarDays,
  Check,
  FileText,
  MapPin,
} from "lucide-react";
import { useParentData } from "@/components/parent/ParentData";
import { TournamentBanner } from "@/components/public/TournamentBanner";
import { TournamentIdCheck, type IdCardRead } from "@/components/parent/TournamentIdCheck";
import { ageFromDOB, categoryAllows, type PublicCategory } from "@/lib/registration";
import { useSessionDraft, useUrlParam } from "@/lib/url-state";

/* "done" is a fee that has been settled; "held" is a place taken with the fee
   still owed — the screen used to show the first for both, and for the card
   path it showed it without charging anything at all. */
const STEPS = ["detail", "register", "payment", "done", "held"] as const;
type Step = (typeof STEPS)[number];

/* What the parent has typed and chosen, kept for this tab so a reload or Back
   returns them to the step they were on with it all still filled in. Never in
   the address: it carries the child's name and date of birth. */
type Pay = "card" | "promptpay" | "bank" | "later";
type Draft = {
  child: string; pay: Pay; nickname: string; nameTh: string; acceptTerms: boolean;
  categoryId: string; idRead: IdCardRead | null;
};
const EMPTY_DRAFT: Draft = {
  child: "", pay: "card", nickname: "", nameTh: "", acceptTerms: false, categoryId: "", idRead: null,
};
function isDraft(v: unknown): v is Draft {
  const d = v as Draft;
  return typeof v === "object" && v !== null &&
    typeof d.child === "string" && typeof d.nickname === "string" && typeof d.nameTh === "string" &&
    typeof d.acceptTerms === "boolean" && typeof d.categoryId === "string" &&
    ["card", "promptpay", "bank", "later"].includes(d.pay) &&
    (d.idRead === null || (typeof d.idRead === "object" && typeof d.idRead.studentId === "string"));
}

/* The public form's conditions of entry, by message key. */
const TERMS = ["termsRegistration", "termsRefund", "termsChanges", "termsConduct", "termsLiability"] as const;

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

/* Read from the address, which needs a Suspense boundary around it. */
export default function TournamentPage() {
  return (
    <Suspense fallback={null}>
      <TournamentFlow />
    </Suspense>
  );
}

function TournamentFlow() {
  const t = useTranslations("pv2");
  const tReg = useTranslations("register");
  const router = useRouter();
  const {
    children: childrenV2, tournament: nextTournament, tournamentEntries: nextEntries, tournamentsById,
    register, payCardFee,
  } = useParentData();
  /* The tournament the card's Register was for (?id=), else the next one —
     the page used to take the next Upcoming one whichever card was tapped,
     with that tournament's categories. */
  const wanted = useSearchParams().get("id") ?? "";
  const picked = wanted ? tournamentsById[wanted] : undefined;
  const tournamentV2 = picked?.tournament ?? nextTournament;
  const tournamentEntries = picked?.entries ?? nextEntries;
  const [submitting, setSubmitting] = useState(false);
  /* Whatever the server said stays in the console. A parent gets one sentence
     they can act on, in their own language, beside the button. */
  const [registerFailed, setRegisterFailed] = useState(false);
  /* Separate from registerFailed because they mean different things to a
     parent: one says the child has no place, the other says the child has a
     place and the fee is still owed. */
  const [payFailed, setPayFailed] = useState(false);
  const [step, setStep, stepBack] = useUrlParam("step", STEPS, "detail");
  const tournamentId = tournamentV2?.id ?? "";
  const [draft, setDraft] = useSessionDraft(`jtrax:tournament-entry:${tournamentId}`, EMPTY_DRAFT, isDraft);
  /* What the public form asks too. The family's contact details are on
     file, so they are not asked for again. The ID card step holds what the
     card said, for the child it was read for, and the category that birth
     year allows. */
  const { child, pay, nickname, nameTh, acceptTerms, idRead, categoryId } = draft;
  const field = <K extends keyof Draft>(key: K) => (value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setChild = field("child");
  const setPay = field("pay");
  const setNickname = field("nickname");
  const setNameTh = field("nameTh");
  const setAcceptTerms = field("acceptTerms");
  const setIdRead = field("idRead");
  const setCategoryId = field("categoryId");
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  /* The entry exists from here: the result replaces the payment step in
     history, so Back cannot offer to pay again, and the form is emptied for
     the next child — keeping only who and how, which the result names. */
  const finish = (result: "done" | "held") => {
    setDraft((d) => ({ ...EMPTY_DRAFT, child: d.child, pay: d.pay }));
    setStep(result, "replace");
  };
  useEffect(() => {
    if (!tournamentId) return;
    let live = true;
    fetch("/api/tournament-categories", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<Record<string, string>>) => {
        if (!live) return;
        setCategories(rows
          .filter((r) => r.tournament_id === tournamentId)
          .map((r) => ({ id: r.tournament_category_id, name: r.name })));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [tournamentId]);

  const participant = childrenV2.find((c) => c.key === child) ?? childrenV2[0];
  const verified = idRead && idRead.studentId === participant?.id ? idRead : null;
  const chosenCategory = categories.find((c) => c.id === categoryId);
  const categoryOk = categories.length === 0 || Boolean(
    chosenCategory && verified &&
    categoryAllows(chosenCategory.name, verified.dateOfBirth, tournamentV2?.startDate ?? "").allowed,
  );
  const missing = !verified
    ? t("verifyIdFirst")
    : !categoryOk
      ? t("chooseCategoryFirst")
      : !nickname.trim()
        ? tReg("needNickname")
        : !acceptTerms
          ? tReg("needTerms")
          : "";
  const readyToPay = missing === "";
  /* A child with a place cannot be registered again — the second attempt is
     refused by a unique index, which is what a family who had a card declined
     used to hit. They get the fee button instead. */
  const entered = new Set(tournamentEntries.map((e) => e.studentId));
  const available = childrenV2.filter((c) => !entered.has(c.key));
  /* The address can name a step this family cannot be on — a reload after
     the tab's draft was lost, a link opened in a new tab — so the screen
     shows the furthest step that still makes sense rather than a broken one. */
  const shown: Step =
    step === "payment" && !readyToPay ? "register"
      : step === "register" && (available.length === 0 || tournamentV2?.registration !== "open") ? "detail"
        : step;

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

  if (shown === "done" || shown === "held") {
    const settled = shown === "done";
    const paidLater = pay === "later";
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
            : t(paidLater ? "placeHeldLaterBody" : "placeHeldBody", {
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

  if (shown === "register") {
    return (
      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
        <BackHeader title={t("registration")} onBack={() => stepBack("detail")} />
        <div className="flex flex-col gap-2">
          <span className={label}>{t("selectChild")}</span>
          <div className="flex flex-col gap-2.5">
            {available.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setChild(c.key);
                  /* The card and the category belong to the child they were for. */
                  if (c.key !== child) {
                    setIdRead(null);
                    setCategoryId("");
                  }
                }}
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
        {participant && (
          <TournamentIdCheck
            tournamentId={tournamentV2.id}
            studentId={participant.id}
            startDate={tournamentV2.startDate}
            categories={categories}
            read={verified}
            onRead={(r) => {
              setIdRead(r);
              /* The Thai name off the card, unless one was typed. */
              if (r?.thaiName && !nameTh) setNameTh(r.thaiName);
            }}
            categoryId={categoryId}
            onCategory={setCategoryId}
          >
            {/* The player's names, side by side, before the category. */}
            <div className="grid gap-3 sm:grid-cols-2">
              {(!verified || verified.documentType !== "passport") && (
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className={label}>{tReg("nameThai")}</span>
                  <input
                    value={nameTh}
                    onChange={(e) => setNameTh(e.target.value)}
                    maxLength={80}
                    lang="th"
                    placeholder={tReg("nameThaiPlaceholder")}
                    className={inputCls}
                  />
                </label>
              )}
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={label}>
                  {tReg("nickname")}
                  <span className="ml-0.5 text-pp-danger" aria-hidden>*</span>
                </span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={80}
                  placeholder={tReg("nicknamePlaceholder")}
                  className={inputCls}
                />
              </label>
            </div>
            {/* Read off the ID card, not typed: it decides the category. */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={label}>{tReg("dateOfBirth")}</span>
                <input
                  readOnly
                  tabIndex={-1}
                  value={verified ? longDate(verified.dateOfBirth) : ""}
                  placeholder={tReg("dobFromCard")}
                  className={inputCls.replace("bg-pp-card", "bg-pp-panel")}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={label}>{tReg("age")}</span>
                <input
                  readOnly
                  tabIndex={-1}
                  value={verified ? String(ageFromDOB(verified.dateOfBirth)) : ""}
                  placeholder="—"
                  className={inputCls.replace("bg-pp-card", "bg-pp-panel")}
                />
              </label>
            </div>
          </TournamentIdCheck>
        )}
        <div className="flex flex-col gap-2">
          <span className={label}>{tReg("termsTitle")}</span>
          <div className="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-4">
            <ol className="flex list-decimal flex-col gap-2 pl-4 text-[12.5px] leading-relaxed text-pp-sub">
              {TERMS.map((k) => (
                <li key={k}>
                  <span className="font-semibold text-pp-ink">{tReg(`${k}Title`)}</span>
                  {" — "}
                  {tReg(`${k}Body`)}
                </li>
              ))}
            </ol>
            <label className="flex cursor-pointer items-start gap-2.5 border-t border-pp-line pt-3 text-[13px] font-semibold text-pp-ink">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 size-4 accent-pp-blue"
              />
              <span>
                {tReg("termsAccept")}
                <span className="ml-0.5 text-pp-danger" aria-hidden>*</span>
              </span>
            </label>
          </div>
        </div>
        {!readyToPay && (
          <p className="text-center text-[12px] text-pp-muted">
            {missing}
          </p>
        )}
        <button
          onClick={() => setStep("payment")}
          disabled={!readyToPay}
          className={`${cta} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {t("continuePayment")}
        </button>
      </div>
    );
  }

  if (shown === "payment") {
    return (
      <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
        <BackHeader title={t("payment")} onBack={() => stepBack("register")} />
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
          {chosenCategory && (
            <>
              <div className="border-t border-pp-line" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] font-bold uppercase tracking-[.1em] text-pp-faint">
                  {t("category")}
                </span>
                <span className="text-sm font-semibold text-pp-ink">{chosenCategory.name}</span>
              </div>
            </>
          )}
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
                ["later", t("payLater")],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setPay(k)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] bg-pp-card px-4 py-3.5 text-left"
                style={{ borderColor: pay === k ? "var(--color-pp-blue)" : "var(--color-pp-line)" }}
              >
                <Radio selected={pay === k} />
                <span className="flex flex-col">
                  <span className="text-[13.5px] font-semibold text-pp-ink">{lbl}</span>
                  {k === "later" && <span className="text-[12px] text-pp-muted">{t("payLaterHint")}</span>}
                </span>
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
                idCheck: verified?.checkId ?? "",
                categoryId,
                nickname: nickname.trim(),
                nameTh: nameTh.trim(),
                acceptTerms,
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
              finish("held");
              setSubmitting(false);
              return;
            }
            try {
              const url = await payCardFee(registrationId);
              if (!url) {
                // Card payments are not switched on: the place is held and the
                // desk takes the fee.
                finish("held");
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
          {submitting && pay === "card" ? t("openingPayment") : pay === "later" ? t("registerNow") : t("payNow")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[620px] flex-col gap-4">
      <BackHeader title={t("tournamentTitle")} onBack={() => router.push("/parent")} />
      <TournamentBanner
        name={tournamentV2.name}
        when={tournamentV2.date}
        venue={tournamentV2.venue}
        imageUrl={tournamentV2.hasBanner ? `/api/tournaments/${tournamentV2.id}/banner` : undefined}
        className="h-[200px] w-full rounded-xl shadow-[0_8px_24px_rgba(35,53,94,.10)]"
      />
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
      {/* Only what there is to open: the regulation the organiser uploaded
          (or linked), and the venue on a map. A row with nothing behind it is
          left out rather than drawn as a link that goes nowhere. */}
      {(tournamentV2.regulationUrl || tournamentV2.mapUrl) && (
        <div className="flex flex-col gap-2">
          <span className={label}>{t("viewDetailsOn")}</span>
          <div className="divide-y divide-pp-line overflow-hidden rounded-xl bg-pp-card shadow-[0_8px_24px_rgba(35,53,94,.10)]">
            {tournamentV2.regulationUrl && (
              <a
                href={tournamentV2.regulationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-pp-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-pp-blue"
              >
                <FileText className="size-[17px] flex-none text-pp-blue" strokeWidth={1.8} />
                <span className="flex-1 text-[13px] text-pp-ink">{t("regulationsPdf")}</span>
                <span className="text-pp-muted" aria-hidden>→</span>
              </a>
            )}
            {tournamentV2.mapUrl && (
              <a
                href={tournamentV2.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-pp-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-pp-blue"
              >
                <MapPin className="size-[17px] flex-none text-pp-blue" strokeWidth={1.8} />
                <span className="flex-1 text-[13px] text-pp-ink">{t("venueMap")}</span>
                <span className="text-pp-muted" aria-hidden>→</span>
              </a>
            )}
          </div>
        </div>
      )}
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
      {tournamentV2.registration !== "open" ? (
        /* Closed by the academy or past its closing date: the server would
           refuse the entry, so there is no button to start one. */
        <p role="status" className="rounded-xl bg-pp-panel px-4 py-3 text-center text-[13px] font-semibold text-pp-sub">
          {tournamentV2.registration === "closed" ? t("registrationClosed") : t("registrationDeadlinePassed")}
        </p>
      ) : available.length > 0 ? (
        <button
          onClick={() => {
            if (!available.some((c) => c.key === child)) setChild(available[0].key);
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

function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}
