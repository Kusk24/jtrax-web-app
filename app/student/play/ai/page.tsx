import { getTranslations } from "next-intl/server";
import { PlayShell } from "@/components/game/PlayShell";
import { AiGame } from "@/components/game/AiGame";

export default async function AiPage() {
  const t = await getTranslations("play");
  return (
    <PlayShell title={t("vsComputer")} back="/student/play">
      <AiGame />
    </PlayShell>
  );
}
