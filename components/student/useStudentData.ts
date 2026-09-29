"use client";

/* Who the signed-in pupil is and where they stand — the header, the rating,
   the points, the classes and certificates — loaded once per screen.

   Home, Profile and History all show some of this. Each used to fetch its own
   pieces in its own way; one hook means the three cannot disagree about the
   pupil's name, rating or points. */
import { useCallback, useEffect, useState } from "react";
import { getMyLichess } from "@/lib/lichess";
import { classesAttended } from "@/lib/classes-attended";
import { getProgress, type Progress } from "@/lib/progress";

/** The academy's certificate milestone until its setting loads. */
const DEFAULT_CERT_SESSIONS = 50;

export type StudentData = {
  name: string;
  studentId: string;
  userAccountId: string;
  level: string;
  /** The pupil's Lichess rating, rapid first — null when not linked or unrated. */
  rating: { perf: string; value: number } | null;
  classes: number | null;
  certSessions: number;
  /** Certificates earned: every `certSessions` classes attended. */
  certificates: number | null;
  progress: Progress | null;
  refreshProgress: () => void;
};

export function useStudentData(): StudentData {
  const [me, setMe] = useState<{ displayName: string; studentId: string; userAccountId: string } | null>(null);
  const [record, setRecord] = useState<{ name?: string; current_level?: string } | null>(null);
  const [rating, setRating] = useState<StudentData["rating"]>(null);
  const [classes, setClasses] = useState<number | null>(null);
  const [certSessions, setCertSessions] = useState(DEFAULT_CERT_SESSIONS);
  const [progress, setProgress] = useState<Progress | null>(null);

  const refreshProgress = useCallback(() => {
    getProgress()
      .then(setProgress)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const list = <T,>(path: string): Promise<T[]> =>
      fetch(`/api/${path}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

    getProgress()
      .then((p) => alive && setProgress(p))
      .catch(() => {});

    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!alive || !m) return;
        setMe({ displayName: m.displayName ?? "", studentId: m.studentId ?? "", userAccountId: m.userAccountId ?? "" });
        if (!m.studentId) return;
        // `students` is scoped to the pupil's own row; found by id regardless.
        list<{ student_id: string; name?: string; current_level?: string }>("students")
          .then((rows) => alive && setRecord(rows.find((row) => row.student_id === m.studentId) ?? null))
          .catch(() => {});
        Promise.all([
          list<{ session_id: string; check_in_time?: string }>("attendance"),
          list<{ session_id: string }>("class-sessions"),
        ])
          .then(([attendance, sessions]) => alive && setClasses(classesAttended(attendance, new Set(sessions.map((x) => x.session_id)))))
          .catch(() => {});
      })
      .catch(() => {});

    list<{ config_key: string; config_value: string }>("system-configuration")
      .then((rows) => {
        const n = Number(rows.find((r) => r.config_key === "certificate_sessions")?.config_value);
        if (alive && Number.isFinite(n) && n > 0) setCertSessions(n);
      })
      .catch(() => {});

    /* Rapid is what the academy plays, so it leads; puzzle rating is last —
       it is not a measure of playing strength. */
    getMyLichess()
      .then((mine) => {
        if (!alive || !mine.linked) return;
        const order = ["rapid", "blitz", "classical", "bullet", "puzzle"];
        const best = [...mine.link.ratings]
          .filter((r) => r.rating > 0)
          .sort((a, b) => order.indexOf(a.perf) - order.indexOf(b.perf))[0];
        if (best) setRating({ perf: best.perf, value: best.rating });
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  return {
    name: record?.name ?? me?.displayName ?? "",
    studentId: me?.studentId ?? "",
    userAccountId: me?.userAccountId ?? "",
    level: record?.current_level ?? "",
    rating,
    classes,
    certSessions,
    certificates: classes === null ? null : Math.floor(classes / certSessions),
    progress,
    refreshProgress,
  };
}
