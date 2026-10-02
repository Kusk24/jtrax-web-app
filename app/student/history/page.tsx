import { Suspense } from "react";
import { HistoryScreen } from "./HistoryScreen";

/* The pupil's chess record: games and daily challenges. Not a timeline of
   everything — the streak already says which days they practised. */
export default function HistoryPage() {
  return (
    <Suspense fallback={null}>
      <HistoryScreen />
    </Suspense>
  );
}
