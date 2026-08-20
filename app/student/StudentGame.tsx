"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Flame, LogOut, Star, X } from "lucide-react";
import { getMyLichess } from "@/lib/lichess";
import { LichessCard } from "@/components/student/LichessCard";
import { SignOutButton } from "@/components/SignOutButton";
import {
  PUZZLES,
  PIECE_GLYPH,
  isWhite,
  legalMovesFor,
  type Board,
  type Square,
} from "@/lib/student-game";

type Screen = "home" | "puzzles" | "puzzle" | "profile";


/* Shared kawaii button chrome: peach pill with double outline. */
const peachBtn =
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

/* Living-room props shared by the home and feed screens. */
function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-[18px] bg-sv-cream px-3.5 py-3 shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sv-gold text-sv-ink">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[17px] font-bold leading-none">{value}</span>
        <span className="truncate text-[11.5px] text-sv-body">{label}</span>
      </span>
    </div>
  );
}

function HomeAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] flex-1 items-center justify-center rounded-[18px] bg-sv-cream text-[15px] font-bold text-sv-ink shadow-[inset_0_0_0_1.5px_rgb(206,219,236)] transition-colors duration-150 hover:bg-sv-gold"
    >
      {label}
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
  const [puzzlesSolved, setPuzzlesSolved] = useState([false, false, false]);
  const [board, setBoard] = useState<Board>(() => PUZZLES[0].build());
  const [selected, setSelected] = useState<Square | null>(null);
  const [solved, setSolved] = useState(false);
  const [showWrong, setShowWrong] = useState(false);
  const [message, setMessage] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [streak, setStreak] = useState(7);
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
                if (self?.streak_count != null) setStreak(self.streak_count);
                if (self) setRecord(self);
              },
            );
        }
      })
      .catch(() => {});
  }, []);

  /* The day's win is recorded server-side; failures stay silent in the game. */
  const reportPractice = () => {
    if (!studentId) return;
    fetch("/api/practice-activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        activity_date: new Date().toISOString().slice(0, 10),
        puzzles_completed: 3,
        minutes_practiced: 10,
        points_earned: 30,
        streak_count: streak + 1,
      }),
    }).catch(() => {});
  };

  /* Feed-screen state */
  const autoNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const solvedCount = puzzlesSolved.filter(Boolean).length;
  const isDailyDone = solvedCount >= 3;

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
    setPuzzleIndex(index);
    setBoard(PUZZLES[index].build());
    setSelected(null);
    setSolved(false);
    setShowWrong(false);
    setMessage("");
    setScreen("puzzle");
  };

  const resetPuzzle = () => {
    setBoard(PUZZLES[puzzleIndex].build());
    setSelected(null);
    setSolved(false);
    setShowWrong(false);
    setMessage("");
  };

  const select = (r: number, c: number) => {
    if (solved) return;
    const SOLUTION = { from: PUZZLES[puzzleIndex].from, to: PUZZLES[puzzleIndex].to };
    if (selected) {
      const [sr, sc] = selected;
      const legal = legalMovesFor(board, sr, sc);
      if (legal.some(([lr, lc]) => lr === r && lc === c)) {
        const newBoard = board.map((row) => row.slice());
        newBoard[r][c] = newBoard[sr][sc];
        newBoard[sr][sc] = null;
        const isSolution =
          sr === SOLUTION.from[0] && sc === SOLUTION.from[1] && r === SOLUTION.to[0] && c === SOLUTION.to[1];
        if (isSolution) {
          const nextSolved = puzzlesSolved.slice();
          nextSolved[puzzleIndex] = true;
          setBoard(newBoard);
          setSelected(null);
          setSolved(true);
          setShowWrong(false);
          setMessage(t("checkmateMsg"));
          setPuzzlesSolved(nextSolved);
          setTimeout(() => {
            if (puzzleIndex < PUZZLES.length - 1) {
              loadPuzzle(puzzleIndex + 1);
            } else {
              reportPractice();
              setCelebrate(true);
            }
          }, 1400);
        } else {
          setBoard(newBoard);
          setSelected(null);
          setShowWrong(true);
          setMessage(t("wrongMsg"));
          setTimeout(() => {
            setBoard(PUZZLES[puzzleIndex].build());
            setShowWrong(false);
            setMessage("");
          }, 1200);
        }
        return;
      }
      const piece = board[r][c];
      setSelected(piece && isWhite(piece) ? [r, c] : null);
      return;
    }
    const piece = board[r][c];
    if (piece && isWhite(piece)) setSelected([r, c]);
  };

  const legal = selected ? legalMovesFor(board, selected[0], selected[1]) : [];

  const navItems = [
    { key: "home", active: screen === "home", color: screen === "home" ? "rgb(36,65,124)" : "rgb(53,85,117)" },
    {
      key: "puzzles",
      active: screen === "puzzles" || screen === "puzzle",
      color: screen === "puzzles" || screen === "puzzle" ? "rgb(58,93,165)" : "rgb(36,65,124)",
    },
    { key: "profile", active: screen === "profile", color: screen === "profile" ? "rgb(53,85,117)" : "rgb(36,65,124)" },
  ] as const;

  return (
    <div className="relative h-[844px] w-[390px] shrink-0 overflow-hidden bg-sv-paper text-sv-ink sm:rounded-[36px] sm:shadow-[0_20px_60px_rgba(36,65,124,0.28)]">
      {/* The academy's own colours rather than a picture of a room. The cottage
          art was warm raster and no palette change could reach it. */}
      <div className="absolute inset-x-0 top-0 h-[300px] bg-[linear-gradient(180deg,#24417C_0%,#3A5DA5_58%,#F7FAFD_100%)]" />

      {/* The Lichess rating, synced. Absent rather than zero when there is no
          linked account: a rating of 0 is a claim about how well a child plays,
          and an empty corner is not. */}
      {rating && (
        <div className="absolute right-5 top-12 flex items-center gap-1.5 rounded-[20px] bg-sv-cream px-3 py-1.5 shadow-[inset_0_0_0_1px_rgb(206,219,236)]">
          <Star className="size-[15px] fill-sv-accent text-sv-accent" strokeWidth={1.5} />
          <span className="text-sm font-bold">{rating.value}</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-sv-body">
            {tl(`perf.${rating.perf}`)}
          </span>
        </div>
      )}

      {/* ---------------- HOME ---------------- */}
      {screen === "home" && (
        /* Laid out in flow, not at absolute coordinates. The old home screen
           pinned its one card to top-449 because a cat and a sofa occupied
           everything above it; with those gone the same coordinates left a
           320px hole between the heading and the card. */
        <div className="absolute inset-x-0 bottom-[104px] top-0 flex flex-col gap-3.5 overflow-y-auto px-[25px] pb-4 pt-[44px]">
          <h1 className="font-sv-display text-[32px] font-normal leading-tight text-white">
            {t("home")}
          </h1>
          <p className="-mt-2 text-sm font-bold text-white/85">
            {record?.name ?? me?.displayName ?? ""}
          </p>

          <div className="mt-1 flex gap-3.5">
            <StatTile label={t("streakLabel")} value={String(streak)} icon={<Flame className="size-[18px]" strokeWidth={2.4} />} />
            <StatTile label={t("dailyChallenge")} value={`${solvedCount}/3`} icon={<PuzzlePieceIcon fill="rgb(36,65,124)" size={18} />} />
          </div>

          {/* Daily challenge */}
          <div className="rounded-[20px] bg-sv-gold p-2.5 shadow-[inset_0_0_0_2px_rgb(206,219,236)]">
            <div className="flex flex-col items-center gap-2.5 rounded-[16px] bg-sv-cream px-4 py-5">
              <h2 className="text-center text-[22px] font-bold">
                {isDailyDone ? t("missionComplete") : t("dailyChallenge")}
              </h2>
              <span className="text-center text-sm font-bold text-sv-body">
                {isDailyDone ? t("keepStreak") : t("puzzlesCount", { n: solvedCount })}
              </span>
              <button
                onClick={() => go("puzzles")}
                className={`${peachBtn} mt-1 flex min-h-[44px] w-[181px] items-center justify-center gap-2 text-base`}
              >
                {isDailyDone ? <PuzzlePieceIcon fill="#fff" size={18} /> : null}
                <span>{isDailyDone ? t("freePlay") : t("start")}</span>
              </button>
            </div>
          </div>

          {/* The two things a pupil comes here to do, rather than a blank
              stretch of wall where the cat used to sit. */}
          <div className="flex gap-3.5">
            <HomeAction href="/student/play" label={tp("title")} />
            <HomeAction href="/student/challenge" label={tch("title")} />
          </div>
        </div>
      )}

      {screen === "puzzles" && (
        <>
          <h1 className="absolute left-[25px] top-[43px] font-sv-display text-[32px] font-normal text-white">{t("puzzles")}</h1>
          <div className="absolute left-[18px] top-[126px] h-[604px] w-[354px] overflow-hidden rounded-3xl bg-sv-gold p-[18px] shadow-[inset_0_0_0_2px_rgb(206,219,236),0_4px_10px_rgba(125,87,50,0.35)]">
            {/* Tabs */}
            <div className="flex h-12 w-full gap-1 rounded-3xl bg-sv-cream p-1 shadow-[inset_0_0_0_1.5px_rgb(206,219,236)]">
              {(
                [
                  ["daily", t("daily")],
                  ["free", t("freePlay")],
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[20px] border-none text-[15px] font-bold"
                  style={{
                    background: tab === k ? "#fff" : "transparent",
                    boxShadow: tab === k ? "inset 0 0 0 1.5px rgb(206,219,236)" : "none",
                    /* The inactive tab changes colour rather than fading: navy
                       at 60% opacity measures 3.33:1 on white. */
                    color: tab === k ? "rgb(36,65,124)" : "rgb(53,85,117)",
                  }}
                >
                  {k === "daily" ? (
                    <Flame className="size-[18px]" strokeWidth={2.4} style={{ color: tab === "daily" ? "rgb(36,65,124)" : "rgb(53,85,117)" }} />
                  ) : (
                    <PuzzlePieceIcon fill={tab === "free" ? "rgb(58,93,165)" : "rgb(36,65,124)"} size={18} />
                  )}
                  <span>{lbl}</span>
                </button>
              ))}
            </div>
            {/* Cards */}
            <div className="mt-[18px] flex flex-col gap-3.5">
              {tab === "daily"
                ? [0, 1, 2].map((i) => (
                    <button
                      key={i}
                      onClick={() => loadPuzzle(i)}
                      className="flex h-[78px] w-full cursor-pointer items-center gap-4 rounded-[18px] border-none bg-sv-cream px-5 text-left shadow-[inset_0_0_0_1px_rgb(206,219,236)]"
                    >
                      <span className="flex text-[rgb(36,65,124)]">
                        <span className="-mr-1.5 text-3xl">♟</span>
                        <span className="text-3xl">♜</span>
                      </span>
                      <span className="flex-1 text-base font-bold text-sv-ink">{t("puzzleN", { n: i + 1 })}</span>
                      {puzzlesSolved[i] ? (
                        <Check className="size-5 text-[rgb(47,107,79)]" strokeWidth={3} />
                      ) : (
                        <span className="text-base font-bold text-sv-ink">x1</span>
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
                      className="flex h-[78px] w-full cursor-pointer items-center gap-4 rounded-[18px] bg-sv-cream px-5 shadow-[inset_0_0_0_1px_rgb(206,219,236)]"
                    >
                      <span className="flex text-[rgb(36,65,124)]">
                        <span className="-mr-1.5 text-3xl">♟</span>
                        <span className="text-3xl">♜</span>
                      </span>
                      <span className="flex-1 text-base font-bold text-sv-ink">{title}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: n }, (_, i) => (
                          <Star key={i} className="size-[18px] fill-[#f2b632] text-[#c78a1d]" strokeWidth={1.5} />
                        ))}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </>
      )}

      {/* ---------------- PUZZLE BOARD ---------------- */}
      {screen === "puzzle" && (
        <>
          <button onClick={() => go("puzzles")} aria-label={t("back")} className="absolute left-5 top-[46px] z-[2] cursor-pointer border-none bg-transparent text-[22px] font-bold text-sv-ink">
            ←
          </button>
          <h1 className="absolute top-[44px] w-[390px] text-center font-sv-display text-[26px] font-normal text-white">
            {t("puzzleN", { n: puzzleIndex + 1 })}
          </h1>
          {/* Sits on the navy wash with the heading, so it is white like the
              heading — `sv-body` here measured 3.9 luminance spread, i.e. gone. */}
          <div className="absolute top-[103px] w-[390px] text-center text-[13px] font-bold text-white/90">{t("whiteToMove")}</div>

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
                    const r = Math.floor(idx / 8);
                    const c = idx % 8;
                    const isSelected = selected?.[0] === r && selected?.[1] === c;
                    const isLegal = legal.some(([lr, lc]) => lr === r && lc === c);
                    const piece = board[r][c];
                    const isCapture = isLegal && !!piece;
                    const bg = isSelected
                      ? "rgb(220,232,248)"
                      : (r + c) % 2 === 0
                        ? "var(--color-sv-board-light)"
                        : "var(--color-sv-board-dark)";
                    return (
                      <button
                        key={idx}
                        onClick={() => select(r, c)}
                        className="relative flex size-[34px] cursor-pointer items-center justify-center border-none p-0"
                        style={{ background: bg }}
                      >
                        {piece && (
                          <span
                            className="select-none text-2xl leading-none"
                            style={{
                              color: isWhite(piece) ? "var(--color-sv-piece-white)" : "var(--color-sv-piece-black)",
                              textShadow: isWhite(piece) ? "1px 1px 0 rgb(36,65,124)" : "none",
                            }}
                          >
                            {PIECE_GLYPH[piece]}
                          </span>
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

            <button onClick={resetPuzzle} className={`${peachBtn} mt-4 px-[26px] py-2.5 text-sm`}>
              {t("reset")}
            </button>
          </div>
        </>
      )}

      {/* ---------------- PROFILE ---------------- */}
      {screen === "profile" && (
        <>
          <h1 className="absolute left-[21px] top-[51px] font-sv-display text-[32px] font-normal text-white">{t("profile")}</h1>
          {/* A scrolling column rather than a stack of absolute positions.
              Every card here used to be pinned to a measured offset, which
              meant nothing could be added without moving all of them — and
              there was no room left below the streak anyway. */}
          <div className="absolute inset-x-0 bottom-[110px] top-[100px] flex flex-col items-center gap-4 overflow-y-auto px-[15px] pb-4">
          <div className="h-[104px] w-[352px] shrink-0 rounded-[20px] bg-sv-gold shadow-[inset_0_0_0_2px_rgb(206,219,236),0_4px_4px_rgba(125,87,50,0.5)]">
            <div className="absolute left-2.5 top-[5px] flex h-[94px] w-[332px] items-center gap-3.5 rounded-[18px] bg-sv-cream pl-[18px] pr-3 shadow-[inset_0_0_0_1px_rgb(206,219,236)]">
              <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-sv-gold font-sv-display text-[22px] text-sv-ink shadow-[inset_0_0_0_1px_rgb(206,219,236)]">
                {(record?.name ?? me?.displayName ?? "?").trim().charAt(0).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-col items-start gap-1">
                <span className="max-w-full truncate text-base font-bold">
                  {record?.name ?? me?.displayName ?? "—"}
                </span>
                {/* An email is long and a phone is narrow, so it truncates
                    rather than pushing the badge off the card. */}
                <span className="max-w-full truncate text-[11.5px] text-sv-body">{me?.email ?? ""}</span>
                <span className="rounded-[20px] bg-sv-mint px-2.5 py-[3px] text-[11px] text-sv-mint-ink shadow-[inset_0_0_0_0.5px_rgb(137,187,169),0_0_0_0.5px_rgb(137,187,169)]">
                  {record?.current_level || t("beginner")}
                </span>
              </span>
            </div>
          </div>

          {/* Details worth checking: the id a teacher asks for, the rating, and
              when the academy last saw you. */}
          <div className="w-[352px] shrink-0 overflow-hidden rounded-[20px] bg-sv-gold p-2.5 shadow-[inset_0_0_0_2px_rgb(206,219,236),0_2px_4px_rgba(118,83,50,0.58)]">
            <div className="rounded-[16px] bg-sv-cream px-4 py-3 shadow-[inset_0_0_0_1px_rgb(206,219,236)]">
              {(
                [
                  [t("studentIdLabel"), studentId || "—"],
                  [t("ratingLabel"), record?.fide_rating ? String(record.fide_rating) : t("unrated")],
                  [t("lastAttendedLabel"), record?.last_attended_date || t("notYet")],
                ] as const
              ).map(([label, value], i) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 py-2"
                  style={{ borderTop: i === 0 ? "none" : "1px solid rgb(216,226,240)" }}
                >
                  <span className="text-[13px] text-sv-body">{label}</span>
                  <span className="max-w-[190px] truncate text-[13px] font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[196px] w-[352px] shrink-0 overflow-hidden rounded-[20px] bg-sv-gold shadow-[inset_0_0_0_2px_rgb(206,219,236),0_2px_4px_rgba(118,83,50,0.58)]">
            <div className="absolute left-5 top-5 flex items-center gap-1.5 text-base font-bold">
              <Flame className="size-[18px] fill-[#f28c33] text-[#d96c1e]" strokeWidth={1.5} />
              <span>{t("dayStreak", { n: streak })}</span>
            </div>
            <div className="absolute left-5 top-14 grid w-[312px] grid-cols-7 gap-2">
              {Array.from({ length: 21 }, (_, i) => (
                <span
                  key={i}
                  className="aspect-square w-full rounded-md"
                  style={{
                    /* Filled squares track the real streak rather than a fixed
                       seven, so a 3-day streak no longer draws a full week. */
                    background: i < Math.min(streak, 21) ? "rgb(220,232,248)" : "rgb(244,247,250)",
                    boxShadow: `inset 0 0 0 1px ${
                      i < Math.min(streak, 21) ? "rgba(207,132,40,0.6)" : "rgba(183,192,216,0.6)"
                    }`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* What the academy cannot otherwise see: the chess played at home. */}
          <LichessCard />

          <SignOutButton className="flex h-[54px] w-[352px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[20px] bg-sv-cream text-base font-bold text-sv-primary shadow-[inset_0_0_0_2px_rgb(206,219,236),0_2px_4px_rgba(118,83,50,0.4)] transition-transform active:translate-y-[2px] disabled:">
            <LogOut className="size-[18px]" />
            {tc("signOut")}
          </SignOutButton>
          </div>
        </>
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

      {/* Bottom nav. Profile sits last, as it does in every other portal —
          Play is a route rather than a screen, so it is rendered in place
          rather than driven by `go`. */}
      <nav className="absolute left-[25px] top-[750px] flex h-[70px] w-[340px] items-center justify-around rounded-[25px] bg-sv-cream shadow-[inset_0_0_0_1.25px_rgb(216,226,240),0_0_0_1.25px_rgb(216,226,240)]">
        {navItems.map((item) => (
          <Fragment key={item.key}>
            {/* A game deserves a URL, so a player who reloads mid-game lands
                back at the board rather than the home screen. */}
            {item.key === "profile" && (
              <Link
                href="/student/challenge"
                aria-label={tch("title")}
                className="flex size-[34px] items-center justify-center rounded-full"
              >
                {/* Two crossed swords: the "play someone" idea, without an
                    emoji and without repeating the knight used for Play. */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(36,65,124)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 14.5 21 21M21 3l-8 8M3 21l8-8M9.5 9.5 3 3" />
                  <path d="M18 3h3v3M6 3H3v3" />
                </svg>
              </Link>
            )}
            {item.key === "profile" && (
              <Link
                href="/student/play"
                aria-label={tp("title")}
                className="flex size-[34px] items-center justify-center rounded-full"
              >
                {/* Knight — the piece a child draws when asked to draw chess. */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 21h9v-1.6c0-4.2-1.5-5.6-3.4-7.1l1.1-2.2-2.4 1.1-1.6-1.9 3-2.6-1-2.2L9.6 6 8.2 4.3 7 6.6 5.4 9.9c-.5 1 .1 2.1 1.2 2.2l1.6.2-1.5 2.4c-.5.9-.7 1.9-.7 2.9V21z"
                    fill="rgb(36,65,124)"
                    stroke="rgb(36,65,124)"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
            <button
              onClick={() => go(item.key as Screen)}
              aria-label={t(item.key)}
              className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-none"
              style={{ background: item.key === "profile" && item.active ? "rgb(220,232,248)" : "transparent" }}
            >
              {item.key === "home" && (
                <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
                  <path d="M13 1.5L2 10.5V22.5H10V15.5H16V22.5H24V10.5L13 1.5Z" fill={item.color} stroke={item.color} strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              )}
              {item.key === "puzzles" && <PuzzlePieceIcon fill={item.color} size={26} />}
              {item.key === "profile" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10.5" stroke={item.color} strokeWidth="1.6" />
                  <circle cx="12" cy="9.5" r="3.2" fill={item.color} />
                  <path d="M4.5 19C5.8 15.8 8.6 14.5 12 14.5C15.4 14.5 18.2 15.8 19.5 19" stroke={item.color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              )}
            </button>
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
