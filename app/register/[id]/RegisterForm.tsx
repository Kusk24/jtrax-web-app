"use client";

/* The form itself.
 *
 * Two things shape it. It is filled in on a phone, probably one-handed, so
 * every control is at least 44px tall and the whole thing is one column. And
 * the person filling it in has no account and no way to check anything
 * afterwards, so the price updates as they tick the student box, and the
 * confirmation says plainly that a place is not yet theirs.
 *
 * The student box is a *claim*. Nothing here checks it, and that is deliberate:
 * if the discount only appeared for addresses the academy recognised, this form
 * would be a way to test whether a given child is a pupil here, one submission
 * at a time. Staff see the match and decide.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, Check, CreditCard, IdCard, UserRound } from "lucide-react";
import {
  ageFromDOB, categoryAllows, registerForTournament, scanIDCard,
  type PublicCategory, type ScannedIDCard,
} from "@/lib/registration";
import { PublicCard } from "@/components/public/PublicShell";

/* The five numbered conditions, in the order the academy wrote them. Data
   rather than markup so the wording lives in the message files with everything
   else the entrant reads, and so Thai is a translation rather than a fork. */
const TERMS = ["termsRegistration", "termsRefund", "termsChanges", "termsConduct", "termsLiability"] as const;

const field =
  "w-full min-h-[44px] rounded-xl border border-pp-line bg-white px-3 py-2.5 text-[15px] text-pp-ink " +
  "outline-none transition-colors duration-150 placeholder:text-pp-muted " +
  "focus:border-pp-blue focus:ring-2 focus:ring-pp-soft";

