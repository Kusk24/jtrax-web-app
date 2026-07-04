import type {
  Teacher,
  TeacherClass,
  RosterStudent,
  TeacherAttendanceSession,
} from "./types";

export const teacher: Teacher = {
  id: "serene",
  name: "Serene",
  teacherId: "s1003",
  experienceYears: 3,
  avatarColor: "bg-rose-200 text-rose-800",
  phone: "+66123456789",
  email: "sereneofchess@gmail.com",
};

export const weeklyProgress = {
  pct: 80,
  totalSessions: 10,
  remainingSessions: 2,
  hoursTaught: "8h",
};

export const monthlyOverview = {
  sessions: 30,
  students: 29,
  attendancePct: 80,
  creditsConsumed: 800,
};

export const branches = [
  { name: "Bangkok Branch", phone: "+66123456789" },
  { name: "Onnut Branch", phone: "+66123456790" },
];

export const myClasses: TeacherClass[] = [
  {
    id: "sec101",
    course: "Beginner Chess",
    section: "Sec 101",
    day: "Mon, Wed",
    time: "9:00 AM - 10:00 AM",
    studentsEnrolled: 16,
    capacity: 20,
    location: "Bangkok",
    room: "Room 1A",
  },
  {
    id: "sec301",
    course: "Beginner Chess",
    section: "Sec 301",
    day: "Sun",
    time: "9:00 AM - 10:00 AM",
    studentsEnrolled: 12,
    capacity: 20,
    location: "Onnut",
    room: "Room 1B",
  },
];

export const upcomingClass = myClasses[0];

export const scheduleWeek = [
  { date: 10, label: "MON", isToday: true },
  { date: 11, label: "TUE", isToday: false },
  { date: 12, label: "WED", isToday: false },
  { date: 13, label: "THU", isToday: false },
  { date: 14, label: "FRI", isToday: false },
  { date: 15, label: "SAT", isToday: false },
];

export const scheduleByDate: Record<number, TeacherClass[]> = {
  10: [myClasses[0]],
  12: [myClasses[0]],
};

/** Roster of Sec 101 — first rows match the mockups, the rest fill up to 16. */
export const roster: RosterStudent[] = [
  {
    id: "penny",
    name: "Penny",
    studentId: "u6612127",
    avatarColor: "bg-amber-200 text-amber-900",
    sessionsUsed: 8,
    sessionsTotal: 20,
    creditsRemaining: 2,
    expiresOn: "20.5.26",
    lowCredits: true,
  },
  {
    id: "uri",
    name: "Uri",
    studentId: "u6612127",
    avatarColor: "bg-lime-200 text-lime-900",
    sessionsUsed: 5,
    sessionsTotal: 20,
    creditsRemaining: 15,
    expiresOn: "20.6.26",
    lowCredits: false,
  },
  {
    id: "kat",
    name: "Kat",
    studentId: "u6612120",
    avatarColor: "bg-violet-200 text-violet-900",
    sessionsUsed: 4,
    sessionsTotal: 20,
    creditsRemaining: 16,
    expiresOn: "30.5.26",
    lowCredits: false,
  },
  {
    id: "grace",
    name: "Grace",
    studentId: "u6612167",
    avatarColor: "bg-sky-200 text-sky-900",
    sessionsUsed: 10,
    sessionsTotal: 20,
    creditsRemaining: 10,
    expiresOn: "20.7.26",
    lowCredits: false,
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `s${i + 5}`,
    name: ["Mila", "Noah", "Ivy", "Leo", "Ava", "Max", "Zoe", "Eli", "Mia", "Sam", "Lily", "Ben"][i],
    studentId: `u66121${30 + i}`,
    avatarColor: "bg-stone-200 text-stone-700",
    sessionsUsed: 6 + (i % 8),
    sessionsTotal: 20,
    creditsRemaining: 14 - (i % 8),
    expiresOn: "20.8.26",
    lowCredits: false,
  })),
];

export const sessionHistory: TeacherAttendanceSession[] = [
  {
    id: "may10-sec101",
    date: "May 10, 2026",
    classId: "sec101",
    course: "Beginner Chess",
    section: "Sec 101",
    time: "9:00 AM - 10:00 AM",
    location: "Bangkok",
    presentIds: roster.filter((s) => s.id !== "uri").map((s) => s.id),
    absentIds: ["uri"],
    status: "ongoing",
    dismissedAt: {},
  },
  {
    id: "may9-sec301",
    date: "May 9, 2026",
    classId: "sec301",
    course: "Beginner Chess",
    section: "Sec 301",
    time: "9:00 AM - 10:00 AM",
    location: "Onnut",
    presentIds: roster.slice(0, 12).map((s) => s.id),
    absentIds: [],
    status: "finished",
    dismissedAt: Object.fromEntries(
      roster
        .slice(0, 12)
        .map((s, i) => [s.id, `10:${String(2 + i).padStart(2, "0")} AM`]),
    ),
  },
];

/** Sessions where attendance is taken but the class isn't closed yet. */
export const ongoingSessions = sessionHistory.filter(
  (s) => s.status === "ongoing",
);

/** Extra detail for the teacher's view of one student (mirrors student portal data). */
export const studentDetail = {
  id: "penny",
  level: "Beginner",
  age: 8,
  credits: { remaining: 2, total: 20, validUntil: "20 May 2026" },
  parents: [
    {
      name: "Sandy Jones",
      relationKey: "mother",
      avatarColor: "bg-rose-200 text-rose-800",
      phone: "+66123456789",
      email: "sandy01234@gmail.com",
    },
    {
      name: "Mile Jones",
      relationKey: "father",
      avatarColor: "bg-sky-200 text-sky-900",
      phone: "+66123456790",
      email: "mile.jones@gmail.com",
    },
  ],
  enrolledClass: {
    ...myClasses[0],
    attended: 18,
    of: 20,
    pct: 90,
  },
  lastAttendance: {
    course: "Beginner Chess",
    section: "Sec 101",
    when: "Mon 9:00 AM - 10:00 AM",
    status: "present" as const,
  },
};
