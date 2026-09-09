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
  CERT_SESSIONS, CURRENT, recentMonths, todayISO,
  type AnnouncementV2, type ChildKey, type ChildV2, type HistRow, type MonthDef,
  type InboxNotif, NOTIF_DEFAULTS, type NotifType, type SenderKind, type TournamentV2,
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

type Prefs = Record<NotifType, boolean>;
type Status = "loading" | "live" | "error";

type ParentDataValue = {
  children: ChildV2[];
  parent: { name: string; phone: string; email: string };
  announcements: AnnouncementV2[];
  /** The backend inbox, newest first — the server already respected the
      parent's preferences when it sent (or did not send) each one. */
  notifs: InboxNotif[];
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
  /** Classes attended before a certificate is awarded — the academy's own
      figure from system_configuration, or the 50 default until it saves one. */
  certSessions: number;
  prefs: Prefs;
  parentId: string;
  savePref: (type: NotifType, enabled: boolean) => Promise<void>;
  register: (input: {
    tournamentId: string; studentId: string; participantName: string; contact: string; fee: number;
  }) => Promise<void>;
};

const ParentDataContext = createContext<ParentDataValue | null>(null);

/* Announcement read marks live in localStorage, keyed by the parent —
   announcements have no per-reader row in the backend. Notification read
   marks used to live here too; they moved to the server (`read_at` on the
   inbox row) when the notification backbone arrived. */
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
  const [allNotifs, setAllNotifs] = useState<InboxNotif[]>([]);
  const [tour, setTour] = useState<TournamentV2 | null>(null);
  const [months] = useState<MonthDef[]>(() => recentMonths());
  const [att, setAtt] = useState<ParentDataValue["att"]>({});
  const [hist, setHist] = useState<HistRow[]>([]);
  const [todayActivity, setTodayActivity] = useState<ParentDataValue["todayActivity"]>([]);
  const [certSessions, setCertSessions] = useState(CERT_SESSIONS);
  const [prefs, setPrefs] = useState<Prefs>(NOTIF_DEFAULTS);
  const [parentId, setParentId] = useState("");
  const [annRead, setAnnRead] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [students, enrollments, classes, txs, teachers, attendance, sessions,
      announcements, tournaments, activities, parents, contacts, config, me] = await Promise.all([
      get("students"), get("enrollments"), get("classes"), get("credit-transactions"),
      get("teachers"), get("attendance"), get("class-sessions"),
      get("announcements"), get("tournaments"), get("practice-activities"),
      get("parents"), get("parent-contacts"),
      /* Tolerant: a backend deployed before system-configuration was readable
         by parents answers 403, and the milestone has a default — that must
         not read as the whole server being down. */
      get("system-configuration").catch(() => [] as Row[]),
      fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]);
    if (!me?.parentId) throw new Error("not a parent session");
    setParentId(me.parentId);

    /* The academy's certificate milestone, or the default until it saves one. */
    const certRaw = Number(s(
      config.find((r) => s(r, "config_key") === "certificate_sessions") ?? {},
      "config_value",
    ));
    setCertSessions(Number.isFinite(certRaw) && certRaw > 0 ? certRaw : CERT_SESSIONS);
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

/* The real inbox: what the backend actually sent this account. It used
       to be re-derived from attendance stamps, which could only ever imitate
       the sender — now the rows the notification backbone wrote are the list,
       read marks included. */
    const inboxRes = await fetch("/api/notifications", { cache: "no-store" });
    const inboxRows: Row[] = inboxRes.ok
      ? (((await inboxRes.json()) as { notifications?: Row[] }).notifications ?? [])
      : [];
    setAllNotifs(inboxRows.map((row) => {
      /* Deep link from the payload: a child event lands on that child, an
         announcement on the announcements screen, anything else stays here. */
      let href = "/parent/notifications";
      try {
        const data = JSON.parse(s(row, "data") || "{}") as { studentId?: string };
        const child = data.studentId ? mapped.find((c) => c.id === data.studentId) : undefined;
        if (child) href = `/parent/child/${child.key}`;
      } catch { /* unparseable payload: the row still shows, it just goes nowhere */ }
      if (s(row, "type") === "announcement") href = "/parent/announcements";
      return {
        id: s(row, "notification_id"),
        type: s(row, "type"),
        title: s(row, "title"),
        body: s(row, "body"),
        at: s(row, "created_at"),
        read: s(row, "read_at") !== "",
        href,
      };
    }));

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

    /* The per-type toggles: the backend stores only overrides, so start from
       the defaults and lay the saved choices over them. The in-app channel is
       the master switch for a type. */
    const setRes = await fetch("/api/notification-settings", { cache: "no-store" });
    if (setRes.ok) {
      const saved = (((await setRes.json()) as { settings?: Row[] }).settings ?? [])
        .filter((row) => s(row, "channel") === "inapp");
      const next = { ...NOTIF_DEFAULTS };
      for (const row of saved) {
        const typ = s(row, "type") as NotifType;
        if (typ in next) next[typ] = Boolean(row.enabled);
      }
      setPrefs(next);
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

  const savePref = useCallback(async (type: NotifType, enabled: boolean) => {
    /* Optimistic: the switch answers the finger; a failed save is put back by
       the caller's catch. In-app is the type's master switch server-side. */
    setPrefs((prev) => ({ ...prev, [type]: enabled }));
    const res = await fetch("/api/notification-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, channel: "inapp", enabled }),
    });
    if (!res.ok) {
      setPrefs((prev) => ({ ...prev, [type]: !enabled }));
      throw new Error("saving preference failed");
    }
  }, []);

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
    /* Optimistic, and fire-and-forget: a read mark that fails to save costs a
       bold dot on the next visit, nothing more. */
    setAllNotifs((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
    fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }, []);

  const markAnnRead = useCallback((id: string) => {
    setAnnRead((prev) => {
      const next = new Set(prev).add(id);
      storeRead("anns", parentId, next);
      return next;
    });
  }, [parentId]);

  const value = useMemo<ParentDataValue>(() => ({
    children: childList, parent, announcements: anns,
    /* Unfiltered on purpose: the server applied the preferences when it sent.
       Filtering again here would hide history the moment a toggle changed. */
    notifs: allNotifs,
    unreadNotifs: allNotifs.filter((x) => !x.read).length,
    isNotifRead: (id) => allNotifs.find((x) => x.id === id)?.read ?? true,
    markNotifRead,
    markAllNotifsRead: () => {
      setAllNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
      fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    },
    isAnnRead: (id) => annRead.has(id),
    markAnnRead,
    tournament: tour, months, att, hist, todayActivity, certSessions,
    prefs, parentId, savePref, register,
  }), [childList, parent, anns, allNotifs, annRead, markNotifRead, markAnnRead,
    tour, months, att, hist, todayActivity, certSessions, prefs, parentId, savePref, register]);

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
        <div className="flex w-full max-w-[380px] flex-col items-center gap-3 rounded-xl border-[1.5px] border-pp-line bg-pp-card p-6 text-center shadow-[0_8px_24px_rgba(35,53,94,.10)]">
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
