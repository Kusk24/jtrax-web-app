"use client";

/* The student portal's /student screens: Home, Puzzles (with the puzzle
   board) and Profile, addressed by `?screen=`. Home and Profile are drawn by
   their own components; the puzzle board lives here because it shares the
   daily set's state with Home's Daily Challenge card. */
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  RotateCcw,
  Target,
  X,
} from "lucide-react";
import { boardSize, useFitWidth } from "@/lib/use-fit-width";
import { fetchLiveTournaments, type LiveTournament } from "@/lib/live-tournaments";
import { SoundToggle } from "@/components/game/SoundToggle";
import { moveBetween, moveFrom, playSound, preloadSounds, soundForMove } from "@/lib/sound";
import {
  pieceSrc,
  movesFrom,
  squareName,
  squareToRC,
  toGrid,
  type BoardGrid,
} from "@/lib/chess-core";
import {
  attemptMove,
  gameAt,
  openPuzzle,
  getDailyPuzzles,
  getPuzzleList,
  attemptListMove,
  openListPuzzle,
  puzzleGoal,
  type DailyPuzzle,
  type FreeTier,
  type PuzzleList,
} from "@/lib/puzzles";
import type { Chess } from "chess.js";
import { useStudentData } from "@/components/student/useStudentData";
import { HomeScreen } from "@/components/student/HomeScreen";
import { MiniBoard } from "@/components/student/MiniBoard";
import { puzzleTitleKey } from "@/lib/puzzle-title";
import { ProfileScreen } from "@/components/student/ProfileScreen";
import {
  Card,
  primaryPill,
  secondaryPill,
} from "@/components/student/kit";

type Square = [number, number];

/** How long the opponent "thinks" before a puzzle's reply lands — the same
    feel as the robot's minimum think time. */
const REPLY_PAUSE_MS = 550;

type Screen = "home" | "puzzles" | "daily" | "puzzle" | "profile";
type Section = Exclude<Screen, "puzzle">;

/* The pages a puzzle board opens from, and goes back to. */
const BOARD_PAGES: Section[] = ["puzzles", "daily"];

/** The heading on a Free Play puzzle, by level. */
const TIER_TITLE: Record<FreeTier, "beginnerPuzzle" | "intermediatePuzzle" | "advancedPuzzle"> = {
  beginner: "beginnerPuzzle",
  intermediate: "intermediatePuzzle",
  advanced: "advancedPuzzle",
};


/* The three levels, easiest first, with their colour — the filter tags and
   each puzzle's tile use the same one. */
const TIER_ROWS = [
  { tier: "beginner", tone: "emerald" },
  { tier: "intermediate", tone: "sky" },
  { tier: "advanced", tone: "amber" },
] as const;
const toneOf = (tier: FreeTier) => TIER_ROWS.find((r) => r.tier === tier)!.tone;
/** A daily puzzle's level, from its rating — the same bands the list uses. */
const tierOfRating = (rating: number): FreeTier => (rating < 800 ? "beginner" : rating < 1200 ? "intermediate" : "advanced");

const TIER_SUB: Record<FreeTier, "tierBeginnerSub" | "tierIntermediateSub" | "tierAdvancedSub"> = {
  beginner: "tierBeginnerSub",
  intermediate: "tierIntermediateSub",
  advanced: "tierAdvancedSub",
};

/* A page opened from Puzzles: a back arrow, the title and a line under it. */
function SubPageHeader({ onBack, backLabel, title, sub }: { onBack: () => void; backLabel: string; title: string; sub?: string }) {
  return (
    <header className="flex items-center gap-2.5 px-0.5">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="flex size-[38px] flex-none cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-pp-line bg-pp-card text-pp-ink hover:bg-pp-soft"
      >
        <ArrowLeft className="size-4" strokeWidth={2.2} />
      </button>
      <div className="min-w-0">
        <h1 className="truncate font-pp-display text-2xl font-semibold leading-tight text-pp-ink">{title}</h1>
        {sub && <p className="truncate text-[11.5px] text-pp-muted">{sub}</p>}
      </div>
    </header>
  );
}

