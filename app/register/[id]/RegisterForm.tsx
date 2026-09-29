"use client";

/* The entry form, in the order the academy's own paper form asks it:
 * the terms, the regulation, the player, their category, and the payment.
 *
 * It is filled in on a phone, probably one-handed, so every control is at
 * least 44px tall and the columns fold to one. The person filling it in has
 * no account, so the price follows the student box as it is ticked, and
 * "Pay & Register" does both in one go: the place is saved first, then the
 * browser goes to Stripe's page for the fee (card or PromptPay). A card that
 * fails, or a family who would rather pay at the desk, keeps the place — the
 * confirmation says so, with the dates that matter and who to call.
 *
 * The age group goes by birth year, as chess events do: U10 in 2026 is born
 * on or after 1 January 2016. Groups the player is too old for cannot be
 * picked; the backend refuses them regardless.
 *
 * The student box is a *claim*. Nothing here checks it, and that is
 * deliberate: if the discount only appeared for addresses the academy
 * recognised, this form would be a way to test whether a given child is a
 * pupil here. Staff see the match and decide.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  BadgeCheck, Camera, Check, CreditCard, Eye, FileText, Info, Lock, Mail, MessageCircle,
  Phone, QrCode, ScrollText, Trophy, Upload, UserRound,
} from "lucide-react";
import {
  ageFromDOB, categoryAllows, payForPublicEntry, registerForTournament, scanIDCard,
  type PublicCategory, type ScannedIDCard,
} from "@/lib/registration";
import { ACADEMY_CONTACT } from "@/lib/academy-contact";
import { PublicCard } from "@/components/public/PublicShell";
import { PayNow } from "./PayNow";

/* The five numbered conditions, in the order the academy wrote them. Data
   rather than markup so the wording lives in the message files. */
const TERMS = ["termsRegistration", "termsRefund", "termsChanges", "termsConduct", "termsLiability"] as const;

const field =
  "w-full min-h-[44px] rounded-xl border border-pp-line bg-white px-3 py-2.5 text-[15px] text-pp-ink " +
  "outline-none transition-colors duration-150 placeholder:text-pp-muted " +
  "focus:border-pp-blue focus:ring-2 focus:ring-pp-soft disabled:cursor-not-allowed";

type DocType = "thai-id" | "passport";

