"use client";

/* A game against the computer. Entirely local: no room, no API call, no record
   kept. Losing to the computer in private is the point — it is practice, not a
   result the academy reports on.

   Three opponents, and they are three different models rather than one engine
   turned down — see useAiOpponent.ts for why that distinction matters. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "./ChessBoard";
import { CapturedTray } from "./CapturedTray";
import { Panel, actionBtn } from "./PlayShell";
import { OPPONENTS, useAiOpponent, type Opponent } from "./useAiOpponent";
import { capturedIn, endingOf, gameFrom, pairedMoves, type Ending } from "@/lib/chess-core";

export function AiGame() {
  const t = useTranslations("play");

  const [opponent, setOpponent] = useState<Opponent>("novice");
  const { ready, failed, loading, bestMove } = useAiOpponent(opponent);
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
    // Each opponent wants the position in its own terms: Stockfish takes UCI,
    // the novice model reads the game as PGN text, Maia-2 takes a FEN.
    void bestMove(moves, game.history(), game.fen()).then((uci) => {
      if (mine !== generation.current) return; // a restart happened mid-think
      setThinking(false);
      if (uci) sync([...moves, uci]);
    });
  }, [ready, ending, game, moves, thinking, bestMove, sync]);

  const captured = capturedIn(game);

  return (
    <div className="flex flex-col gap-3">
      <Panel className="!p-3">
        <p className="mb-2 text-[13px] font-bold">{t("opponent")}</p>
        <div className="flex gap-1.5">
          {OPPONENTS.map((o) => (
            <button
              key={o}
              onClick={() => setOpponent(o)}
              aria-pressed={opponent === o}
              /* min-h-11 is the 44px touch minimum. The selected state is the
                 navy fill rather than --color-sv-gold, which despite its name
                 is rgb(232,239,249) and sits at 1.06:1 against sv-paper — you
                 could not tell which opponent you had chosen. */
              className={`min-h-11 flex-1 cursor-pointer rounded-xl border-none px-2 py-2 text-[13px] font-bold transition-colors ${
                opponent === o
                  ? "bg-sv-ink text-sv-paper"
                  : "bg-sv-paper text-sv-ink shadow-[inset_0_0_0_1.5px_rgb(216,226,240)]"
              }`}
            >
              {t(`opponentName.${o}`)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-sv-body">
          {t(`opponentHint.${opponent}`)}
        </p>
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
        {failed ? (
          <p className="text-[13px] font-bold">
            {opponent === "expert" ? t("error.engine") : t("modelFailed")}
          </p>
        ) : !ready ? (
          <p className="flex items-center justify-center gap-2 text-[13px] font-bold">
            <Loader2 className="size-3.5 animate-spin" />
            {/* The two trained models are a 26 MB and a 47 MB download, so the
                first wait is longer than waking a worker and says so. */}
            {loading ? t("modelLoading") : t("engineLoading")}
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

      <button onClick={reset} className={`${actionBtn} py-3 text-sm`}>
        {t("newGame")}
      </button>
    </div>
  );
}
