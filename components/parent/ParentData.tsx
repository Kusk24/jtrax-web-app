"use client";

/**
 * Live data for the parent portal. Collections keep the exact shapes of
 * lib/parent-v2-data (the design port), initialised from those mocks and
 * replaced with backend rows once fetched — screens render instantly and
 * hydrate to real data. Joins from ER rows happen here only.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ATT, MONTHS, announcementsV2, childrenV2, histV2, notifsV2, tournamentV2,
  type AnnouncementV2, type ChildKey, type ChildV2, type SenderKind,
} from "@/lib/parent-v2-data";

type Row = Record<string, unknown>;
const s = (r: Row, k: string) => (r[k] as string | null) ?? "";
const n = (r: Row, k: string) => Number(r[k] ?? 0);

async function get(path: string): Promise<Row[]> {
  const res = await fetch(`/api/${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as Row[];
}

/* Seed students reuse the design photos; anyone else gets the tinted circle. */
const PHOTOS: Record<string, string> = {
  Penny: "/parent/penny.jpeg",
  Uri: "/parent/uri.jpeg",
};

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

type Prefs = { checkin: boolean; credits: boolean; news: boolean };

type ParentDataValue = {
  live: boolean;
  children: ChildV2[];
  announcements: AnnouncementV2[];
  notifs: typeof notifsV2;
  tournament: typeof tournamentV2;
  att: typeof ATT;
  hist: typeof histV2;
  prefs: Prefs;
  parentId: string;
  savePrefs: (p: Prefs) => Promise<void>;
  register: (input: {
    tournamentId: string; studentId: string; participantName: string; contact: string; fee: number;
  }) => Promise<void>;
};

const ParentDataContext = createContext<ParentDataValue | null>(null);

