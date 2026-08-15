import { getTranslations } from "next-intl/server";
import { PlayShell } from "@/components/game/PlayShell";
import { JoinForm } from "@/components/game/JoinForm";

export default async function JoinPage() {
  const t = await getTranslations("play");
  return (
    <PlayShell title={t("vsFriend")} back="/student/play">
      <JoinForm />
    </PlayShell>
  );
}
