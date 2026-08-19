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
import { registerForTournament, type PublicCategory } from "@/lib/registration";
import { PublicCard } from "@/components/public/PublicShell";

const field =
  "w-full min-h-[44px] rounded-xl border border-pp-line bg-white px-3 py-2.5 text-[15px] text-pp-ink " +
  "outline-none transition-colors duration-150 placeholder:text-pp-faint " +
  "focus:border-pp-blue focus:ring-2 focus:ring-pp-soft";

export function RegisterForm({
  tournamentId,
  categories,
  fee,
  studentFee,
  discountPct,
}: {
  tournamentId: string;
  categories: PublicCategory[];
  fee: number;
  studentFee: number;
  discountPct: number;
}) {
  const t = useTranslations("register");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isStudent, setIsStudent] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ feeQuoted: number } | null>(null);

  const payable = isStudent && discountPct > 0 ? studentFee : fee;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const out = await registerForTournament(tournamentId, {
        name, email, phone, dateOfBirth, categoryId, isStudent,
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
    <PublicCard>
      <h2 className="font-pp-display text-lg font-bold text-pp-navy">{t("formTitle")}</h2>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3.5" noValidate>
        <Labelled label={t("name")} htmlFor="reg-name" required>
          <input
            id="reg-name" className={field} value={name} required
            autoComplete="name" maxLength={80}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </Labelled>

        <Labelled label={t("email")} htmlFor="reg-email" required hint={t("emailHint")}>
          <input
            id="reg-email" className={field} value={email} required
            type="email" inputMode="email" autoComplete="email" maxLength={254}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </Labelled>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Labelled label={t("phone")} htmlFor="reg-phone">
            <input
              id="reg-phone" className={field} value={phone}
              type="tel" inputMode="tel" autoComplete="tel" maxLength={32}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Labelled>
          <Labelled label={t("dateOfBirth")} htmlFor="reg-dob" hint={t("dateOfBirthHint")}>
            <input
              id="reg-dob" className={field} value={dateOfBirth} type="date"
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Labelled>
        </div>

        {categories.length > 0 && (
          <Labelled label={t("category")} htmlFor="reg-cat">
            <select
              id="reg-cat" className={`${field} cursor-pointer`} value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t("categoryAny")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Labelled>
        )}

        {discountPct > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-pp-line bg-pp-mist p-3 transition-colors duration-150 hover:border-pp-blue">
            <input
              type="checkbox" checked={isStudent}
              onChange={(e) => setIsStudent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--color-pp-blue)]"
            />
            <span className="min-w-0">
              <span className="block text-[14.5px] font-semibold text-pp-ink">
                {t("isStudent", { pct: discountPct })}
              </span>
              <span className="block text-[12.5px] text-pp-muted">{t("isStudentHint")}</span>
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-pp-red-soft px-3 py-2.5 text-[13.5px] font-semibold text-pp-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pp-line pt-4">
          <span className="text-[15px] text-pp-muted">
            {t("youPay")} <strong className="text-pp-ink">{money(payable)}</strong>
          </span>
          <button
            type="submit"
            disabled={busy}
            className="min-h-[44px] cursor-pointer rounded-xl bg-pp-blue px-6 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-pp-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? t("sending") : t("submit")}
          </button>
        </div>
      </form>
    </PublicCard>
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
