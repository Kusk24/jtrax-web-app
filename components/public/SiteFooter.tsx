/* The foot of the public pages: how to reach the academy, kept small.
 *
 * It sits under a registration or payment form, so it stays visually
 * secondary — the page's mist background, a hairline above, muted text —
 * rather than a dark band that competes with the form for attention.
 *
 * A server component, fetched here rather than inside PublicShell because the
 * shell's card is also used from client components. The details are what an
 * admin typed in Settings → Academy contact; a field left empty is not shown,
 * and with none at all the footer is just the academy's name.
 */
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { lineHref } from "@/lib/academy-contact";

const API_BASE = process.env.JTRAX_API_URL ?? "http://localhost:8790";

type Contact = {
  name?: string;
  phone?: string;
  email?: string;
  lineId?: string;
  facebook?: string;
  instagram?: string;
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

/** The address as people write it on a poster: no scheme, no trailing slash. */
function bare(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/** "02-853-9836 / 099-0156-156" is two numbers: each gets its own tel: link,
    or tapping it would dial both strung together. */
function phones(raw: string): string[] {
  return raw.split(/\s*[/,]\s*/).filter(Boolean);
}

export async function SiteFooter() {
  const c = await fetchContact();
  const t = await getTranslations("footer");
  const name = c.name || "JCA Chess Academy";
  const line = c.lineId ? lineHref(c.lineId) : "";
  const link =
    "rounded underline-offset-4 transition-colors hover:text-pp-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue";
  const web = [
    c.website && { label: bare(c.website), href: href(c.website) },
    c.facebook && { label: t("facebook"), href: href(c.facebook) },
    c.instagram && { label: t("instagram"), href: href(c.instagram) },
  ].filter(Boolean) as Array<{ label: string; href: string }>;
  /* One address per line — a branch each — then the opening hours. */
  const visit = [c.address, c.hours].filter(Boolean).join("\n");
  const hasContact = Boolean(c.phone || c.email || line || web.length);

  return (
    <footer className="border-t border-pp-line text-pp-sub">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 px-4 py-6 text-center text-[13px]">
        <div className="flex items-center gap-2">
          <Image src="/jca-logo.png" alt="" width={28} height={28} className="rounded-md object-contain" />
          <p className="font-pp-display text-sm font-bold uppercase tracking-[0.12em] text-pp-navy">{name}</p>
        </div>

        {hasContact && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold text-pp-ink">{t("needHelp")}</p>
            {c.phone && (
              <p>
                {phones(c.phone).map((p, i) => (
                  <span key={p}>
                    {i > 0 && " / "}
                    <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className={link}>
                      {p}
                    </a>
                  </span>
                ))}
              </p>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className={link}>
                {c.email}
              </a>
            )}
            {line && (
              <p>
                {t("line")}:{" "}
                <a
                  href={line}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium text-pp-blue ${link}`}
                >
                  {t("chatWithUs")}
                </a>
              </p>
            )}
            {web.length > 0 && (
              <p>
                {web.map((w, i) => (
                  <span key={w.href}>
                    {i > 0 && " · "}
                    <a href={w.href} target="_blank" rel="noopener noreferrer" className={link}>
                      {w.label}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        {visit && <p className="max-w-md whitespace-pre-line text-xs leading-relaxed">{visit}</p>}
        <p className="text-[11px]">{t("rights", { year: new Date().getFullYear(), name })}</p>
      </div>
    </footer>
  );
}
