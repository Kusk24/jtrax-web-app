"use client";

/* A game against another student. The board is drawn from the move list the
   server confirmed, never from local optimism: the server is the referee, so
   showing a move before it is accepted would mean sometimes taking it back. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink, Loader2, Pause, Swords, Wifi, WifiOff } from "lucide-react";
import { ChessBoard } from "./ChessBoard";
import { ResultDialog } from "./ResultDialog";
import { CapturedTray } from "./CapturedTray";
import { Panel, actionBtn } from "./PlayShell";
import { useRoom } from "./useRoom";
import { capturedIn, gameFrom, pairedMoves } from "@/lib/chess-core";
import { clockAt, fmtClock, reasonKey, timeControlLabel } from "@/lib/live-games";
import { outcomeOf } from "@/lib/progress";

/** The screen the pupil opened this board from, and the way back to it. */
export type RoomOrigin = "play" | "challenge";

export function LiveGame({ roomId, from = "play" }: { roomId: string; from?: RoomOrigin }) {
  const t = useTranslations("play");
  const ts = useTranslations("st");
  const router = useRouter();
  const { room, moves, seat, connection, error, play, resign, draw, enter } = useRoom(roomId);
  const [moveError, setMoveError] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);

  /* Raised once when the room ends, and dismissible — a class game is often
     looked back over with a teacher standing there. `over` covers both ways a
     room ends: played out, or stopped from the console.
     Declared here rather than beside the render that uses it, because there
     are two early returns below and a hook cannot sit after one. */
  const over = room?.status === "Finished" || room?.status === "Cancelled";
  const [showResult, setShowResult] = useState(false);
  const announced = useRef(false);
  useEffect(() => {
    if (over && !announced.current) {
      announced.current = true;
      setShowResult(true);
    }
  }, [over]);

  const game = useMemo(() => gameFrom(moves.map((m) => m.uci)), [moves]);

  /* A rated game's clock ticks here between Lichess's reports, so the side to
     move sees their time going down rather than jumping once per move. */
  const ticking = Boolean(room?.clock) && room?.status === "Active";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);

  if (error) {
    return <Panel><p className="text-sm font-bold">{t(`error.${error}`)}</p></Panel>;
  }
  if (!room || !game) {
    return (
      <Panel className="flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm font-bold">{t("loading")}</span>
      </Panel>
    );
  }

  const orientation = seat === "Black" ? "b" : "w";
  const myTurn = room.status === "Active" && seat !== "" && room.turn === seat;
  const opponent = seat === "White" ? room.black : room.white;
  // The whole move: the board highlights both its squares and slides the
  // arriving piece in from the first.
  const lastMove = moves.length ? moves[moves.length - 1].uci : undefined;

  const captured = capturedIn(game);
  /* The board is drawn from the viewer's side, so whoever is at the top of it
     is the other player — and their tray belongs above the board, next to
     their name, the way it sits on any board they have seen before. */
  const topSide = orientation === "w" ? "b" : "w";
  const nameOf = (side: "w" | "b") =>
    (side === "w" ? room.white : room.black)?.displayName ?? t("emptySeat");
  const trayFor = (side: "w" | "b") => (side === "w" ? captured.byWhite : captured.byBlack);

  const clock = clockAt(room.clock, room.turn, room.status === "Active", now);
  /* How it ended, in words — "" when it is not an ending we can name. */
  const reason = (() => {
    const key = reasonKey(room.resultReason);
    return key && t.has(`reason.${key}`) ? t(`reason.${key}`) : "";
  })();
  const opponentColour = seat === "White" ? "Black" : seat === "Black" ? "White" : "";
  const iEntered = seat === "White" ? room.whiteEntered : seat === "Black" ? room.blackEntered : false;
  const tc = timeControlLabel(room.timeControl);

  /* A name, what that player has taken and — on a rated game — their clock,
     sized to the board above or below it. */
  const playerLine = (side: "w" | "b") => {
    const ms = clock ? (side === "w" ? clock.white : clock.black) : null;
    const running = room.status === "Active" && room.turn === (side === "w" ? "White" : "Black");
    return (
      <div className="flex w-full items-center justify-between gap-2 px-1">
        <span className="truncate text-[12px] font-bold">{nameOf(side)}</span>
        <span className="flex items-center gap-2">
          <CapturedTray side={side} pieces={trayFor(side)} advantage={captured.advantage} />
          {ms !== null && (
            <span
              aria-label={t("clock", { name: nameOf(side) })}
              className={`rounded-lg px-2 py-0.5 font-mono text-[13px] font-bold tabular-nums ${
                running ? "bg-[#10264d] text-white" : "bg-sv-paper text-sv-ink"
              } ${ms < 10_000 ? "!bg-[rgb(176,63,58)] !text-white" : ""}`}
            >
              {fmtClock(ms)}
            </span>
          )}
        </span>
      </div>
    );
  };

  async function onMove(uci: string) {
    setMoveError("");
    const failure = await play(uci);
    if (failure) setMoveError(failure);
  }

  /* A wide screen puts the board on the left and the game's panels in a
     column beside it; a phone keeps the old order — who you are playing,
     the board, then the controls. */
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-1">
      {/* Who you are playing, and whether the stream is actually live. */}
      <Panel className="flex items-center justify-between !p-3">
        <span className="flex flex-col">
          <span className="text-[13px] font-bold">
            {opponent ? opponent.displayName : t("waitingForOpponent")}
          </span>
          <span className="text-[11px] text-pp-muted">
            {t(`seat.${seat || "watching"}`)}
            {tc ? ` · ${t("timeControl", { tc })}` : ""}
          </span>
        </span>
        <span
          title={t(`connection.${connection}`)}
          className="flex items-center gap-1 text-[11px] font-bold text-pp-muted"
        >
          {connection === "live" ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {t(`connection.${connection}`)}
        </span>
      </Panel>

      {/* Whether this game counts. Shown while it is being played, because a
          game that has stopped counting is something the players need to know
          now rather than afterwards. */}
      {room.lichessRated && (
        <Panel className="!p-3">
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold">
            <Swords className="size-3.5" />
            {t("rated.on")}
          </p>
          {room.lichessGameId && (
            <a
              href={`https://lichess.org/${room.lichessGameId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-[11.5px] font-bold underline text-pp-muted"
            >
              {t("rated.viewOnLichess")} <ExternalLink className="size-3" />
            </a>
          )}
        </Panel>
      )}

      {!room.lichessRated && room.lichessDetachedReason && (
        <Panel className="!p-3">
          <p className="text-[12.5px] font-bold text-[rgb(176,96,40)]">
            {t(`rated.detached.${room.lichessDetachedReason}`)}
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-pp-muted">{t("rated.detachedHint")}</p>
        </Panel>
      )}

      {/* A game the office set up: both seats are taken and it waits for the
          two players to sit down. One with an empty seat still needs its code
          handed to whoever takes it. */}
      {/* Paused by the teacher. The board can be looked at, not played. */}
      {room.stopped && (
        <Panel className="text-center !border-[#f3dda9] !bg-[#fff8e8]">
          <p className="flex items-center justify-center gap-1.5 text-[15px] font-bold text-[#7a5200]">
            <Pause className="size-4" strokeWidth={2.4} />
            {t("room.onHoldTitle")}
          </p>
          <p className="mt-1 text-[11.5px] leading-snug text-[#8a6a28]">{t("room.onHoldBody")}</p>
        </Panel>
      )}
      {room.status === "Open" && !room.stopped && seat !== "" && opponent && !iEntered && (
        <Panel className="text-center">
          <p className="text-[15px] font-bold">
            {t(moves.length > 0 ? "room.continueTitle" : "room.enterTitle", { name: opponent.displayName })}
          </p>
          <p className="mt-1 text-[11.5px] text-pp-muted">
            {t(`seat.${seat}`)}
            {tc ? ` · ${t("timeControl", { tc })}` : ""}
          </p>
          <p className="mt-1 text-[11.5px] text-pp-muted">
            {t(moves.length > 0 ? "room.continueBody" : "room.enterBody")}
          </p>
          <button onClick={() => void enter()} className={`${actionBtn} mt-3 w-full py-3 text-sm`}>
            {t("room.enter")}
          </button>
        </Panel>
      )}
      {room.status === "Open" && !room.stopped && seat !== "" && opponent && iEntered && (
        <Panel className="flex items-center justify-center gap-2 text-center">
          <Loader2 className="size-4 animate-spin" />
          <p role="status" className="text-[13px] font-bold">{t("room.waitingFor", { name: opponent.displayName })}</p>
        </Panel>
      )}
      {room.status === "Open" && !opponent && (
        <Panel className="text-center">
          <p className="text-[13px] font-bold">{t("shareCode")}</p>
          <p className="mt-1.5 font-mono text-[30px] font-bold tracking-[0.3em]">{room.code}</p>
        </Panel>
      )}

      </div>

      <div className="mx-auto flex w-full max-w-[596px] flex-col items-stretch gap-1.5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        {playerLine(topSide)}
        <ChessBoard
          game={game}
          orientation={orientation}
          canMove={myTurn}
          onMove={onMove}
          lastMove={lastMove}
        />
        {playerLine(orientation)}
      </div>

      {over && showResult && (
        <ResultDialog
          title={
            room.status === "Cancelled"
              ? t("cancelled")
              : seat && room.result
                ? ts(`resultTitle.${outcomeOf(room.result, seat === "White" ? "white" : "black")}`)
                : t(`result.${room.result === "1/2-1/2" ? "draw" : room.result === "1-0" ? "whiteWon" : "blackWon"}`)
          }
          detail={room.status === "Finished" && reason ? t("byReason", { reason }) : undefined}
          /* For a player, their own result and what the game earned; a
             watcher sees only who won. */
          outcome={room.status === "Finished" && seat ? outcomeOf(room.result, seat === "White" ? "white" : "black") : null}
          facts={
            seat
              ? [
                  { label: ts("opponent"), value: opponent?.displayName ?? "—" },
                  { label: ts("youPlayed"), value: ts(seat === "White" ? "side.white" : "side.black") },
                  { label: ts("timeControl"), value: tc || ts("untimed") },
                  { label: ts("when"), value: new Date().toLocaleDateString([], { month: "short", day: "numeric" }) },
                ]
              : undefined
          }
          /* Nothing to restart here, so the way on is back to the screen the
             board was opened from: Play for a class game, Challenge for a
             game with a friend, where the next invitation is. Named for where
             it goes: with both buttons reading "Back" the dialog had two doors
             and one name. */
          primaryLabel={t(from === "challenge" ? "backToChallenge" : "backToPlay")}
          onPrimary={() => router.push(`/student/${from}`)}
          onClose={() => setShowResult(false)}
        />
      )}

      <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-2">
      <Panel className="!py-2.5 text-center">
        {room.status === "Finished" ? (
          <p className="text-[13px] font-bold">
            {t(`result.${room.result === "1/2-1/2" ? "draw" : room.result === "1-0" ? "whiteWon" : "blackWon"}`)}
            {reason ? ` — ${reason}` : ""}
          </p>
        ) : room.status === "Cancelled" ? (
          <p className="text-[13px] font-bold">{t("cancelled")}</p>
        ) : (
          <p className="text-[13px] font-bold">
            {room.stopped
              ? t("onHold")
              : myTurn
                ? t("yourMove")
                : room.status === "Open"
                  ? t("waitingForOpponent")
                  : t("theirMove")}
          </p>
        )}
        {moveError && <p className="mt-1 text-[11px] font-bold text-[rgb(160,60,60)]">{t(`error.${moveError}`)}</p>}
      </Panel>

      {moves.length > 0 && (
        <Panel className="max-h-28 overflow-y-auto !py-2.5">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px]">
            {pairedMoves(moves.map((m) => m.san)).map((pair) => (
              <div key={pair.no} className="contents">
                <span className="opacity-50">{pair.no}.</span>
                <span>{pair.white}</span>
                <span>{pair.black ?? ""}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* A draw offer standing: the other player answers it here, and the one
          who offered is told they are waiting rather than left wondering. */}
      {room.status === "Active" && seat !== "" && room.drawOffer === opponentColour && (
        <Panel className="!p-3 text-center">
          <p className="text-[13px] font-bold">{t("draw.incoming", { name: opponent?.displayName ?? "" })}</p>
          <div className="mt-2.5 flex gap-2">
            <button onClick={() => void draw("accept")} className={`${actionBtn} flex-1 py-2.5 text-sm`}>
              {t("draw.accept")}
            </button>
            <button
              onClick={() => void draw("decline")}
              className="flex-1 py-2.5 cursor-pointer rounded-full border border-pp-line bg-pp-card text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft"
            >
              {t("draw.decline")}
            </button>
          </div>
        </Panel>
      )}
      {room.status === "Active" && seat !== "" && room.drawOffer === seat && (
        <p role="status" className="text-center text-[12px] font-bold text-pp-muted">
          {t("draw.offered", { name: opponent?.displayName ?? "" })}
        </p>
      )}

      {room.status === "Active" && seat !== "" && (
        confirmResign ? (
          <div className="flex gap-2">
            <button onClick={() => void resign()} className={`${actionBtn} flex-1 py-3 text-sm`}>
              {t("resignConfirm")}
            </button>
            <button
              onClick={() => setConfirmResign(false)}
              className="flex-1 py-3 cursor-pointer rounded-full border border-pp-line bg-pp-card text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft"
            >
              {t("keepPlaying")}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {!room.drawOffer && (
              <button
                onClick={() => void draw("offer")}
                className="flex-1 py-3 cursor-pointer rounded-full border border-pp-line bg-pp-card text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft"
              >
                {t("draw.offer")}
              </button>
            )}
            <button
              onClick={() => setConfirmResign(true)}
              className="flex-1 py-3 cursor-pointer rounded-full border border-pp-line bg-pp-card text-[14px] font-semibold text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft"
            >
              {t("resign")}
            </button>
          </div>
        )
      )}
      </div>
    </div>
  );
}
