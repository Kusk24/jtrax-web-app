"use client";

/* A game against the computer. Entirely local: no room, no API call, no record
   kept. Losing to the computer in private is the point — it is practice, not a
   result the academy reports on.

   Three opponents, and they are three different models rather than one engine
   turned down — see useAiOpponent.ts for why that distinction matters. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Bot } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "./ChessBoard";
import { CapturedTray } from "./CapturedTray";
import { ResultDialog } from "./ResultDialog";
import { Panel, actionBtn } from "./PlayShell";
import { useAiOpponent, type Opponent } from "./useAiOpponent";
import { clearSavedAiGame, loadSavedAiGame, saveAiGame } from "@/lib/saved-ai-game";
import { capturedIn, endingOf, gameFrom, pairedMoves, type Ending } from "@/lib/chess-core";
import { recordSoloGame } from "@/lib/progress";

export function AiGame({ initialOpponent = "novice" }: { initialOpponent?: Opponent }) {
  const t = useTranslations("play");
  const t3 = useTranslations("sv3");
  const ts = useTranslations("st");

  /* Chosen on the Games page; this page plays that one robot. */
  const opponent = initialOpponent;
  const { ready, failed, loading, bestMove } = useAiOpponent(opponent);
  const [moves, setMoves] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [ending, setEnding] = useState<Ending>(null);
  /* Separate from `ending` so dismissing the dialog does not un-finish the
     game, and so a new game can raise it again. */
  const [showResult, setShowResult] = useState(false);
  // Guards against a reply arriving for a game the player already restarted.
  const generation = useRef(0);
  /* When this game's first move was made, and which game was last saved — so
     a finished game is recorded exactly once, and counts in History like any
     other game. */
  const startedAt = useRef<string | null>(null);
  const saved = useRef(-1);

  const sync = useCallback((next: string[]) => {
    const replayed = gameFrom(next);
    if (!replayed) return;
    setMoves(next);
    setGame(replayed);
    const over = endingOf(replayed);
    setEnding(over);
    setShowResult(!!over);
  }, []);

  const reset = () => {
    generation.current += 1;
    startedAt.current = null;
    setThinking(false);
    clearSavedAiGame();
    sync([]);
  };

  /* An unfinished game against this robot, left with the back button: picked
     up where it stopped. Restored after the first paint, so the server's page
     and the browser's agree. */
  useEffect(() => {
    const id = setTimeout(() => {
      const kept = loadSavedAiGame();
      if (!kept || kept.opponent !== opponent) return;
      startedAt.current = kept.startedAt;
      sync(kept.moves);
    }, 0);
    return () => clearTimeout(id);
  }, [opponent, sync]);

  /* Kept after every move, so leaving by any route keeps the game; a
     finished one is cleared — it is in History now. */
  useEffect(() => {
    if (ending) clearSavedAiGame();
    else if (moves.length > 0) saveAiGame({ opponent, moves, startedAt: startedAt.current });
  }, [moves, ending, opponent]);

  function onMove(uci: string) {
    if (thinking || ending) return;
    if (!startedAt.current) startedAt.current = new Date().toISOString().slice(0, 19).replace("T", " ");
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

  useEffect(() => {
    if (!ending || saved.current === generation.current || moves.length === 0) return;
    saved.current = generation.current;
    recordSoloGame({
      opponent,
      moves,
      result: ending.result,
      reason: ending.reason,
      startedAt: startedAt.current ?? undefined,
    })
      .catch(() => {
        /* Not saved (offline, or not a pupil's session): the game still
           happened on screen, it just is not in History. */
      });
  }, [ending, moves, opponent]);

  const captured = capturedIn(game);

  const resultKey = ending
    ? ending.result === "1/2-1/2"
      ? "draw"
      : ending.result === "1-0"
        ? "youWon"
        : "youLost"
    : null;

  /* Board on the left and everything about the game beside it on a wide
     screen; one column, board first, on a phone. */
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {ending && showResult && resultKey && (
        <ResultDialog
          title={t(`result.${resultKey}`)}
          detail={t("byReason", { reason: t(`reason.${ending.reason}`) })}
          outcome={resultKey === "draw" ? "draw" : resultKey === "youWon" ? "win" : "loss"}
          facts={[
            { label: ts("opponent"), value: t3(`robotName.${opponent}`) },
            { label: ts("youPlayed"), value: ts("side.white") },
            { label: ts("moves"), value: Math.ceil(moves.length / 2) },
            { label: ts("when"), value: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
          ]}
          primaryLabel={t("newGame")}
          onPrimary={() => {
            setShowResult(false);
            reset();
          }}
          onClose={() => setShowResult(false)}
        />
      )}

      {/* You always play White here, so the engine sits at the top of the board. */}
      <div className="mx-auto flex w-full max-w-[596px] flex-col items-stretch gap-1.5">
        <div className="flex w-full items-center justify-between gap-2 px-1">
          {/* Who you are playing — chosen on the Games page. */}
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-pp-ink">
            <Bot className="size-4 text-pp-blue" strokeWidth={2.2} aria-hidden />
            {t3(`robotName.${opponent}`)}
          </span>
          <CapturedTray side="b" pieces={captured.byBlack} advantage={captured.advantage} />
        </div>
        <ChessBoard
          game={game}
          orientation="w"
          /* Not gated on `ready`. Switching opponent mid-game keeps the
             position — it always did — but the new model is a 26–47 MB
             download, and while it arrived the board stopped accepting moves
             even on your own turn. It looked frozen, so switching looked
             broken. Your move is yours whether or not the opponent has
             finished loading; the reply simply waits. */
          canMove={!thinking && !ending && game.turn() === "w"}
          onMove={onMove}
          lastMove={moves.length ? moves[moves.length - 1] : undefined}
        />
        <div className="flex w-full items-center justify-between gap-2 px-1">
          <span className="text-[12px] font-bold">{t("you")}</span>
          <CapturedTray side="w" pieces={captured.byWhite} advantage={captured.advantage} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
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
          /* The dialog says it properly; this is what remains once it is
             dismissed, for anyone looking back at the finished position. */
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
    </div>
  );
}
