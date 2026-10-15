"use client";

/* The results views with their category and round held in the address, so a
 * reload, Back or a shared link opens the same table. The page is prerendered,
 * so these render under Suspense with the plain views as the fallback: the
 * served HTML shows the newest round, and the address takes over in the
 * browser.
 */
import type { ComponentProps } from "react";
import { useUrlValue } from "@/lib/url-state";
import { CategoryResults } from "./CategoryResults";
import { ResultsView } from "./ResultsView";

function useRound(): [number | undefined, (round: number) => void] {
  const [raw, set] = useUrlValue("round");
  const n = Number(raw);
  return [raw && Number.isInteger(n) ? n : undefined, (round) => set(String(round))];
}

export function ResultsFromUrl(props: ComponentProps<typeof ResultsView>) {
  const [round, onRound] = useRound();
  return <ResultsView {...props} round={round} onRound={onRound} />;
}

export function CategoryResultsFromUrl({ categories }: ComponentProps<typeof CategoryResults>) {
  const [category, setCategory] = useUrlValue("category");
  const [round, onRound] = useRound();
  return (
    <CategoryResults
      categories={categories}
      category={category}
      onCategory={(name) => setCategory(name, "push", ["round"])}
      round={round}
      onRound={onRound}
    />
  );
}
