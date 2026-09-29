/* Where the arrival reminder's link lands. The code is after the #, so the
 * page is a shell and the browser does the rest (see ArrivalAnswer). */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicShell } from "@/components/public/PublicShell";
import { ArrivalAnswer } from "./ArrivalAnswer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("arrival");
  return {
    title: `${t("pageTitle")} — JCA Chess Academy`,
    // A personal link: never indexed or unfurled.
    robots: { index: false, follow: false },
  };
}

export default async function ArrivalPage() {
  const t = await getTranslations("arrival");
  return (
    <PublicShell title={t("pageTitle")}>
      <ArrivalAnswer />
    </PublicShell>
  );
}
