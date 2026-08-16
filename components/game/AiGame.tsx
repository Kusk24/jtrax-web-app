"use client";

/* A game against Stockfish. Entirely local: no room, no API call, no record
   kept. Losing to the computer in private is the point — it is practice, not a
   result the academy reports on. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "./ChessBoard";
import { CapturedTray } from "./CapturedTray";
import { Panel, peachBtn } from "./PlayShell";
import { useStockfish, type Level } from "./useStockfish";
import { capturedIn, endingOf, gameFrom, pairedMoves, type Ending } from "@/lib/chess-core";

const LEVELS: Level[] = [1, 2, 3, 4, 5];

export function AiGame() {
  const t = useTranslations("play");
  const { ready, failed, bestMove } = useStockfish();

  const [level, setLevel] = useState<Level>(2);
  const [moves, setMoves] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [ending, setEnding] = useState<Ending>(null);
  // Guards against a reply arriving for a game the player already restarted.
  const generation = useRef(0);

  const sync = useCallback((next: string[]) => {
    const replayed = gameFrom(next);
    if (!replayed) return;
    setMoves(next);
    setGame(replayed);
    setEnding(endingOf(replayed));
  }, []);

  const reset = () => {
    generation.current += 1;
    setThinking(false);
    sync([]);
  };

  function onMove(uci: string) {
    if (thinking || ending) return;
    sync([...moves, uci]);
  }

  /* The engine answers whenever it is black's turn and the game is live. */
  useEffect(() => {
    if (!ready || ending || game.turn() !== "b" || thinking) return;
    const mine = generation.current;
    setThinking(true);
    void bestMove(moves, level).then((uci) => {
      if (mine !== generation.current) return; // a restart happened mid-think
      setThinking(false);
      if (uci) sync([...moves, uci]);
    });
  }, [ready, ending, game, moves, level, thinking, bestMove, sync]);

  if (failed) {
    return <Panel><p className="text-sm font-bold">{t("error.engine")}</p></Panel>;
  }

  const captured = capturedIn(game);

  return (
    <div className="flex flex-col gap-3">
      <Panel className="!p-3">
        <p className="mb-2 text-[13px] font-bold">{t("level")}</p>
        <div className="flex gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              className={`flex-1 cursor-pointer rounded-xl border-none py-2 text-sm font-bold text-sv-brown ${
                level === l
                  ? "bg-sv-gold shadow-[inset_0_0_0_1.5px_rgb(208,158,97)]"
                  : "bg-sv-paper shadow-[inset_0_0_0_1.5px_rgba(208,158,97,0.4)]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-snug opacity-70">{t(`levelHint.${level}`)}</p>
      </Panel>

      {/* You always play White here, so the engine sits at the top of the board. */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex w-[328px] items-center justify-between gap-2 px-1">
          <span className="text-[12px] font-bold">{t("computer")}</span>
          <CapturedTray side="b" pieces={captured.byBlack} advantage={captured.advantage} />
        </div>
        <ChessBoard
          game={game}
          orientation="w"
          canMove={ready && !thinking && !ending && game.turn() === "w"}
          onMove={onMove}
          lastMove={moves.length ? moves[moves.length - 1].slice(2, 4) : undefined}
        />
        <div className="flex w-[328px] items-center justify-between gap-2 px-1">
          <span className="text-[12px] font-bold">{t("you")}</span>
          <CapturedTray side="w" pieces={captured.byWhite} advantage={captured.advantage} />
        </div>
      </div>

      <Panel className="!py-2.5 text-center">
        {!ready ? (
          <p className="flex items-center justify-center gap-2 text-[13px] font-bold">
            <Loader2 className="size-3.5 animate-spin" />
            {t("engineLoading")}
          </p>
        ) : ending ? (
          <p className="text-[13px] font-bold">
            {t(`result.${ending.result === "1/2-1/2" ? "draw" : ending.result === "1-0" ? "youWon" : "youLost"}`)}
            {` — ${t(`reason.${ending.reason}`)}`}
          </p>
        ) : (
          <p className="text-[13px] font-bold">{thinking ? t("thinking") : t("yourMove")}</p>
        )}
      </Panel>

      {moves.length > 0 && (
        <Panel className="max-h-24 overflow-y-auto !py-2.5">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 font-mono text-[11px]">
            {pairedMoves(game.history()).map((pair) => (
              <div key={pair.no} className="contents">
                <span className="opacity-50">{pair.no}.</span>
                <span>{pair.white}</span>
                <span>{pair.black ?? ""}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <button onClick={reset} className={`${peachBtn} py-3 text-sm`}>
        {t("newGame")}
      </button>
    </div>
  );
}
