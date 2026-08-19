"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Flame, LogOut, Star, X } from "lucide-react";
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

type Screen = "home" | "feed" | "puzzles" | "puzzle" | "profile";

const FEED_RADIUS = 60;

/* Shared kawaii button chrome: peach pill with double outline. */
const peachBtn =
  "cursor-pointer rounded-[20px] border-none bg-sv-peach font-bold text-sv-brown shadow-[inset_0_0_0_1.25px_rgb(192,120,98),0_0_0_1.25px_rgb(192,120,98)]";

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
function RoomScene() {
  return (
    <>
      <Image src="/student/boyandcat.png" alt="" width={276} height={157} className="absolute left-[31px] top-[123px] h-[124px] w-[138px] object-contain" />
      <div className="absolute left-[236px] top-[200px] h-[10px] w-[163px] rounded-lg bg-[rgb(184,133,88)] shadow-[0_3px_4px_rgba(80,50,30,0.3)]" />
      <Image src="/student/clock.png" alt="" width={122} height={82} className="absolute left-[252px] top-[165px] h-[41px] w-[61px] object-contain" />
      <Image src="/student/trophy.png" alt="" width={126} height={164} className="absolute left-[307px] top-[138px] h-[82px] w-[63px] object-contain" />
      <Image src="/student/sofa.png" alt="" width={620} height={413} className="absolute left-[196px] top-[352px] w-[310px] max-w-none object-contain opacity-90" />
    </>
  );
}

function PawCorner({ pos }: { pos: string }) {
  return (
    <Image
      src="/student/paw.png"
      alt=""
      width={60}
      height={59}
      className={`absolute z-[4] size-[30px] object-contain ${pos}`}
    />
  );
}

