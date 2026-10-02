import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Bot, ChessKing, ChessKnight, ChessPawn, DoorOpen } from "lucide-react";
import { PlayShell } from "@/components/game/PlayShell";
import { MyGames } from "@/components/game/MyGames";
import { JoinForm } from "@/components/game/JoinForm";
import { ChallengePanel } from "@/app/student/challenge/ChallengeScreen";
import { SESSION_COOKIE, fetchMe } from "@/lib/session";
import { GameModeCard } from "@/components/student/GameModeCard";
import { RecentGames } from "@/components/student/RecentGames";
import { FriendPawns } from "@/components/student/FriendPawns";

/* Games: every way to play, drawn to the student reference design.
 *
 * The games already under way come first, because somebody may be waiting on
 * this pupil's move. Then the three ways to start one, each a card that opens
 * to what it holds: against the computer (three levels), against another
 * student (the challenge panel), or at a board by its code. Recent games close
 * the page, with the way into the full history. */
const LEVELS = [
  { key: "novice", level: "beginner", icon: ChessPawn, tone: "border-pp-green-soft hover:bg-pp-green-soft", tile: "bg-pp-green-soft text-pp-green", label: "text-pp-green" },
  { key: "strong", level: "intermediate", icon: ChessKnight, tone: "border-pp-soft hover:bg-pp-soft", tile: "bg-pp-soft text-pp-blue", label: "text-pp-blue" },
  { key: "expert", level: "advanced", icon: ChessKing, tone: "border-pp-amber-soft hover:bg-pp-amber-soft", tile: "bg-pp-amber-soft text-pp-amber", label: "text-pp-amber" },
] as const;

export default async function PlayPage() {
  const t3 = await getTranslations("sv3");
  const me = await fetchMe((await cookies()).get(SESSION_COOKIE)?.value);
  if (!me?.studentId) redirect("/student");

  return (
    <PlayShell title={t3("games")} nav>

      {/* Draws nothing when there are none. */}
      {me.userAccountId && <MyGames myAccountId={me.userAccountId} />}

      <div className="flex flex-col gap-2">
        <GameModeCard
          id="computer"
          tone="ai"
          title={t3("playVsAi")}
          art={<Bot className="size-6 text-pp-blue" strokeWidth={2} />}
        >
          {/* Three robots side by side, named by level, in the puzzle list's level colours. */}
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map(({ key, level, icon: Icon, tone, tile, label }) => (
              <Link
                key={key}
                href={`/student/play/ai?opponent=${key}`}
                className={`flex flex-col items-center gap-1.5 rounded-lg border bg-pp-card px-2 py-3 text-center transition-colors ${tone}`}
              >
                <span className={`flex size-10 items-center justify-center rounded-lg ${tile}`} aria-hidden>
                  <Icon className="size-5" strokeWidth={1.9} />
                </span>
                <span className={`text-[13px] font-semibold ${label}`}>{t3(`level.${level}`)}</span>
              </Link>
            ))}
          </div>
        </GameModeCard>

        <GameModeCard
          id="challenge"
          tone="friend"
          title={t3("playWithFriend")}
          art={<FriendPawns size="size-7" />}
        >
          <ChallengePanel myStudentId={me.studentId} />
        </GameModeCard>

        <GameModeCard
          id="room"
          tone="room"
          title={t3("joinRoom")}
          art={<DoorOpen className="size-6 text-pp-green" strokeWidth={2} />}
        >
          <JoinForm />
        </GameModeCard>
      </div>

      <RecentGames studentId={me.studentId} />
    </PlayShell>
  );
}
