"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, School, Check } from "lucide-react";
import { attendanceSession } from "@/lib/student-data";

export type CheckinPhase = "verifying" | "success" | "not-started";

const VERIFY_DURATION_MS = 3000;

const pieces = [
  { glyph: "♟", color: "text-navy", delay: "0ms" },
  { glyph: "♞", color: "text-amber-500", delay: "120ms" },
  { glyph: "♝", color: "text-orange-600", delay: "240ms" },
  { glyph: "♜", color: "text-teal-400", delay: "360ms" },
  { glyph: "♚", color: "text-emerald-600", delay: "480ms" },
];

export function CheckinFlow({ initialPhase }: { initialPhase: CheckinPhase }) {
  const [phase, setPhase] = useState(initialPhase);

  useEffect(() => {
    if (phase !== "verifying") return;
    const timer = setTimeout(() => setPhase("success"), VERIFY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const notStarted = phase === "not-started";

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <header className="flex items-start gap-3">
        <Link
          href="/student"
          aria-label="Back to homepage"
          className="mt-0.5 rounded-full p-1 text-navy hover:bg-navy-soft/40"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-navy">
            {notStarted ? "Attendance" : "Self Check-in"}
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            {notStarted
              ? `${attendanceSession.course} - ${attendanceSession.section}`
              : "Check-in once you are in the classroom."}
          </p>
        </div>
      </header>

      {phase === "verifying" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-10">
          <span className="relative flex size-48 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-olive-soft" />
            <span className="absolute inset-0 rounded-full bg-olive-soft" />
            <span className="relative flex size-32 items-center justify-center rounded-full bg-olive">
              <School className="size-12 text-white" />
            </span>
          </span>
          <div className="flex flex-col items-center gap-6">
            <p className="font-semibold text-ink">Verifying you are in the classroom...</p>
            <div className="flex gap-4 text-2xl">
              {pieces.map((p, i) => (
                <span
                  key={i}
                  className={`animate-bounce ${p.color}`}
                  style={{ animationDelay: p.delay }}
                >
                  {p.glyph}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === "success" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <span className="relative flex size-48 items-center justify-center rounded-full bg-olive-soft">
            <span className="flex size-32 items-center justify-center rounded-full bg-olive">
              <Check className="size-16 text-white" strokeWidth={3} />
            </span>
          </span>
          <div className="text-center">
            <h2 className="text-xl font-extrabold text-ink">Checked in successfully !</h2>
            <p className="mt-1 text-sm text-muted">
              Welcome to {attendanceSession.course} {attendanceSession.section}.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center justify-between rounded-xl border border-olive/40 bg-olive-soft/60 px-4 py-3 text-sm">
            <span className="text-ink">Checked in at {attendanceSession.checkinTime}</span>
            <span className="font-bold text-brick">-1 credit</span>
          </div>
        </div>
      )}

      {notStarted && (
        <div className="flex flex-1 items-center justify-center">
          <p className="max-w-xs text-center text-2xl font-semibold leading-relaxed text-navy">
            Teacher has not started attendance session yet !
          </p>
        </div>
      )}

      {phase !== "verifying" && (
        <Link
          href="/student"
          className="mx-auto mb-2 block w-full max-w-md rounded-xl bg-navy py-3 text-center font-semibold text-white shadow-sm hover:bg-navy-deep"
        >
          Back To Homepage
        </Link>
      )}
    </div>
  );
}