/* The levels' colours: tinted, flat. */
const TIER_TONE = {
  emerald: { card: "hover:border-pp-green-soft", well: "bg-pp-green-soft text-pp-green", sub: "text-pp-green", arrow: "text-pp-green" },
  sky: { card: "hover:border-pp-soft", well: "bg-pp-soft text-pp-blue", sub: "text-pp-blue", arrow: "text-pp-blue" },
  amber: { card: "hover:border-pp-amber-soft", well: "bg-pp-amber-soft text-pp-amber", sub: "text-pp-amber", arrow: "text-pp-amber" },
} as const;

/** The day's set finished: said once, with the bonus it earned. */
function DailyCompleteDialog({ onHome, onMore }: { onHome: () => void; onMore: () => void }) {
  const t = useTranslations("st");
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onHome();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onHome]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,33,58,0.45)] px-6" onClick={onHome}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-done-title"
        onClick={(e) => e.stopPropagation()}
        className="st-enter w-full max-w-[360px] rounded-2xl bg-pp-card p-6 text-center shadow-[0_24px_60px_rgba(20,33,58,.28)]"
      >
        <span className="st-badge-reveal mx-auto flex size-20 items-center justify-center rounded-full bg-pp-green-soft text-pp-green ring-8 ring-pp-green-soft/50" aria-hidden>
          <BadgeCheck className="size-10" strokeWidth={1.8} />
        </span>
        <h2 id="daily-done-title" className="mt-4 font-pp-display text-[22px] font-bold text-pp-ink">{t("challengeDone")}</h2>
        <p className="mt-1 text-[14px] text-pp-muted">{t("challengeDoneDialog")}</p>
        <button ref={first} type="button" onClick={onHome} className={`${primaryPill} mt-5 w-full`}>
          {t("backToHome")}
        </button>
        <button type="button" onClick={onMore} className={`${secondaryPill} mt-2 w-full`}>
          {t("keepPractising")}
        </button>
      </div>
    </div>
  );
}

