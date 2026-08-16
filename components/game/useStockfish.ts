"use client";

/* Stockfish as a Web Worker, spoken to over UCI.

   The engine runs in the browser, not on the API: it costs nothing to serve,
   answers instantly, and works with no network. Rendering a move takes a few
   hundred milliseconds of one worker thread, which is why the worker is created
   lazily — a student who never opens this screen never downloads 7 MB. */
import { useCallback, useEffect, useRef, useState } from "react";

/** Difficulty as a chess school would set it, not as UCI expresses it.
    Stockfish's floor is Elo 1320, which still beats every pupil here, so the
    easy levels are made easy by capping search depth instead. */
export type Level = 1 | 2 | 3 | 4 | 5;

type Setting = { depth: number; elo?: number };

const LEVELS: Record<Level, Setting> = {
  1: { depth: 1 },
  2: { depth: 2 },
  3: { depth: 4 },
  4: { depth: 8, elo: 1500 },
  5: { depth: 12, elo: 2000 },
};

/** Thinking time floor, so the engine does not answer before a child has taken
    their finger off the board — an instant reply reads as "it wasn't listening". */
const MIN_THINK_MS = 450;

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((uci: string) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let worker: Worker;
    try {
      worker = new Worker("/stockfish/stockfish-18-lite-single.js");
    } catch {
      setFailed(true);
      return;
    }
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : String(e.data?.data ?? "");
      if (line.startsWith("uciok")) {
        worker.postMessage("isready");
        return;
      }
      if (line.startsWith("readyok")) {
        setReady(true);
        return;
      }
      if (line.startsWith("bestmove")) {
        // "bestmove e2e4 ponder e7e5" — the second field is the move.
        const uci = line.split(" ")[1];
        const resolve = resolveRef.current;
        resolveRef.current = null;
        // "(none)" comes back when the position is already over.
        if (resolve) resolve(uci && uci !== "(none)" ? uci : "");
      }
    };
    worker.onerror = () => setFailed(true);
    worker.postMessage("uci");

    return () => {
      resolveRef.current = null;
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  /** Asks for a move in the position reached by these UCI moves. Resolves to ""
      when the engine has nothing to play or is unavailable. */
  const bestMove = useCallback(
    async (moves: string[], level: Level): Promise<string> => {
      const worker = workerRef.current;
      if (!worker || !ready) return "";
      const { depth, elo } = LEVELS[level];

      // UCI_LimitStrength makes the engine play weaker moves on purpose;
      // without it, capping depth alone still produces near-perfect play.
      worker.postMessage(`setoption name UCI_LimitStrength value ${elo ? "true" : "false"}`);
      if (elo) worker.postMessage(`setoption name UCI_Elo value ${elo}`);
      worker.postMessage(`position startpos${moves.length ? " moves " + moves.join(" ") : ""}`);

      const started = Date.now();
      const uci = await new Promise<string>((resolve) => {
        resolveRef.current = resolve;
        worker.postMessage(`go depth ${depth}`);
      });
      const elapsed = Date.now() - started;
      if (elapsed < MIN_THINK_MS) {
        await new Promise((r) => setTimeout(r, MIN_THINK_MS - elapsed));
      }
      return uci;
    },
    [ready],
  );

  return { ready, failed, bestMove };
}
