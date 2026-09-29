"use client";

/* Home: the pupil's own chess dashboard, mobile first and compact.
 *
 * Read top to bottom: who is here, today's puzzles (the one navy card in the
 * portal), any game waiting on them, the ways to play, and practice puzzles.
 * The four summary numbers are on Profile. Every section is a short row or a
 * small card, so most of it fits on one phone screen. */
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bot, Check, ChessKnight, Flame, ChevronRight, DoorOpen, Play, Puzzle as PuzzleIcon, Star, Trophy } from "lucide-react";
import { MyGames } from "@/components/game/MyGames";
import type { LiveTournament } from "@/lib/live-tournaments";
import type { StudentData } from "./useStudentData";
import { FriendPawns } from "./FriendPawns";
import { ResumeGameCard } from "./ResumeGameCard";

/** The student portal's card: white, a thin border, no heavy shadow. */
export const stCard = "rounded-xl border-[1.5px] border-pp-line bg-pp-card";

const PILL_TONE = {
  amber: "bg-st-gold-soft text-st-gold",
  blue: "bg-pp-soft text-pp-blue",
  violet: "bg-pp-plum-soft text-pp-deep",
} as const;

/** One summary number: a small flat icon, the value, and its label under it. */
function StatPill({ tone, icon, value, label }: { tone: keyof typeof PILL_TONE; icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className={`${stCard} flex min-w-0 flex-col gap-1 px-2.5 py-2`}>
      <span className={`flex size-6 items-center justify-center rounded-md ${PILL_TONE[tone]}`} aria-hidden>
        {icon}
      </span>
      <span className="truncate text-[15px] font-bold leading-tight text-pp-ink">{value}</span>
      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-pp-muted">{label}</span>
    </div>
  );
}

/** Three numbers that say where a player stands — their rating, the games
    they have played (every kind on the Games tab) and the puzzles they have
    solved — on Profile, three across even on a phone. */
export function SummaryPills({ data }: { data: StudentData }) {
  const t3 = useTranslations("sv3");
  const tl = useTranslations("lichess");
  const p = data.progress;
  return (
    <section className="grid grid-cols-3 gap-2">
      <StatPill
        tone="amber"
        icon={<Star className="size-3.5 fill-yellow-400 text-yellow-400" strokeWidth={0} />}
        value={data.rating ? data.rating.value : <span className="text-[11px]">{t3("notRated")}</span>}
        label={data.rating ? tl(`perf.${data.rating.perf}`) : t3("ratingPill")}
      />
      <StatPill tone="blue" icon={<ChessKnight className="size-3.5" strokeWidth={2.2} />} value={p?.gamesPlayed ?? "—"} label={t3("gamesPill")} />
      <StatPill tone="violet" icon={<PuzzleIcon className="size-3.5" strokeWidth={2.2} />} value={p?.puzzlesSolved ?? "—"} label={t3("puzzlesPill")} />
    </section>
  );
}

/** The day's progress as a big ring, the percentage inside. */
function ProgressRing({ pct }: { pct: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex size-[104px] shrink-0 items-center justify-center" aria-hidden>
      <svg viewBox="0 0 104 104" className="absolute inset-0 -rotate-90">
        <circle cx="52" cy="52" r={r} fill="none" stroke="var(--color-pp-card)" strokeWidth={9} />
        {pct > 0 && (
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke="var(--color-pp-deep)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={`${(c * pct) / 100} ${c}`}
            style={{ transition: "stroke-dasharray 700ms ease" }}
          />
        )}
      </svg>
      <span className="relative font-pp-display text-[24px] font-bold text-pp-ink">{pct}%</span>
    </span>
  );
}

/** The day's puzzles on Home, laid out as a progress card: what is done and
    a line of encouragement on the left, a big ring on the right, the streak
    along the bottom, then the button for the next
    puzzle. Light blue with deep blue, the student panel's own colours. */
export function DailyProgressCard({
  solved,
  total,
  loading,
  href,
  action,
}: {
  solved: number;
  total: number;
  loading: boolean;
  /** Where the top of the card goes: the Daily Challenge page. */
  href: string;
  action: { label: string; onClick: () => void };
}) {
  const t3 = useTranslations("sv3");
  const n = total || 3;
  const done = total > 0 && solved >= total;
  const pct = n > 0 ? Math.round((Math.min(solved, n) / n) * 100) : 0;
  return (
    <section
      /* Admin's Create Class light blue in light mode; in dark mode the card
         turns dark with the rest of the page. */
      className="rounded-3xl border border-pp-line bg-st-hero p-5"
    >
      <Link href={href} className="flex items-center gap-4">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-pp-muted">{t3("todaysChallenge")}</span>
          <span className="mt-1 block font-pp-display text-[22px] font-bold leading-tight text-pp-ink">
            {loading ? "…" : t3("completedOf", { n: solved, total: n })}
          </span>
          <span className="mt-1.5 block text-[13px] text-pp-muted">
            {done ? t3("dailyDoneBody") : t3("dailyBody", { n })}
          </span>
        </span>
        <span className="shrink-0 translate-y-2.5">
          <ProgressRing pct={loading ? 0 : pct} />
        </span>
      </Link>


      <button
        type="button"
        onClick={action.onClick}
        disabled={loading}
        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-pp-deep py-3 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(36,59,99,.28)] transition-colors hover:bg-pp-navy disabled:cursor-wait disabled:opacity-70"
      >
        {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : <Play className="size-4 fill-current" strokeWidth={0} aria-hidden />}
        {action.label}
      </button>
    </section>
  );
}