export default function StudentGame() {
  const t = useTranslations("sv2");
  const ts = useTranslations("st");
  const tp = useTranslations("play");
  const t3 = useTranslations("sv3");

  const router = useRouter();
  const params = useSearchParams();
  const wanted = params.get("screen");
  const section: Section =
    wanted === "puzzles" || wanted === "profile" || wanted === "daily"
      ? wanted
      : params.has("lichess")
        ? "profile"
        : "home";
  const [boardOpen, setBoardOpen] = useState(false);
  const screen: Screen = BOARD_PAGES.includes(section) && boardOpen ? "puzzle" : section;
  /* The board fills its column, up to 560px of squares plus the frame. */
  const [boardRef, boardWidth] = useFitWidth<HTMLDivElement>(364, 596);
  const square = boardSize(boardWidth, 36) / 8;
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);
  const [freePuzzle, setFreePuzzle] = useState<DailyPuzzle | null>(null);
  const [freeTier, setFreeTier] = useState<FreeTier | null>(null);
  /* The practice list: twenty puzzles, levels mixed. Null until loaded. */
  const [list, setList] = useState<PuzzleList | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [listIndex, setListIndex] = useState(0);
  /* "" for every level. */
  const [listFilter, setListFilter] = useState<FreeTier | "">("");
  /* A list puzzle solved again today: said so on the board. */
  const [replay, setReplay] = useState(false);
  const [game, setGame] = useState<Chess | null>(null);
  const [played, setPlayed] = useState<string[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [solved, setSolved] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  /* The pupil's move is on the board and the opponent's reply is coming. */
  const [waiting, setWaiting] = useState(false);
  /* Bumped whenever the board is reset or changed, so a reply still on its
     way does not land on a board the pupil has moved away from. */
  const boardGen = useRef(0);
  const [message, setMessage] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const data = useStudentData();

  const puzzle = freePuzzle ?? puzzles[puzzleIndex];
  const flipped = puzzle?.side === "Black";
  const grid: BoardGrid = game ? toGrid(game) : Array.from({ length: 8 }, () => Array(8).fill(null));
  const view = (r: number, c: number): [number, number] => (flipped ? [7 - r, 7 - c] : [r, c]);
  const [liveTournament, setLiveTournament] = useState<LiveTournament | null>(null);

  useEffect(() => {
    if (screen === "puzzle") preloadSounds();
  }, [screen]);

  useEffect(() => {
    let cancelled = false;
    fetchLiveTournaments().then((list) => {
      if (!cancelled && list.length > 0) setLiveTournament(list[0]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Re-read on every visit: the server swaps yesterday's solved puzzles for
     new ones, and a day may have turned since the page opened. */
  useEffect(() => {
    if (section !== "puzzles") return;
    let cancelled = false;
    getPuzzleList()
      .then((l) => {
        if (cancelled) return;
        setListFailed(false);
        setList(l);
      })
      .catch(() => !cancelled && setListFailed(true));
    return () => {
      cancelled = true;
    };
  }, [section]);

  /* Today's puzzles. The set is chosen on the server, and the solves and
     streak are worked out there — re-read after a solve, never guessed. */
  const refreshPractice = data.refreshProgress;

  useEffect(() => {
    let cancelled = false;
    getDailyPuzzles()
      .then((set) => {
        if (cancelled) return;
        setPuzzles(set.puzzles);
        setExhausted(set.exhausted);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingPuzzles(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /* Feed-screen state */
  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const solvedCount = puzzles.filter((p) => p.solved).length;
  const isDailyDone = puzzles.length > 0 && solvedCount >= puzzles.length;

  const go = (s: Section) => {
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    setBoardOpen(false);
    if (s !== section) router.push(s === "home" ? "/student" : `/student?screen=${s}`);
  };

  /* Board state for whichever puzzle is being opened. Both paths reset exactly
     the same things, so they share this rather than drifting apart. */
  const openBoard = (p: DailyPuzzle | undefined, practice = false) => {
    boardGen.current += 1;
    setWaiting(false);
    /* A practice puzzle opens ready to play even when it is ticked: playing
       it again is allowed, it just earns nothing. */
    if (p && practice) void openListPuzzle(p.puzzleId);
    else if (p && !p.solved) void openPuzzle(p.puzzleId);
    setGame(p ? gameAt(p.fen) : null);
    setPlayed([]);
    setSelected(null);
    setSolved(practice ? false : (p?.solved ?? false));
    setShowWrong(false);
    setMessage("");
    setBoardOpen(true);
    if (!BOARD_PAGES.includes(section)) router.push("/student?screen=daily");
  };

  /* Opens one of the list's puzzles on the board. */
  const loadListPuzzle = (index: number) => {
    const p = list?.puzzles[index];
    if (!p) return;
    setListIndex(index);
    setFreeTier(p.tier);
    setFreePuzzle(p);
    openBoard(p, true);
  };

  const loadPuzzle = (index: number) => {
    const p = puzzles[index];
    setReplay(false);
    /* Opening a daily puzzle leaves Free Play, or `puzzle` would keep
       resolving to the free one and the board would not change. */
    setFreePuzzle(null);
    setFreeTier(null);
    setPuzzleIndex(index);
    // openBoard starts the clock server-side. Only the first open counts, so
    // coming back after a wrong answer continues the same sitting.
    openBoard(p);
  };

  const resetPuzzle = () => {
    boardGen.current += 1;
    setWaiting(false);
    const p = freePuzzle ?? puzzles[puzzleIndex];
    setGame(p ? gameAt(p.fen) : null);
    setPlayed([]);
    setSelected(null);
    setSolved(false);
    setShowWrong(false);
    setMessage("");
  };

  /* Submits the pupil's move and does what the server says.
     Nothing here knows the answer: the old board carried `from`/`to` for each
     of three fixed puzzles, so the solution was in the page. */
  const submit = async (uci: string) => {
    const p = freePuzzle ?? puzzles[puzzleIndex];
    if (!p || !game) return;
    setSelected(null);
    let verdict;
    try {
      verdict = freePuzzle ? await attemptListMove(p.puzzleId, uci, played) : await attemptMove(p.puzzleId, uci, played);
    } catch {
      setMessage(tp("error.unreachable"));
      return;
    }

    /* The server returns the position after the move and any reply. When the
       puzzle goes on, the pupil's own move is shown first and the reply a
       beat later, as the robot answers — both landing at once hid what the
       opponent did. The board still ends on the server's position. */
    const next = gameAt(verdict.fen);
    const mine = moveFrom(game.fen(), uci);
    const replyComing = verdict.correct && !verdict.solved;
    if (replyComing && mine) {
      const afterMine = gameAt(mine.after);
      if (afterMine) setGame(afterMine);
      setWaiting(true);
      const gen = boardGen.current;
      setTimeout(() => {
        if (gen !== boardGen.current) return;
        if (next) setGame(next);
        setWaiting(false);
      }, REPLY_PAUSE_MS);
    } else if (next) {
      setGame(next);
    }

    /* Sound follows what the pupil sees: their move now, the reply with it. */
    if (mine) playSound(soundForMove(mine));

    if (!verdict.correct) {
      setShowWrong(true);
      setMessage(t("wrongMsg"));
      setTimeout(() => playSound("wrong"), 180);
      setTimeout(() => {
        setGame(gameAt(p.fen));
        setPlayed([]);
        setShowWrong(false);
        setMessage("");
      }, 1200);
      return;
    }

    setPlayed([...played, uci]);
    setShowWrong(false);

    if (!verdict.solved) {
      // A longer puzzle: the opponent has replied and it is their move again.
      setMessage(t("keepGoingMsg"));
      const reply = mine ? moveBetween(mine.after, verdict.fen) : null;
      if (reply) setTimeout(() => playSound(soundForMove(reply)), REPLY_PAUSE_MS);
      return;
    }

    setTimeout(() => playSound("game-end"), 300);

    setSolved(true);
    setMessage(t("checkmateMsg"));
    setReplay(Boolean(freePuzzle) && verdict.firstSolve !== true);
    // The practice row was just written server-side by the grader, so the
    // flame is re-read rather than guessed at. Free Play earns it too: the
    // child practised, and the streak counts days practised.
    refreshPractice();

    /* A list puzzle is not part of today's set: it ticks its tile, then the
       next unticked one in the same filter opens — or, with none left, the
       pupil is back at the list. */
    if (freePuzzle) {
      const idx = listIndex;
      const rows = (list?.puzzles ?? []).map((row, i) => (i === idx ? { ...row, solved: true } : row));
      if (list) setList({ ...list, puzzles: rows });
      const open = (x: (typeof rows)[number]) => !x.solved && (!listFilter || x.tier === listFilter);
      setTimeout(() => {
        const next = rows.findIndex((x, i) => i > idx && open(x));
        const wrap = next >= 0 ? next : rows.findIndex(open);
        if (wrap >= 0) {
          setListIndex(wrap);
          setFreeTier(rows[wrap].tier);
          setFreePuzzle(rows[wrap]);
          openBoard(rows[wrap], true);
        } else {
          setBoardOpen(false);
        }
      }, 1400);
      return;
    }

    setPuzzles((prev) =>
      prev.map((row, i) => (i === puzzleIndex ? { ...row, solved: true } : row)),
    );
    const wasLast = puzzles.slice(0, puzzleIndex).every((x) => x.solved) && puzzleIndex === puzzles.length - 1;
    setTimeout(() => {
      const nextUnsolved = puzzles.findIndex((x, i) => i !== puzzleIndex && !x.solved);
      if (!wasLast && nextUnsolved >= 0) loadPuzzle(nextUnsolved);
      else setCelebrate(true);
    }, 1400);
  };

  /* Board squares are addressed in view coordinates and translated once here,
     so the rest of the screen does not have to know the board is turned round
     for a pupil playing Black. */
  const select = (vr: number, vc: number) => {
    /* Not while the opponent's reply is still to land. */
    if (solved || waiting || !game || !puzzle) return;
    const [r, c] = view(vr, vc);
    const square = squareName(r, c);
    const mine = game.get(square);
    const myColour = puzzle.side === "White" ? "w" : "b";

    if (selected) {
      const from = squareName(selected[0], selected[1]);
      const options = movesFrom(game, from).filter((m) => m.slice(2, 4) === square);
      if (options.length > 0) {
        // A promotion offers several; a child promoting to anything but a
        // queen is rare enough that the queen is chosen for them.
        const queen = options.find((m) => m.endsWith("q"));
        void submit(queen ?? options[0]);
        return;
      }
      setSelected(mine && mine.color === myColour ? [r, c] : null);
      return;
    }
    if (mine && mine.color === myColour) setSelected([r, c]);
  };

  const legal: Square[] = selected && game
    ? movesFrom(game, squareName(selected[0], selected[1])).map((m) => squareToRC(m.slice(2, 4)))
    : [];


  /* Home's "Start Challenge" goes straight to the next puzzle to solve rather
     than to a list the pupil then has to choose from. */
  const startChallenge = () => {
    const next = puzzles.findIndex((x) => !x.solved);
    if (next >= 0) loadPuzzle(next);
    else go("daily");
  };
  const openFreePlay = () => {
    setCelebrate(false);
    setBoardOpen(false);
    router.push("/student?screen=puzzles");
  };

  return (
    <div className="flex flex-col gap-5">
      {screen === "home" && (
        <HomeScreen
          data={data}
          daily={{ solved: solvedCount, total: puzzles.length || 3, loading: loadingPuzzles }}
          onStartChallenge={startChallenge}
          onFreePlay={openFreePlay}
          liveTournament={liveTournament}
        />
      )}

      {/* ---------------- PUZZLES: THE LIST OF TWENTY ---------------- */}
      {/* Levels mixed, two in three from the pupil's own level. Level tags on
          top, Today's Challenge as the first row, then each puzzle with its
          board, name, level and rating — ticked once solved today. Tomorrow
          the ticked ones are replaced and the rest stay. */}
      {screen === "puzzles" && (
        <div className="st-enter mx-auto flex w-full max-w-[640px] flex-col gap-5">
          <h1 className="m-0 font-pp-display text-[23px] font-bold leading-tight tracking-[-0.01em] text-pp-ink">{t("puzzles")}</h1>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]" role="tablist" aria-label={t("puzzles")}>
            {([["", t3("filterAll")], ...TIER_ROWS.map((r) => [r.tier, t3(`level.${r.tier}`)])] as [FreeTier | "", string][]).map(([k, label]) => {
              const on = listFilter === k;
              return (
                <button
                  key={k || "all"}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setListFilter(k)}
                  title={k ? t3(TIER_SUB[k]) : undefined}
                  className={`shrink-0 cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    on ? "bg-pp-blue text-white" : "bg-pp-line text-pp-muted hover:bg-pp-line"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Today's Challenge: the day's three, opening their own page. */}
          <button
            type="button"
            onClick={() => go("daily")}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-pp-soft bg-pp-soft p-2.5 text-left transition-colors hover:bg-pp-soft"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-pp-amber-soft text-pp-amber" aria-hidden>
              <Target className="size-6" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-pp-ink">{t3("todaysChallenge")}</span>
              <span className="text-[12px] text-pp-muted">{t3("challengeCompleted", { n: solvedCount, total: puzzles.length || 3 })}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-pp-blue transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden />
          </button>

          {listFailed && !list ? (
            <p className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3 py-6 text-center text-[12.5px] text-pp-muted">{t("puzzlesUnavailable")}</p>
          ) : !list ? (
            <p className="rounded-xl border-[1.5px] border-pp-line bg-pp-card py-6 text-center text-[12.5px] text-pp-muted">{t("puzzlesLoading")}</p>
          ) : list.puzzles.length === 0 ? (
            <p className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3 py-6 text-center text-[12.5px] text-pp-muted">{t("puzzlesExhausted")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {list.puzzles.map((p, i) => {
                if (listFilter && p.tier !== listFilter) return null;
                const c = TIER_TONE[toneOf(p.tier)];
                return (
                  <button
                    key={p.puzzleId}
                    type="button"
                    onClick={() => loadListPuzzle(i)}
                    title={p.solved ? t3("playAgain") : undefined}
                    className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-pp-card px-2.5 py-[12.5px] text-left transition-colors ${
                      p.solved ? "border-pp-green-soft" : "border-pp-line hover:border-pp-faint"
                    }`}
                  >
                    <MiniBoard fen={p.fen} flipped={p.side === "Black"} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-pp-ink">{t3(`theme.${puzzleTitleKey(p.themes)}`)}</span>
                      <span className="text-[12px]">
                        <span className={`font-semibold ${c.sub}`}>{t3(`level.${p.tier}`)}</span>
                        <span className="text-pp-muted"> • {t("ratingLabel", { rating: p.rating })}</span>
                      </span>
                    </span>
                    {p.solved ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-pp-green text-white" aria-label={t("solvedLabel")}>
                        <Check className="size-3.5" strokeWidth={3.2} />
                      </span>
                    ) : (
                      <ChevronRight className="size-5 shrink-0 text-pp-blue transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- DAILY CHALLENGE ---------------- */}
      {/* The day's three, drawn like the Puzzles list: board, name, level and
          rating, a tick once solved. */}
      {screen === "daily" && (
        <div className="st-enter mx-auto flex w-full max-w-[640px] flex-col gap-5">
          <SubPageHeader
            onBack={() => go("home")}
            backLabel={t("back")}
            title={t("dailyChallenge")}
            sub={`${ts("puzzlesOf", { n: solvedCount, total: puzzles.length || 3 })} · ${
              isDailyDone ? t3("dailyDoneBody") : t3("dailyBody", { n: puzzles.length || 3 })
            }`}
          />
          {loadingPuzzles ? (
            <p className="rounded-xl border-[1.5px] border-pp-line bg-pp-card py-6 text-center text-[12.5px] text-pp-muted">{t("puzzlesLoading")}</p>
          ) : puzzles.length === 0 ? (
            <p className="rounded-xl border-[1.5px] border-pp-line bg-pp-card px-3 py-6 text-center text-[12.5px] leading-relaxed text-pp-muted">
              {exhausted ? t("puzzlesExhausted") : t("puzzlesUnavailable")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {puzzles.map((p, i) => {
                const tier = tierOfRating(p.rating);
                return (
                  <button
                    key={p.puzzleId}
                    type="button"
                    onClick={() => loadPuzzle(i)}
                    className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-pp-card p-2.5 text-left transition-colors ${
                      p.solved ? "border-pp-green-soft" : "border-pp-line hover:border-pp-faint"
                    }`}
                  >
                    <MiniBoard fen={p.fen} flipped={p.side === "Black"} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-pp-ink">{t3(`theme.${puzzleTitleKey(p.themes)}`)}</span>
                      <span className="text-[12px]">
                        <span className={`font-semibold ${TIER_TONE[toneOf(tier)].sub}`}>{t3(`level.${tier}`)}</span>
                        <span className="text-pp-muted"> • {t("ratingLabel", { rating: p.rating })}</span>
                      </span>
                    </span>
                    {p.solved ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-pp-green text-white" aria-label={t("solvedLabel")}>
                        <Check className="size-3.5" strokeWidth={3.2} />
                      </span>
                    ) : (
                      <ChevronRight className="size-5 shrink-0 text-pp-blue transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------- PUZZLE BOARD ---------------- */}
      {screen === "puzzle" && (
        <div className="st-enter flex flex-col gap-5">
          <header className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBoardOpen(false)}
              aria-label={t("back")}
              className="flex size-[38px] flex-none cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-pp-line bg-pp-card text-pp-ink hover:bg-pp-soft"
            >
              <ArrowLeft className="size-4" strokeWidth={2.2} />
            </button>
            <div className="min-w-0">
              <h1 className="m-0 font-pp-display text-2xl font-semibold leading-tight text-pp-ink">
                {freeTier ? `${t(TIER_TITLE[freeTier])} · ${listIndex + 1}` : t("puzzleN", { n: puzzleIndex + 1 })}
              </h1>
              {puzzle && <p className="text-[13px] text-pp-muted">{t("ratingLabel", { rating: puzzle.rating })}</p>}
            </div>
            <SoundToggle className="ml-auto" />
          </header>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div ref={boardRef} className="mx-auto w-full max-w-[596px]">
              {/* The board on a clean card, the frame in the console's line
                  colour rather than a warm wood tone. */}
              <div className="mx-auto w-fit rounded-2xl border-[1.5px] border-pp-line bg-pp-card p-3 shadow-[0_10px_30px_rgba(35,53,94,.10)]">
                <div
                  className="grid overflow-hidden rounded-lg ring-2 ring-[#46608c]"
                  style={{ gridTemplateColumns: `repeat(8, ${square}px)`, gridTemplateRows: `repeat(8, ${square}px)` }}
                >
                  {Array.from({ length: 64 }, (_, idx) => {
                    const vr = Math.floor(idx / 8);
                    const vc = idx % 8;
                    const [r, c] = view(vr, vc);
                    const isSelected = selected?.[0] === r && selected?.[1] === c;
                    const isLegal = legal.some(([lr, lc]) => lr === r && lc === c);
                    const piece = grid[r][c];
                    const isCapture = isLegal && !!piece;
                    const bg = isSelected
                      ? "var(--color-sv-board-selected)"
                      : (vr + vc) % 2 === 0
                        ? "var(--color-sv-board-light)"
                        : "var(--color-sv-board-dark)";
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => select(vr, vc)}
                        aria-label={squareName(r, c)}
                        className="relative flex cursor-pointer items-center justify-center border-none p-0"
                        style={{ width: square, height: square, background: bg }}
                      >
                        {/* Coordinates on the edge squares, as on a real board. */}
                        {vc === 0 && (
                          <span className="pointer-events-none absolute left-0.5 top-0.5 text-[10px] font-bold leading-none text-[#46608c]/70">{squareName(r, c)[1]}</span>
                        )}
                        {vr === 7 && (
                          <span className="pointer-events-none absolute bottom-0.5 right-1 text-[10px] font-bold leading-none text-[#46608c]/70">{squareName(r, c)[0]}</span>
                        )}
                        {piece && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={pieceSrc(piece.color, piece.type)}
                            alt=""
                            draggable={false}
                            className="pointer-events-none select-none drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]"
                            style={{ width: square * 0.9, height: square * 0.9 }}
                          />
                        )}
                        {isLegal &&
                          (isCapture ? (
                            <span className="absolute inset-0.5 rounded-md shadow-[inset_0_0_0_3px_rgba(46,92,184,0.75)]" />
                          ) : (
                            <span className="absolute rounded-full bg-[rgba(30,58,112,0.35)]" style={{ width: square / 3, height: square / 3 }} />
                          ))}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Card>
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[.12em] text-pp-muted">
                  <Target className="size-4 text-pp-blue" strokeWidth={2.2} aria-hidden /> {t("yourGoal")}
                </p>
                <p className="mt-1.5 font-pp-display text-[17px] font-bold text-pp-ink">
                  {puzzle
                    ? t(puzzleGoal(puzzle).key === "mateIn" ? "toMoveGoalMate" : "toMoveGoalBest", {
                        side: t(puzzle.side === "White" ? "sideWhite" : "sideBlack"),
                        count: puzzleGoal(puzzle).count,
                      })
                    : ""}
                </p>
              </Card>

              {/* One slot for what just happened. */}
              <div className="relative flex min-h-[76px] items-center" aria-live="polite">
                {solved ? (
                  <div className="st-enter flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-[#bfe4d8] bg-pp-green-soft px-4 py-3.5">
                    <span className="st-check-pop flex size-10 shrink-0 items-center justify-center rounded-full bg-pp-green text-white" aria-hidden>
                      <Check className="size-5" strokeWidth={3} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[15px] font-bold text-pp-ink">{ts("puzzleComplete")}</span>
                      {replay && <span className="text-[13px] font-semibold text-pp-green">{t3("solvedAgain")}</span>}
                    </span>
                  </div>
                ) : message ? (
                  <p
                    role="status"
                    className={`flex w-full items-center gap-2.5 rounded-2xl px-4 py-3.5 text-[15px] font-semibold ${
                      showWrong ? "st-enter bg-pp-red-soft text-pp-red" : "bg-pp-soft text-pp-ink"
                    }`}
                  >
                    {showWrong ? <X className="size-5 shrink-0" strokeWidth={3} aria-hidden /> : <Check className="size-5 shrink-0 text-pp-green" strokeWidth={3} aria-hidden />}
                    {message}
                  </p>
                ) : null}
              </div>

              <button type="button" onClick={resetPuzzle} className={`${secondaryPill} w-full`}>
                <RotateCcw className="size-4" aria-hidden /> {t("reset")}
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "profile" && <ProfileScreen data={data} />}

      {celebrate && (
        <DailyCompleteDialog
          onHome={() => {
            setCelebrate(false);
            go("home");
          }}
          onMore={openFreePlay}
        />
      )}
    </div>
  );
}
