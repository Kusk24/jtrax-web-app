"use client";

/* A finished game, replayed.
 *
 * Read-only: the board steps through the moves that were played, from the
 * start or from any move in the list. A class or challenge game comes from its
 * room; a game against the computer from the record the portal saved. */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/game/ChessBoard";
import { gameFrom, pairedMoves } from "@/lib/chess-core";
import { getSoloGame, outcomeOf } from "@/lib/progress";
import { reasonKey } from "@/lib/live-games";
import { Card, secondaryPill } from "@/components/student/kit";
import { OutcomeChip, stampDate, useWhen } from "@/components/student/HistoryRows";

type Replay = {
  opponent: string;
  side: "white" | "black";
  ucis: string[];
  result: string;
  reason: string;
  at: string;
  timeControl?: string;
};

export function GameReplay() {
  const t = useTranslations("st");
  const tp = useTranslations("play");
  const when = useWhen();
  const params = useSearchParams();
  const kind = params.get("kind");
  const id = params.get("id") ?? "";
  const [replay, setReplay] = useState<Replay | null>(null);
  const [failed, setFailed] = useState(false);
  const [ply, setPly] = useState(0);

  useEffect(() => {
    let alive = true;
    const done = (r: Replay) => {
      if (!alive) return;
      setReplay(r);
      setPly(r.ucis.length);
    };
    const load =
      kind === "solo"
        ? getSoloGame(id).then((g) => done({ opponent: tp(`opponentName.${g.opponent}`), side: g.side, ucis: g.moves, result: g.result, reason: g.reason, at: g.at }))
        : fetch(`/api/game-rooms/${encodeURIComponent(id)}`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((data) => {
              const side = data.seat === "Black" ? "black" : "white";
              const other = side === "white" ? data.room.black : data.room.white;
              const clock = data.room.timeControl;
              done({
                opponent: other?.displayName ?? "—",
                side,
                ucis: (data.moves as { uci: string }[]).map((m) => m.uci),
                result: data.room.result ?? "",
                reason: data.room.resultReason ?? "",
                at: data.room.endedAt ?? data.room.createdAt ?? "",
                timeControl: clock?.limit ? `${Math.round(clock.limit / 60)}+${clock.increment ?? 0}` : undefined,
              });
            });
    load.catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [kind, id, tp]);

  const game = useMemo(() => (replay ? gameFrom(replay.ucis.slice(0, ply)) ?? new Chess() : new Chess()), [replay, ply]);
  const sans = useMemo(() => {
    const full = replay ? gameFrom(replay.ucis) : null;
    return full ? full.history() : [];
  }, [replay]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!replay) return;
      if (e.key === "ArrowLeft") setPly((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setPly((p) => Math.min(replay.ucis.length, p + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [replay]);

  const back = (
    <Link href="/student/history" aria-label={t("backToHistory")} className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-pp-line bg-pp-card text-pp-muted transition-colors hover:bg-pp-soft">
      <ArrowLeft className="size-[18px]" strokeWidth={2.2} />
    </Link>
  );

  if (failed) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">{back}<h1 className="font-pp-display text-[23px] font-bold text-pp-ink">{t("viewGame")}</h1></div>
        <Card><p className="text-[14px] text-pp-muted">{t("gameNotFound")}</p></Card>
      </div>
    );
  }

  const outcome = replay ? outcomeOf(replay.result, replay.side) : null;
  const rk = reasonKey(replay?.reason);
  const total = replay?.ucis.length ?? 0;
  const ctl = "flex size-11 cursor-pointer items-center justify-center rounded-full border border-pp-line bg-pp-card text-pp-ink transition-colors hover:border-pp-blue hover:bg-pp-soft disabled:cursor-not-allowed disabled:text-pp-faint";

  return (
    <div className="st-enter flex flex-col gap-5">
      <header className="flex items-center gap-3">
        {back}
        <div className="min-w-0">
          <h1 className="truncate font-pp-display text-[23px] font-bold leading-tight text-pp-ink">
            {replay ? t("vs", { them: replay.opponent }) : t("loading")}
          </h1>
          {replay?.at && <p className="text-[13px] text-pp-muted">{when.date(stampDate(replay.at))} · {when.time(stampDate(replay.at))}</p>}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col items-center gap-3">
          <ChessBoard game={game} orientation={replay?.side === "black" ? "b" : "w"} canMove={false} onMove={() => {}} lastMove={ply > 0 ? replay?.ucis[ply - 1] : undefined} />
          <div className="flex items-center gap-2" role="group" aria-label={t("replayControls")}>
            <button type="button" className={ctl} onClick={() => setPly(0)} disabled={ply === 0} aria-label={t("firstMove")}><ChevronFirst className="size-5" /></button>
            <button type="button" className={ctl} onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0} aria-label={t("prevMove")}><ChevronLeft className="size-5" /></button>
            <span className="min-w-[72px] text-center text-[13px] font-semibold text-pp-muted">{ply}/{total}</span>
            <button type="button" className={ctl} onClick={() => setPly((p) => Math.min(total, p + 1))} disabled={ply === total} aria-label={t("nextMove")}><ChevronRight className="size-5" /></button>
            <button type="button" className={ctl} onClick={() => setPly(total)} disabled={ply === total} aria-label={t("lastMove")}><ChevronLast className="size-5" /></button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Card>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
              <div><dt className="text-[12px] text-pp-muted">{t("result")}</dt><dd className="mt-1">{outcome ? <OutcomeChip outcome={outcome} /> : "—"}</dd></div>
              <div><dt className="text-[12px] text-pp-muted">{t("youPlayed")}</dt><dd className="mt-1 font-semibold text-pp-ink">{replay ? t(`side.${replay.side}`) : "—"}</dd></div>
              <div><dt className="text-[12px] text-pp-muted">{t("reason")}</dt><dd className="mt-1 font-semibold text-pp-ink">{rk && t.has(`reasonLabel.${rk}`) ? t(`reasonLabel.${rk}`) : "—"}</dd></div>
              <div><dt className="text-[12px] text-pp-muted">{t("timeControl")}</dt><dd className="mt-1 font-semibold text-pp-ink">{replay?.timeControl ?? t("untimed")}</dd></div>
            </dl>
          </Card>
          <Card className="max-h-[360px] overflow-y-auto !p-3">
            <ol className="grid grid-cols-[36px_1fr_1fr] gap-y-0.5 text-[13.5px]">
              {pairedMoves(sans).map((row) => (
                <li key={row.no} className="contents">
                  <span className="py-1 text-pp-faint">{row.no}.</span>
                  {([row.white, row.black] as const).map((san, j) => {
                    const at = (row.no - 1) * 2 + j + 1;
                    return san ? (
                      <button key={j} type="button" onClick={() => setPly(at)} className={`cursor-pointer rounded-md border-none px-2 py-1 text-left font-semibold ${ply === at ? "bg-pp-blue text-white" : "bg-transparent text-pp-ink hover:bg-pp-soft"}`}>
                        {san}
                      </button>
                    ) : <span key={j} />;
                  })}
                </li>
              ))}
            </ol>
            {total === 0 && replay && <p className="p-2 text-[13px] text-pp-muted">{t("noMoves")}</p>}
          </Card>
          <Link href="/student/history" className={secondaryPill}>{t("backToHistory")}</Link>
        </div>
      </div>
    </div>
  );
}