export default function StudentGame() {
  const t = useTranslations("sv2");
  const tc = useTranslations("common");
  const tp = useTranslations("play");

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
  const stars = 10;
  const fishCount = 32;

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
  const [catState, setCatState] = useState<"idle" | "eating" | "celebrate">("idle");
  const [trayFish, setTrayFish] = useState([0, 1, 2]);
  const [mochiFed, setMochiFed] = useState(false);
  const [feedCelebrating, setFeedCelebrating] = useState(false);
  const [drag, setDrag] = useState<{ id: number; dx: number; dy: number; near: boolean } | null>(null);
  const [feedingId, setFeedingId] = useState<number | null>(null);
  const catRef = useRef<HTMLImageElement>(null);
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

  const onFishDown = (id: number, e: React.PointerEvent<HTMLImageElement>) => {
    e.preventDefault();
    const fishEl = e.currentTarget;
    const catEl = catRef.current;
    if (!fishEl || !catEl) return;
    const fishRect = fishEl.getBoundingClientRect();
    const catRect = catEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const fishCenterX = fishRect.left + fishRect.width / 2;
    const fishCenterY = fishRect.top + fishRect.height / 2;
    const mouthX = catRect.left + catRect.width * 0.5;
    const mouthY = catRect.top + catRect.height * 0.42;
    let near = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      near = Math.hypot(fishCenterX + dx - mouthX, fishCenterY + dy - mouthY) < FEED_RADIUS;
      setDrag({ id, dx, dy, near });
      setCatState(near ? "eating" : "idle");
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (near) {
        setFeedingId(id);
        setDrag(null);
        setCatState("eating");
        setTimeout(() => {
          setTrayFish((prev) => {
            const rest = prev.filter((f) => f !== id);
            if (rest.length === 0) {
              setMochiFed(true);
              setCatState("celebrate");
              setFeedCelebrating(true);
              setTimeout(() => setFeedCelebrating(false), 2000);
              autoNavTimer.current = setTimeout(() => setScreen("home"), 2800);
            } else {
              setCatState("idle");
            }
            return rest;
          });
          setFeedingId(null);
        }, 500);
      } else {
        setDrag(null);
        setCatState("idle");
      }
    };
    setDrag({ id, dx: 0, dy: 0, near: false });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const legal = selected ? legalMovesFor(board, selected[0], selected[1]) : [];

  const navItems = [
    { key: "home", active: screen === "home", color: screen === "home" ? "rgb(224,122,96)" : "rgb(109,61,52)" },
    {
      key: "puzzles",
      active: screen === "puzzles" || screen === "puzzle",
      color: screen === "puzzles" || screen === "puzzle" ? "rgb(180,140,214)" : "rgb(109,61,52)",
    },
    { key: "profile", active: screen === "profile", color: screen === "profile" ? "rgb(207,132,40)" : "rgb(109,61,52)" },
  ] as const;

  return (
    <div className="relative h-[844px] w-[390px] shrink-0 overflow-hidden bg-sv-paper text-sv-brown sm:rounded-[36px] sm:shadow-[0_20px_60px_rgba(80,50,30,0.35)]">
      {/* Room backdrop: wall texture + warm floor (original bg art lost past download cap). */}
      <div
        className="absolute inset-x-0 top-0 h-[520px] bg-cover bg-top"
        style={{ backgroundImage: "url('/student/wall.png')" }}
      />
      <div className="absolute inset-x-0 bottom-0 top-[520px] bg-[rgb(233,213,181)]" />
      <div className="absolute inset-x-0 top-[516px] h-[6px] bg-[rgba(184,133,88,0.45)]" />

      {/* Star / fish badge */}
      <div className="absolute right-5 top-12 flex items-center gap-1.5 rounded-[20px] bg-sv-cream px-3 py-1.5 shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]">
        <Star className="size-[15px] fill-[#f2b632] text-[#c78a1d]" strokeWidth={1.5} />
        <span className="text-sm font-bold">{stars}</span>
        <span className="h-3.5 w-px bg-[rgba(208,158,97,0.5)]" />
        <Image src="/student/fish.png" alt="fish" width={24} height={24} className="size-6 object-contain" />
        <span className="text-sm font-bold">{fishCount}</span>
      </div>

      {/* ---------------- HOME ---------------- */}
      {screen === "home" && (
        <>
          <h1 className="absolute left-[25px] top-[44px] font-sv-display text-[32px] font-normal">{t("home")}</h1>
          <RoomScene />
          <Image
            src={isDailyDone && mochiFed ? "/student/happy.png" : "/student/peek.png"}
            alt=""
            width={458}
            height={390}
            className="absolute left-[71px] top-[307px] h-[195px] w-[229px] max-w-none object-contain"
          />
          {/* Daily challenge card */}
          <div className="absolute left-[25px] top-[449px] h-[212px] w-[331px] rounded-[20px] bg-sv-gold shadow-[inset_0_0_0_2px_rgb(208,158,97),0_4px_10px_rgba(125,87,50,0.4)]">
            <PawCorner pos="left-2 top-2" />
            <PawCorner pos="right-2 top-2 -scale-x-100" />
            <PawCorner pos="bottom-2 left-2" />
            <PawCorner pos="bottom-2 right-2 -scale-x-100" />
            <div className="absolute left-[9px] top-[10px] h-48 w-[313px] rounded-[18px] bg-sv-cream shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]" />
            {!isDailyDone && (
              <>
                <div className="absolute top-5 w-[313px] text-center text-2xl font-bold">{t("dailyChallenge")}</div>
                <div className="absolute top-[76px] w-[313px] text-center text-base font-bold">
                  {t("puzzlesCount", { n: solvedCount })}
                </div>
                <div className="absolute left-0 top-[108px] flex w-[313px] items-center justify-center gap-3.5">
                  <span className="h-5 w-[30px]" />
                  {[0, 1].map((i) => (
                    <svg key={i} width="30" height="20" viewBox="0 0 30 20" fill="none">
                      <ellipse cx="14" cy="10" rx="10" ry="7" stroke="rgb(208,158,97)" strokeWidth="1.5" strokeDasharray="3 2" />
                      <path d="M24 10L29 5V15L24 10Z" stroke="rgb(208,158,97)" strokeWidth="1.5" strokeDasharray="3 2" strokeLinejoin="round" />
                      <circle cx="9" cy="8" r="1" fill="rgb(208,158,97)" />
                    </svg>
                  ))}
                  <Image src="/student/fish.png" alt="fish" width={54} height={40} className="absolute left-[88px] top-[-9px] z-[3] h-10 w-[54px] object-contain" />
                </div>
                <button onClick={() => go("puzzles")} className={`${peachBtn} absolute left-[81px] top-[145px] h-9 w-[151px] text-lg`}>
                  {t("start")}
                </button>
              </>
            )}
            {isDailyDone && !mochiFed && (
              <>
                <div className="absolute top-[26px] w-[313px] text-center text-[22px] font-bold">{t("mochiWaiting")}</div>
                <div className="absolute top-[76px] w-[313px] text-center text-[15px] font-bold opacity-85">{t("todaysMeal")}</div>
                <div className="absolute left-[46px] top-24 flex w-[221px] items-center justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <Image key={i} src="/student/fish.png" alt="fish" width={48} height={48} className="size-12 object-contain" />
                  ))}
                </div>
                <button onClick={() => go("feed")} className={`${peachBtn} absolute left-[81px] top-[145px] h-9 w-[151px] text-lg`}>
                  {t("feedMochiBtn")}
                </button>
              </>
            )}
            {isDailyDone && mochiFed && (
              <>
                {Array.from({ length: 14 }, (_, i) => {
                  const colors = ["rgb(255,179,157)", "rgb(255,227,135)", "rgb(180,140,214)", "rgb(137,187,169)", "rgb(224,122,96)"];
                  return (
                    <span
                      key={i}
                      className="absolute z-[1] size-2 opacity-90"
                      style={{
                        left: 8 + ((i * 23) % 300),
                        top: 6 + ((i * 37) % 190),
                        background: colors[i % colors.length],
                        borderRadius: i % 2 === 0 ? "50%" : "2px",
                        transform: `rotate(${(i * 53) % 360}deg)`,
                      }}
                    />
                  );
                })}
                <div className="absolute top-[30px] z-[2] w-[313px] text-center text-[22px] font-bold">{t("missionComplete")}</div>
                <div className="absolute top-[78px] z-[2] w-[313px] text-center text-sm font-bold opacity-85">{t("keepStreak")}</div>
                <button onClick={() => go("puzzles")} className={`${peachBtn} absolute left-[66px] top-32 z-[2] flex h-10 w-[181px] items-center justify-center gap-2 text-base`}>
                  <PuzzlePieceIcon fill="rgb(109,61,52)" />
                  <span>{t("freePlay")}</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ---------------- FEED ---------------- */}
      {screen === "feed" && (
        <>
          <button onClick={() => go("home")} aria-label={t("back")} className="absolute left-5 top-[46px] cursor-pointer border-none bg-transparent text-[22px] font-bold text-sv-brown">
            ←
          </button>
          <h1 className="absolute left-[60px] top-[44px] font-sv-display text-[32px] font-normal">{t("feedMochi")}</h1>
          <RoomScene />
          {/* Fish tray */}
          <div
            className="absolute left-[39px] top-[340px] flex h-[78px] w-[313px] items-center justify-center gap-[34px] rounded-[22px] bg-sv-cream shadow-[inset_0_0_0_1.5px_rgb(208,158,97)] transition-[opacity,transform] duration-500"
            style={{ opacity: mochiFed ? 0 : 1, transform: `scale(${mochiFed ? 0.9 : 1})`, pointerEvents: mochiFed ? "none" : "auto" }}
          >
            {trayFish.map((id) => {
              const isDragging = drag?.id === id;
              const isFeeding = feedingId === id;
              const scale = isFeeding ? 0 : isDragging && drag?.near ? 1.15 : 1;
              return (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={id}
                  src="/student/fish.png"
                  alt="fish"
                  onPointerDown={(e) => onFishDown(id, e)}
                  className="relative size-[34px] cursor-grab touch-none object-contain"
                  style={{
                    zIndex: isDragging ? 50 : 1,
                    transform: `translate(${isDragging ? drag.dx : 0}px, ${isDragging ? drag.dy : 0}px) scale(${scale})`,
                    transition: isDragging ? "transform 60ms linear" : "transform 220ms ease",
                    filter: isDragging ? "drop-shadow(0 6px 10px rgba(80,50,30,0.4))" : "none",
                  }}
                />
              );
            })}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={catRef}
            src={catState === "eating" ? "/student/eating.png" : "/student/cat1.png"}
            alt="Mochi"
            className="absolute left-[115px] top-[560px] size-40 object-contain"
            style={{ animation: catState === "celebrate" ? "sv-cat-bounce 700ms ease-in-out 2" : "none" }}
          />
          {mochiFed && (
            <>
              {feedCelebrating &&
                Array.from({ length: 18 }, (_, i) => {
                  const colors = ["rgb(255,179,157)", "rgb(255,227,135)", "rgb(248,246,235)", "rgb(255,214,224)", "rgb(255,200,150)"];
                  return (
                    <span
                      key={i}
                      className="absolute top-[-20px] z-[32] size-[9px] opacity-0"
                      style={{
                        left: `${(i * 21) % 100}%`,
                        background: colors[i % colors.length],
                        borderRadius: i % 3 !== 0 ? "50%" : "2px",
                        animation: `sv-confetti-fall ${1600 + (i % 5) * 150}ms ease-in ${(i * 130) % 1400}ms 1`,
                      }}
                    />
                  );
                })}
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[rgba(109,61,52,0.5)] [animation:sv-fade-in_400ms_ease]">
                <div className="w-[280px] rounded-3xl bg-sv-cream p-[32px_26px] text-center shadow-[inset_0_0_0_2px_rgb(208,158,97)] [animation:sv-pop-in_450ms_cubic-bezier(0.34,1.56,0.64,1)]">
                  <div className="mb-3 font-sv-display text-[26px]">{t("greatJob")}</div>
                  <div className="mb-[22px] text-[15px] font-bold leading-normal">{t("mochiFull")}</div>
                  <button onClick={() => go("home")} className={`${peachBtn} px-[30px] py-3 text-base`}>
                    {t("backToHome")}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ---------------- PUZZLES LIST ---------------- */}
      {screen === "puzzles" && (
        <>
          <h1 className="absolute left-[25px] top-[43px] font-sv-display text-[32px] font-normal">{t("puzzles")}</h1>
          <div className="absolute left-[18px] top-[156px] h-[450px] w-[354px] overflow-hidden rounded-3xl bg-sv-gold p-[18px] shadow-[inset_0_0_0_2px_rgb(208,158,97),0_4px_10px_rgba(125,87,50,0.35)]">
            {/* Tabs */}
            <div className="flex h-12 w-full gap-1 rounded-3xl bg-sv-cream p-1 shadow-[inset_0_0_0_1.5px_rgb(208,158,97)]">
              {(
                [
                  ["daily", t("daily")],
                  ["free", t("freePlay")],
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[20px] border-none text-[15px] font-bold text-sv-brown"
                  style={{
                    background: tab === k ? "#fff" : "transparent",
                    boxShadow: tab === k ? "inset 0 0 0 1.5px rgb(208,158,97)" : "none",
                    opacity: tab === k ? 1 : 0.6,
                  }}
                >
                  {k === "daily" ? (
                    <Image src="/student/fish.png" alt="" width={40} height={20} className="h-5 w-10 object-contain" />
                  ) : (
                    <PuzzlePieceIcon fill={tab === "free" ? "rgb(180,140,214)" : "rgb(109,61,52)"} size={18} />
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
                      className="flex h-[78px] w-full cursor-pointer items-center gap-4 rounded-[18px] border-none bg-sv-cream px-5 text-left shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]"
                    >
                      <span className="flex text-[rgb(40,32,30)]">
                        <span className="-mr-1.5 text-3xl">♟</span>
                        <span className="text-3xl">♜</span>
                      </span>
                      <span className="flex-1 text-base font-bold text-sv-brown">{t("puzzleN", { n: i + 1 })}</span>
                      <Image src="/student/fish.png" alt="fish" width={40} height={22} className="h-[22px] w-10 object-contain" />
                      {puzzlesSolved[i] ? (
                        <Check className="size-5 text-[rgb(36,163,110)]" strokeWidth={3} />
                      ) : (
                        <span className="text-base font-bold text-sv-brown">x1</span>
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
                      className="flex h-[78px] w-full cursor-pointer items-center gap-4 rounded-[18px] bg-sv-cream px-5 shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]"
                    >
                      <span className="flex text-[rgb(40,32,30)]">
                        <span className="-mr-1.5 text-3xl">♟</span>
                        <span className="text-3xl">♜</span>
                      </span>
                      <span className="flex-1 text-base font-bold text-sv-brown">{title}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: n }, (_, i) => (
                          <Star key={i} className="size-[18px] fill-[#f2b632] text-[#c78a1d]" strokeWidth={1.5} />
                        ))}
                      </span>
                    </div>
                  ))}
            </div>
            <Image src="/student/peek.png" alt="" width={208} height={178} className="absolute left-[253px] top-[382px] h-[89px] w-[104px] object-contain" />
          </div>
        </>
      )}

      {/* ---------------- PUZZLE BOARD ---------------- */}
      {screen === "puzzle" && (
        <>
          <button onClick={() => go("puzzles")} aria-label={t("back")} className="absolute left-5 top-[46px] z-[2] cursor-pointer border-none bg-transparent text-[22px] font-bold text-sv-brown">
            ←
          </button>
          <h1 className="absolute top-[44px] w-[390px] text-center font-sv-display text-[26px] font-normal">
            {t("puzzleN", { n: puzzleIndex + 1 })}
          </h1>
          <div className="absolute top-[103px] w-[390px] text-center text-[13px] font-bold opacity-85">{t("whiteToMove")}</div>

          <div className="absolute left-[31px] top-[230px] flex w-[328px] flex-col items-center">
            <div className="relative mb-1 flex w-full justify-start">
              <Image src="/student/cat1.png" alt="" width={164} height={190} className="absolute top-[-71px] z-[1] h-[95px] w-[82px] object-contain px-[9px]" />
              {message && (
                <div
                  className="absolute left-24 top-[-68px] z-[2] flex max-w-[210px] items-center gap-1.5 rounded-2xl px-3 py-2"
                  style={{
                    background: solved ? "rgb(249,230,173)" : "rgb(255,240,240)",
                    boxShadow: `inset 0 0 0 1.5px ${solved ? "rgb(208,158,97)" : "rgb(196,165,165)"}`,
                  }}
                >
                  {solved && <Image src="/student/trophy.png" alt="" width={44} height={57} className="size-[22px] object-contain" />}
                  {showWrong && <X className="size-4 text-[rgb(196,90,90)]" strokeWidth={3} />}
                  <span className="text-xs font-bold">{message}</span>
                  <span
                    className="absolute bottom-3.5 left-[-6px] size-3 rotate-45 [clip-path:polygon(0_0,100%_100%,0_100%)]"
                    style={{
                      background: solved ? "rgb(249,230,173)" : "rgb(255,240,240)",
                      boxShadow: `inset 0 0 0 1.5px ${solved ? "rgb(208,158,97)" : "rgb(196,165,165)"}`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="relative top-[-13px] rounded-[20px] bg-sv-gold p-2.5 shadow-[inset_0_0_0_2px_rgb(208,158,97),0_4px_10px_rgba(125,87,50,0.35)]">
              <div className="rounded-[14px] bg-sv-cream p-2 shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]">
                <div className="grid grid-cols-[repeat(8,34px)] grid-rows-[repeat(8,34px)] overflow-hidden rounded-lg shadow-[0_0_0_2px_rgb(116,84,44)]">
                  {Array.from({ length: 64 }, (_, idx) => {
                    const r = Math.floor(idx / 8);
                    const c = idx % 8;
                    const isSelected = selected?.[0] === r && selected?.[1] === c;
                    const isLegal = legal.some(([lr, lc]) => lr === r && lc === c);
                    const piece = board[r][c];
                    const isCapture = isLegal && !!piece;
                    const bg = isSelected
                      ? "rgb(255,227,135)"
                      : (r + c) % 2 === 0
                        ? "rgb(248,246,235)"
                        : "rgb(196,165,165)";
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
                              color: isWhite(piece) ? "rgb(255,251,240)" : "rgb(90,50,42)",
                              textShadow: isWhite(piece) ? "1px 1px 0 rgb(109,61,52)" : "none",
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
          <h1 className="absolute left-[21px] top-[51px] font-sv-display text-[32px] font-normal">{t("profile")}</h1>
          {/* A scrolling column rather than a stack of absolute positions.
              Every card here used to be pinned to a measured offset, which
              meant nothing could be added without moving all of them — and
              there was no room left below the streak anyway. */}
          <div className="absolute inset-x-0 bottom-[110px] top-[100px] flex flex-col items-center gap-4 overflow-y-auto px-[15px] pb-4">
          <div className="h-[104px] w-[352px] shrink-0 rounded-[20px] bg-sv-gold shadow-[inset_0_0_0_2px_rgb(208,158,97),0_4px_4px_rgba(125,87,50,0.5)]">
            <div className="absolute left-2.5 top-[5px] flex h-[94px] w-[332px] items-center gap-3.5 rounded-[18px] bg-sv-cream pl-[18px] pr-3 shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]">
              <span className="size-[50px] shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(156,162,147)]">
                <Image src="/student/happy.png" alt="" width={100} height={100} className="size-full object-cover" />
              </span>
              <span className="flex min-w-0 flex-col items-start gap-1">
                <span className="max-w-full truncate text-base font-bold">
                  {record?.name ?? me?.displayName ?? "—"}
                </span>
                {/* An email is long and a phone is narrow, so it truncates
                    rather than pushing the badge off the card. */}
                <span className="max-w-full truncate text-[11.5px] opacity-70">{me?.email ?? ""}</span>
                <span className="rounded-[20px] bg-sv-mint px-2.5 py-[3px] text-[11px] text-sv-mint-ink shadow-[inset_0_0_0_0.5px_rgb(137,187,169),0_0_0_0.5px_rgb(137,187,169)]">
                  {record?.current_level || t("beginner")}
                </span>
              </span>
            </div>
          </div>

          {/* Details worth checking: the id a teacher asks for, the rating, and
              when the academy last saw you. */}
          <div className="w-[352px] shrink-0 overflow-hidden rounded-[20px] bg-sv-gold p-2.5 shadow-[inset_0_0_0_2px_rgb(208,158,97),0_2px_4px_rgba(118,83,50,0.58)]">
            <div className="rounded-[16px] bg-sv-cream px-4 py-3 shadow-[inset_0_0_0_1px_rgba(208,158,97,0.5)]">
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
                  style={{ borderTop: i === 0 ? "none" : "1px solid rgba(208,158,97,0.35)" }}
                >
                  <span className="text-[13px] opacity-75">{label}</span>
                  <span className="max-w-[190px] truncate text-[13px] font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[196px] w-[352px] shrink-0 overflow-hidden rounded-[20px] bg-sv-gold shadow-[inset_0_0_0_2px_rgb(208,158,97),0_2px_4px_rgba(118,83,50,0.58)]">
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
                    background: i < Math.min(streak, 21) ? "rgb(255,227,135)" : "rgb(244,247,250)",
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

          <SignOutButton className="flex h-[54px] w-[352px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[20px] bg-sv-cream text-base font-bold text-sv-coral shadow-[inset_0_0_0_2px_rgb(208,158,97),0_2px_4px_rgba(118,83,50,0.4)] transition-transform active:translate-y-[2px] disabled:opacity-60">
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
              <Image
                key={delay}
                src="/student/fish.png"
                alt=""
                width={70}
                height={70}
                className="size-[70px] object-contain"
                style={{ animation: `sv-fish-zoom 900ms ease-in-out ${delay}ms infinite alternate` }}
              />
            ))}
          </span>
          <span className="mt-5 text-sm font-bold text-[rgba(255,255,255,0.85)]">{t("tapToContinue")}</span>
        </button>
      )}

      {/* Bottom nav. Profile sits last, as it does in every other portal —
          Play is a route rather than a screen, so it is rendered in place
          rather than driven by `go`. */}
      <nav className="absolute left-[25px] top-[750px] flex h-[70px] w-[340px] items-center justify-around rounded-[25px] bg-sv-cream shadow-[inset_0_0_0_1.25px_rgb(237,218,192),0_0_0_1.25px_rgb(237,218,192)]">
        {navItems.map((item) => (
          <Fragment key={item.key}>
            {/* A game deserves a URL, so a player who reloads mid-game lands
                back at the board rather than the home screen. */}
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
                    fill="rgb(109,61,52)"
                    stroke="rgb(109,61,52)"
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
              style={{ background: item.key === "profile" && item.active ? "rgb(255,227,135)" : "transparent" }}
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
