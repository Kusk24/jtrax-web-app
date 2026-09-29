import { getTranslations } from "next-intl/server";
import { PlayShell } from "@/components/game/PlayShell";
import { AiGame } from "@/components/game/AiGame";
import type { Opponent } from "@/components/game/useAiOpponent";

/* Listed here rather than imported: this is a server page, and a value from a
   "use client" module arrives as a client reference, not the array. */
const LEVELS: Opponent[] = ["novice", "strong", "expert"];

/* Play > Play the Computer links here with the level already chosen. */
export default async function AiPage({ searchParams }: { searchParams: Promise<{ opponent?: string }> }) {
  const t3 = await getTranslations("sv3");
  const wanted = (await searchParams).opponent;
  const initial = LEVELS.includes(wanted as Opponent) ? (wanted as Opponent) : "novice";
  return (
    <PlayShell title={t3("playVsAi")} back="/student/play" wide>
      <AiGame initialOpponent={initial} />
    </PlayShell>
  );
}
