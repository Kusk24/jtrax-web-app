"use client";

/* The games waiting for this pupil — on the home screen and on Play.

   When the teacher pairs two students, the game arrives here as an
   invitation: who they are playing, which colour, the time control. Nothing
   starts until the pupil presses Enter; the game is in play once both have,
   so neither child's clock runs while the other is still across the room.
   A game the teacher paused shows as Paused: the pupil can open it and
   look, but nothing moves until the teacher resumes it.
   Games a friend accepted from Challenge show here too, so every game still
   to finish is in one place.

   Polled, not streamed: this list changes a few times a lesson, and the board
   itself streams once it is open. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, DoorOpen, Hourglass, Pause, Swords } from "lucide-react";
import { stepOf, timeControlLabel, unfinished, type MyGame } from "@/lib/live-games";

const POLL_MS = 8000;

export function MyGames({ myAccountId }: { myAccountId: string }) {
  const t = useTranslations("play");
  const router = useRouter();
  const [games, setGames] = useState<MyGame[]>([]);
  const [entering, setEntering] = useState("");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/game-rooms", { cache: "no-store" });
        if (!res.ok) return;
        const list = (await res.json()) as MyGame[];
        if (alive) setGames(unfinished(list));
      } catch {
        /* Offline for a moment; the next poll catches up. */
      }
    };
    void load();
    const id = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (games.length === 0) return null;

  async function enter(id: string) {
    setEntering(id);
    try {
      await fetch(`/api/game-rooms/${id}/enter`, { method: "POST" });
    } finally {
      router.push(`/student/play/room/${id}`);
    }
  }

  return (
    <section aria-labelledby="my-games" className="flex flex-col gap-2.5">
      <h2 id="my-games" className="text-[14px] font-semibold text-pp-ink">{t("myGames.title")}</h2>
      {games.map((g) => {
        const side = g.white?.userAccountId === myAccountId ? "White" : "Black";
        const opponent = side === "White" ? g.black : g.white;
        const step = stepOf(g, myAccountId);
        const myTurn = g.status === "Active" && g.turn === side;
        const tc = timeControlLabel(g.timeControl);
        const details = [
          t("myGames.youPlay", { side: t(`side.${side}`) }),
          tc ? t("timeControl", { tc }) : "",
          g.lichessRated ? t("myGames.rated") : "",
        ].filter(Boolean);

        /* An invitation is the one thing on the screen asking for a tap, so it
           is the loud card: who, which colour, and one button. */
        if (step === "invited") {
          return (
            <div
              key={g.gameRoomId}
              className="rounded-2xl border-[1.5px] border-[#bcd3fb] bg-pp-soft p-[18px]"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-pp-blue">
                {g.moveCount ? t("myGames.continueTitle") : t("myGames.invited")}
              </p>
              <p className="mt-1 text-[16px] font-bold leading-snug text-pp-ink">
                {t("myGames.competing", { name: opponent?.displayName ?? "" })}
              </p>
              <p className="mt-1 text-[11.5px] text-pp-muted">{details.join(" · ")}</p>
              {g.label && <p className="mt-0.5 text-[11px] text-pp-muted">{g.label}</p>}
              <button
                type="button"
                disabled={entering === g.gameRoomId}
                onClick={() => void enter(g.gameRoomId)}
                className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center gap-[7px] rounded-full border-none bg-pp-blue text-[14px] font-semibold text-white transition-colors hover:bg-pp-deep disabled:opacity-70"
              >
                <DoorOpen className="size-4" strokeWidth={2.4} />
                {entering === g.gameRoomId ? t("myGames.entering") : t("myGames.enter")}
              </button>
            </div>
          );
        }

        return (
          <button
            key={g.gameRoomId}
            type="button"
            onClick={() => router.push(`/student/play/room/${g.gameRoomId}`)}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-pp-blue hover:bg-pp-soft hover:shadow-[0_8px_24px_rgba(36,59,99,.14)] ${
              myTurn ? "border-[#bfe4d8] bg-[#ebfaf5]" : "border-pp-line bg-pp-card"
            }`}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ff] text-pp-ink">
              {step === "onHold" ? (
                <Pause className="size-5" strokeWidth={2.2} />
              ) : step === "waitingForOpponent" ? (
                <Hourglass className="size-5" strokeWidth={2.2} />
              ) : (
                <Swords className="size-5" strokeWidth={2.2} />
              )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[14px] font-bold text-pp-ink">
                {t("myGames.vs", { name: opponent?.displayName ?? "" })}
              </span>
              <span className="text-[10.5px] text-pp-muted">
                {step === "onHold"
                  ? t("myGames.onHoldBody")
                  : step === "waitingForOpponent"
                    ? t("myGames.waitingFor", { name: opponent?.displayName ?? "" })
                    : `${details[0]} · ${myTurn ? t("myGames.yourTurn") : t("myGames.theirTurn")}`}
              </span>
            </span>
            {step === "onHold" ? (
              <span className="shrink-0 rounded-full bg-[#fff4dc] px-3 py-1.5 text-[11.5px] font-bold text-[#9a6800]">
                {t("myGames.onHold")}
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-pp-ink">
                {t("myGames.open")}
                <ChevronRight className="size-4" strokeWidth={2.2} />
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}