/** A section title with an optional arrow link on the right. */
export function StSectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between px-0.5">
      <h2 className="text-[11.5px] font-bold uppercase tracking-[.14em] text-pp-sub">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-[12px] font-semibold text-pp-blue hover:underline">
          {linkLabel}
          <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden />
        </Link>
      )}
    </div>
  );
}

const MODE_TONE = {
  blue: { card: "border-pp-soft bg-pp-soft hover:bg-pp-soft", icon: "text-pp-blue", sub: "text-pp-blue" },
  orange: { card: "border-st-orange-line bg-st-orange-soft hover:bg-st-orange-line", icon: "text-st-orange", sub: "text-st-orange" },
  emerald: { card: "border-pp-green-soft bg-pp-green-soft hover:bg-pp-green-soft", icon: "text-pp-green", sub: "text-pp-green" },
} as const;

/** One of the three ways to play: a tile in its own colour, the icon on a
    white well, opening its card on Games. */
function ModeTile({ href, tone, icon, title, sub }: { href: string; tone: keyof typeof MODE_TONE; icon: React.ReactNode; title: string; sub: string }) {
  const c = MODE_TONE[tone];
  return (
    <Link href={href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl border px-2 py-[12.5px] text-center transition-colors ${c.card}`}>
      <span className={`flex size-9 items-center justify-center rounded-lg bg-pp-card ${c.icon}`} aria-hidden>
        {icon}
      </span>
      <span className="max-w-full truncate text-[12px] font-bold text-pp-ink">{title}</span>
      <span className={`max-w-full truncate text-[10.5px] font-medium ${c.sub}`}>{sub}</span>
    </Link>
  );
}

export function HomeScreen({
  data,
  daily,
  onStartChallenge,
  onFreePlay,
  liveTournament,
}: {
  data: StudentData;
  daily: { solved: number; total: number; loading: boolean };
  onStartChallenge: () => void;
  onFreePlay: () => void;
  liveTournament: LiveTournament | null;
}) {
  const t = useTranslations("st");
  const t3 = useTranslations("sv3");
  const tp = useTranslations("pv2");
  const locale = useLocale();
  /* The actual today, as the parent home writes it; th-TH gives the Buddhist year. */
  const todayLabel = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const done = daily.total > 0 && daily.solved >= daily.total;
  return (
    <div className="st-enter mx-auto flex w-full max-w-[640px] flex-col gap-5">
      {/* The parent home's greeting, as it is there: "Hi, Mini!" and the date. */}
      <section className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">
            {tp("hi", { name: data.name.trim().split(/\s+/)[0] || data.name || "—" })}
          </h1>
          <span className="text-sm text-pp-muted">{todayLabel}</span>
        </div>
        {/* The streak, top right: days practised in a row. */}
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-st-orange-soft px-3 py-1.5 text-[14px] font-bold text-st-orange"
          title={t3("dayStreak", { n: data.progress?.streak.current ?? 0 })}
          aria-label={t3("dayStreak", { n: data.progress?.streak.current ?? 0 })}
        >
          <Flame className="size-4 fill-orange-400 text-orange-500" strokeWidth={2.2} aria-hidden />
          {data.progress?.streak.current ?? 0}
        </span>
      </section>

      <DailyProgressCard
        solved={daily.solved}
        total={daily.total}
        loading={daily.loading}
        href="/student?screen=daily"
        action={{
          label: done ? t("keepPractising") : daily.solved > 0 ? t("continueChallenge") : t("startChallenge"),
          onClick: done ? onFreePlay : onStartChallenge,
        }}
      />

      {/* A robot game left unfinished — draws nothing when there is none. */}
      <ResumeGameCard />

      {/* Games somebody is waiting on — draws nothing when there are none. */}
      {data.userAccountId && <MyGames myAccountId={data.userAccountId} />}

      {liveTournament && (
        <Link
          href={`/t/${liveTournament.tournamentId}`}
          className={`${stCard} flex items-center gap-3 px-3 py-2.5 transition-colors hover:border-pp-green-soft`}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pp-green-soft text-pp-green" aria-hidden>
            <Trophy className="size-4" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-pp-green">{t("tournament")}</span>
            <span className="truncate text-[13.5px] font-bold text-pp-ink">{liveTournament.name}</span>
          </span>
          <span className="shrink-0 text-[12px] font-bold text-pp-green">{t("seeResults")}</span>
        </Link>
      )}

      <section className="flex flex-col gap-2">
        <StSectionTitle title={t3("games")} />
        <div className="grid grid-cols-3 gap-2">
          <ModeTile href="/student/play#computer" tone="blue" title={t3("vsAi")} sub={t3("vsAiSub")} icon={<Bot className="size-5" strokeWidth={2} />} />
          <ModeTile
            href="/student/play#challenge"
            tone="orange"
            title={t3("withFriend")}
            sub={t3("withFriendSub")}
            icon={<FriendPawns size="size-5" />}
          />
          <ModeTile href="/student/play#room" tone="emerald" title={t3("gameRoom")} sub={t3("gameRoomSub")} icon={<DoorOpen className="size-5" strokeWidth={2} />} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <StSectionTitle title={t3("practice")} />
        <button
          type="button"
          onClick={onFreePlay}
          className={`${stCard} group flex w-full cursor-pointer items-center gap-3 px-3 py-[12.5px] text-left transition-colors hover:border-pp-soft`}
        >
          {/* A solid jigsaw piece — the nav's Puzzles icon is an outline, so the
              two do not read as the same button. */}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pp-soft text-pp-blue" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
              <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z" />
            </svg>
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13.5px] font-bold text-pp-ink">{t3("puzzlesCard")}</span>
            <span className="truncate text-[11.5px] text-pp-muted">{t3("puzzlesCardSub")}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-pp-faint transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden />
        </button>
      </section>
    </div>
  );
}
