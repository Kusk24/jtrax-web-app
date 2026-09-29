import { getTranslations } from "next-intl/server";
import { Panel, PlayShell } from "@/components/game/PlayShell";
import { JoinForm } from "@/components/game/JoinForm";

export default async function JoinPage() {
  const t = await getTranslations("play");
  return (
    <PlayShell title={t("vsFriend")} back="/student/play">
      {/* On its own page the form gets the card Play gives it. */}
      <Panel>
        <JoinForm />
      </Panel>
    </PlayShell>
  );
}