export function RegisterForm({
  tournamentId,
  categories,
  fee,
  studentFee,
  discountPct,
  startDate,
  regulationHref,
  cardPayments = false,
  earlyBirdUntil,
  registrationDeadline,
  preview = false,
}: {
  tournamentId: string;
  categories: PublicCategory[];
  fee: number;
  studentFee: number;
  discountPct: number;
  /** The event's first day — its year is the one age groups count from. */
  startDate: string;
  /** Where the regulation opens, when there is one. */
  regulationHref?: string;
  /** Stripe is on: the button pays as well as registers. */
  cardPayments?: boolean;
  /** Set while the early-bird price is the one being quoted. */
  earlyBirdUntil?: string;
  registrationDeadline?: string;
  /** The organiser's review of a draft: everything shows, nothing sends. */
  preview?: boolean;
}) {
  const t = useTranslations("register");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [docType, setDocType] = useState<DocType>("thai-id");
  const [name, setName] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [studentId, setStudentId] = useState("");

  /* The card scan. Held so the form can say what came off the document, and
     so what it read is sent beside what was finally typed. */
  const [scan, setScan] = useState<ScannedIDCard | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{
    feeQuoted: number;
    entry?: string;
    code?: string;
    /** Stripe could have been opened but was not — offer it again. */
    payRetry: boolean;
    emailed: boolean;
  } | null>(null);

  const payable = isStudent && discountPct > 0 ? studentFee : fee;
  const age = ageFromDOB(dateOfBirth);
  const paysOnline = cardPayments && payable > 0;

  const eligibility = categories.map((c) => ({ ...c, ...categoryAllows(c.name, dateOfBirth, startDate) }));
  const chosen = eligibility.find((c) => c.id === categoryId);
  /* A category picked before the date of birth changed can stop being one
     this player may enter. */
  const categoryBlocked = Boolean(chosen && !chosen.allowed);

  async function readCard(file: File) {
    setScanning(true);
    setScanNote("");
    try {
      const card = await scanIDCard(tournamentId, file);
      setScan(card);
      /* Only fill a field that is empty: somebody who typed a name and then
         attached a card has told us twice, and the one they typed is meant. */
      const full = [card.firstName.value, card.lastName.value].filter(Boolean).join(" ");
      if (full && !name) setName(full);
      if (card.thaiName?.value && !nameTh) setNameTh(card.thaiName.value);
      if (card.dateOfBirth.value && !dateOfBirth) setDateOfBirth(card.dateOfBirth.value);
      if (card.documentType === "thai-id" || card.documentType === "passport") setDocType(card.documentType);
      if (!full && !card.dateOfBirth.value) setScanNote(t("scanNothingRead"));
    } catch (err) {
      setScanNote(err instanceof Error ? err.message : t("scanFailed"));
    } finally {
      setScanning(false);
    }
  }

  /* Everything the paper form marks with a star. Checked here so the message
     can name what is missing; the server checks the rest. */
  function missing(): string {
    if (!acceptTerms) return t("needTerms");
    if (name.trim().length < 2) return t("needName");
    if (!dateOfBirth) return t("needDob");
    if (!nickname.trim()) return t("needNickname");
    if (!phone.trim()) return t("needPhone");
    if (!email.trim()) return t("needEmail");
    if (categories.length > 0 && !categoryId) return t("needCategory");
    if (categoryBlocked) return t("categoryTooOldHelp", { year: chosen?.bornFrom ?? 0 });
    if (isStudent && !studentId.trim()) return t("needStudentId");
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preview) return;
    const why = missing();
    if (why) {
      setError(why);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const out = await registerForTournament(tournamentId, {
        name: name.trim(),
        email,
        phone,
        dateOfBirth,
        categoryId,
        isStudent,
        studentId: isStudent ? studentId : undefined,
        nickname,
        age: age || undefined,
        acceptTerms,
        nameTh: docType === "thai-id" ? nameTh.trim() : undefined,
        documentType: docType,
        scannedName: scan ? [scan.firstName.value, scan.lastName.value].filter(Boolean).join(" ") : undefined,
        scannedDateOfBirth: scan?.dateOfBirth.value || undefined,
      });
      const canPay = Boolean(out.cardPayments && out.registrationId && out.payCode);
      if (canPay) {
        /* The place is theirs now; the fee is the second step. If Stripe
           cannot be opened, the confirmation below offers it again. */
        try {
          window.location.assign(await payForPublicEntry(out.registrationId!, out.payCode!));
          return; // left busy: the browser is on its way to Stripe
        } catch {
          /* fall through to the confirmation */
        }
      }
      setDone({
        feeQuoted: out.feeQuoted,
        entry: out.registrationId,
        code: out.payCode,
        payRetry: canPay,
        emailed: Boolean(out.emailed),
      });
      setBusy(false);
    } catch (err) {
      // The server's message is written for whoever is at the form.
      setError(err instanceof Error ? err.message : t("failed"));
      setBusy(false);
    }
  }

  if (done) {
    const earlyBird = earlyBirdUntil && !isStudent ? earlyBirdUntil : "";
    return (
      <PublicCard>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-pp-green-soft">
            <Check className="size-6 text-pp-green-dot" strokeWidth={3} aria-hidden />
          </span>
          <h2 className="font-pp-display text-lg font-bold text-pp-navy">{t("doneTitle")}</h2>
          <p className="max-w-md text-sm text-pp-muted">{t("doneBody")}</p>
          {done.feeQuoted > 0 && (
            <p className="text-sm font-semibold text-pp-ink">{t("doneFee", { fee: money(done.feeQuoted) })}</p>
          )}
          {done.feeQuoted > 0 && done.payRetry && done.entry && done.code && (
            <PayNow entry={done.entry} code={done.code} label={t("payNow", { fee: money(done.feeQuoted) })} />
          )}
          {done.feeQuoted > 0 && (
            <UnpaidRules earlyBirdUntil={earlyBird} closes={registrationDeadline} />
          )}
          {done.emailed && <p className="max-w-md text-[13px] text-pp-muted">{t("doneEmailed", { email })}</p>}
          <Contacts />
        </div>
      </PublicCard>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {/* 1 — Terms and conditions */}
      <Section title={t("termsTitle")} icon={<ScrollText className="size-5" />}>
        <div className="rounded-xl border border-pp-line bg-pp-wash px-4 py-3.5">
          <ol className="grid list-decimal gap-x-8 gap-y-3 pl-5 text-[13px] leading-relaxed text-pp-sub md:grid-cols-2">
            {TERMS.map((key) => (
              <li key={key}>
                <span className="font-semibold text-pp-ink">{t(`${key}Title`)}</span>
                <span className="block">{t(`${key}Body`)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[12.5px] font-semibold italic text-pp-ink">{t("termsAcknowledge")}</p>
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-5 shrink-0 cursor-pointer accent-pp-blue"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          <span className="text-[13.5px] text-pp-ink">
            {t("termsAccept")} <span className="text-pp-danger" aria-hidden>*</span>
          </span>
        </label>
      </Section>

      {/* 2 — Regulation */}
      {regulationHref && (
        /* A visible outline, so the regulation reads as its own box rather
           than blending into the page between the terms and the player. */
        <section className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-[#8fa6d1] bg-white p-4 shadow-[0_4px_16px_rgba(35,53,94,.05)] sm:p-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-pp-red-soft text-pp-danger">
            <FileText className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-pp-display text-[15.5px] font-bold text-pp-navy">{t("regulation")}</span>
            <span className="block text-[12.5px] text-pp-muted">{t("regulationHint")}</span>
          </span>
          <a
            href={regulationHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-pp-blue px-4 text-[13.5px] font-semibold text-pp-blue transition-colors duration-150 hover:bg-[#f4f8ff]"
          >
            <Eye className="size-4" aria-hidden /> {t("viewRegulation")}
          </a>
        </section>
      )}

      {/* 3 — Player */}
      <Section title={t("playerSection")} icon={<UserRound className="size-5" />}>
        {/* Which document the player holds comes first: it decides whether
            there is a Thai name to give (a Thai ID card prints one, a passport
            does not), and it is the document the upload below reads. */}
        {/* The question and its two answers on one line. A radiogroup named by
            its label rather than a fieldset: a <legend> will not sit inline. */}
        <div role="radiogroup" aria-labelledby="doc-type-label" className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span id="doc-type-label" className="text-[13px] font-semibold text-pp-sub">{t("documentType")}</span>
          <div className="flex flex-wrap gap-2">
            {(["thai-id", "passport"] as const).map((d) => (
              <label
                key={d}
                className={`flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[13.5px] font-semibold transition-colors duration-150 ${docType === d ? "border-pp-blue bg-[#f4f8ff] text-pp-blue" : "border-pp-line bg-white text-pp-ink"}`}
              >
                <input
                  type="radio"
                  name="doc-type"
                  className="size-4 accent-pp-blue"
                  checked={docType === d}
                  onChange={() => setDocType(d)}
                />
                {t(d === "thai-id" ? "docThaiId" : "docPassport")}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-pp-line bg-pp-wash p-3.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-pp-blue shadow-sm">
            <Camera className="size-5" aria-hidden />
          </span>
          <span className="min-w-[180px] flex-1">
            <span className="block text-[13.5px] font-semibold text-pp-ink">
              {t("idCardTitle")} <span className="font-normal text-pp-muted">{t("optional")}</span>
            </span>
            <span className="block text-[12.5px] text-pp-sub">{t("idCardHint")}</span>
          </span>
          <label
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-pp-line bg-white px-4 text-[13.5px] font-semibold text-pp-blue sm:w-auto transition-colors duration-150 hover:border-pp-blue ${preview ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <Upload className="size-4" aria-hidden />
            {scanning ? t("scanning") : t("idCardChoose")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={scanning || preview}
              onChange={(e) => {
                const f = e.target.files?.[0];
                /* Cleared so picking the same file twice still fires. */
                e.target.value = "";
                if (f) void readCard(f);
              }}
            />
          </label>
          {(scanNote || scan) && (
            <p className="w-full text-[12.5px] text-pp-sub" role="status">
              {scanNote ||
                t("scanRead", {
                  name: [scan!.firstName.value, scan!.lastName.value].filter(Boolean).join(" ") || "—",
                  dob: scan!.dateOfBirth.value || "—",
                })}
              {scan?.dateOfBirth.value && scan.dateOfBirth.confidence < 0.5 && (
                <span className="block font-semibold text-pp-amber">{t("scanCheckDate")}</span>
              )}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <Labelled label={t("nameEnglish")} htmlFor="reg-name" required>
            <input
              id="reg-name" className={field} value={name} autoComplete="name" maxLength={80}
              onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")}
            />
          </Labelled>
          {docType === "thai-id" ? (
            <Labelled label={t("nameThai")} htmlFor="reg-name-th">
              <input
                id="reg-name-th" className={field} value={nameTh} maxLength={80} lang="th"
                onChange={(e) => setNameTh(e.target.value)} placeholder={t("nameThaiPlaceholder")}
              />
            </Labelled>
          ) : (
            <div className="hidden sm:block" />
          )}
          <Labelled label={t("dateOfBirth")} htmlFor="reg-dob" required>
            <input
              id="reg-dob" className={field} value={dateOfBirth} type="date"
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Labelled>
          <Labelled label={t("age")} htmlFor="reg-age">
            <input
              id="reg-age" className={`${field} bg-pp-wash`} readOnly tabIndex={-1}
              value={age ? String(age) : ""} placeholder={t("agePlaceholder")}
            />
          </Labelled>
          <div className="sm:col-span-2">
            <Labelled label={t("nickname")} htmlFor="reg-nickname" required>
              <input
                id="reg-nickname" className={field} value={nickname} maxLength={80}
                onChange={(e) => setNickname(e.target.value)} placeholder={t("nicknamePlaceholder")}
              />
            </Labelled>
          </div>
          {/* The two ways to reach the family, side by side. */}
          <Labelled label={t("phone")} htmlFor="reg-phone" required>
            <input
              id="reg-phone" className={field} value={phone} type="tel" inputMode="tel"
              autoComplete="tel" maxLength={32} onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
            />
          </Labelled>
          <Labelled label={t("email")} htmlFor="reg-email" required hint={t("emailHint")}>
            <input
              id="reg-email" className={field} value={email} type="email" inputMode="email"
              autoComplete="email" maxLength={254} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </Labelled>
        </div>
      </Section>

      {/* 4 — Category */}
      {categories.length > 0 && (
        <Section title={t("category")} icon={<Trophy className="size-5" />}>
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-[#edf4ff] px-3.5 py-2.5 text-[12.5px] font-medium text-pp-blue">
            <Info className="size-4 shrink-0" aria-hidden /> {t("categoryInfo")}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5" role="radiogroup" aria-label={t("category")}>
            {eligibility.map((c) => {
              const selected = categoryId === c.id;
              return (
                <label
                  key={c.id}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 transition-colors duration-150 ${
                    !c.allowed
                      ? "cursor-not-allowed border-pp-line bg-pp-wash opacity-55"
                      : selected
                        ? "cursor-pointer border-pp-blue bg-[#f4f8ff] ring-2 ring-pp-soft"
                        : "cursor-pointer border-pp-line bg-white hover:border-pp-blue"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    className="mt-0.5 size-4 shrink-0 accent-pp-blue"
                    checked={selected}
                    disabled={!c.allowed}
                    onChange={() => setCategoryId(c.id)}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-pp-ink">{c.name}</span>
                    <span className="block text-[11.5px] leading-snug text-pp-muted">
                      {c.limit === 0
                        ? t("categoryOpen")
                        : t("categoryBornFrom", { year: c.bornFrom })}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {categoryBlocked && (
            <p role="alert" className="mt-2 text-[12.5px] font-semibold text-pp-danger">
              {t("categoryTooOldHelp", { year: chosen?.bornFrom ?? 0 })}
            </p>
          )}
        </Section>
      )}

      {/* 5 — Payment */}
      <Section title={t("paymentSection")} icon={<CreditCard className="size-5" />}>
        {discountPct > 0 && (
          <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[#cbdcf6] bg-[#f4f8ff] p-3 transition-colors duration-150 hover:border-pp-blue">
            <input
              type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-pp-blue"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[14px] font-semibold text-pp-ink">
                <BadgeCheck className="size-4 text-pp-blue" aria-hidden /> {t("isStudent", { pct: discountPct })}
              </span>
              <span className="block text-[12.5px] text-pp-sub">{t("isStudentHint")}</span>
              {isStudent && (
                <span className="mt-2.5 block">
                  <label htmlFor="reg-student-id" className="mb-1 block text-[12.5px] font-semibold text-pp-ink">
                    {t("studentId")}
                  </label>
                  <input
                    id="reg-student-id" className={field} value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    /* The label toggles the checkbox; typing here must not. */
                    onClick={(e) => e.stopPropagation()}
                    placeholder={t("studentIdPlaceholder")}
                  />
                </span>
              )}
            </span>
          </label>
        )}

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-stretch">
          <div className="rounded-xl bg-[#f4f8ff] px-4 py-3.5">
            <span className="block text-[12px] font-semibold text-pp-muted">{t("entryFee")}</span>
            <strong className="block font-pp-display text-[24px] text-pp-navy">{money(payable)}</strong>
            {chosen && <span className="block text-[12px] text-pp-sub">{t("forCategory", { name: chosen.name })}</span>}
          </div>
          <div className="flex flex-col justify-center gap-2 rounded-xl border border-pp-line px-4 py-3">
            <span className="text-[12px] font-semibold text-pp-muted">{t("paymentMethod")}</span>
            {paysOnline || preview ? (
              <>
                <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold text-pp-ink">
                  <CreditCard className="size-4 text-pp-blue" aria-hidden /> {t("methodCard")}
                  <span className="rounded bg-[#1a1f71] px-1.5 py-0.5 text-[9.5px] font-bold italic text-white">VISA</span>
                  <span className="rounded bg-[#eb001b] px-1.5 py-0.5 text-[9.5px] font-bold text-white">Mastercard</span>
                  <span className="rounded bg-[#2e77bc] px-1.5 py-0.5 text-[9.5px] font-bold text-white">AMEX</span>
                </span>
                <span className="flex items-center gap-2 text-[13.5px] font-semibold text-pp-ink">
                  <QrCode className="size-4 text-pp-blue" aria-hidden /> {t("methodPromptPay")}
                </span>
                <span className="flex items-center gap-1.5 text-[11.5px] text-pp-muted">
                  <Lock className="size-3.5" aria-hidden /> {t("stripeSecure")}
                </span>
              </>
            ) : (
              <span className="text-[13px] text-pp-ink">{payable > 0 ? t("payAtDesk") : t("noFee")}</span>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-pp-red-soft px-3 py-2.5 text-[13.5px] font-semibold text-pp-danger">
            {error}
          </p>
        )}
        {preview && (
          <p className="mt-3 rounded-xl bg-pp-amber-soft px-3 py-2 text-[12.5px] font-semibold text-pp-amber">
            {t("previewSubmitOff")}
          </p>
        )}

        <button
          type="submit"
          disabled={preview || busy}
          className="mt-4 flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-pp-blue px-6 text-[15px] font-semibold text-white shadow-[0_8px_18px_rgba(46,92,184,.22)] transition-colors duration-150 hover:bg-pp-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue disabled:cursor-not-allowed disabled:opacity-60"
        >
          {paysOnline || (preview && payable > 0) ? <Lock className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}
          {busy
            ? paysOnline ? t("openingPayment") : t("sending")
            : paysOnline || (preview && payable > 0)
              ? t("payAndRegister", { fee: money(payable) })
              : t("submit")}
        </button>
      </Section>
    </form>
  );
}

/** What happens to a place that is not paid for yet — the same rules the
    server applies (entryrules.go in jtrax-backend). */
function UnpaidRules({ earlyBirdUntil, closes }: { earlyBirdUntil?: string; closes?: string }) {
  const t = useTranslations("register");
  return (
    <div className="w-full max-w-md rounded-xl border border-pp-line bg-pp-wash px-4 py-3 text-left">
      <p className="text-[13px] font-semibold text-pp-ink">{t("unpaidTitle")}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[12.5px] leading-relaxed text-pp-sub">
        <li>{t("unpaidPayLater")}</li>
        {earlyBirdUntil && <li>{t("unpaidEarlyBird", { date: longDate(earlyBirdUntil) })}</li>}
        {closes && <li>{t("unpaidRelease", { date: longDate(closes) })}</li>}
      </ul>
    </div>
  );
}

function Contacts() {
  const t = useTranslations("register");
  return (
    <div className="w-full max-w-md rounded-xl bg-[#edf4ff] px-4 py-3 text-left text-[12.5px] text-pp-ink">
      <p className="font-semibold">{t("contactTitle")}</p>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5">
        <Phone className="size-3.5 text-pp-blue" aria-hidden />
        {ACADEMY_CONTACT.phones.map((p, i) => (
          <span key={p}>
            {i > 0 && " · "}
            <a className="font-semibold text-pp-blue" href={`tel:${p.replace(/-/g, "")}`}>{p}</a>
          </span>
        ))}
      </p>
      <p className="mt-1 flex items-center gap-1.5">
        <Mail className="size-3.5 text-pp-blue" aria-hidden />
        <a className="font-semibold text-pp-blue" href={`mailto:${ACADEMY_CONTACT.email}`}>{ACADEMY_CONTACT.email}</a>
      </p>
      <p className="mt-1 flex items-center gap-1.5">
        <MessageCircle className="size-3.5 text-pp-blue" aria-hidden />
        <a className="font-semibold text-pp-blue" href={ACADEMY_CONTACT.line} target="_blank" rel="noopener noreferrer">LINE</a>
      </p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-pp-line bg-white p-4 shadow-[0_4px_16px_rgba(35,53,94,.05)] sm:p-5">
      <div className="mb-4 flex items-center gap-3 border-b border-pp-panel pb-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-[#edf4ff] text-pp-blue">{icon}</span>
        <h2 className="font-pp-display text-[16.5px] font-bold text-pp-navy">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Labelled({
  label, htmlFor, children, required, hint,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-pp-sub">
        {label}
        {required && <span className="ml-0.5 text-pp-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-pp-muted">{hint}</p>}
    </div>
  );
}

function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
