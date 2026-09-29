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
import { ExternalLink, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { PublicShell, PublicCard } from "@/components/public/PublicShell";
import { TournamentBanner } from "@/components/public/TournamentBanner";
import { SiteFooter } from "@/components/public/SiteFooter";
import type { PublicCategory, PublicTournament } from "@/lib/registration";
import { RegisterForm } from "./RegisterForm";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

/* Short, because the two facts most likely to change while a poster is up are
   how many places are left and whether registration is still open. */
export const revalidate = 30;

type Payload = { tournament: PublicTournament; categories: PublicCategory[] };

/* `preview` is a draft's review link, opened by the console before the event
   is published. It is never cached: the organiser goes back, edits, and looks
   again, and must see the edit. */
async function fetchTournament(id: string, preview?: string): Promise<Payload | null> {
  try {
    const res = preview
      ? await fetch(
          `${API_BASE}/api/v1/public/tournaments/${id}/preview?preview=${encodeURIComponent(preview)}`,
          { cache: "no-store" },
        )
      : await fetch(`${API_BASE}/api/v1/public/tournaments/${id}`, {
          next: { revalidate },
        });
    if (!res.ok) return null;
    return (await res.json()) as Payload;
  } catch {
    return null;
  }
}

type SearchParams = Promise<{ preview?: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { id } = await params;
  const { preview } = await searchParams;
  const data = await fetchTournament(id, preview);
  // A tournament nobody opened must not leak its name through a page title.
  if (!data) return { title: "JTrax" };
  if (preview) return { title: `Preview — ${data.tournament.name}`, robots: { index: false, follow: false } };
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

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { preview } = await searchParams;
  const data = await fetchTournament(id, preview);
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

  /* The preview link has to ride along on the draft's own files, which are
     not public until it is published. */
  const previewQuery = preview ? `?preview=${encodeURIComponent(preview)}` : "";
  const venue = tournament.venueName || tournament.venueAddress;

  const mapUrl = venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([tournament.venueName, tournament.venueAddress].filter(Boolean).join(", "))}`
    : "";
  const earlyBird = tournament.earlyBirdActive && tournament.earlyBirdUntil && tournament.earlyBirdFee;
  /* Whole days until the deadline, counted on the academy's calendar
     (Bangkok): entries close at the end of that day, whatever the reader's
     own time zone. The last week is drawn in red — early enough to act on,
     late enough that a deadline two months out does not look like an alarm. */
  const daysLeft = tournament.registrationDeadline ? daysUntil(tournament.registrationDeadline) : null;
  const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <PublicShell footer={<SiteFooter />}
      title={tournament.name}
      subtitle={when || undefined}
      wide
      /* The banner is the whole header: nothing above it, and the heading is
         for screen readers only. */
      titleHidden
      hero={
        <TournamentBanner
          name={tournament.name}
          when={when}
          venue={venue}
          imageUrl={tournament.hasBanner ? `/api/tournaments/${tournament.id}/banner${previewQuery}` : undefined}
          className="w-full rounded-2xl shadow-[0_12px_32px_rgba(35,53,94,.14)]"
        />
      }
    >
      <div className="flex flex-col gap-4">
        {preview && (
          <p className="rounded-xl border border-[#f1d9b5] bg-pp-amber-soft px-4 py-3 text-[13px] font-semibold text-pp-amber">
            {t("previewBanner")}
          </p>
        )}

        {/* Four facts, each a label, one big answer and a line under it: what
            it costs, how long there is to enter, when it is, where it is. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard
            label={t("cards.fees")}
            badge={
              earlyBird ? (
                <span className="rounded-md border border-[#bfe4d8] bg-pp-green-soft px-2 py-0.5 text-[11.5px] font-semibold text-pp-green">
                  {t("cards.earlyBird")}
                </span>
              ) : undefined
            }
          >
            <p className="font-pp-display text-[18px] font-bold leading-snug text-pp-navy">{money(tournament.fee, locale)}</p>
            <p className="mt-1 text-[12.5px] text-pp-muted">
              {[
                earlyBird
                  ? t("cards.regularAfter", { fee: money(tournament.regularFee, locale), date: shortDate(tournament.earlyBirdUntil!, locale) })
                  : "",
                tournament.studentDiscountPct > 0 ? t("cards.students", { fee: money(tournament.studentFee, locale) }) : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </InfoCard>

          <InfoCard
            label={t("cards.deadline")}
            badge={
              daysLeft !== null && daysLeft >= 0 ? (
                <span
                  className={`rounded-md border px-2 py-0.5 text-[11.5px] font-semibold ${
                    urgent ? "border-[#f3c4c4] bg-pp-red-soft text-pp-red" : "border-[#cfdcf5] bg-pp-soft text-pp-blue"
                  }`}
                >
                  {daysLeft === 0 ? t("cards.lastDay") : t("cards.daysLeft", { count: daysLeft })}
                </span>
              ) : undefined
            }
          >
            <p className={`font-pp-display text-[18px] font-bold leading-snug ${urgent ? "text-pp-red" : "text-pp-navy"}`}>
              {tournament.registrationDeadline ? longDate(tournament.registrationDeadline, locale) : t("cards.noDeadline")}
            </p>
            {tournament.registrationDeadline && daysLeft !== null && daysLeft >= 0 && (
              <p className="mt-1 text-[12.5px] text-pp-muted">
                {[
                  t("cards.closesAt"),
                  daysLeft === 0 ? t("cards.closesToday") : t("cards.closesIn", { count: daysLeft }),
                ].join(" · ")}
              </p>
            )}
          </InfoCard>

          {/* The event date in red, so the day to be there stands out. */}
          <InfoCard label={t("cards.eventDate")}>
            <p className="font-pp-display text-[18px] font-bold leading-snug text-pp-red">
              {tournament.startDate ? longDate(tournament.startDate, locale) : t("dateTbc")}
            </p>
            {tournament.endDate && tournament.endDate !== tournament.startDate ? (
              <p className="mt-1 text-[12.5px] text-pp-muted">{t("cards.until", { date: longDate(tournament.endDate, locale) })}</p>
            ) : tournament.startDate ? (
              <p className="mt-1 text-[12.5px] text-pp-muted">{t("cards.oneDay")}</p>
            ) : null}
          </InfoCard>

          <InfoCard
            label={t("cards.venue")}
            badge={
              mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-1 text-[12.5px] font-semibold text-pp-blue hover:underline"
                >
                  <MapPin className="size-3.5 text-pp-red" aria-hidden /> {t("cards.maps")}
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ) : undefined
            }
          >
            <p className="font-pp-display text-[18px] font-bold leading-snug text-pp-navy">
              {tournament.venueName || tournament.venueAddress || t("dateTbc")}
            </p>
            {tournament.venueAddress && tournament.venueAddress !== tournament.venueName && (
              <p className="mt-1 text-[12.5px] text-pp-muted">{tournament.venueAddress}</p>
            )}
          </InfoCard>
        </div>

        {tournament.open ? (
          <RegisterForm
            tournamentId={tournament.id}
            categories={categories}
            fee={tournament.fee}
            studentFee={tournament.studentFee}
            discountPct={tournament.studentDiscountPct}
            startDate={tournament.startDate}
            regulationHref={tournament.hasRegulation ? `/api/tournaments/${tournament.id}/regulation${previewQuery}` : undefined}
            cardPayments={Boolean(tournament.cardPayments)}
            earlyBirdUntil={tournament.earlyBirdActive ? tournament.earlyBirdUntil : undefined}
            registrationDeadline={tournament.registrationDeadline || undefined}
            preview={Boolean(preview)}
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

/** A label, an optional chip or link on the right, then the answer. */
function InfoCard({ label, badge, children }: { label: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-pp-line bg-white p-4 shadow-[0_4px_16px_rgba(35,53,94,.05)] sm:p-5">
      <div className="mb-2 flex min-h-6 items-start justify-between gap-2">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-[.06em] text-pp-muted">{label}</h2>
        {badge && <span className="shrink-0">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

/** "Sunday, Jun 7, 2026", in the reader's language. */
function longDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { weekday: "long", month: "short", day: "numeric", year: "numeric" }).format(d);
}

/** "Jun 7". */
function shortDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(d);
}

/** Days from today to `iso` on the academy's calendar; 0 on the day itself,
    negative once it has passed. Worked in UTC so no time zone shifts a day. */
function daysUntil(iso: string): number {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(b) ? -1 : Math.round((b - a) / 86_400_000);
}
