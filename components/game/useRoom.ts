"use client";

/* Live state for one game room: a snapshot fetched on mount, then kept current
   by the server's event stream.

   EventSource is doing real work here beyond saving a poll — it reconnects on
   its own. The API sleeps after fifteen idle minutes on the free tier, so a
   stream *will* drop mid-game, and it has to heal without the player noticing.
   Every event is a full snapshot, so a reconnect needs no replay. */
import { useCallback, useEffect, useRef, useState } from "react";

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
  legalMoves: string[];
  /** "live" once the stream is open; the board stays usable while connecting. */
  connection: "connecting" | "live" | "offline";
  error: string;
};

export function useRoom(roomId: string) {
  const [state, setState] = useState<RoomState>({
    room: null, moves: [], seat: "", legalMoves: [], connection: "connecting", error: "",
  });
  // Held in a ref so the stream handler can tell a genuinely new position from
  // the echo of a move this client just made.
  const plyRef = useRef(0);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/game-rooms/${roomId}`, { cache: "no-store" });
      if (!res.ok) {
        setState((s) => ({ ...s, error: res.status === 404 ? "notFound" : "unreachable" }));
        return;
      }
      const data = await res.json();
      plyRef.current = data.moves.length;
      setState((s) => ({
        ...s,
        room: data.room,
        moves: data.moves,
        seat: data.seat ?? "",
        legalMoves: data.legalMoves ?? [],
        error: "",
      }));
    } catch {
      setState((s) => ({ ...s, error: "unreachable" }));
    }
  }, [roomId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const source = new EventSource(`/api/game-rooms/${roomId}/events`);

    source.addEventListener("room", (ev) => {
      const snapshot = JSON.parse((ev as MessageEvent).data);
      setState((s) => ({
        ...s,
        connection: "live",
        room: s.room ? { ...s.room, ...snapshot } : s.room,
      }));
      // The event carries the position but not the move list or the legal
      // moves, so a change in ply is what triggers the authorized read.
      if (snapshot.ply !== plyRef.current) {
        plyRef.current = snapshot.ply;
        void refetch();
      }
    });
    source.onopen = () => setState((s) => ({ ...s, connection: "live" }));
    // EventSource retries by itself; this only reflects the gap in the UI.
    source.onerror = () => setState((s) => ({ ...s, connection: "offline" }));

    return () => source.close();
  }, [roomId, refetch]);

  /** Sends a move. The server is the referee, so a rejection here is the truth
      and the board is resynced rather than argued with. */
  const play = useCallback(
    async (uci: string): Promise<string> => {
      try {
        const res = await fetch(`/api/game-rooms/${roomId}/moves`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ move: uci }),
        });
        if (!res.ok) {
          await refetch();
          return res.status === 409 ? "outOfTurn" : "illegal";
        }
        await refetch();
        return "";
      } catch {
        return "unreachable";
      }
    },
    [roomId, refetch],
  );

  const resign = useCallback(async () => {
    await fetch(`/api/game-rooms/${roomId}/resign`, { method: "POST" });
    await refetch();
  }, [roomId, refetch]);

  return { ...state, play, resign, refetch };
}
