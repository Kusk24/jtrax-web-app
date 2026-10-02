import { Suspense } from "react";
import { GameReplay } from "./GameReplay";

/* One finished game from History, replayed move by move. */
export default function GameReplayPage() {
  return (
    <Suspense fallback={null}>
      <GameReplay />
    </Suspense>
  );
}
