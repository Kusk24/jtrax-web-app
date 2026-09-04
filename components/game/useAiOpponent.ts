"use client";

/* The three computer opponents, behind one call.

   They are three different models, not one engine turned down. That is the
   whole point: Stockfish's calibrated floor is Elo 1320, still stronger than
   any pupil here, so below that it has to be crippled by capping search depth —
   which plays perfectly and then collapses at random, and reads to a child as
   the computer being unfair.

   novice  a 25.7M character-level GPT the academy trained from random weights
           on games between 800-1200 players. ~520 Elo, 26 MB.
   strong  Maia-2, fine-tuned by the academy on 2000-2800 games. ~1300-1450,
           47 MB, and rating-conditioned so one file covers any level.
   expert  Stockfish 18, already in the app.

   Measurements and how they were taken:
   jtrax-docs/features/training-our-own-chess-opponents.md */
import { useCallback, useEffect, useRef, useState } from "react";
import { maia, novice } from "@/lib/engines";
import { useStockfish, type Level } from "./useStockfish";

export type Opponent = "novice" | "strong" | "expert";
export const OPPONENTS: Opponent[] = ["novice", "strong", "expert"];

/** Maia-2's rating dial. Not a cap — at 1100 it plays like a beginner on
    purpose, blunders included, which is what makes a fourth tier nearly free. */
const STRONG_ELO = 1500;
const EXPERT_LEVEL: Level = 5;

/** Thinking-time floor, so a reply does not land before a child has taken their
    finger off the board. An instant answer reads as "it wasn't listening". */
const MIN_THINK_MS = 450;

type Status = "idle" | "loading" | "ready" | "failed";

export function useAiOpponent(opponent: Opponent) {
  const stockfish = useStockfish();
  const [status, setStatus] = useState<Status>("idle");
  // Which download this state belongs to, so a slow one that finishes after the
  // student has switched opponents cannot report itself ready.
  const current = useRef(0);

  useEffect(() => {
    if (opponent === "expert") return;
    const mine = (current.current += 1);
    setStatus("loading");
    const load = opponent === "novice" ? novice.preload : maia.preload;
    void load().then(
      () => mine === current.current && setStatus("ready"),
      () => mine === current.current && setStatus("failed"),
    );
  }, [opponent]);

  const ready = opponent === "expert" ? stockfish.ready : status === "ready";
  const failed = opponent === "expert" ? stockfish.failed : status === "failed";

  /** A move for this position, as UCI. "" means the opponent has nothing to
      play — a finished game, or a novice that could not find a legal move. */
  const bestMove = useCallback(
    async (moves: string[], sanHistory: string[], fen: string): Promise<string> => {
      const started = Date.now();
      let uci = "";
      try {
        if (opponent === "expert") uci = await stockfish.bestMove(moves, EXPERT_LEVEL);
        else if (opponent === "strong") uci = await maia.bestMove(fen, STRONG_ELO);
        else uci = await novice.bestMove(sanHistory);
      } catch {
        setStatus("failed");
        return "";
      }
      const elapsed = Date.now() - started;
      if (elapsed < MIN_THINK_MS) {
        await new Promise((r) => setTimeout(r, MIN_THINK_MS - elapsed));
      }
      return uci;
    },
    [opponent, stockfish],
  );

  return { ready, failed, loading: status === "loading", bestMove };
}
