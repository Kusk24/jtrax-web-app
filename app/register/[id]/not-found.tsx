/* What a registration link shows when the tournament is not taking entries
 * through it: registration closed by the organiser, a draft, or an id that
 * never existed. The API answers all three alike, so this page says the same
 * for each — it must not tell a visitor which ids are real — and gives the
 * academy's contacts instead of a bare 404.
 *
 * A tournament past its deadline or full still opens its own page, which says
 * so; this is only for the link that no longer leads to one.
 */
import { getTranslations } from "next-intl/server";
import { PublicShell, PublicCard } from "@/components/public/PublicShell";
import { SiteFooter } from "@/components/public/SiteFooter";
import { AcademyContacts } from "@/components/public/AcademyContacts";
import { fetchContact } from "./academy";

export default async function RegistrationNotOpen() {
  const [t, contact] = await Promise.all([getTranslations("register"), fetchContact()]);
  return (
    <PublicShell footer={<SiteFooter />} title={t("notOpenTitle")}>
      <PublicCard>
        <p className="text-sm font-semibold text-pp-amber">{t("notOpenBody")}</p>
        <div className="mt-4">
          <AcademyContacts contact={contact} />
        </div>
      </PublicCard>
    </PublicShell>
  );
}