export function RegisterForm({
  tournamentId,
  categories,
  fee,
  studentFee,
  discountPct,
  startDate,
}: {
  tournamentId: string;
  categories: PublicCategory[];
  fee: number;
  studentFee: number;
  discountPct: number;
  /** The day a category's age limit is measured against. */
  startDate: string;
}) {
  const t = useTranslations("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [nickname, setNickname] = useState("");
  /* A string, not a number: an empty numeric input is NaN, and a field that
     flickers to 0 while somebody is deleting a digit is a field that fights
     back. Converted once, at submit. */
  const [age, setAge] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  /* The card scan. `scan` holds what was read so the form can show which
     values came off the document and how sure it was — a prefill the entrant
     cannot see the provenance of is one they will not think to check. */
  const [scan, setScan] = useState<ScannedIDCard | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ feeQuoted: number } | null>(null);

  const payable = isStudent && discountPct > 0 ? studentFee : fee;

  /* Which categories this player may enter, worked out from their date of
     birth. The backend decides for real; this greys out what it would refuse
     so nobody fills a form in only to be told no. */
  const eligibility = categories.map((c) => ({
    ...c,
    ...categoryAllows(c.name, dateOfBirth, startDate),
  }));
  const chosen = eligibility.find((c) => c.id === categoryId);
  /* A category picked before a date of birth was typed — or before it was
     changed — can become one this player cannot enter. */
  const categoryBlocked = Boolean(chosen && !chosen.allowed);

  /* Read the card and fill in what it says.
   *
   * Every value is written into a field the entrant can see and change. The
   * scan is a typing aid, not a verification step: a misread date of birth
   * that silently moved a child into the wrong age group would be worse than
   * no scan at all, and the backend re-checks the group against whatever is
   * finally submitted.
   *
   * A failure is a note, not an error — the form is still completable by hand,
   * which is exactly what it was before this existed. */
  async function readCard(file: File) {
    setScanning(true);
    setScanNote("");
    try {
      const card = await scanIDCard(tournamentId, file);
      setScan(card);

      /* Only fill a field that is empty. Somebody who typed their name and
         then attached a card has told us the name twice, and the one they
         typed is the one they meant. */
      const full = [card.firstName.value, card.lastName.value].filter(Boolean).join(" ");
      if (full && !name) setName(full);
      if (card.dateOfBirth.value && !dateOfBirth) setDateOfBirth(card.dateOfBirth.value);
      /* The age follows from the date of birth rather than being read: a card
         prints a date and never an age. */
      const derived = ageFromDOB(card.dateOfBirth.value);
      if (derived > 0 && !age) setAge(String(derived));

      if (!full && !card.dateOfBirth.value) setScanNote(t("scanNothingRead"));
    } catch (err) {
      setScanNote(err instanceof Error ? err.message : t("scanFailed"));
    } finally {
      setScanning(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const out = await registerForTournament(tournamentId, {
        name, email, phone, dateOfBirth, categoryId, isStudent,
        studentId: isStudent ? studentId : undefined,
        nickname,
        age: Number(age) || undefined,
        acceptTerms,
      });
      setDone({ feeQuoted: out.feeQuoted });
    } catch (err) {
      // The server's message is written for whoever is standing at the form —
      // "that email is already registered", "this tournament is full" — so it
      // is shown as-is rather than replaced with something vaguer.
      setError(err instanceof Error ? err.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <PublicCard>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-pp-green-soft">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="var(--color-pp-green-dot)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h2 className="font-pp-display text-lg font-bold text-pp-navy">{t("doneTitle")}</h2>
          {/* Said plainly: turning up on the day assuming a place is exactly the
              misunderstanding this sentence exists to prevent. */}
          <p className="max-w-sm text-sm text-pp-muted">{t("doneBody")}</p>
          <p className="text-sm font-semibold text-pp-ink">
            {t("doneFee", { fee: money(done.feeQuoted) })}
          </p>
        </div>
      </PublicCard>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Section number="1" title={t("playerSection")} icon={<UserRound className="size-4" />}>
        <div className="grid gap-3.5 sm:grid-cols-2">
        <Labelled label={t("name")} htmlFor="reg-name" required>
          <input
            id="reg-name" className={field} value={name} required
            autoComplete="name" maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </Labelled>

          <Labelled label={t("dateOfBirth")} htmlFor="reg-dob" hint={t("dateOfBirthHint")}>
            <input
              id="reg-dob" className={field} value={dateOfBirth} type="date"
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Labelled>
        </div>
        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
          <Labelled label={t("email")} htmlFor="reg-email" required hint={t("emailHint")}>
            <input
              id="reg-email" className={field} value={email} required
              type="email" inputMode="email" autoComplete="email" maxLength={254}
              onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
            />
          </Labelled>
          <Labelled label={t("phone")} htmlFor="reg-phone">
            <input
              id="reg-phone" className={field} value={phone}
              type="tel" inputMode="tel" autoComplete="tel" maxLength={32}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Labelled>
        </div>
        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2">
          <Labelled label={t("nickname")} htmlFor="reg-nickname" hint={t("nicknameHint")}>
            <input
              id="reg-nickname" className={field} value={nickname} maxLength={80}
              onChange={(e) => setNickname(e.target.value)}
            />
          </Labelled>
          <Labelled label={t("age")} htmlFor="reg-age" hint={t("ageHint")}>
            <input
              id="reg-age" className={field} value={age}
              type="number" inputMode="numeric" min={0} max={120}
              onChange={(e) => setAge(e.target.value)}
            />
          </Labelled>
        </div>

        {/* The card, under the fields it fills rather than above them: it is
            optional, and leading with an upload on a phone reads as a wall. */}
        <div className="mt-3.5 rounded-xl border border-dashed border-pp-line bg-pp-wash p-3">
          <p className="text-[13px] font-semibold text-pp-ink">{t("idCardTitle")}</p>
          <p className="mt-0.5 text-[12.5px] text-pp-sub">{t("idCardHint")}</p>
          <label className="mt-2.5 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-pp-line bg-white px-3.5 text-[14px] font-semibold text-pp-ink transition-colors duration-150 hover:border-pp-blue">
            <IdCard className="size-4" />
            {scanning ? t("scanning") : t("idCardChoose")}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={scanning}
              onChange={(e) => {
                const f = e.target.files?.[0];
                /* Cleared so picking the same file twice still fires — a
                   retry after a blurry photo is the ordinary case. */
                e.target.value = "";
                if (f) void readCard(f);
              }}
            />
          </label>
          {scanNote && (
            <p className="mt-2 text-[12.5px] text-pp-amber-ink" role="status">{scanNote}</p>
          )}
          {scan && (
            /* What the card said, so the entrant knows which fields came off
               it and can see where the model was unsure. */
            <p className="mt-2 text-[12.5px] text-pp-sub" role="status">
              {t("scanRead", {
                name: [scan.firstName.value, scan.lastName.value].filter(Boolean).join(" ") || "—",
                dob: scan.dateOfBirth.value || "—",
              })}
              {scan.dateOfBirth.value && scan.dateOfBirth.confidence < 0.5 && (
                <span className="block font-semibold text-pp-amber-ink">{t("scanCheckDate")}</span>
              )}
            </p>
          )}
        </div>
      </Section>

      <Section number="2" title={t("affiliationSection")} icon={<BadgeCheck className="size-4" />}>
        <div className="grid gap-3.5 md:grid-cols-2 md:items-start">
          {categories.length > 0 && (
          <Labelled label={t("category")} htmlFor="reg-cat">
            <select
              id="reg-cat" className={`${field} cursor-pointer`} value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t("categoryAny")}</option>
              {eligibility.map((c) => (
                <option key={c.id} value={c.id} disabled={!c.allowed}>
                  {c.name}
                  {c.needsDob
                    ? ` — ${t("categoryNeedsDob")}`
                    : c.allowed
                      ? ""
                      : ` — ${t("categoryTooOld", { limit: c.limit })}`}
                </option>
              ))}
            </select>
            {categoryBlocked && (
              <p role="alert" className="mt-1.5 text-[12.5px] font-semibold text-pp-danger">
                {chosen?.needsDob
                  ? t("categoryNeedsDobHelp")
                  : t("categoryTooOldHelp", { limit: chosen?.limit ?? 0 })}
              </p>
            )}
          </Labelled>
          )}

          {discountPct > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#cbdcf6] bg-[#f4f8ff] p-3 transition-colors duration-150 hover:border-pp-blue">
            <input
              type="checkbox" checked={isStudent}
              onChange={(e) => setIsStudent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-pp-blue)]"
            />
            <span className="min-w-0">
              <span className="block text-[14.5px] font-semibold text-pp-ink">
                {t("isStudent", { pct: discountPct })}
              </span>
              {/* On the mist panel, so pp-sub — see PublicShell. */}
              <span className="block text-[12.5px] text-pp-sub">{t("isStudentHint")}</span>
              {isStudent && (
                <span className="mt-2.5 block">
                  <label htmlFor="reg-student-id" className="mb-1 block text-[12.5px] font-semibold text-pp-ink">
                    {t("studentId")}
                  </label>
                  <input
                    id="reg-student-id"
                    className={field}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    /* The label is a click target for the checkbox above it,
                       so typing in here must not toggle it. */
                    onClick={(e) => e.stopPropagation()}
                    required
                    placeholder={t("studentIdPlaceholder")}
                  />
                  <span className="mt-1 block text-[12px] text-pp-sub">{t("studentIdHint")}</span>
                </span>
              )}
            </span>
          </label>
          )}
        </div>
      </Section>

      <Section number="3" title={t("summarySection")} icon={<CreditCard className="size-4" />}>
        {error && (
          <p role="alert" className="rounded-xl bg-pp-red-soft px-3 py-2.5 text-[13.5px] font-semibold text-pp-danger">
            {error}
          </p>
        )}

        {/* The conditions, above the button that accepts them. Collapsed by
            default because there are five numbered clauses and a phone form
            that opens with a wall of legal text is a phone form nobody
            finishes — but present, and openable, on the same screen as the
            tick. A link away to them would be a tick on something unread. */}
        <details className="rounded-xl border border-pp-line bg-pp-wash px-3.5 py-3">
          <summary className="cursor-pointer text-[13.5px] font-semibold text-pp-ink">
            {t("termsTitle")}
          </summary>
          <ol className="mt-2 flex list-decimal flex-col gap-2 pl-5 text-[12.5px] leading-relaxed text-pp-sub">
            {TERMS.map((key) => (
              <li key={key}>
                <span className="font-semibold text-pp-ink">{t(`${key}Title`)}</span>
                <span className="block">{t(`${key}Body`)}</span>
              </li>
            ))}
          </ol>
        </details>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-pp-line bg-white p-3 transition-colors duration-150 hover:border-pp-blue">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-pp-blue"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          <span className="text-[13.5px] leading-snug text-pp-ink">{t("termsAccept")}</span>
        </label>

        <div className="grid gap-3 md:grid-cols-[1fr_1.2fr] md:items-center">
          <span className="rounded-xl bg-[#f4f8ff] px-4 py-3 text-[13px] text-pp-muted">
            {t("youPay")} <strong className="ml-1 text-[22px] text-pp-navy">{money(payable)}</strong>
          </span>
          <button
            type="submit"
            /* The PDF's rule: an ineligible category means they cannot
               proceed to registration or payment. The backend refuses it
               regardless; this stops the journey earlier.

               Unticked terms disable it for the same reason — the server
               refuses the entry, and finding that out after pressing Submit
               teaches nothing the checkbox above could not have said. */
            disabled={busy || categoryBlocked || !acceptTerms}
            className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-pp-blue px-6 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(46,92,184,.2)] transition-colors duration-150 hover:bg-pp-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? t("sending") : <><Check className="size-4" />{t("submit")}</>}
          </button>
        </div>
        <p className="mt-2 text-[10.5px] text-pp-muted">{t("requestHint")}</p>
      </Section>
    </form>
  );
}

function Section({ number, title, icon, children }: { number: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-pp-line bg-white p-4 shadow-[0_4px_16px_rgba(35,53,94,.05)] sm:p-5">
      <div className="mb-4 flex items-center gap-2.5 border-b border-pp-panel pb-3">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#edf4ff] text-[11px] font-bold text-pp-blue">{number}</span>
        <span className="flex items-center gap-2 font-pp-display text-[15px] font-bold text-pp-navy">{icon}{title}</span>
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

function money(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "THB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
