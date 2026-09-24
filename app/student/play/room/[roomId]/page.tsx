import { getTranslations } from "next-intl/server";
import { PlayShell } from "@/components/game/PlayShell";
import { LiveGame } from "@/components/game/LiveGame";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { roomId } = await params;
  /* A board is reached from Play (a class game, by code) or from Challenge (a
     game with a friend), and both ways out lead back to where the pupil came
     from. The Challenge screen says so in the link. */
  const from = (await searchParams).from === "challenge" ? "challenge" : "play";
  const t = await getTranslations("play");
  return (
    <PlayShell title={t("classGame")} back={`/student/${from}`}>
      <LiveGame roomId={roomId} from={from} />
    </PlayShell>
  );
}
