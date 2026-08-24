"use client";

/* A child's Lichess ratings on their parent's screen.
 *
 * The permission for this already existed — the API scopes a parent to their own
 * children in the query — but nothing rendered it, so the half of a pupil's
 * chess played at home was visible to staff and to the pupil and to nobody else.
 *
 * Read-only by design. A parent linking or unlinking their child's account
 * happens on the child's own profile, where the consent screen belongs.
 */
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { PERF_ORDER, sortRatings, type LichessLink } from "@/lib/lichess";

const label = "text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub";

export function ChildLichess({ studentId }: { studentId: string }) {
  const t = useTranslations("pv2");
  const [link, setLink] = useState<LichessLink | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/lichess/links?studentId=${encodeURIComponent(studentId)}`, {
          cache: "no-store",
        });
        const rows: LichessLink[] = res.ok ? await res.json() : [];
        // The query is already scoped to this parent's children, so anything
        // that comes back is theirs to see; the id filter is a convenience.
        if (!cancelled) setLink(rows.find((r) => r.studentId === studentId) ?? null);
      } catch {
        /* An unreachable API reads as "nothing linked", which is the honest
           empty state rather than an error a parent can do anything about. */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // Nothing linked is not worth a card on a parent's screen; it would just be
  // an instruction aimed at somebody who is not reading it.
  if (!loaded || !link) return null;

  const ratings = sortRatings(link.ratings).filter((r) => PERF_ORDER.includes(r.perf));

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border-[1.5px] border-pp-line bg-pp-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className={label}>{t("lichess.title")}</span>
        <a
          href={link.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[12px] font-semibold text-pp-ink underline"
        >
          {link.username}
          <ExternalLink className="size-3" />
        </a>
      </div>

      {ratings.length === 0 ? (
        <p className="text-[12.5px] text-pp-muted">{t("lichess.noGames")}</p>
      ) : (
        <div className="flex flex-col">
          {ratings.map((r, i) => (
            <div
              key={r.perf}
              className="flex items-center justify-between gap-3 py-1.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--pp-line, rgba(0,0,0,.08))" }}
            >
              <span className="text-[13px] text-pp-muted">{t(`lichess.perf.${r.perf}`)}</span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-[13.5px] font-semibold text-pp-ink">{r.rating}</span>
                {/* A provisional rating swings wildly and is not an achievement
                    yet. Saying so is kinder than a number that drops tomorrow. */}
                {r.provisional && (
                  <span className="text-[10.5px] text-pp-muted">{t("lichess.provisional")}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11.5px] leading-snug text-pp-muted">{t("lichess.footnote")}</p>
    </section>
  );
}
