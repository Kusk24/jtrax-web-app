"use client";

/* Live state for one game room: a snapshot fetched on mount, then kept current
   by the server's event stream.

   EventSource is doing real work here beyond saving a poll — it reconnects on
   its own. The API sleeps after fifteen idle minutes on the free tier, so a
   stream *will* drop mid-game, and it has to heal without the player noticing.

   Two rules keep this fast and correct, and both were learned by measuring:

   1. **Never re-read what the server just told us.** An event carries the move
      that caused it, and a POST returns the move it accepted, so neither needs
      a follow-up GET. Round trips are invisible on localhost and are the whole
      experience over a free-tier deployment.

   2. **Never let an older response win.** Every update is gated on ply, because
      a slow GET can land after a newer event and would otherwise reinstate a
      position the game has already left — which looks exactly like the board
      freezing on someone else's turn. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { gameFrom, uciToMove } from "@/lib/chess-core";

export type Seat = { userAccountId: string; displayName: string; studentId?: string };

export type Room = {
  gameRoomId: string;
  code?: string;
  label?: string;
  status: "Open" | "Active" | "Finished" | "Cancelled";
  fen: string;
  turn?: "White" | "Black";
  result?: string;
  resultReason?: string;
  white: Seat | null;
  black: Seat | null;
  moveCount: number;
};

export type Move = { ply: number; san: string; uci: string; fenAfter: string };

export type RoomState = {
  room: Room | null;
  moves: Move[];
  seat: "White" | "Black" | "";
  /** "live" once the stream is open; the board stays usable while connecting. */
  connection: "connecting" | "live" | "offline";
  error: string;
};

const EMPTY: RoomState = { room: null, moves: [], seat: "", connection: "connecting", error: "" };

export function useRoom(roomId: string) {
  const [state, setState] = useState<RoomState>(EMPTY);
  // Mirrors state.moves.length for callbacks that must not close over state.
  const plyRef = useRef(0);
  const setBoth = useCallback((next: (s: RoomState) => RoomState) => {
    setState((s) => {
      const out = next(s);
      plyRef.current = out.moves.length;
      return out;
    });
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/game-rooms/${roomId}`, { cache: "no-store" });
      if (!res.ok) {
        setState((s) => ({ ...s, error: res.status === 404 ? "notFound" : "unreachable" }));
        return;
      }
      const data = await res.json();
      setBoth((s) =>
        // Rule 2: a read that started before the position moved on must not
        // reinstate it.
        data.moves.length < s.moves.length
          ? s
          : { ...s, room: data.room, moves: data.moves, seat: data.seat ?? "", error: "" },
      );
    } catch {
      setState((s) => ({ ...s, error: "unreachable" }));
    }
  }, [roomId, setBoth]);

  useEffect(() => {
    setState(EMPTY);
    plyRef.current = 0;
    void refetch();
  }, [roomId, refetch]);

  useEffect(() => {
    const source = new EventSource(`/api/game-rooms/${roomId}/events`);

    source.addEventListener("room", (ev) => {
      const snap = JSON.parse((ev as MessageEvent).data);
      setBoth((s) => {
        if (snap.ply < s.moves.length) {
          // Behind us — our own optimistic move, or a duplicate. Room fields
          // are still worth taking; the move list is not.
          return { ...s, connection: "live", room: s.room ? { ...s.room, ...snap, fen: s.room.fen } : s.room };
        }
        const room = s.room ? { ...s.room, ...snap } : s.room;
        if (snap.ply === s.moves.length) {
          return { ...s, connection: "live", room };
        }
        if (snap.ply === s.moves.length + 1 && snap.lastUci) {
          // Rule 1: the event carries the move, so no GET is needed.
          return {
            ...s,
            connection: "live",
            room,
            moves: [...s.moves, { ply: snap.ply, san: snap.lastSan, uci: snap.lastUci, fenAfter: snap.fen }],
          };
        }
        // More than one move ahead: events were missed, so a read is the only
        // way to close the gap.
        void refetch();
        return { ...s, connection: "live", room };
      });
    });
    source.onopen = () => setState((s) => ({ ...s, connection: "live" }));
    // EventSource retries by itself; this only reflects the gap in the UI.
    source.onerror = () => setState((s) => ({ ...s, connection: "offline" }));

    return () => source.close();
  }, [roomId, refetch, setBoth]);

  /** Drops anything shown past `at`, undoing an optimistic move. */
  const rollback = useCallback(
    (at: number) => setBoth((s) => (s.moves.length > at ? { ...s, moves: s.moves.slice(0, at) } : s)),
    [setBoth],
  );

  /**
   * Sends a move, showing it immediately.
   *
   * The board renders it before the server answers because the client has
   * already checked it against the same rules — a rejection means the position
   * moved underneath us, not that the move was nonsense, and that is rare
   * enough to be worth the wait everyone else avoids. A rejection rolls back
   * and resyncs; the server stays the referee either way.
   */
  const play = useCallback(
    async (uci: string): Promise<string> => {
      const at = plyRef.current;
      const optimistic = provisionalMove(state.moves, uci, at + 1);
      if (optimistic) {
        setBoth((s) => (s.moves.length === at ? { ...s, moves: [...s.moves, optimistic] } : s));
      }
      try {
        const res = await fetch(`/api/game-rooms/${roomId}/moves`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ move: uci }),
        });
        if (!res.ok) {
          // Take the provisional move back *before* re-reading. The staleness
          // guard in refetch compares lengths, so leaving it in place would
          // make the server's (shorter, correct) answer look like an old one
          // and the phantom would survive the resync.
          rollback(at);
          await refetch();
          return res.status === 409 ? "outOfTurn" : "illegal";
        }
        const data = await res.json();
        // Replace the provisional entry with what the server actually recorded,
        // which is also the only place the result of the game comes from.
        setBoth((s) => {
          const moves = s.moves.slice(0, at);
          moves.push({ ply: data.move.ply, san: data.move.san, uci: data.move.uci, fenAfter: data.fen });
          const room = s.room
            ? { ...s.room, fen: data.fen, turn: data.turn, moveCount: moves.length,
                ...(data.result ? { status: "Finished" as const, result: data.result, resultReason: data.resultReason } : {}) }
            : s.room;
          return s.moves.length > moves.length ? s : { ...s, moves, room };
        });
        return "";
      } catch {
        rollback(at);
        await refetch();
        return "unreachable";
      }
    },
    [roomId, refetch, rollback, setBoth, state.moves],
  );

  const resign = useCallback(async () => {
    await fetch(`/api/game-rooms/${roomId}/resign`, { method: "POST" });
    await refetch();
  }, [roomId, refetch]);

  return { ...state, play, resign, refetch };
}

/** Builds the entry to show while the server is still answering. Returns null
    if the move does not play, in which case nothing is shown early. */
function provisionalMove(moves: Move[], uci: string, ply: number): Move | null {
  const game: Chess | null = gameFrom(moves.map((m) => m.uci));
  if (!game) return null;
  try {
    const made = game.move(uciToMove(uci));
    if (!made) return null;
    return { ply, san: made.san, uci, fenAfter: game.fen() };
  } catch {
    return null;
  }
}