export function ParentDataProvider({ children: kids }: { children: ReactNode }) {
  const [live, setLive] = useState(false);
  const [childList, setChildList] = useState<ChildV2[]>(childrenV2);
  const [anns, setAnns] = useState<AnnouncementV2[]>(announcementsV2);
  const [tour, setTour] = useState(tournamentV2);
  const [att, setAtt] = useState(ATT);
  const [hist, setHist] = useState(histV2);
  const [prefs, setPrefs] = useState<Prefs>({ checkin: true, credits: true, news: false });
  const [parentId, setParentId] = useState("");

  const load = useCallback(async () => {
    const [students, enrollments, classes, txs, teachers, attendance, sessions,
      announcements, tournaments, activities, me] = await Promise.all([
      get("students"), get("enrollments"), get("classes"), get("credit-transactions"),
      get("teachers"), get("attendance"), get("class-sessions"),
      get("announcements"), get("tournaments"), get("practice-activities"),
      fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]);
    if (!me?.parentId) throw new Error("not a parent session");
    setParentId(me.parentId);

    const teacherByAccount = new Map(teachers.map((t) => [s(t, "user_account_id"), t]));
    const today = new Date();

    const mapped: ChildV2[] = students.map((st, i) => {
      const sid = s(st, "student_id");
      const enr = enrollments.find((e) => s(e, "student_id") === sid && s(e, "status") === "Active")
        ?? enrollments.find((e) => s(e, "student_id") === sid);
      const cls = enr ? classes.find((c) => s(c, "class_id") === s(enr, "class_id")) : undefined;
      const myTx = enr ? txs.filter((t) => s(t, "enrollment_id") === s(enr, "enrollment_id")) : [];
      const credits = myTx.reduce((sum, t) => sum + n(t, "amount"), 0);
      const expiry = myTx.filter((t) => s(t, "expiry_date")).map((t) => s(t, "expiry_date")).sort().at(-1) ?? "";
      const daysLeft = expiry
        ? Math.max(0, Math.ceil((new Date(expiry).getTime() - today.getTime()) / 86400_000))
        : 0;
      const bought = myTx.filter((t) => n(t, "amount") > 0).reduce((sum, t) => sum + n(t, "amount"), 0);
      const attended = attendance.filter((a) => s(a, "student_id") === sid).length;
      const acts = activities.filter((a) => s(a, "student_id") === sid);
      const week = Array.from({ length: 7 }, (_, d) => {
        const day = new Date(today.getTime() - (6 - d) * 86400_000).toISOString().slice(0, 10);
        return n(acts.find((a) => s(a, "activity_date") === day) ?? {}, "minutes_practiced");
      });
      const name = s(st, "name");
      return {
        key: sid as ChildKey,
        name,
        id: sid,
        level: (s(st, "current_level") || "Beginner") as ChildV2["level"],
        age: 0,
        photo: PHOTOS[name] ?? "",
        avBg: i % 2 ? "#cfd9f0" : "#b4c5e4",
        clsTitle: cls ? s(cls, "name") : "—",
        sched: "Mon & Wed",
        time: "2:00 – 3:00 PM",
        branch: "Bangkok",
        room: "Room 1A",
        teacher: teachers.length ? s(teachers[0], "name") : "—",
        credits,
        valid: fmtDate(expiry),
        daysLeft,
        attended,
        total: bought || 20,
        completedSessions: attended,
        totalSessions: 50,
        streak: n(st, "streak_count"),
        practiceWeek: week,
      };
    });
    setChildList(mapped);

    /* Attendance dots for the fixed Apr–Jun 2026 calendars the design uses. */
    const nextAtt = {} as typeof ATT;
    for (const child of mapped) {
      const per: Record<number, { present: number[]; absent: number[] }> = {};
      MONTHS.forEach((m, mi) => {
        const [monName, year] = m.name.split(" ");
        const present = attendance
          .filter((a) => s(a, "student_id") === child.id && !!s(a, "check_in_time"))
          .map((a) => {
            const ses = sessions.find((x) => s(x, "session_id") === s(a, "session_id"));
            return ses ? new Date(s(ses, "session_date")) : null;
          })
          .filter((d): d is Date => !!d && d.getFullYear() === Number(year)
            && d.toLocaleString("en", { month: "long" }) === monName)
          .map((d) => d.getDate());
        per[mi] = { present, absent: [] };
      });
      nextAtt[child.key as ChildKey] = per;
    }
    setAtt(nextAtt);

    /* History rows: attendance joined to sessions, newest first. */
    const rows = attendance
      .map((a) => {
        const ses = sessions.find((x) => s(x, "session_id") === s(a, "session_id"));
        const child = mapped.find((c) => c.id === s(a, "student_id"));
        if (!ses || !child) return null;
        return {
          date: fmtDate(s(ses, "session_date")),
          iso: s(ses, "session_date"),
          child: child.key as ChildKey,
          status: (s(a, "check_in_time") ? "Present" : "Absent") as "Present" | "Absent",
          time: `${s(ses, "start_time")} – ${s(ses, "end_time")}`,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.iso.localeCompare(a.iso));
    setHist(rows);

    setAnns(announcements
      .sort((a, b) => s(b, "posted_at").localeCompare(s(a, "posted_at")))
      .map((a) => {
        const t = teacherByAccount.get(s(a, "author_user_account_id"));
        const sender: SenderKind = t ? "teacher" : "admin";
        return {
          id: s(a, "announcement_id"),
          sender,
          senderName: t ? s(t, "name") : "JCA Head Office",
          title: s(a, "title"),
          msg: s(a, "body"),
          child: null,
          cls: null,
          attachment: n(a, "has_attachment") === 1,
          time: fmtDate(s(a, "posted_at")),
        };
      }));

    const trn = tournaments.find((t) => s(t, "tournament_status") === "Upcoming") ?? tournaments[0];
    if (trn) {
      const deadline = s(trn, "registration_deadline");
      setTour({
        ...tournamentV2,
        name: s(trn, "name"),
        venue: s(trn, "venue_name"),
        date: fmtDate(s(trn, "start_date")),
        regDeadline: fmtDate(deadline),
        day: fmtDate(s(trn, "start_date")),
        fee: `THB ${n(trn, "regular_fee")}`,
        closesInDays: deadline
          ? Math.max(0, Math.ceil((new Date(deadline).getTime() - today.getTime()) / 86400_000))
          : 0,
        id: s(trn, "tournament_id"),
      } as typeof tournamentV2 & { id: string });
    }

    const pref = (await get(`notification-preferences?parent_id=${me.parentId}`))[0];
    if (pref) {
      setPrefs({
        checkin: n(pref, "check_in_alerts_enabled") === 1,
        credits: n(pref, "credit_expiry_alerts_enabled") === 1,
        news: n(pref, "announcement_alerts_enabled") === 1,
      });
    }
    setLive(true);
  }, []);

  useEffect(() => {
    load().catch(() => setLive(false)); // mock data keeps the screens usable
  }, [load]);

  const savePrefs = useCallback(async (p: Prefs) => {
    setPrefs(p);
    await fetch(`/api/notification-preferences/${parentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        check_in_alerts_enabled: p.checkin,
        credit_expiry_alerts_enabled: p.credits,
        announcement_alerts_enabled: p.news,
      }),
    });
  }, [parentId]);

  const register = useCallback(async (input: {
    tournamentId: string; studentId: string; participantName: string; contact: string; fee: number;
  }) => {
    const res = await fetch("/api/tournament-registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournament_id: input.tournamentId,
        student_id: input.studentId,
        participant_name: input.participantName,
        participant_contact: input.contact,
        fee_charged: input.fee,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? "registration failed");
    }
  }, []);

  const value = useMemo<ParentDataValue>(() => ({
    live, children: childList, announcements: anns, notifs: notifsV2,
    tournament: tour, att, hist, prefs, parentId, savePrefs, register,
  }), [live, childList, anns, tour, att, hist, prefs, parentId, savePrefs, register]);

  return <ParentDataContext.Provider value={value}>{kids}</ParentDataContext.Provider>;
}

export function useParentData(): ParentDataValue {
  const ctx = useContext(ParentDataContext);
  if (!ctx) throw new Error("useParentData must be used inside <ParentDataProvider>");
  return ctx;
}
