"use client";

/* A game against another student. The board is drawn from the move list the
   server confirmed, never from local optimism: the server is the referee, so
   showing a move before it is accepted would mean sometimes taking it back. */
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Loader2, Swords, Wifi, WifiOff } from "lucide-react";
import { ChessBoard } from "./ChessBoard";
import { CapturedTray } from "./CapturedTray";
import { Panel, actionBtn } from "./PlayShell";
import { useRoom } from "./useRoom";
import { capturedIn, gameFrom, pairedMoves } from "@/lib/chess-core";

export function LiveGame({ roomId }: { roomId: string }) {
  const t = useTranslations("play");
  const { room, moves, seat, connection, error, play, resign } = useRoom(roomId);
  const [moveError, setMoveError] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);

  const game = useMemo(() => gameFrom(moves.map((m) => m.uci)), [moves]);

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
  const lastMove = moves.length ? moves[moves.length - 1].uci.slice(2, 4) : undefined;

  const captured = capturedIn(game);
  /* The board is drawn from the viewer's side, so whoever is at the top of it
     is the other player — and their tray belongs above the board, next to
     their name, the way it sits on any board they have seen before. */
  const topSide = orientation === "w" ? "b" : "w";
  const nameOf = (side: "w" | "b") =>
    (side === "w" ? room.white : room.black)?.displayName ?? t("emptySeat");
  const trayFor = (side: "w" | "b") => (side === "w" ? captured.byWhite : captured.byBlack);

  /* A name and what that player has taken, sized to the board above or below it. */
  const playerLine = (side: "w" | "b") => (
    <div className="flex w-[328px] items-center justify-between gap-2 px-1">
      <span className="truncate text-[12px] font-bold">{nameOf(side)}</span>
      <CapturedTray side={side} pieces={trayFor(side)} advantage={captured.advantage} />
    </div>
  );

  async function onMove(uci: string) {
    setMoveError("");
    const failure = await play(uci);
    if (failure) setMoveError(failure);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Who you are playing, and whether the stream is actually live. */}
      <Panel className="flex items-center justify-between !p-3">
        <span className="flex flex-col">
          <span className="text-[13px] font-bold">
            {opponent ? opponent.displayName : t("waitingForOpponent")}
          </span>
          <span className="text-[11px] text-sv-body">{t(`seat.${seat || "watching"}`)}</span>
        </span>
        <span
          title={t(`connection.${connection}`)}
          className="flex items-center gap-1 text-[11px] font-bold text-sv-body"
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
              className="mt-1 flex items-center gap-1 text-[11.5px] font-bold underline text-sv-body"
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
          <p className="mt-1 text-[11.5px] leading-snug text-sv-body">{t("rated.detachedHint")}</p>
        </Panel>
      )}

      {room.status === "Open" && (
        <Panel className="text-center">
          <p className="text-[13px] font-bold">{t("shareCode")}</p>
          <p className="mt-1.5 font-mono text-[30px] font-bold tracking-[0.3em]">{room.code}</p>
        </Panel>
      )}

      <div className="flex flex-col items-center gap-1.5">
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

      <Panel className="!py-2.5 text-center">
        {room.status === "Finished" ? (
          <p className="text-[13px] font-bold">
            {t(`result.${room.result === "1/2-1/2" ? "draw" : room.result === "1-0" ? "whiteWon" : "blackWon"}`)}
            {room.resultReason ? ` — ${t(`reason.${room.resultReason}`)}` : ""}
          </p>
        ) : room.status === "Cancelled" ? (
          <p className="text-[13px] font-bold">{t("cancelled")}</p>
        ) : (
          <p className="text-[13px] font-bold">
            {myTurn ? t("yourMove") : room.status === "Open" ? t("waitingForOpponent") : t("theirMove")}
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

      {room.status === "Active" && seat !== "" && (
        confirmResign ? (
          <div className="flex gap-2">
            <button onClick={() => void resign()} className={`${actionBtn} flex-1 py-3 text-sm`}>
              {t("resignConfirm")}
            </button>
            <button
              onClick={() => setConfirmResign(false)}
              className="flex-1 cursor-pointer rounded-[20px] border-none bg-sv-cream py-3 text-sm font-bold text-sv-ink shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]"
            >
              {t("keepPlaying")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmResign(true)}
            className="cursor-pointer rounded-[20px] border-none bg-sv-cream py-3 text-sm font-bold text-sv-ink shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]"
          >
            {t("resign")}
          </button>
        )
      )}
    </div>
  );
}
