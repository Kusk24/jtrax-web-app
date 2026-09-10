/* The public registration form for one tournament.
 *
 * This is what the QR code on a poster leads to, so it has to work for somebody
 * standing in a hall on a phone who has never heard of JTrax: no sign-in, no
 * app, one screen, and a price they can see before they type anything.
 *
 * Server-rendered and fetched straight from the backend rather than through
 * /api — that proxy exists to attach a session token, and there is no session
 * here. It is also what makes the page shareable: the name, date and fee are in
 * the HTML, so a link pasted into a chat unfurls as the event it is.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, FileText, MapPin, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { PublicShell, PublicCard } from "@/components/public/PublicShell";
import type { PublicCategory, PublicTournament } from "@/lib/registration";
import { RegisterForm } from "./RegisterForm";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

/* Short, because the two facts most likely to change while a poster is up are
   how many places are left and whether registration is still open. */
export const revalidate = 30;

type Payload = { tournament: PublicTournament; categories: PublicCategory[] };

async function fetchTournament(id: string): Promise<Payload | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/tournaments/${id}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as Payload;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchTournament(id);
  // A tournament nobody opened must not leak its name through a page title.
  if (!data) return { title: "JTrax" };
  return {
    title: `${data.tournament.name} — JCA Chess Academy`,
    description: `Register for ${data.tournament.name}.`,
  };
}

/** Dates through Intl, never hand-rolled. */
function formatDate(iso: string, locale: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export default async function RegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fetchTournament(id);
  // Closed and non-existent are the same 404 here, exactly as the API treats
  // them — the page must not be a way to discover which ids are real.
  if (!data) notFound();

  const t = await getTranslations("register");
  const locale = await getLocale();
  const { tournament, categories } = data;

  const dates = [tournament.startDate, tournament.endDate].filter(Boolean);
  const when =
    dates.length === 2 && dates[0] !== dates[1]
      ? `${formatDate(dates[0], locale)} – ${formatDate(dates[1], locale)}`
      : dates.length
        ? formatDate(dates[0], locale)
        : "";

  return (
    <PublicShell title={tournament.name} subtitle={when || undefined} wide>
      <div className="flex flex-col gap-4">
        <PublicCard className="!p-4 sm:!p-5">
          <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
            <Fact
              label={t("fee")}
              value={money(tournament.fee, locale)}
              icon={<CalendarDays className="size-4" />}
              /* Says why the price is what it is: an early-bird price that
                 expires is worth knowing the expiry of. */
              note={
                tournament.earlyBirdActive && tournament.earlyBirdUntil
                  ? t("earlyBirdUntil", { date: formatDate(tournament.earlyBirdUntil, locale) })
                  : undefined
              }
            />
            {tournament.studentDiscountPct > 0 && (
              <Fact
                label={t("studentFee")}
                value={money(tournament.studentFee, locale)}
                icon={<Users className="size-4" />}
                note={t("discountOf", { pct: tournament.studentDiscountPct })}
              />
            )}
            {tournament.venueName && <Fact label={t("venue")} value={tournament.venueName} icon={<MapPin className="size-4" />} />}
            {tournament.registrationDeadline && (
              <Fact label={t("closes")} value={formatDate(tournament.registrationDeadline, locale)} icon={<Clock3 className="size-4" />} />
            )}
            {tournament.spotsLeft !== null && (
              <Fact label={t("placesLeft")} value={String(tournament.spotsLeft)} icon={<Users className="size-4" />} />
            )}
          </dl>

          {/* The organiser's own rules — schedule, categories, prizes. A
              parent deciding whether to enter should be able to read them
              without asking the desk for a copy. */}
          {tournament.hasRegulation && (
            <a
              href={`/api/tournaments/${tournament.id}/regulation`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-[54px] w-full items-center gap-3 rounded-xl border border-[#cbdcf6] bg-[#f4f8ff] px-4 text-[13px] font-semibold text-pp-blue transition-colors duration-150 hover:border-pp-blue"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm"><FileText className="size-4" aria-hidden /></span>
              <span className="flex flex-1 flex-col"><strong>{t("regulation")}</strong><span className="text-[11px] font-normal text-pp-muted">{t("regulationHint")}</span></span>
              <span className="rounded-lg border border-[#cbdcf6] bg-white px-3 py-1.5 text-[11px] font-bold">{t("viewRegulation")}</span>
            </a>
          )}
        </PublicCard>

        {tournament.open ? (
          <RegisterForm
            tournamentId={tournament.id}
            categories={categories}
            fee={tournament.fee}
            studentFee={tournament.studentFee}
            discountPct={tournament.studentDiscountPct}
            startDate={tournament.startDate}
          />
        ) : (
          <PublicCard>
            <p className="text-sm font-semibold text-pp-amber">
              {tournament.closedReason === "full" ? t("closedFull") : t("closedDeadline")}
            </p>
            <p className="mt-1.5 text-sm text-pp-muted">{t("closedHint")}</p>
          </PublicCard>
        )}
      </div>
    </PublicShell>
  );
}

/** Currency through Intl with the ISO code — never a hand-rolled symbol. */
function money(amount: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "THB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}

function Fact({ label, value, note, icon }: { label: string; value: string; note?: string; icon?: React.ReactNode }) {
  return (
    /* The note lives inside the <dd>, not beside it: a <div> inside a <dl> may
       only hold <dt>/<dd> pairs, and a stray <p> there is invalid markup that
       screen readers read out of order. */
    <div className="rounded-xl border border-pp-line bg-[#fbfdff] p-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-pp-muted"><span className="text-pp-blue">{icon}</span>{label}</dt>
      <dd className="mt-1 text-[14px] font-semibold text-pp-ink">{value}{note && <span className="block text-[10.5px] font-normal text-pp-muted">{note}</span>}</dd>
    </div>
  );
}
