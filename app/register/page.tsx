/* Every tournament currently open to the public.
 *
 * The per-event page is what a QR code leads to; this is what someone who heard
 * "the academy runs open tournaments" and went looking finds. Closed events are
 * absent rather than greyed out — the backend only serves open ones, and a list
 * of things you cannot do is not a useful page.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PublicShell, PublicCard } from "@/components/public/PublicShell";
import type { PublicTournament } from "@/lib/registration";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Open tournaments — JCA Chess Academy",
};

async function fetchOpen(): Promise<PublicTournament[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/tournaments`, { next: { revalidate } });
    if (!res.ok) return [];
    const data = (await res.json()) as { tournaments?: PublicTournament[] };
    return data.tournaments ?? [];
  } catch {
    // A cold or unreachable backend shows the empty state, not a crash: this is
    // a public page and a stack trace is never the right thing to show on one.
    return [];
  }
}

export default async function OpenTournaments() {
  const [t, locale, list] = await Promise.all([
    getTranslations("register"),
    getLocale(),
    fetchOpen(),
  ]);

  return (
    <PublicShell title={t("indexTitle")} subtitle={t("indexSub")}>
      {list.length === 0 ? (
        <PublicCard>
          <p className="py-6 text-center text-sm text-pp-muted">{t("indexEmpty")}</p>
        </PublicCard>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((x) => (
            <li key={x.id}>
              <Link
                href={`/register/${x.id}`}
                className="block rounded-2xl border border-pp-line bg-white p-5 shadow-[0_1px_2px_rgba(35,53,94,.04)] transition-colors duration-150 hover:border-pp-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-pp-display text-[17px] font-bold text-pp-navy">{x.name}</h2>
                  <span className="text-[15px] font-semibold text-pp-ink">{money(x.fee, locale)}</span>
                </div>
                <p className="mt-1 text-[13.5px] text-pp-muted">
                  {[
                    formatDate(x.startDate, locale),
                    x.venueName,
                    x.spotsLeft !== null ? t("placesLeftInline", { count: x.spotsLeft }) : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PublicShell>
  );
}

function formatDate(iso: string, locale: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function money(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "THB",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(amount);
}
