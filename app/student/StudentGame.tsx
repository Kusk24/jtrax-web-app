"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  Flame,
  Gamepad2,
  GraduationCap,
  Home,
  LogOut,
  Puzzle,
  Star,
  Swords,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { getMyLichess } from "@/lib/lichess";
import { fetchLiveTournaments, type LiveTournament } from "@/lib/live-tournaments";
import { LichessCard } from "@/components/student/LichessCard";
import { SignOutButton } from "@/components/SignOutButton";
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
  getPracticeSummary,
  puzzleGoal,
  type DailyPuzzle,
  type PracticeSummary,
} from "@/lib/puzzles";
import type { Chess } from "chess.js";

type Square = [number, number];

type Screen = "home" | "puzzles" | "puzzle" | "profile";


/* Shared button chrome: navy pill with a double outline. */
const actionBtn =
  "cursor-pointer rounded-[20px] border-none bg-sv-primary font-bold text-white shadow-[inset_0_0_0_1.25px_rgb(27,50,96),0_0_0_1.25px_rgb(27,50,96)]";

function PuzzlePieceIcon({ fill, size = 20 }: { fill: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <path
        d="M9 2H14V5.2C14 6 14.6 6.5 15.3 6.3C15.7 6.15 16.15 6.05 16.6 6.05C18.5 6.05 20 7.55 20 9.45C20 9.9 19.9 10.35 19.75 10.75C19.55 11.45 20.05 12.05 20.85 12.05H24V17H20.85C20.05 17 19.55 17.6 19.75 18.3C19.9 18.7 20 19.15 20 19.6C20 21.5 18.5 23 16.6 23C16.15 23 15.7 22.9 15.3 22.75C14.6 22.55 14 23.05 14 23.85V24H9V19.5C9 18.6 8.15 18.05 7.35 18.4C6.95 18.55 6.55 18.65 6.1 18.65C4.2 18.65 2.7 17.15 2.7 15.25C2.7 13.35 4.2 11.85 6.1 11.85C6.55 11.85 6.95 11.95 7.35 12.1C8.15 12.45 9 11.9 9 11V2Z"
        fill={fill}
      />
    </svg>
  );
}

/* Compact stat cards shared by the reference home and profile screens. */
function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[15px] border border-[#dce8f8] bg-white px-3 py-2.5 shadow-[0_6px_18px_rgba(37,99,235,.07)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4ff] text-[#2563eb]">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[16px] font-bold leading-none text-[#10264d]">{value}</span>
        <span className="mt-1 truncate text-[10.5px] font-semibold text-[#7083a3]">{label}</span>
      </span>
    </div>
  );
}

