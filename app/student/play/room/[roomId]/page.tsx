import { getTranslations } from "next-intl/server";
import { PlayShell } from "@/components/game/PlayShell";
import { LiveGame } from "@/components/game/LiveGame";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const t = await getTranslations("play");
  return (
    <PlayShell title={t("vsFriend")} back="/student/play">
      <LiveGame roomId={roomId} />
    </PlayShell>
  );
}
