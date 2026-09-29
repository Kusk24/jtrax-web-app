/* The foot of the public pages: how to reach the academy, as any website ends.
 *
 * A server component, fetched here rather than inside PublicShell because the
 * shell's card is also used from client components. The details are what an
 * admin typed in Settings → Academy contact; a field left empty is not shown,
 * and with none at all the footer is just the academy's name.
 */
import { getTranslations } from "next-intl/server";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

type Contact = {
  name?: string;
  phone?: string;
  email?: string;
  lineId?: string;
  facebook?: string;
  website?: string;
  address?: string;
  hours?: string;
};

async function fetchContact(): Promise<Contact> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/academy`, { next: { revalidate: 300 } });
    return res.ok ? ((await res.json()) as Contact) : {};
  } catch {
    return {};
  }
}

/** A typed web address, with the scheme added when it was left off. */
function href(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export async function SiteFooter() {
  const c = await fetchContact();
  const t = await getTranslations("footer");
  const name = c.name || "JCA Chess Academy";
  const line = c.lineId?.replace(/^@?/, "@");
  const reach = [
    c.phone && { label: t("phone"), value: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, "")}` },
    c.email && { label: t("email"), value: c.email, href: `mailto:${c.email}` },
    line && { label: t("line"), value: line, href: `https://line.me/R/ti/p/${encodeURIComponent(line)}` },
  ].filter(Boolean) as Array<{ label: string; value: string; href: string }>;
  const follow = [
    c.facebook && { label: t("facebook"), href: href(c.facebook) },
    c.website && { label: t("website"), href: href(c.website) },
  ].filter(Boolean) as Array<{ label: string; href: string }>;
  const link =
    "rounded underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <footer className="mt-8 bg-pp-navy text-[#c9d4ea]">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <p className="font-pp-display text-lg font-bold text-white">{name}</p>
          {c.address && <p className="whitespace-pre-line text-sm leading-relaxed">{c.address}</p>}
        </div>

        {reach.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{t("contactUs")}</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {reach.map((r) => (
                <li key={r.label}>
                  <span className="text-[#8fa3c9]">{r.label}: </span>
                  <a href={r.href} className={link}>
                    {r.value}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {c.hours && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{t("hours")}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed">{c.hours}</p>
          </div>
        )}

        {follow.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{t("followUs")}</p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {follow.map((f) => (
                <li key={f.label}>
                  <a href={f.href} target="_blank" rel="noopener noreferrer" className={link}>
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-5xl px-6 py-4 text-xs text-[#8fa3c9]">
          {t("rights", { year: new Date().getFullYear(), name })}
        </p>
      </div>
    </footer>
  );
}
