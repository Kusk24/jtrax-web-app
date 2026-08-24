"use client";

/**
 * Live data for the parent portal. Every collection is joined here from
 * backend rows — the screens render display shapes and never see the ER model.
 *
 * There is no mock fallback. The portal either shows what the academy has on
 * file or says the server is unreachable; sample children rendered as if they
 * were real is how a parent stops trusting the real ones.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  CURRENT, recentMonths, todayISO,
  type AnnouncementV2, type ChildKey, type ChildV2, type HistRow, type MonthDef,
  type NotifV2, type SenderKind, type TournamentV2,
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

/** Two decimal places with trailing zeros dropped — an hour of class costs an
    hour of credit, so balances are fractional and full of floating-point dust. */
const roundCredits = (v: number) => Math.round(v * 100) / 100;

function ageOf(dobISO: string, now: Date): number {
  if (!dobISO) return 0;
  const dob = new Date(dobISO);
  if (isNaN(dob.getTime())) return 0;
  let a = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) a--;
  return Math.max(0, a);
}

type Prefs = { checkin: boolean; credits: boolean; news: boolean };
type Status = "loading" | "live" | "error";

type ParentDataValue = {
  children: ChildV2[];
  parent: { name: string; phone: string; email: string };
  announcements: AnnouncementV2[];
  /** Filtered by the parent's notification preferences, newest first. */
  notifs: NotifV2[];
  unreadNotifs: number;
  isNotifRead: (id: string) => boolean;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  isAnnRead: (id: string) => boolean;
  markAnnRead: (id: string) => void;
  tournament: TournamentV2 | null;
  months: MonthDef[];
  att: Record<ChildKey, Record<number, { present: number[]; absent: number[] }>>;
  hist: HistRow[];
  todayActivity: { child: string; mins: number; done: boolean }[];
  prefs: Prefs;
  parentId: string;
  savePrefs: (p: Prefs) => Promise<void>;
  register: (input: {
    tournamentId: string; studentId: string; participantName: string; contact: string; fee: number;
  }) => Promise<void>;
};

const ParentDataContext = createContext<ParentDataValue | null>(null);

/* Read marks survive a reload because they live in localStorage, keyed by the
   parent — there is no per-notification table in the backend to keep them in,
   and a mark that resets on every visit is not a mark. */
const readKey = (kind: "notifs" | "anns", parentId: string) => `jtrax:parent:${parentId}:${kind}-read`;

