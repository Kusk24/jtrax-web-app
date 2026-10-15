/**
 * The privacy notice (PDPA s.23): what the academy collects, why, who sees it,
 * how long it is kept and how to use your rights. Public, because it has to be
 * readable before anyone signs up; every consent checkbox links here.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicShell, PublicCard } from "@/components/public/PublicShell";
import { SiteFooter } from "@/components/public/SiteFooter";
import { fetchContact } from "@/lib/academy-contact-server";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy";

const SECTIONS = ["what", "why", "children", "sharing", "keep", "rights", "security"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacy");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const contact = await fetchContact();
  return (
    <PublicShell footer={<SiteFooter />} title={t("title")} subtitle={t("version", { version: PRIVACY_NOTICE_VERSION })}>
      <div className="flex flex-col gap-4">
        <p role="note" className="rounded-xl bg-pp-amber-soft px-4 py-3 text-[13px] font-semibold text-pp-ink">
          {t("draft")}
        </p>
        <PublicCard>
          <p className="text-[14px] leading-relaxed text-pp-ink">{t("intro")}</p>
        </PublicCard>
        {SECTIONS.map((key) => (
          <PublicCard key={key}>
            <h2 className="mb-2 font-pp-display text-[16px] font-bold text-pp-navy">{t(`${key}Title`)}</h2>
            <p className="text-[14px] leading-relaxed text-pp-ink">{t(key)}</p>
          </PublicCard>
        ))}
        <PublicCard>
          <h2 className="mb-2 font-pp-display text-[16px] font-bold text-pp-navy">{t("contactTitle")}</h2>
          <p className="text-[14px] leading-relaxed text-pp-ink">{t("contact")}</p>
          <ul className="mt-2 flex flex-col gap-1 text-[14px]">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="font-semibold text-pp-blue underline-offset-4 hover:underline">
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phones.map((p) => (
              <li key={p}>
                <a href={`tel:${p.replace(/[^\d+]/g, "")}`} className="font-semibold text-pp-blue underline-offset-4 hover:underline">
                  {p}
                </a>
              </li>
            ))}
          </ul>
        </PublicCard>
      </div>
    </PublicShell>
  );
}