function HomeAction({
  href,
  label,
  body,
  icon,
  tone,
}: {
  href: string;
  label: string;
  body: string;
  icon: React.ReactNode;
  tone: "mint" | "lilac";
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[116px] min-w-0 flex-1 flex-col items-start justify-between rounded-[18px] border p-3.5 text-[#10264d] shadow-[0_8px_22px_rgba(37,99,235,.06)] transition-colors duration-150 ${
        tone === "mint"
          ? "border-[#c7eadf] bg-[#ebfaf5] hover:bg-[#ddf7ee]"
          : "border-[#e2d9fb] bg-[#f3efff] hover:bg-[#ebe4ff]"
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-[13px] bg-white shadow-[0_3px_10px_rgba(37,99,235,.09)]">
        {icon}
      </span>
      <span>
        <span className="block text-[14px] font-bold">{label}</span>
        <span className="mt-0.5 block text-[10.5px] leading-snug text-[#7083a3]">{body}</span>
      </span>
    </Link>
  );
}

export default function StudentGame() {
  const t = useTranslations("sv2");
  const tc = useTranslations("common");
  const tp = useTranslations("play");
  const tch = useTranslations("challenge");
  const tl = useTranslations("lichess");

  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<"daily" | "free">("daily");
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  /* Today's set, from the academy's bank, matched to this pupil's rating.
     Empty until it loads; `exhausted` means every puzzle in the bank has been
     set to them before — they are never repeated. */
  const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);
  /* The position as chess.js sees it, so the board obeys real rules rather
     than the mate-in-1 toy the three hard-coded puzzles used. */
  const [game, setGame] = useState<Chess | null>(null);
  /* The pupil's own moves in this puzzle, which is what the grader wants —
     it replays the opponent from its copy of the solution. */
  const [played, setPlayed] = useState<string[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [solved, setSolved] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [message, setMessage] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [studentId, setStudentId] = useState("");
  /* Derived by the server from the days actually practised. It used to start
     at a hard-coded 7, so a pupil with no data was shown a week they had
     never earned. */
  const [practice, setPractice] = useState<PracticeSummary | null>(null);

  const streak = practice?.streak ?? 0;
  const puzzle = puzzles[puzzleIndex];
  /* Rank 8 first when the pupil is White; flipped when they are Black, so the
     pieces they move are always the ones nearest them. */
  const flipped = puzzle?.side === "Black";
  const grid: BoardGrid = game ? toGrid(game) : Array.from({ length: 8 }, () => Array(8).fill(null));
  const view = (r: number, c: number): [number, number] => (flipped ? [7 - r, 7 - c] : [r, c]);
  /* The profile card used to hard-code "Mochi" and "Beginner" — the cat's name
     and a guess. This is the signed-in account. */
  const [me, setMe] = useState<{ displayName: string; email: string } | null>(null);
  const [record, setRecord] = useState<{
    name?: string;
    current_level?: string;
    fide_rating?: number;
    last_attended_date?: string;
  } | null>(null);
  /* The one number in the corner, and it is real.
     It was two invented ones — 10 stars and 32 fish, both hard-coded — sitting
     where a child would reasonably read them as something they had earned. */
  const [rating, setRating] = useState<{ perf: string; value: number } | null>(null);
  /* The school's live tournament, when there is one — the banner points at the
     public results page, the same link the hall's QR code carries. */
  const [liveTournament, setLiveTournament] = useState<LiveTournament | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLiveTournaments().then((list) => {
      if (!cancelled && list.length > 0) setLiveTournament(list[0]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* One rating, chosen the way a coach would introduce a child: rapid is the
     format the academy actually plays, so it leads, and the others stand in
     only when there is no rapid game yet. Puzzle is deliberately last — it is
     not a measure of playing strength. */
  useEffect(() => {
    let cancelled = false;
    getMyLichess()
      .then((mine) => {
        if (cancelled || !mine.linked) return;
        const order = ["rapid", "blitz", "classical", "bullet", "puzzle"];
        const best = [...mine.link.ratings]
          .filter((r) => r.rating > 0)
          .sort((a, b) => order.indexOf(a.perf) - order.indexOf(b.perf))[0];
        if (best) setRating({ perf: best.perf, value: best.rating });
      })
      .catch(() => {
        /* No link, or a cold API. The corner simply stays empty. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (me) setMe({ displayName: me.displayName, email: me.email });
        if (me?.studentId) {
          setStudentId(me.studentId);
          fetch("/api/students", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : []))
            .then(
              (
                rows: {
                  student_id: string;
                  name?: string;
                  current_level?: string;
                  fide_rating?: number;
                  last_attended_date?: string;
                  streak_count?: number;
                }[],
              ) => {
                // The scope on `students` means this list is only ever the
                // caller's own row, but find by id rather than take [0].
                const self = rows.find((row) => row.student_id === me.studentId);
                if (self) setRecord(self);
              },
            );
        }
      })
      .catch(() => {});
  }, []);

  /* Today's puzzles and the practice record behind the flame. Both are server
     truth: the set is chosen there and the streak is derived there. */
  const refreshPractice = () => {
    getPracticeSummary()
      .then(setPractice)
      .catch(() => {});
  };

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
    getPracticeSummary()
      .then((p) => !cancelled && setPractice(p))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  /* Feed-screen state */
  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const solvedCount = puzzles.filter((p) => p.solved).length;
  const isDailyDone = puzzles.length > 0 && solvedCount >= puzzles.length;

  const go = (s: Screen) => {
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    setScreen(s);
  };

  /* Coming back from Lichess lands on this route, but the card that sent them
     there lives on the profile screen — and screens here are state, not routes.
     Without this a pupil returns from granting access to the home screen and
     sees nothing at all confirming it worked. */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("screen");
    if (wanted === "puzzles" || wanted === "profile") setScreen(wanted);
    if (new URLSearchParams(window.location.search).has("lichess")) {
      setScreen("profile");
    }
  }, []);

  const loadPuzzle = (index: number) => {
    const p = puzzles[index];
    // Starts the clock server-side. Only the first open counts, so coming back
    // after a wrong answer continues the same sitting.
    if (p && !p.solved) void openPuzzle(p.puzzleId);
    setPuzzleIndex(index);
    setGame(p ? gameAt(p.fen) : null);
    setPlayed([]);
    setSelected(null);
    setSolved(p?.solved ?? false);
    setShowWrong(false);
    setMessage("");
    setScreen("puzzle");
  };

  const resetPuzzle = () => {
    const p = puzzles[puzzleIndex];
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
    const p = puzzles[puzzleIndex];
    if (!p || !game) return;
    setSelected(null);
    let verdict;
    try {
      verdict = await attemptMove(p.puzzleId, uci, played);
    } catch {
      setMessage(tp("error.unreachable"));
      return;
    }

    /* The server returns the position after the move and any reply, so the
       board follows its view rather than replaying the reply here. */
    const next = gameAt(verdict.fen);
    if (next) setGame(next);

    if (!verdict.correct) {
      setShowWrong(true);
      setMessage(t("wrongMsg"));
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
      return;
    }

    setSolved(true);
    setMessage(t("checkmateMsg"));
    setPuzzles((prev) =>
      prev.map((row, i) => (i === puzzleIndex ? { ...row, solved: true } : row)),
    );
    // The practice row was just written server-side by the grader, so the
    // flame is re-read rather than guessed at.
    refreshPractice();
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
    if (solved || !game || !puzzle) return;
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

  const name = record?.name ?? me?.displayName ?? "";
  const firstName = name.trim().split(/\s+/)[0] || name;

  return (
    <div className="relative h-[844px] w-[390px] shrink-0 overflow-hidden bg-[#eef5ff] text-[#10264d] sm:rounded-[32px] sm:shadow-[0_24px_70px_rgba(30,64,175,.22)]">
      <div className="pointer-events-none absolute -right-20 -top-20 size-[250px] rounded-full bg-[radial-gradient(circle,#dbeafe_0%,rgba(219,234,254,0)_70%)]" />

      {screen !== "puzzle" && (
        <div className="absolute inset-x-0 top-0 z-10 flex h-[48px] items-end justify-center pb-1.5 text-[11px] font-semibold tracking-[.02em] text-[#60779c]">
          {t("brand")}
        </div>
      )}

      {/* The Lichess rating, synced. Absent rather than zero when there is no
          linked account: a rating of 0 is a claim about how well a child plays,
          and an empty corner is not. */}
      {rating && screen === "home" && (
        <div className="absolute right-5 top-[54px] z-10 flex items-center gap-1.5 rounded-full border border-[#dbe7f8] bg-white px-3 py-1.5 shadow-[0_5px_14px_rgba(37,99,235,.08)]">
          <Star className="size-[14px] fill-[#f4b942] text-[#d99a16]" strokeWidth={1.5} />
          <span className="text-sm font-bold">{rating.value}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7083a3]">
            {tl(`perf.${rating.perf}`)}
          </span>
        </div>
      )}

      {/* ---------------- HOME ---------------- */}
      {screen === "home" && (
        <div className="absolute inset-x-0 bottom-[72px] top-[48px] flex flex-col gap-3 overflow-y-auto px-4 pb-5 pt-3 [scrollbar-width:none]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-sv-display text-[24px] font-bold leading-tight text-[#10264d]">
                {t("greeting", { name: firstName })}
              </h1>
              <p className="mt-1 text-[11px] text-[#7083a3]">{t("greetingSub")}</p>
            </div>
            <button
              type="button"
              onClick={() => go("profile")}
              aria-label={t("profile")}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#dbeafe] font-sv-display text-[15px] font-bold text-[#2563eb] shadow-[0_6px_16px_rgba(37,99,235,.13)]"
            >
              {name.trim().charAt(0).toUpperCase() || "S"}
            </button>
          </div>

          <div className="flex gap-2.5">
            <StatTile label={t("streakLabel")} value={String(streak)} icon={<Flame className="size-[18px] text-[#f59e0b]" strokeWidth={2.4} />} />
            <StatTile label={t("dailyChallenge")} value={`${solvedCount}/3`} icon={<Puzzle className="size-[18px]" strokeWidth={2.2} />} />
          </div>

          {/* Daily challenge */}
          <div className="relative overflow-hidden rounded-[20px] border border-[#f3dda9] bg-[#fff8e8] p-4 shadow-[0_8px_20px_rgba(180,120,20,.08)]">
            <div className="pointer-events-none absolute -right-5 -top-5 size-24 rounded-full bg-[#ffebae]" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-bold text-[#10264d]">
                  {isDailyDone ? t("missionComplete") : t("todaysChallenge")}
                </h2>
                <span className="mt-1 block text-[10.5px] text-[#8a6a28]">
                  {isDailyDone ? t("keepStreak") : t("challengeHint")}
                </span>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#ffd45c] shadow-[0_5px_14px_rgba(180,120,20,.16)]">
                <Trophy className="size-6 text-[#9a6800]" strokeWidth={2.2} />
              </span>
            </div>
            <div className="relative mt-3">
              <div className="flex items-center justify-between text-[10px] font-semibold text-[#6f7788]">
                <span>{t("puzzlesCount", { n: solvedCount })}</span>
                <span>{Math.round((solvedCount / 3) * 100)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f6e4aa]">
                <div className="h-full rounded-full bg-[#f4be2c] transition-[width] duration-300" style={{ width: `${(solvedCount / 3) * 100}%` }} />
              </div>
              <button
                onClick={() => go("puzzles")}
                className="mt-3 flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-[#2563eb] text-[12px] font-bold text-white shadow-[0_7px_16px_rgba(37,99,235,.2)]"
              >
                <span>{isDailyDone ? t("freePlay") : t("startChallenge")}</span>
                <ChevronRight className="size-4" strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {/* The two things a pupil comes here to do, rather than a blank
              stretch of wall where the cat used to sit. */}
          <div className="flex gap-2.5">
            <HomeAction
              href="/student/play"
              label={tp("title")}
              body={t("practiceComputer")}
              tone="mint"
              icon={<Bot className="size-5 text-[#15906b]" strokeWidth={2.2} />}
            />
            <HomeAction
              href="/student/challenge"
              label={t("playFriend")}
              body={t("playTogether")}
              tone="lilac"
              icon={<Swords className="size-5 text-[#7457d7]" strokeWidth={2.2} />}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[12px] font-bold text-[#10264d]">{t("myProgress")}</h2>
              <button type="button" onClick={() => go("profile")} className="cursor-pointer border-none bg-transparent text-[10px] font-bold text-[#2563eb]">
                {t("viewAll")}
              </button>
            </div>
            <div className="flex gap-2.5">
              <StatTile label={t("ratingLabel")} value={rating ? String(rating.value) : t("unrated")} icon={<BarChart3 className="size-[18px]" strokeWidth={2.2} />} />
              <StatTile label={t("dailyChallenge")} value={`${solvedCount}/3`} icon={<Star className="size-[18px] text-[#f59e0b]" strokeWidth={2.1} />} />
            </div>
          </div>

          {liveTournament && (
            <Link
              href={`/t/${liveTournament.tournamentId}`}
              className="flex min-h-[52px] items-center gap-3 rounded-[18px] bg-sv-mint px-4 shadow-[inset_0_0_0_1.5px_rgb(143,191,168)] transition-colors duration-150 hover:brightness-[1.03]"
            >
              <span className="flex min-w-0 flex-1 flex-col py-2">
                <span className="text-[12px] font-bold uppercase tracking-wide text-sv-mint-ink">
                  {t("liveTournament")}
                </span>
                <span className="truncate text-[14px] font-bold text-sv-ink">{liveTournament.name}</span>
              </span>
              <span className="shrink-0 text-[13px] font-bold text-sv-mint-ink">{t("seeResults")}</span>
            </Link>
          )}
        </div>
      )}

      {screen === "puzzles" && (
        <div className="absolute inset-x-0 bottom-[72px] top-[48px] overflow-y-auto px-4 pb-5 pt-4 [scrollbar-width:none]">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-sv-display text-[27px] font-bold leading-none text-[#10264d]">{t("puzzles")}</h1>
              <p className="mt-1.5 text-[11px] text-[#7083a3]">{t("puzzlesSub")}</p>
            </div>
            <Puzzle className="mb-1 size-10 fill-[#bfe0ff] text-[#79b7ee]" strokeWidth={1.8} />
          </div>

          <div className="mt-4">
            {/* Tabs */}
            <div className="flex h-11 w-full gap-1.5 rounded-[14px] bg-[#dce9f8] p-1">
              {(
                [
                  ["daily", t("daily")],
                  ["free", t("freePlay")],
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[11px] border-none text-[12px] font-bold transition-colors"
                  style={{
                    background: tab === k ? "#2563eb" : "rgba(255,255,255,.78)",
                    boxShadow: tab === k ? "0 5px 12px rgba(37,99,235,.18)" : "none",
                    color: tab === k ? "white" : "#536b91",
                  }}
                >
                  {k === "daily" ? (
                    <Flame className="size-[16px]" strokeWidth={2.4} style={{ color: tab === "daily" ? "#ffd45c" : "#536b91" }} />
                  ) : (
                    <PuzzlePieceIcon fill={tab === "free" ? "white" : "#536b91"} size={16} />
                  )}
                  <span>{lbl}</span>
                </button>
              ))}
            </div>
            {/* Cards */}
            <div className="mt-3.5 rounded-[18px] border border-[#dce8f8] bg-white p-3 shadow-[0_8px_22px_rgba(37,99,235,.07)]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#10264d]">{tab === "daily" ? t("dailyChallenge") : t("freePlay")}</p>
                  <p className="mt-0.5 text-[10px] text-[#7083a3]">{t("puzzlesCount", { n: solvedCount })}</p>
                </div>
                <span className="flex size-8 items-center justify-center rounded-xl bg-[#edf4ff] text-[#2563eb]">
                  <Puzzle className="size-4" strokeWidth={2.2} />
                </span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#dce8f8]">
                <div className="h-full rounded-full bg-[#2563eb] transition-[width]" style={{ width: `${(solvedCount / 3) * 100}%` }} />
              </div>
              <div className="flex flex-col gap-2.5">
              {tab === "daily"
                ? loadingPuzzles
                  ? <p className="px-1 py-6 text-center text-[11px] text-[#8292ad]">{t("puzzlesLoading")}</p>
                  : puzzles.length === 0
                    ? (
                      <p className="px-3 py-6 text-center text-[11px] leading-relaxed text-[#8292ad]">
                        {exhausted ? t("puzzlesExhausted") : t("puzzlesUnavailable")}
                      </p>
                    )
                    : puzzles.map((p, i) => (
                    <button
                      key={p.puzzleId}
                      onClick={() => loadPuzzle(i)}
                      className="flex h-[62px] w-full cursor-pointer items-center gap-3 rounded-[14px] border border-[#e2ebf7] bg-white px-3 text-left shadow-[0_4px_12px_rgba(37,99,235,.05)] transition hover:border-[#bed5f5] hover:bg-[#f8fbff]"
                    >
                      <span className={`flex size-10 items-center justify-center rounded-xl ${i === 0 ? "bg-[#edf4ff]" : i === 1 ? "bg-[#ebfaf5]" : "bg-[#fff2ea]"}`}>
                        <span className="text-[22px] text-[#10264d]">{i === 0 ? "♟" : i === 1 ? "♞" : "♜"}</span>
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span className="text-[13px] font-bold text-[#10264d]">{t("puzzleN", { n: i + 1 })}</span>
                        <span className="text-[10px] text-[#8292ad]">
                          {p.solved ? t("solvedLabel") : t("ratingLabel", { rating: p.rating })}
                        </span>
                      </span>
                      {p.solved ? (
                        <span className="flex size-7 items-center justify-center rounded-full bg-[#e4f7ef]"><Check className="size-4 text-[#15906b]" strokeWidth={3} /></span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-[#edf4ff] px-2 py-1 text-[10px] font-bold text-[#2563eb]">+1 <Star className="size-3 fill-[#7eb6ff]" /></span>
                      )}
                    </button>
                  ))
                : (
                    [
                      [t("beginnerPuzzles"), 1],
                      [t("intermediatePuzzles"), 2],
                      [t("advancedPuzzles"), 3],
                    ] as const
                  ).map(([title, n]) => (
                    <div
                      key={title}
                      className="flex h-[62px] w-full cursor-pointer items-center gap-3 rounded-[14px] border border-[#e2ebf7] bg-white px-3 shadow-[0_4px_12px_rgba(37,99,235,.05)]"
                    >
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[#edf4ff] text-[22px] text-[#10264d]">
                        ♞
                      </span>
                      <span className="flex-1 text-[13px] font-bold text-[#10264d]">{title}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: n }, (_, i) => (
                          <Star key={i} className="size-[18px] fill-[#f2b632] text-[#c78a1d]" strokeWidth={1.5} />
                        ))}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- PUZZLE BOARD ---------------- */}
      {screen === "puzzle" && (
        <>
          <button onClick={() => go("puzzles")} aria-label={t("back")} className="absolute left-5 top-[46px] z-[2] cursor-pointer border-none bg-transparent text-[22px] font-bold text-sv-ink">
            ←
          </button>
          <h1 className="absolute top-[44px] w-[390px] text-center font-sv-display text-[26px] font-bold text-[#10264d]">
            {t("puzzleN", { n: puzzleIndex + 1 })}
          </h1>
          {/* Sits on the navy wash with the heading, so it is white like the
              heading — `sv-body` here measured 3.9 luminance spread, i.e. gone. */}
          {/* Whose move and what to look for, from this puzzle. The line used
              to read "White to move — mate in 1" for everything, which was true
              of the three hard-coded positions and of little else. */}
          <div className="absolute top-[103px] w-[390px] text-center text-[13px] font-bold text-[#60779c]">
            {puzzle
              ? t(puzzleGoal(puzzle).key === "mateIn" ? "toMoveGoalMate" : "toMoveGoalBest", {
                  side: t(puzzle.side === "White" ? "sideWhite" : "sideBlack"),
                  count: puzzleGoal(puzzle).count,
                })
              : ""}
          </div>

          {/* Opening a puzzle you have already solved used to give you a board
              that would not move and no word about why. The board is still
              locked — it is finished — but now it says so. Shown from `solved`,
              which is true both on reopening and the moment it is beaten. */}
          {solved && (
            <div className="absolute left-[31px] top-[136px] flex w-[328px] items-center gap-3 rounded-[16px] border border-[#bfe4d8] bg-[#ebfaf5] px-3.5 py-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#15906b]">
                <Check className="size-5 text-white" strokeWidth={3} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[14px] font-bold text-[#10264d]">{t("completedTitle")}</span>
                <span className="text-[11px] text-[#4a7f6d]">{t("completedBody")}</span>
              </span>
            </div>
          )}

          <div className="absolute left-[31px] top-[230px] flex w-[328px] flex-col items-center">
            <div className="relative mb-1 flex w-full justify-start">
              {message && (
                <div
                  className="absolute left-24 top-[-68px] z-[2] flex max-w-[210px] items-center gap-1.5 rounded-2xl px-3 py-2"
                  style={{
                    background: solved ? "rgb(226,240,233)" : "rgb(251,234,234)",
                    boxShadow: `inset 0 0 0 1.5px ${solved ? "rgb(206,219,236)" : "var(--color-sv-board-dark)"}`,
                  }}
                >
                  {solved && <Check className="size-[18px] text-sv-mint-ink" strokeWidth={3} />}
                  {showWrong && <X className="size-4 text-[rgb(176,63,58)]" strokeWidth={3} />}
                  <span className="text-xs font-bold">{message}</span>
                  <span
                    className="absolute bottom-3.5 left-[-6px] size-3 rotate-45 [clip-path:polygon(0_0,100%_100%,0_100%)]"
                    style={{
                      background: solved ? "rgb(226,240,233)" : "rgb(251,234,234)",
                      boxShadow: `inset 0 0 0 1.5px ${solved ? "rgb(206,219,236)" : "var(--color-sv-board-dark)"}`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="relative top-[-13px] rounded-[20px] bg-sv-gold p-2.5 shadow-[inset_0_0_0_2px_rgb(206,219,236),0_4px_10px_rgba(125,87,50,0.35)]">
              <div className="rounded-[14px] bg-sv-cream p-2 shadow-[inset_0_0_0_1px_rgb(206,219,236)]">
                <div className="grid grid-cols-[repeat(8,34px)] grid-rows-[repeat(8,34px)] overflow-hidden rounded-lg shadow-[0_0_0_2px_rgb(70,96,140)]">
                  {Array.from({ length: 64 }, (_, idx) => {
                    // Drawn in view coordinates; `view` maps them back to the
                    // board, which is turned round for a pupil playing Black.
                    const vr = Math.floor(idx / 8);
                    const vc = idx % 8;
                    const [r, c] = view(vr, vc);
                    const isSelected = selected?.[0] === r && selected?.[1] === c;
                    const isLegal = legal.some(([lr, lc]) => lr === r && lc === c);
                    const piece = grid[r][c];
                    const isCapture = isLegal && !!piece;
                    const bg = isSelected
                      ? "rgb(220,232,248)"
                      : (vr + vc) % 2 === 0
                        ? "var(--color-sv-board-light)"
                        : "var(--color-sv-board-dark)";
                    return (
                      <button
                        key={idx}
                        onClick={() => select(vr, vc)}
                        /* Named, like the squares on the shared board. Without
                           this the puzzle board was a grid of unlabelled
                           buttons — unreadable to a screen reader and
                           unaddressable to anything driving it. */
                        aria-label={squareName(r, c)}
                        className="relative flex size-[34px] cursor-pointer items-center justify-center border-none p-0"
                        style={{ background: bg }}
                      >
                        {piece && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={pieceSrc(piece.color, piece.type)}
                            alt=""
                            draggable={false}
                            className="pointer-events-none size-[30px] select-none"
                          />
                        )}
                        {isLegal &&
                          (isCapture ? (
                            <span className="absolute inset-0.5 rounded-md shadow-[inset_0_0_0_3px_rgba(207,132,40,0.85)]" />
                          ) : (
                            <span className="absolute size-[11px] rounded-full bg-[rgba(116,84,44,0.5)]" />
                          ))}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button onClick={resetPuzzle} className={`${actionBtn} mt-4 px-[26px] py-2.5 text-sm`}>
              {t("reset")}
            </button>
          </div>
        </>
      )}

      {/* ---------------- PROFILE ---------------- */}
      {screen === "profile" && (
        <div className="absolute inset-x-0 bottom-[72px] top-[48px] overflow-y-auto px-4 pb-5 pt-4 [scrollbar-width:none]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-sv-display text-[27px] font-bold leading-none text-[#10264d]">{t("profile")}</h1>
              <p className="mt-1.5 text-[10.5px] text-[#7083a3]">{t("profileSub")}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-[#f1dda8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#10264d] shadow-sm">
              <Trophy className="size-3.5 text-[#e2a51d]" /> {rating?.value ?? "—"}
            </span>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#1f6ae5,#2751bd)] p-4 text-white shadow-[0_12px_28px_rgba(37,99,235,.24)]">
            <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full border-[18px] border-white/5" />
            <div className="relative flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-[14px] border-2 border-[#ffd45c] bg-white/10 font-sv-display text-xl font-bold">
                {name.trim().charAt(0).toUpperCase() || "S"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-bold">{name || "—"}</span>
                <span className="mt-1 inline-flex rounded-full bg-[#55d6ad]/20 px-2 py-0.5 text-[9px] font-bold text-[#a8f3d8]">
                  {record?.current_level || t("beginner")}
                </span>
                <span className="ml-2 text-[9px] text-white/65">#{studentId || "—"}</span>
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-[16px] border border-[#f2dfaa] bg-[#fffaf0] px-2 py-3 text-center shadow-sm">
              <Flame className="mx-auto size-5 text-[#f59e0b]" />
              <strong className="mt-1 block text-[14px] text-[#10264d]">{streak}</strong>
              <span className="text-[9px] font-semibold text-[#7083a3]">{t("streakLabel")}</span>
            </div>
            <div className="rounded-[16px] border border-[#dce8f8] bg-white px-2 py-3 text-center shadow-sm">
              <Gamepad2 className="mx-auto size-5 text-[#2563eb]" />
              <strong className="mt-1 block text-[14px] text-[#10264d]">{solvedCount}</strong>
              <span className="text-[9px] font-semibold text-[#7083a3]">{t("puzzlesSolvedLabel")}</span>
            </div>
            <div className="rounded-[16px] border border-[#eadcf8] bg-[#fbf7ff] px-2 py-3 text-center shadow-sm">
              <GraduationCap className="mx-auto size-5 text-[#8b5bd7]" />
              <strong className="mt-1 block truncate text-[12px] text-[#10264d]">{record?.last_attended_date ? "1+" : "0"}</strong>
              <span className="text-[9px] font-semibold text-[#7083a3]">{t("classesLabel")}</span>
            </div>
          </div>

          <div className="mt-3 rounded-[18px] border border-[#dce8f8] bg-white p-3.5 shadow-[0_7px_20px_rgba(37,99,235,.06)]">
            <div className="flex items-center gap-2 text-[13px] font-bold text-[#10264d]">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#fff2e8]"><Flame className="size-4 text-[#f97316]" /></span>
              {t("dayStreak", { n: streak })}
            </div>
            <p className="ml-10 -mt-1 text-[9.5px] text-[#8292ad]">{t("streakHint")}</p>
            {/* The days the pupil actually practised, oldest first, each cell
                labelled with its own weekday. It used to light the first N of
                seven from the streak number, which drew a week nobody lived —
                a three-day streak always showed Mon-Tue-Wed. */}
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {(practice?.days ?? []).map((day) => {
                const weekday = new Date(day.date + "T00:00:00").getDay();
                return (
                  <span key={day.date} className="flex flex-col items-center gap-1">
                    <span className={`flex aspect-square w-full items-center justify-center rounded-[9px] text-[10px] font-bold ${day.practised ? "bg-[#fb812a] text-white" : "border border-[#e1e9f4] bg-[#f8fbff] text-[#a0aec0]"}`}>
                      {day.practised ? <Check className="size-3.5" strokeWidth={3} /> : Number(day.date.slice(8))}
                    </span>
                    <span className="text-[8px] font-semibold text-[#8b9ab1]">
                      {t(`weekday.${(weekday + 6) % 7}`)}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-3"><LichessCard /></div>

          <SignOutButton className="mt-3 flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] border border-[#dce8f8] bg-white text-[12px] font-bold text-[#2563eb] shadow-sm transition active:translate-y-px">
            <LogOut className="size-4" /> {tc("signOut")}
          </SignOutButton>
          </div>
      )}

      {/* All-solved celebration overlay */}
      {celebrate && (
        <button
          onClick={() => {
            setCelebrate(false);
            setScreen("puzzles");
          }}
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center border-none bg-[rgba(109,61,52,0.55)]"
        >
          <span className="mb-[18px] font-sv-display text-[30px] text-white">{t("allSolved")}</span>
          <span className="flex gap-[18px]">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="flex size-[70px] items-center justify-center"
                style={{ animation: `sv-fish-zoom 900ms ease-in-out ${delay}ms infinite alternate` }}
              >
                <PuzzlePieceIcon fill="#fff" size={54} />
              </span>
            ))}
          </span>
          <span className="mt-5 text-sm font-bold text-[rgba(255,255,255,0.85)]">{t("tapToContinue")}</span>
        </button>
      )}

      <nav className="absolute inset-x-0 bottom-0 z-10 grid h-[72px] grid-cols-5 border-t border-[#e1eaf6] bg-white px-2 pb-1 shadow-[0_-8px_24px_rgba(37,99,235,.04)]">
        <button type="button" onClick={() => go("home")} className={`flex cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent text-[8.5px] font-semibold ${screen === "home" ? "text-[#2563eb]" : "text-[#91a2bc]"}`}><Home className="size-[18px]" strokeWidth={screen === "home" ? 2.6 : 2} />{t("home")}</button>
        <button type="button" onClick={() => go("puzzles")} className={`flex cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent text-[8.5px] font-semibold ${screen === "puzzles" || screen === "puzzle" ? "text-[#2563eb]" : "text-[#91a2bc]"}`}><Puzzle className="size-[18px]" strokeWidth={screen === "puzzles" || screen === "puzzle" ? 2.6 : 2} />{t("puzzles")}</button>
        <Link href="/student/challenge" className="flex flex-col items-center justify-center gap-1 text-[8.5px] font-semibold text-[#91a2bc]"><Swords className="size-[18px]" strokeWidth={2} />{tch("title")}</Link>
        <Link href="/student/play" className="flex flex-col items-center justify-center gap-1 text-[8.5px] font-semibold text-[#91a2bc]"><Gamepad2 className="size-[18px]" strokeWidth={2} />{tp("title")}</Link>
        <button type="button" onClick={() => go("profile")} className={`flex cursor-pointer flex-col items-center justify-center gap-1 border-none bg-transparent text-[8.5px] font-semibold ${screen === "profile" ? "text-[#2563eb]" : "text-[#91a2bc]"}`}><UserRound className="size-[18px]" strokeWidth={screen === "profile" ? 2.6 : 2} />{t("profile")}</button>
      </nav>
    </div>
  );
}