function loadRead(kind: "notifs" | "anns", parentId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(readKey(kind, parentId)) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function storeRead(kind: "notifs" | "anns", parentId: string, ids: Set<string>) {
  try {
    localStorage.setItem(readKey(kind, parentId), JSON.stringify([...ids]));
  } catch {
    /* private mode — marks last for the session only */
  }
}

export function ParentDataProvider({ children: kids }: { children: ReactNode }) {
  const t = useTranslations("pv2");
  const [status, setStatus] = useState<Status>("loading");
  const [childList, setChildList] = useState<ChildV2[]>([]);
  const [parent, setParent] = useState({ name: "", phone: "", email: "" });
  const [anns, setAnns] = useState<AnnouncementV2[]>([]);
  const [allNotifs, setAllNotifs] = useState<NotifV2[]>([]);
  const [tour, setTour] = useState<TournamentV2 | null>(null);
  const [months] = useState<MonthDef[]>(() => recentMonths());
  const [att, setAtt] = useState<ParentDataValue["att"]>({});
  const [hist, setHist] = useState<HistRow[]>([]);
  const [todayActivity, setTodayActivity] = useState<ParentDataValue["todayActivity"]>([]);
  const [prefs, setPrefs] = useState<Prefs>({ checkin: true, credits: true, news: false });
  const [parentId, setParentId] = useState("");
  const [notifRead, setNotifRead] = useState<Set<string>>(new Set());
  const [annRead, setAnnRead] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [students, enrollments, classes, txs, teachers, attendance, sessions,
      announcements, tournaments, activities, parents, contacts, me] = await Promise.all([
      get("students"), get("enrollments"), get("classes"), get("credit-transactions"),
      get("teachers"), get("attendance"), get("class-sessions"),
      get("announcements"), get("tournaments"), get("practice-activities"),
      get("parents"), get("parent-contacts"),
      fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]);
    if (!me?.parentId) throw new Error("not a parent session");
    setParentId(me.parentId);
    setNotifRead(loadRead("notifs", me.parentId));
    setAnnRead(loadRead("anns", me.parentId));

    /* Who is signed in — the greeting, the sidebar, the profile screen and
       the registration prefill all read this instead of a sample name. */
    const own = parents.find((p) => s(p, "parent_id") === me.parentId);
    const contact = (type: string) =>
      s(contacts.find((c) => s(c, "contact_type") === type) ?? {}, "value");
    setParent({
      name: own ? s(own, "name") : (me.displayName as string) ?? "",
      phone: contact("phone"),
      email: contact("email") || (own ? s(own, "email") : ""),
    });

    const today = new Date();
    const todayStr = todayISO(today);
    const nowClock = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

    const mapped: ChildV2[] = students.map((st, i) => {
      const sid = s(st, "student_id");
      const enr = enrollments.find((e) => s(e, "student_id") === sid && (s(e, "status") || "Active") === "Active")
        ?? enrollments.find((e) => s(e, "student_id") === sid);
      const cls = enr ? classes.find((c) => s(c, "class_id") === s(enr, "class_id")) : undefined;
      const myTx = enr ? txs.filter((x) => s(x, "enrollment_id") === s(enr, "enrollment_id")) : [];
      const credits = roundCredits(myTx.reduce((sum, x) => sum + n(x, "amount"), 0));
      const bought = roundCredits(myTx.filter((x) => n(x, "amount") > 0).reduce((sum, x) => sum + n(x, "amount"), 0));
      const expiry = myTx.filter((x) => s(x, "expiry_date")).map((x) => s(x, "expiry_date")).sort().at(-1) ?? "";
      const daysRaw = expiry
        ? Math.ceil((new Date(expiry).getTime() - today.getTime()) / 86400_000)
        : 0;
      const daysLeft = Math.max(0, daysRaw);

      /* Sessions the class has already held. Sessions are written one at a
         time by the desk — there is no weekly pattern — which is also why the
         screen shows no upcoming schedule: a session not yet written is not a
         plan a parent can rely on. */
      const mySessions = cls
        ? sessions.filter((x) => s(x, "class_id") === s(cls, "class_id"))
        : [];
      const held = mySessions.filter((x) => s(x, "session_date") < todayStr
        || (s(x, "session_date") === todayStr && s(x, "end_time") < nowClock)).length;

      const attended = attendance.filter((a) => s(a, "student_id") === sid).length;
      const acts = activities.filter((a) => s(a, "student_id") === sid);
      const week = Array.from({ length: 7 }, (_, d) => {
        const day = todayISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - d)));
        return n(acts.find((a) => s(a, "activity_date") === day) ?? {}, "minutes_practiced");
      });
      const name = s(st, "name");
      return {
        key: sid as ChildKey,
        name,
        id: sid,
        level: s(st, "current_level"),
        age: ageOf(s(st, "date_of_birth"), today),
        photo: PHOTOS[name] ?? "",
        avBg: i % 2 ? "#cfd9f0" : "#b4c5e4",
        clsTitle: cls ? s(cls, "name") : "—",
        enrolledSince: enr ? fmtDate(s(enr, "enrolled_date")) : "",
        credits,
        creditsBought: bought,
        valid: fmtDate(expiry),
        daysLeft,
        expiresAhead: daysRaw >= 0,
        attended,
        heldSessions: held,
        streak: n(st, "streak_count"),
        practiceWeek: week,
      };
    });
    setChildList(mapped);

    /* Attendance dots for the three calendar months. */
    const monthList = months;
    const nextAtt: ParentDataValue["att"] = {};
    for (const child of mapped) {
      const per: Record<number, { present: number[]; absent: number[] }> = {};
      monthList.forEach((m, mi) => {
        const present: number[] = [];
        const absent: number[] = [];
        for (const a of attendance) {
          if (s(a, "student_id") !== child.id) continue;
          const ses = sessions.find((x) => s(x, "session_id") === s(a, "session_id"));
          if (!ses) continue;
          const d = new Date(s(ses, "session_date"));
          if (d.getFullYear() !== m.year || d.getMonth() !== m.month) continue;
          (s(a, "check_in_time") ? present : absent).push(d.getDate());
        }
        per[mi] = { present, absent };
      });
      nextAtt[child.key as ChildKey] = per;
    }
    setAtt(nextAtt);

    /* History rows: attendance joined to sessions, newest first. */
    const rows: HistRow[] = attendance
      .map((a) => {
        const ses = sessions.find((x) => s(x, "session_id") === s(a, "session_id"));
        const child = mapped.find((c) => c.id === s(a, "student_id"));
        if (!ses || !child) return null;
        const sesCls = classes.find((c) => s(c, "class_id") === s(ses, "class_id"));
        return {
          date: fmtDate(s(ses, "session_date")),
          iso: s(ses, "session_date"),
          child: child.key as ChildKey,
          status: (s(a, "check_in_time") ? "Present" : "Absent") as HistRow["status"],
          time: `${s(ses, "start_time")} – ${s(ses, "end_time")}`,
          /* The session's own class. Printing the child's current class here
             relabelled every old row the day they moved. */
          cls: sesCls ? s(sesCls, "name") : "—",
        };
      })
      .filter((r): r is HistRow => r !== null)
      .sort((a, b) => b.iso.localeCompare(a.iso));
    setHist(rows);

    /* Notifications, from the rows that already record what happened: a
       check-in stamp, a pick-up stamp, an expiry date drawing near. The mock
       list this replaced invented events for children who do not exist. */
    const cutoff = todayISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14));
    const notifs: NotifV2[] = [];
    for (const a of attendance) {
      const child = mapped.find((c) => c.id === s(a, "student_id"));
      const inAt = s(a, "check_in_time");
      const outAt = s(a, "check_out_time");
      if (!child || !inAt || inAt.slice(0, 10) < cutoff) continue;
      const aid = s(a, "attendance_id");
      notifs.push({
        id: `att:${aid}:in`, kind: "checkin", at: inAt,
        href: `/parent/child/${child.key}`, name: child.name, cls: child.clsTitle,
      });
      if (outAt) {
        notifs.push({
          id: `att:${aid}:out`, kind: "pickup", at: outAt,
          href: `/parent/child/${child.key}`, name: child.name, cls: child.clsTitle,
        });
      }
    }
    for (const child of mapped) {
      /* Only while the expiry is actually ahead. A balance that lapsed months
         ago is expired, not "expiring soon — 0 days left"; the child's card
         already shows that state. */
      if (child.valid === "—" || child.credits <= 0) continue;
      if (!child.expiresAhead || child.daysLeft > 14) continue;
      notifs.push({
        id: `exp:${child.key}:${child.valid}`, kind: "credits", at: todayStr,
        href: `/parent/child/${child.key}`, name: child.name, cls: child.clsTitle,
        days: child.daysLeft, date: child.valid,
      });
    }
    notifs.sort((a, b) => b.at.localeCompare(a.at));
    setAllNotifs(notifs);

    setAnns(announcements
      .sort((a, b) => s(b, "posted_at").localeCompare(s(a, "posted_at")))
      .map((a) => {
        const author = teachers.find((x) => s(x, "user_account_id") === s(a, "author_user_account_id"));
        const sender: SenderKind = author ? "teacher" : "admin";
        return {
          id: s(a, "announcement_id"),
          sender,
          senderName: author ? s(author, "name") : "JCA Head Office",
          title: s(a, "title"),
          msg: s(a, "body"),
          child: null,
          cls: null,
          attachment: n(a, "has_attachment") === 1,
          time: fmtDate(s(a, "posted_at")),
        };
      }));

    /* The next tournament, or nothing. The card only exists when an event
       does — the mock used to keep advertising Wellington 2026 forever. */
    const trn = tournaments.find((x) => s(x, "tournament_status") === "Upcoming");
    if (trn) {
      const deadline = s(trn, "registration_deadline");
      setTour({
        id: s(trn, "tournament_id"),
        name: s(trn, "name"),
        venue: s(trn, "venue_name"),
        date: fmtDate(s(trn, "start_date")),
        regDeadline: fmtDate(deadline),
        day: fmtDate(s(trn, "start_date")),
        fee: `THB ${n(trn, "regular_fee")}`,
        feeAmount: n(trn, "regular_fee"),
        closesInDays: deadline
          ? Math.max(0, Math.ceil((new Date(deadline).getTime() - today.getTime()) / 86400_000))
          : 0,
      });
    } else {
      setTour(null);
    }

    setTodayActivity(mapped.map((c) => {
      const mins = n(
        activities.find((a) => s(a, "student_id") === c.id && s(a, "activity_date") === todayStr) ?? {},
        "minutes_practiced",
      );
      return { child: c.name, mins, done: mins >= 30 };
    }));

    const pref = (await get(`notification-preferences?parent_id=${me.parentId}`))[0];
    if (pref) {
      setPrefs({
        checkin: n(pref, "check_in_alerts_enabled") === 1,
        credits: n(pref, "credit_expiry_alerts_enabled") === 1,
        news: n(pref, "announcement_alerts_enabled") === 1,
      });
    }
    setStatus("live");
  }, [months]);

  useEffect(() => {
    load().catch(() => setStatus("error"));
  }, [load]);

  const retry = useCallback(() => {
    setStatus("loading");
    load().catch(() => setStatus("error"));
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

  const markNotifRead = useCallback((id: string) => {
    setNotifRead((prev) => {
      const next = new Set(prev).add(id);
      storeRead("notifs", parentId, next);
      return next;
    });
  }, [parentId]);

  const markAnnRead = useCallback((id: string) => {
    setAnnRead((prev) => {
      const next = new Set(prev).add(id);
      storeRead("anns", parentId, next);
      return next;
    });
  }, [parentId]);

  const value = useMemo<ParentDataValue>(() => {
    const notifs = allNotifs.filter((x) =>
      x.kind === "credits" ? prefs.credits : prefs.checkin);
    return {
      children: childList, parent, announcements: anns,
      notifs,
      unreadNotifs: notifs.filter((x) => !notifRead.has(x.id)).length,
      isNotifRead: (id) => notifRead.has(id),
      markNotifRead,
      markAllNotifsRead: () => {
        const next = new Set([...notifRead, ...notifs.map((x) => x.id)]);
        storeRead("notifs", parentId, next);
        setNotifRead(next);
      },
      isAnnRead: (id) => annRead.has(id),
      markAnnRead,
      tournament: tour, months, att, hist, todayActivity,
      prefs, parentId, savePrefs, register,
    };
  }, [childList, parent, anns, allNotifs, notifRead, annRead, markNotifRead, markAnnRead,
    tour, months, att, hist, todayActivity, prefs, parentId, savePrefs, register]);

  /* No screen renders until the data is real. The old behaviour — sample
     children whenever the server was down — looked exactly like working
     software, which is the worst kind of broken. */
  if (status === "loading") {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center">
        <span className="animate-pulse text-[13.5px] font-semibold text-pp-muted">{t("loading")}</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center px-5">
        <div className="flex w-full max-w-[380px] flex-col items-center gap-3 rounded-xl border-[1.5px] border-pp-line bg-white p-6 text-center shadow-[0_8px_24px_rgba(35,53,94,.10)]">
          <span className="font-pp-display text-lg font-semibold text-pp-ink">{t("serverDownTitle")}</span>
          <span className="text-[12.5px] leading-relaxed text-pp-muted">{t("serverDownBody")}</span>
          <button
            onClick={retry}
            className="mt-1 cursor-pointer rounded-xl bg-pp-navy px-6 py-2.5 text-sm font-bold text-white"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return <ParentDataContext.Provider value={value}>{kids}</ParentDataContext.Provider>;
}

export function useParentData(): ParentDataValue {
  const ctx = useContext(ParentDataContext);
  if (!ctx) throw new Error("useParentData must be used inside <ParentDataProvider>");
  return ctx;
}
