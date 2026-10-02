"use client";

/* A connected event's results, one chess-results category at a time.
 *
 * The arbiter publishes each category (U08 + G08, U10 + G10, …) as its own
 * table. The page shows them as tabs over the same view a single-table event
 * gets, so a parent picks their child's category and then searches as usual.
 */
import { useState, type ComponentProps } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PublicCard } from "@/components/public/PublicShell";
import { ResultsView } from "./ResultsView";

type ViewProps = ComponentProps<typeof ResultsView>;

export type Category = {
  name: string;
  sourceUrl?: string;
  stage?: string;
  fetchedAt?: string;
  rounds: ViewProps["rounds"];
  standings: ViewProps["standings"];
};

export function CategoryResults({ categories }: { categories: Category[] }) {
  const t = useTranslations("results");
  const locale = useLocale();
  const [picked, setPicked] = useState(0);
  const current = categories[Math.min(picked, categories.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      {categories.length > 1 && (
        <div role="tablist" aria-label={t("categories")} className="flex flex-wrap gap-2">
          {categories.map((c, i) => {
            const on = i === picked;
            return (
              <button
                key={c.name}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPicked(i)}
                className={`min-h-[40px] rounded-full border px-4 text-[14px] font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue ${
                  on ? "border-pp-blue bg-pp-blue text-white" : "border-pp-line bg-white text-pp-navy hover:border-pp-blue"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Where this table came from, and when it was read — it is a copy of
          somebody else's page, and a parent deserves to know how to check it. */}
      <PublicCard className="!py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-pp-muted">
            {current.stage ? <span className="mr-1 font-semibold text-pp-navy">{current.stage}.</span> : null}
            {t("sourceNote")}
            {current.fetchedAt && <span className="ml-1">{t("fetchedAt", { when: formatTime(current.fetchedAt, locale) })}</span>}
          </p>
          {current.sourceUrl && (
            <a
              href={current.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-pp-blue transition-colors duration-150 hover:text-pp-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue"
            >
              {t("openSource")}
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
              </svg>
            </a>
          )}
        </div>
      </PublicCard>

      {/* Keyed by category: a search typed in one belongs to that one. */}
      <ResultsView key={current.name} standings={current.standings} rounds={current.rounds} external />
    </div>
  );
}

function formatTime(iso: string, locale: string): string {
  const d = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}
