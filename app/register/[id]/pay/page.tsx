/* Where the confirmation email's "Pay" link lands.
 *
 * The entry and its code are in the link itself (see `readPayLink`), so the
 * page is a shell and everything else happens in the browser, where the code
 * can be read from after the `#` without it ever reaching a server log.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicShell } from "@/components/public/PublicShell";
import { PayEntry } from "./PayEntry";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("register");
  return {
    title: `${t("payPageTitle")} — JCA Chess Academy`,
    // A pay link is personal; it should never be indexed or unfurled.
    robots: { index: false, follow: false },
  };
}

export default async function PayPage() {
  const t = await getTranslations("register");
  return (
    <PublicShell title={t("payPageTitle")}>
      <PayEntry />
    </PublicShell>
  );
}
